import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { forEachSeries } from 'p-iteration';
import mime from 'mime';

class ZaioOpeBase {
  static Converters = {
    fileToBase64: {
      type: 'path',
      // <img src="data:image/png;base64,xxxxx..." />
      cvt: (filePath) => {
        const mimeType = mime.getType(filePath.replace(/^.*\./, ''));
        if (mimeType === 'application/octet-stream') throw new Error(`Couldn't get mime from ${filePath}`);
        const body = fs.readFileSync(filePath, 'base64');
        return `data:${mimeType};base64,${body}`;
      },
    }
  };

  constructor(config, options) {
    this.config = config;
    this.options = options;
    this.context = {};
    this.context.orgData = [];
  }

  _cvtArgPath(filePath) {
    return path.isAbsolute(filePath) ? filePath : path.resolve(`${this.context.fileDir}/${filePath}`);
  }

  convert(cvtName, value) {
    if (!cvtName) return value;
    if (!ZaioOpeBase.Converters[cvtName]) throw new Error(`Converter ${cvtName} is not defined.`);
    const { type, cvt } = ZaioOpeBase.Converters[cvtName];
    const argCvt = `_cvtArg${type.charAt(0).toLocaleUpperCase()}${type.substr(1)}`;
    if (typeof(this[argCvt]) !== 'function') throw new Error(`Converter arg processor ${argCvt} is not defined.`);
    return cvt(this[argCvt](value));
  }

  createRequestData(method, data) {
    const init = this.config.initialValue[method] || {};
    const convert = this.config.convert || {};
    return _.fromPairs(_.toPairs(Object.assign(init, data)).map(([key,value]) => [
      this.mappingKey(key),
      this.convert(convert[key], value),
    ]));
  }

