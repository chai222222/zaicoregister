import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { forEachSeries } from 'p-iteration';
import mime from 'mime';
import JsonUtil from './util/JsonUtil'
import ZaicoRequester from './ZaicoRequester';

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
    this.requester = new ZaicoRequester(config, options);
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

  createRequestData(method, data, found) {
    const init = _.cloneDeep(this.config.initialValue[method] || {});
    const convert = this.config.convert || {};
    let newData = _.fromPairs(_.toPairs(Object.assign(init, data)).map(([key,value]) => [
      this.mappingKey(key),
      this.convert(convert[key], value),
    ]));
    newData = this.replaceData(method, newData, found);
    newData = this.assignData(method, newData);
    return newData;
  }

  log(...args) {
    console.log(...args);
  }

  mappingKey(key) {
    return this.config.mapping[key] || key;
  }

  replaceData(method, data, orgData) {
    const refData = Object.assign({}, orgData || {}, data);
    const replaceData = _.get(this.config, `replaceValue.${method}`);
    if (replaceData) {
      _.toPairs(replaceData).forEach(([k, v]) => {
        if (!data[k] && refData[k] && Array.isArray(v)) {
          data[k] = JSON.parse(v.reduce((cur, info) => {
            if (Array.isArray(info.regexp) && typeof info.replace === 'string') {
              const newRep = info.replace.replace(/\$\{(\w+)\}/g, (m, p1) => refData[p1] || '')
              return cur.replace(new RegExp(...info.regexp), newRep);
            }
            return cur;
          }, JSON.stringify(refData[k])));
        }
      });
    }
    return data;
  }

  assignData(method, data) {
    const assignData = _.get(this.config, `assignValue.${method}`);
    if (assignData) {
      _.toPairs(assignData).forEach(([k, v]) => {
        if (!data[k]) {
          data[k] = JSON.parse(JSON.stringify(v).replace(/\$\{(\w+)\}/g, (m, p1) => data[p1] || ''));
        }
      })
    }
    return data;
  }

  loadCacheData() {
    this.log('** read cahce', this.config.cacheFile);
    this.context.data = JsonUtil.loadJson(this.config.cacheFile);
    this.cloneData();
  }

  saveCacheData() {
    this.log('** write cahce', this.config.cacheFile);
    fs.writeFileSync(this.config.cacheFile, JSON.stringify(this.context.data, null, '  '), 'utf-8');
    this.cloneData();
  }

  async getZaicoData() {
    this.log('** get list', this.config.cacheFile);
    return await this.requester.list();
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
    return !_.isEqual(this.context.data, this.context.orgData);
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
    if (this.useCache() && this.isChangedData() && !this.options.dryrun) {
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
        const getRes = await this.requester.info(id);
        if (!_.isEmpty(getRes)) {
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
    await this._processFiles(filePaths);
    await this.afterFiles();
    return true;
  }

  async _processFiles(filePaths) {
    await forEachSeries(filePaths, async f => await this._processFile(f))
  }

  async _processFile(filePath) {
    this.context.filePath = filePath; // 対象ファイル
    this.context.fileDir = path.dirname(filePath); // 対象dir
    const jangetterResult = JsonUtil.loadJson(filePath);
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
    if (!this.options.force && this.findZaico(row.jan)) {
      this.log('すでにJANが登録されています', row.jan, row.title);
      return;
    }
    const data = this.createRequestData('add', row);
    const res = await this.requester.add(data);
    if (!_.isEmpty(res)) await this.updateDatum(res.data.data_id);
  }
}

class UpdateOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    if (found) {
      const data = this.createRequestData('update', row, found);
      if (this.options.force || !_.toPairs(data).every(([k, v]) => _.isEqual(v, found[k]))) {
        const res = await this.requester.update(found.id, data);
        if (!_.isEmpty(res)) await this.updateDatum(found.id);
      }
    } else {
      this.log('未登録のため更新できません', row.jan, row.title);
    }
  }
}

class UpdateOrAddOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    if (found) {
      const data = this.createRequestData('update', row, found);
      if (this.options.force || !_.toPairs(data).every(([k, v]) => _.isEqual(v, found[k]))) {
        const res = await this.requester.update(found.id, data);
        if (!_.isEmpty(res)) await this.updateDatum(found.id);
      }
    } else {
      const data = this.createRequestData('add', row);
      const res = await this.requester.add(data);
      if (!_.isEmpty(res)) await this.updateDatum(res.data.data_id);
    }
  }
}

class DeleteOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = this.findZaico(row.jan);
    if (found) {
      const res = await this.requester.remove(found.id, row.jan);
      if (!_.isEmpty(res)) await this.updateDatum(found.id, true);
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

  async _processFiles() {}

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

/**
 * JANの重複を削除します。
 * - JANが重複していること
 * - 更新日時、作成日時が同じであること
 */
class DeleteDuplicateOperation extends ZaioOpeBase {

  canProcess() {
    return true;
  }

  async _processFiles() {
    const janKey = this.mappingKey('jan');
    const jan2DataArr = this.context.data.reduce((o, val) => {
      (o[val[janKey]] || (o[val[janKey]] = [])).push(val);
      return o;
    }, {})
    const removeJan = _.toPairs(jan2DataArr).map(([jan, arr]) => {
      if (arr.length === 1) return undefined;
      const data = arr.filter(v => v.created_at === v.updated_at);
      if (!this.options.force && data.length === arr.length) {
        this.log(`重複したJANの全てが作成日・修正日が同じです[${jan}]`, ...arr.map(v => v.id));
        return undefined;
      }
      return ({ jan, data });
    }).filter(v => v !== undefined);
    await forEachSeries(removeJan, async ({jan, data}) => {
      await forEachSeries(data, async d => {
        const res = await this.requester.remove(d.id, jan);
        if (!_.isEmpty(res)) await this.updateDatum(d.id, true);
      });
    });
  }
}

export default {
  verify: (...args) => new VerifyOperation(...args),
  add: (...args) => new AddOperation(...args),
  update: (...args) => new UpdateOperation(...args),
  updateAdd: (...args) => new UpdateOrAddOperation(...args),
  delete: (...args) => new DeleteOperation(...args),
  deleteDuplicate: (...args) => new DeleteDuplicateOperation(...args),
  cache: (...args) => new CacheUpdateOperation(...args),
}
