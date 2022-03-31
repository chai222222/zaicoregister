import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import _ from 'lodash';
import readline from 'readline';
import { forEachSeries } from 'p-iteration';
import mime from 'mime';
import JSONStream from 'JSONStream';
import JsonUtil from './util/JsonUtil'
import ZaicoRequester from './ZaicoRequester';
import EditManage from './EditManage';
import CombinedStream from 'combined-stream';
import through2Filter from 'through2-filter';
import through2Map from 'through2-map';

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
    this.requester = new ZaicoRequester(config, options);
    this._editManage = new EditManage(config.editTmpFile);
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

  updateCacheData() {
    this.log('** update cahce', this.config.cacheFile);
    return new Promise((resolve) => {
      fs.renameSync(this.config.cacheFile, this.config.cacheOldFile);
      const dest = [];
      if (this._editManage.counts(EditManage.DELETE)) dest.push(this._editManage.createDeletedFilter());
      if (this._editManage.counts(EditManage.UPDATE)) dest.push(this._editManage.createUpdatedMapper());
      const cacheFileStream = JsonUtil.toJSONArrayInputStream(this.config.cacheOldFile, ...dest);
      (this._editManage.counts(EditManage.APPEND)
        ? () => {
            const cs = CombinedStream.create();
            cs.append(cacheFileStream);
            cs.append(this._editManage.createAppendedReadable());
            return cs;
          }
        : () => cacheFileStream
      )()
        .pipe(JSONStream.stringify())
        .pipe(fs.createWriteStream(this.config.cacheFile))
        .on('end', () => resolve());
    });
  }

  removeCacheData() {
    this.log('** remove cahce', this.config.cacheFile);
    fs.unlinkSync(this.config.cacheFile);
  }

  async zaicoDataToCache() {
    this.log('** get all zaico data', this.config.cacheFile);
    return await this.requester.listToArrayWriter(JsonUtil.createObjectArrayWriter(this.config.cacheFile));
  }

  useCache() {
    return this.options.cache && this.config.cacheFile;
  }

  async _listZaico(fn, mapFn = obj => obj) {
    const result = [];
    return new Promise((resolve) => {
      JsonUtil.toJSONArrayInputStream(this.config.cacheFile)
        .pipe(through2Filter({ objectMode: true }, fn))
        .pipe(through2Map({ objectMode: true }, mapFn))
        .on('data', (data) => result.push(data))
        .on('end', () => resolve(result));
    });
  }

  async listZaico(jan) {
    return await this._listZaico(z => z[this.mappingKey('jan')] === jan);
  }

  async findZaicoByKey(value, key) {
    const res = await this._listZaico(z => z[key] === value);
    return res.length > 0 && res[0];
  }

  async findZaico(jan) {
    return await this.findZaicoByKey(jan, this.mappingKey('jan'));
  }

  isChangedData() {
    return this._editManage.isEdited();
  }

  canProcess(files) {
    return files.length > 0;
  }

  async beforeFiles() {
    if (!fs.existsSync(this.config.cacheFile)) {
      await this.zaicoDataToCache();
    }
  }

  async afterFiles() {
    await this._editManage.end();
    if (this.useCache()) {
      // if (this.isChangedData() && !this.options.dryrun) {
      if (this.isChangedData()) {
        await this.updateCacheData();
      }
    } else {
      this.removeCacheData();
    }
  }

  async beforeRows() { }
  async afterRows() { }
  async beforeRow() { }
  async afterRow() { }
  async eachRow() { }

  async updateDatum(mode, id, data) {
    if (this.useCache()) {
      if (mode === EditManage.DELETE) {
        this._editManage.addData(mode, { id });
      } else {
        const getRes = await this.requester.info(id);
        if (!_.isEmpty(getRes)) {
          this._editManage.addData(mode, getRes.data);
        } else if (this.options.dryrun) {
          const dummy = { ...data, id };
          delete dummy.item_image;
          dummy.updated_at = '2222-22-22T22:22:22+09:00';
          this._editManage.addData(mode, dummy);
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
    this.log('*** load 編集ファイル ***');
    const jangetterResult = JsonUtil.loadJson(filePath);
    this.log('***', jangetterResult.title, '***');
    const rows = jangetterResult.rows;
    if (Array.isArray(rows)) {
      await this.beforeRows(rows);
      await forEachSeries(rows, async (row, idx) => {
        await this.beforeRow(row);
        this._writeRowTitle(`* [${idx+1}/${rows.length}]`, row.title);
        await this.eachRow(row);
        await this.afterRow(row);
      });
      await this.afterRows(rows);
    } else {
      this.log('*** rows is not array.');
    }
  }

  _writeRowTitle(...str) {
    // readline.clearLine(process.stdout);
    // readline.cursorTo(process.stdout, 0);
    // process.stdout.write(str.join(' '));
  }

}

class VerifyOperation extends ZaioOpeBase {

  async eachRow(row) {
    const janKey = this.mappingKey('jan');
    const msgs = ['未登録', '登録済み', '**複数登録済み**'];
    const list = await this.listZaico(row.jan);
    const msg = msgs[list.length > 1 ? 2 : list.length];
    this.log(msg, list.map(row => row[janKey]).join(','));
  }
}

class AddOperation extends ZaioOpeBase {
  async eachRow(row) {
    if (!this.options.force && await this.findZaico(row.jan)) {
      this.log('すでにJANが登録されています', row.jan, row.title);
      return;
    }
    const data = this.createRequestData('add', row);
    const res = await this.requester.add(data);
    if (!_.isEmpty(res)) await this.updateDatum(EditManage.APPEND, res.data.data_id, data);
  }
}

class UpdateOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = await this.findZaico(row.jan);
    if (found) {
      const data = this.createRequestData('update', row, found);
      if (this.options.force || !_.toPairs(data).every(([k, v]) => _.isEqual(v, found[k]))) {
        const res = await this.requester.update(found.id, data);
        if (!_.isEmpty(res)) await this.updateDatum(EditManage.UPDATE, found.id, found);
      }
    } else {
      this.log('未登録のため更新できません', row.jan, row.title);
    }
  }
}

class UpdateOrAddOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = await this.findZaico(row.jan);
    if (found) {
      const data = this.createRequestData('update', row, found);
      if (this.options.force || !_.toPairs(data).every(([k, v]) => _.isEqual(v, found[k]))) {
        const res = await this.requester.update(found.id, data);
        if (!_.isEmpty(res)) await this.updateDatum(EditManage.UPDATE, found.id, found);
      }
    } else {
      const data = this.createRequestData('add', row);
      const res = await this.requester.add(data);
      if (!_.isEmpty(res)) await this.updateDatum(EditManage.APPEND, res.data.data_id, data);
    }
  }
}

class DeleteOperation extends ZaioOpeBase {
  async eachRow(row) {
    const found = await this.findZaico(row.jan);
    if (found) {
      const res = await this.requester.remove(found.id, row.jan);
      if (!_.isEmpty(res)) await this.updateDatum(EditManage.DELETE, found.id);
    } else {
      this.log('未登録のため削除できません', row.jan, row.title);
    }
  }
}

class CacheUpdateOperation extends ZaioOpeBase {
  async beforeFiles() {
    await this.zaicoDataToCache();
  }

  async _processFiles() {}

  useCache() {
    return true;
  }

  isChangedData() {
    return false;
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

  async _createJanCountObj() {
    const janKey = this.mappingKey('jan');
    const obj = { };
    return new Promise((resolve) => {
      JsonUtil.toJSONArrayInputStream(this.config.cacheFile)
        .on('data', data => {
          const jan = data[janKey];
          if (obj[jan]) {
            obj[jan]++;
          } else {
            obj[jan] = 1;
          }
        })
        .on('end', () => resolve(obj));
    });
  }

  async _createDupJan2Data(janCountsObj) {
    const janKey = this.mappingKey('jan');
    const obj = { };
    return new Promise((resolve) => {
      JsonUtil.toJSONArrayInputStream(this.config.cacheFile)
        .pipe(through2Filter({ objectMode: true }, data => janCountsObj[data[janKey]] > 1))
        .on('data', data => {
          const jan = data[janKey];
          if (obj[jan]) {
            obj[jan].push(data);
          } else {
            obj[jan] = [ data ];
          }
        })
        .on('end', () => resolve(obj));
    });
  }

  async _processFiles() {
    const janCounts = await this._createJanCountObj();
    const dupJanObj = await this._createDupJan2Data(janCounts);
    const removeJan = _.toPairs(dupJanObj).map(([jan, arr]) => {
      if (arr.length === 1) return undefined; // フィルタしてるので必ず複数だけど前のままにする
      const data = arr.filter(v => v.created_at === v.updated_at);
      if (data.length === arr.length) {
        const { latest, oldest, force } = this.options;
        if (latest) return ({ jan, data: data.slice(0, data.length - 1) });
        if (oldest) return ({ jan, data: data.slice(1, data.length) });
        if (!force) {
          this.log(`重複したJANの全てが作成日・修正日が同じです[${jan}]`, ...arr.map(v => v.id));
          return undefined;
        }
      } else if (data.length - arr.length > 1) {
        const res = arr.filter(v => v.created_at !== v.updated_at);
        this.log(`重複したJANに作成日・修正日が違うものが複数含まれます。キャッシュを更新し、verifyで確認してくださ[${jan}]`, ...res.map(v => v.id));
      }
      return ({ jan, data });
    }).filter(v => v !== undefined);
    await forEachSeries(removeJan, async ({jan, data}) => {
      await forEachSeries(data, async d => {
        const res = await this.requester.remove(d.id, jan);
        if (!_.isEmpty(res)) await this.updateDatum(EditManage.DELETE, d.id);
      });
    });
  }
}

class CacheFileOperationBase extends ZaioOpeBase {

