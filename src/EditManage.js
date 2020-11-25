import fs from 'fs';
import _, { reject, update } from 'lodash';
import JsonUtil from './util/JsonUtil';
import through2Filter from 'through2-filter';
import through2Map from 'through2-map';

export default class EditManage {

  static DELETE = 0;
  static UPDATE = 1;
  static APPEND = 2;

  constructor(path) {
    this._editTmpPath = path;
    this._editArrWriter = null;
    this._editedData = null;
    this._flags = {};
    this._counts = [0, 0, 0];
  }

  addData(mode, ...data) {
    this._counts[mode] += data.length;
    data.forEach(data => this._flags[data.id + ''] = mode);
    if (mode !== EditManage.DELETE) this._addUpdatedData(...data);
  }

  _addUpdatedData(...data) {
    if (!this._editArrWriter) {
      this._editArrWriter = JsonUtil.createObjectArrayWriter(this._editTmpPath);
    }
    this._editArrWriter.write(data);
  }

  async end() {
    if (this._editArrWriter) {
      await this._editArrWriter.end();
      // TODO: 変更分が大きくてメモリ問題がでたら遅いけどファイルI/Oに変更する
      this._editedData = JsonUtil.loadJson(this._editTmpPath);
      fs.unlinkSync(this._editTmpPath);
    } else {
      this._editedData = [];
    }
  }

  isEdited() {
    return !_.isEmpty(this._flags);
  }

  counts(mode) {
    return this._counts[mode];
  }

  createDeletedFilter() {
    return through2Filter({
      objectMode: true,
    }, (chunk) => this._flags[chunk.id + ''] !== EditManage.DELETE);
  }

  createUpdatedMapper() {
    return through2Map({
      objectMode: true,
    }, (chunk) => {
      if (this._flags[String(chunk.id)] !== EditManage.UPDATE) {
        return chunk;
      }
      return this._editedData.find(data => data.id === chunk.id) || chunk;
    });
  }

  createAppendedReadable() {
    return JsonUtil.createObjectArrayReadble(
      this._editedData.filter((data) => this._flags[data.id + ''] === EditManage.APPEND));
  }

}
