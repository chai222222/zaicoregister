import axios from 'axios';
import _ from 'lodash';

export default class ZaicoRequester {

  constructor(config, options) {
    this.config = config;
    this.options = options;
  }

  _createRequestHeaders() {
    return {
      Authorization: `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  _createRequestConfig() {
    return {
      headers: this._createRequestHeaders(),
    };
  }

  log(...args) {
    if (this.options.dryrun) args.unshift('[DRYRUN]');
    console.log(...args.map(v => v === undefined ? '""' : v));
  }

  err(err) {
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(err.response.data);
      console.log(err.response.status);      // 例：400
      console.log(err.response.statusText);  // Bad Request
      console.log(err.response.headers);
    } else if (err.request) {
      // The request was made but no response was received
      // `err.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(err.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', err.message);
    }
    console.log(err.config);
    if (err.stack) console.log(err.stack);
    return Promise.resolve(nul);
  }

  apiUrl(id = '') {
    return id ? `${this.config.apiUrl}/${id}` : this.config.apiUrl;
  }

  async _zaicoOperation(apiFunc, logFunc) {
    const res = (this.options.dryrun) ? {} : await apiFunc();
    logFunc(res);
    return res;
  }

  async list() {
    let nextUrl = `${this.config.apiUrl}?page=1`; // 先頭ページからアクセス
    const allData = [];
    while (nextUrl) {
      this.log('** get list', nextUrl);
      const res = await axios.get(nextUrl, this._createRequestConfig()).catch((e) => this.err(e));
      nextUrl = undefined;
      if (res && Array.isArray(res.data)) {
        allData.push(...res.data);
        const link = res.headers.link;
        let m;
        if (link && (m = /<([^>]+)>; *rel="next"/.exec(link)) && m[1].indexOf('?page') > 0) {
          nextUrl = m[1];
        }
      }
    }
    return allData;
  }

  async info(id) {
    return await this._zaicoOperation(async () => {
      return await axios.get(this.apiUrl(id), this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
    });
  }

  async add(data) {
    return await this._zaicoOperation(async () => {
      return await axios.post(this.apiUrl(), data, this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
      this.log('追加', data.code, _.get(res, 'data.data_id', ''));
    });
  }

  async update(id, data) {
    return await this._zaicoOperation(async () => {
      return await axios.put(this.apiUrl(id), data, this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
      this.log('更新', data.code, id);
    });
  }

  async remove(id, jan) {
    return await this._zaicoOperation(async () => {
      return await axios.delete(this.apiUrl(id), this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
      this.log('削除', jan, id);
    });
  }
}