  async _processFile(filePath) {
    this.context.filePath = filePath; // 対象ファイル
    this.context.fileDir = path.dirname(filePath); // 対象dir
    this.log('*** load 編集ファイル ***');
    const zaicos = JsonUtil.loadJson(filePath);
    this.log('*** cacheファイル操作 ***');
    if (Array.isArray(zaicos)) {
      await this.beforeRows(zaicos);
      await forEachSeries(zaicos, async (zaico, idx) => {
        await this.beforeRow(zaico);
        this._writeRowTitle(`* [${idx+1}/${zaicos.length}]`, zaico.title);
        await this.eachRow(zaico);
        await this.afterRow(zaico);
      });
      await this.afterRows(zaicos);
    } else {
      this.log(`*** ${filePath} is not array.`);
    }
  }
}

class DiffUpdateOperation extends CacheFileOperationBase {

  async beforeRows(zaicos) {
    // 差分更新で無視するキー
    this.ignoreKeys = new Set(_.get(this.config, 'ignoreKeys.diffUpdate', []));
    this.log('** 差分更新前処理[cacheファイルハッシュ作成]開始 **');
    const idHash = await this._listZaico(({ id }) => !!id, zaico => [
      zaico.id,
      { code: zaico.code, hash: this.hash(this.diffZaico(zaico)) },
    ]);
    this.id2HashObj = new Map(idHash); // キャッシュデータの id をキー、データのハッシュ文字列をバリュー
    this.log('** 差分更新前処理[cacheファイルハッシュ作成]終了 **');
  }

  hash(obj) {
    const md5 = crypto.createHash('md5');
    md5.update(JSON.stringify(obj));
    return md5.digest('hex');
  }

  /**
   * 在庫データ同士を比較し、差分があるデータを抽出します。
   * ignoreKeys.diffUpdateにあるキーは除外されます。
   * キャッシュ在庫データを省略したときは編集在庫データから ignoreKeys.diffUpdateにあるキーを除外した結果を返します。
   *
   * @param {Object} editZaico 編集在庫データ
   * @param {?Object} cacheZaico キャッシュ在庫データ
   * @return {Object} 差分として残った key, value を持ったオブジェクト
   */
  diffZaico(editZaico, cacheZaico) {
    return _.pickBy(editZaico, (v, k) => !this.ignoreKeys.has(k) &&
                                          (!cacheZaico || k in cacheZaico && !_.isEqual(v, cacheZaico[k])));
  }

  async eachRow(zaico) {
    const hashObj = this.id2HashObj.get(zaico.id);
    if (hashObj) {
      if (Object.keys(zaico).length === 1) { // 削除
        const res = await this.requester.remove(zaico.id, hashObj.code);
        if (!_.isEmpty(res)) await this.updateDatum(EditManage.DELETE, zaico.id);
      } else { // 更新
          // 差分をとって除外キーになってなくて違いがあるデータのハッシュ値を比較する
        if (this.hash(this.diffZaico(zaico)) !== hashObj.hash) {
          this.log('DIFF HASH');
          const found = await this.findZaicoByKey(zaico.id, 'id');
          const diff = this.diffZaico(zaico, found)
          this.log(`\ndiff [${found.title}] ${JSON.stringify(diff, null, 2)}\n`);
          const res = await this.requester.update(found.id, diff);
          if (!_.isEmpty(res)) await this.updateDatum(EditManage.UPDATE, found.id, found);
        }
      }
    } else {
      this.log(`ID[${zaico.id}]のデータが未登録のため更新できません`, JSON.stringify(zaico));
    }
    // const found = await this.findZaicoByKey(zaico.id, 'id');
    // if (found) {
    //   if (Object.keys(zaico).length === 1) { // 削除
    //     const res = await this.requester.remove(found.id, found.code);
    //     if (!_.isEmpty(res)) await this.updateDatum(EditManage.DELETE, found.id);
    //   } else { // 更新
    //     // 差分をとって除外キーになってなくて違いがあるデータを残す
    //     const ignore = new Set(_.get(this.config, 'ignoreKeys.diffUpdate', []));
    //     const diff = _.pickBy(zaico, (v, k) => k in found && !ignore.has(k) && !_.isEqual(v, found[k]));
    //     if (!_.isEmpty(diff)) {
    //       this.log('diff', JSON.stringify(diff));
    //       const res = await this.requester.update(found.id, diff);
    //       if (!_.isEmpty(res)) await this.updateDatum(EditManage.UPDATE, found.id, found);
    //     }
    //   }
    // } else {
    //   this.log(`ID[${zaico.id}のデータが未登録のため更新できません`, zaico.jan, zaico.title);
    // }
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
  diffUpdate: (...args) => new DiffUpdateOperation(...args),
}
