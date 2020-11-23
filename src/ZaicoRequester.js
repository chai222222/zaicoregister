import axios from 'axios';
import _ from 'lodash';
import { sleep } from './util/timers';

export default class ZaicoRequester {

  constructor(config, options) {
    this._config = config;
    this._options = options;
    this._requestCount = 0;
  }

  _createRequestHeaders() {
    return {
      Authorization: `Bearer ${this._config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  _createRequestConfig() {
    return {
      headers: this._createRequestHeaders(),
    };
  }

  _getWaitPromise() {
    const waitPerCount = _.get(this._config, 'waitPerCount');
    this._requestCount++;
    if (this._requestCount % waitPerCount < 1) {
      const waitMills = _.get(this._config, 'waitMills');
      if (waitMills > 0) {
        console.log(`[WAIT][${waitMills}ミリ秒][${this._requestCount}リクエスト]`);
        return sleep(waitMills);
      }
    }
    return Promise.resolve();
  }

  log(...args) {
    if (this._options.dryrun) args.unshift('[DRYRUN]');
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
    return id ? `${this._config.apiUrl}/${id}` : this._config.apiUrl;
  }

  async _zaicoOperation(getDummy, apiFunc, logFunc) {
    await this._getWaitPromise();
    const res = (this._options.dryrun) ? getDummy() : await apiFunc();
    logFunc(res);
    return res;
  }

  async listToArrayWriter(arrWriter) {
    let nextUrl = `${this._config.apiUrl}?page=1`; // 先頭ページからアクセス
    let count = 0;
    const cchk = this._config.requestMaxPage <= 0
      ? () => true
      : () => count++ < this._config.requestMaxPage;
    while (nextUrl && cchk()) {
      await this._getWaitPromise();
      this.log('** get listToArrayWriter', nextUrl);
      const res = await axios.get(nextUrl, this._createRequestConfig()).catch((e) => this.err(e));
      nextUrl = undefined;
      if (res && Array.isArray(res.data)) {
        arrWriter.write(res.data);
        const link = res.headers.link;
        let m;
        if (link && (m = /<([^>]+)>; *rel="next"/.exec(link)) && m[1].indexOf('?page') > 0) {
          nextUrl = m[1];
        }
      }
    }
    await arrWriter.end();
  }

  _dummy(id) {
    const res = { data: { } };
    if (typeof id === 'string') res.data.data_id = id;
    if (typeof id === 'object') Object.assign(res.data, id);
    if (!res.data.data_id && res.data.id) res.data.data_id = res.data.id;
    if (!res.data.data_id && !res.data.id) {
      const did = Math.random().toString(36).substring(7);
      res.data.id = did;
      res.data.data_id = did;
    }
    return res;
  }

  async info(id) {
    return await this._zaicoOperation(() => ({}), async () => {
      return await axios.get(this.apiUrl(id), this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
    });
  }

  async add(data) {
    return await this._zaicoOperation(() => this._dummy(data), async () => {
      return await axios.post(this.apiUrl(), data, this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
      this.log('追加', data.code, _.get(res, 'data.data_id', ''));
    });
  }

  async update(id, data) {
    return await this._zaicoOperation(() => this._dummy(data), async () => {
      return await axios.put(this.apiUrl(id), data, this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
      this.log('更新', data.code, id);
    });
  }

  async remove(id, jan) {
    return await this._zaicoOperation(() => this._dummy(id), async () => {
      return await axios.delete(this.apiUrl(id), this._createRequestConfig()).catch((e) => this.err(e));
    }, (res) => {
      this.log('削除', jan, id);
    });
  }
}
