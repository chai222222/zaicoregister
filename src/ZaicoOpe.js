import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
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

  loadContextData() {
    this.log('** read cahce', this.config.cacheFile);
    this.context.data = JSON.parse(fs.readFileSync(this.config.cacheFile, 'utf-8'));
  }

  saveContextData() {
    this.log('** write cahce', this.config.cacheFile);
    fs.writeFileSync(this.config.cacheFile, JSON.stringify(this.context.data, null, '  '), 'utf-8');
  }

  useCache() {
    return this.options.cache && this.config.cacheFile;
  }

  findZaico(jan) {
    return this.context.data.find(z => z[this.mappingKey('jan')] === jan);
  }

  async beforeRows() {
    if (this.useCache()) {
      if (fs.existsSync(this.config.cacheFile)) {
        this.loadContextData();
        return;
      }
    }
    const headers = this.createRequestHeaders();
    this.context.data = [];
    this.log('** get list', this.config.cacheFile);
    const res = await axios.get(this.config.apiUrl, { headers }).catch((e) => this.err(e));
    this.context.data = res.data;
    if (this.useCache()) {
      this.saveContextData();
    }
  }

  afterRows() { }
  beforeRow() { }
  afterRow() { }
  eachRow() { }

  processFile(filePath) {
    this.context.filePath = filePath; // 対象ファイル
    this.context.fileDir = path.dirname(filePath); // 対象dir
    const jangetterResult = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    this.log('***', jangetterResult.title, '***');
    const rows = jangetterResult.rows;
    if (Array.isArray(rows)) {
      this.beforeRows(rows);
      rows.forEach((row => {
        this.beforeRow(row);
        this.log('*', row.title);
        this.eachRow(row);
        this.afterRow(row);
      }))
      this.afterRows(rows);
    } else {
      this.log('*** rows is not array.');
    }
  }
}

class VerifyOperation extends ZaioOpeBase {

  eachRow(row) {
    const found = this.findZaico(row.jan);
    const msg = found ? '登録済' : '未登録';
    this.log(msg, row.jan);
  }
}

class AddOperation extends ZaioOpeBase {
  async eachRow(row) {
    const headers = this.createRequestHeaders();
    const data = this.createRequestData('add', row);
    // this.log(row,data);
    const res = await axios.post(this.config.apiUrl, data, { headers }).catch((e) => this.err(e));
    if (res.data && this.useCache()) {
      const getRes = await axios.get(`${this.config.apiUrl}/${res.data.data_id}`, { headers }).catch((e) => this.err(e));
      if (getRes) this.context.data.push(getRes.data);
    }
  }

  afterRows() {
    if (this.useCache()) {
      this.saveContextData();
    }
  }
}

class UpdateOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    if (found) {
      const headers = this.createRequestHeaders();
      const data = this.createRequestData('update', row);
      const res = await axios.put(`${this.config.apiUrl}/${found.id}`, data, { headers }).catch((e) => this.err(e));
    } else {
      this.log('未登録のため更新できません', row.jan, row.title);
    }
  }
}

class DeleteOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    if (found) {
      const headers = this.createRequestHeaders();
      const res = await axios.delete(`${this.config.apiUrl}/${found.id}`, { headers }).catch((e) => this.err(e));
    } else {
      this.log('未登録のため削除できません', row.jan, row.title);
    }
  }
}

export default {
  verify: (...args) => new VerifyOperation(...args),
  add: (...args) => new AddOperation(...args),
  update: (...args) => new UpdateOperation(...args),
  delete: (...args) => new DeleteOperation(...args),
}