  createRequestHeaders() {
    return {
      Authorization: `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  log(...args) {
    console.log(...args);
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
    if(err.stack) console.log(err.stack);
  }

  mappingKey(key) {
    return this.config.mapping[key] || key;
  }

  loadCacheData() {
    this.log('** read cahce', this.config.cacheFile);
    this.context.data = JSON.parse(fs.readFileSync(this.config.cacheFile, 'utf-8'));
    this.cloneData();
  }

  saveCacheData() {
    this.log('** write cahce', this.config.cacheFile);
    fs.writeFileSync(this.config.cacheFile, JSON.stringify(this.context.data, null, '  '), 'utf-8');
    this.cloneData();
  }

  async getZaicoData() {
    this.log('** get list', this.config.cacheFile);
    const headers = this.createRequestHeaders();
    let nextUrl = `${this.config.apiUrl}?page=1`; // 先頭ページからアクセス
    const allData = [];
    while (nextUrl) {
      this.log('** get list', nextUrl);
      const res = await axios.get(nextUrl, { headers }).catch((e) => this.err(e));
      nextUrl = undefined;
      if (res && Array.isArray(res.data)) {
        allData.push(...res.data);
        const link = res.headers.link;
        let m;
        if (link && (m = /<([^>]+)>; *rel="next"/.exec(link))) {
          nextUrl = m[1];
        }
      }
    }
    return allData;
  }

  useCache() {
    return this.options.cache && this.config.cacheFile;
  }

  listZaico(jan) {
    return this.context.data.filter(z => z[this.mappingKey('jan')] === jan);
  }

  findZaico(jan) {
    return this.context.data.find(z => z[this.mappingKey('jan')] === jan);
  }

  cloneData() {
    this.context.orgData = _.cloneDeep(this.context.data);
  }

  isChangedData() {
    return JSON.stringify(this.context.data) !== JSON.stringify(this.context.orgData);
  }

  canProcess(files) {
    return files.length > 0;
  }

  async beforeFiles() {
    if (this.useCache()) {
      if (fs.existsSync(this.config.cacheFile)) {
        this.loadCacheData();
        return;
      }
    }
    this.context.data = [];
    const list = await this.getZaicoData();
    if (list) {
      this.context.data = list;
      if (this.useCache()) {
        this.saveCacheData();
      }
    }
  }

  async afterFiles() {
    if (this.useCache() && this.isChangedData()) {
      this.saveCacheData();
    }
  }

  async beforeRows() { }
  async afterRows() { }
  async beforeRow() { }
  async afterRow() { }
  async eachRow() { }

  async updateDatum(id, del = false) {
    if (this.useCache()) {
      if (del) {
        this.context.data = this.context.data.filter(row => row.id !== id);
      } else {
        const headers = this.createRequestHeaders();
        const getRes = await axios.get(`${this.config.apiUrl}/${id}`, { headers }).catch((e) => this.err(e));
        if (getRes) {
          const idx = this.context.data.findIndex(row => row.id === id);
          if (idx >= 0) {
            this.context.data[idx] = getRes.data;
          } else {
            this.context.data.push(getRes.data);
          }
        }
      }
    }
  }

  async processFiles(filePaths) {
    if (!this.canProcess(filePaths)) {
      return false;
    }
    await this.beforeFiles();
    await forEachSeries(filePaths, async f => await this.processFile(f))
    await this.afterFiles();
    return true;
  }

  async processFile(filePath) {
    this.context.filePath = filePath; // 対象ファイル
    this.context.fileDir = path.dirname(filePath); // 対象dir
    const jangetterResult = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    this.log('***', jangetterResult.title, '***');
    const rows = jangetterResult.rows;
    if (Array.isArray(rows)) {
      await this.beforeRows(rows);
      await forEachSeries(rows, async row => {
        await this.beforeRow(row);
        this.log('*', row.title);
        await this.eachRow(row);
        await this.afterRow(row);
      });
      await this.afterRows(rows);
    } else {
      this.log('*** rows is not array.');
    }
  }
}

class VerifyOperation extends ZaioOpeBase {

  async eachRow(row) {
    const msgs = ['未登録', '登録済み', '**複数登録済み**'];
    const list = this.listZaico(row.jan);
    const msg = msgs[list.length > 1 ? 2 : list.length];
    this.log(msg, list.map(row => row.jan).join(','));
  }
}

class AddOperation extends ZaioOpeBase {
  async eachRow(row) {
    const headers = this.createRequestHeaders();
    const data = this.createRequestData('add', row);
    // this.log(row,data);
    const res = await axios.post(this.config.apiUrl, data, { headers }).catch((e) => this.err(e));
    this.log('追加', row.jan, res.data.data_id);
    if (res) await this.updateDatum(res.data.data_id);
  }
}

class UpdateOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    if (found) {
      const headers = this.createRequestHeaders();
      const data = this.createRequestData('update', row);
      const res = await axios.put(`${this.config.apiUrl}/${found.id}`, data, { headers }).catch((e) => this.err(e));
      this.log('更新', row.jan, found.id);
      if (res) await this.updateDatum(found.id);
    } else {
      this.log('未登録のため更新できません', row.jan, row.title);
    }
  }
}

class UpdateOrAddOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    const headers = this.createRequestHeaders();
    if (found) {
      const data = this.createRequestData('update', row);
      const res = await axios.put(`${this.config.apiUrl}/${found.id}`, data, { headers }).catch((e) => this.err(e));
      this.log('更新', row.jan, found.id);
      if (res) await this.updateDatum(found.id);
    } else {
      const data = this.createRequestData('add', row);
      const res = await axios.post(this.config.apiUrl, data, { headers }).catch((e) => this.err(e));
      this.log('追加', row.jan, res.data.data_id);
      if (res) await this.updateDatum(res.data.data_id);
    }
  }
}

class DeleteOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    if (found) {
      const headers = this.createRequestHeaders();
      const res = await axios.delete(`${this.config.apiUrl}/${found.id}`, { headers }).catch((e) => this.err(e));
      this.log('削除', row.jan, found.id);
      if (res) await this.updateDatum(found.id, true);
    } else {
      this.log('未登録のため削除できません', row.jan, row.title);
    }
  }
}

class CacheUpdateOperation extends ZaioOpeBase {
  async beforeFiles() {
    const list = await this.getZaicoData();
    if (list) this.context.data = list;
  }

  async processFile() {}

  useCache() {
    return true;
  }

  isChangedData() {
    return true;
  }

  canProcess() {
    return true;
  }
}

export default {
  verify: (...args) => new VerifyOperation(...args),
  add: (...args) => new AddOperation(...args),
  update: (...args) => new UpdateOperation(...args),
  updateAdd: (...args) => new UpdateOrAddOperation(...args),
  delete: (...args) => new DeleteOperation(...args),
  cache: (...args) => new CacheUpdateOperation(...args),
}
