import fs, { read } from 'fs';
import { Readable } from 'stream';
import JSONStream from 'JSONStream';
import { resolve } from 'path';

class ArrayWriter {
  constructor(stream) {
    this._stream = stream;
    this._cnt = 0;
    this._stream.write('[');
  }

  write(arr) {
    arr.forEach(data => {
      const pre = this._cnt++ ? ',' : '';
      this._stream.write(pre + JSON.stringify(data) + '\n');
    });
  }

  async end() {
    return new Promise((resolve) => {
      this._stream.write(']');
      this._stream.end(() => resolve());
    });
  }

}


export default class JsonUtil {

  static _existPath(path) {
    if (!fs.existsSync(path)) {
      throw new Error(`ファイル ${path} が存在しません。パスを確認してください。`);
    }
  }

  static loadJson(path) {
    this._existPath(path);
    try {
      return JSON.parse(fs.readFileSync(path, 'utf-8'));
    } catch (e) {
      throw new Error(`ファイル ${path} の JSON 読み込みに失敗しました ${e}`);
    }
  }

  static toJSONArrayInputStream(path, ...dest) {
    this._existPath(path);
    const is = fs.createReadStream(path, 'utf-8');
    return [JSONStream.parse('*'), ...dest].reduce((is, w) => is.pipe(w), is);
  }

  static createObjectArrayWriter(path) {
    return new ArrayWriter(fs.createWriteStream(path));
  }

  static createObjectArrayReadble(arr) {
    const readable = new Readable({ objectMode: true, read() {}});
    arr.forEach(e => readable.push(e));
    readable.push(null);
    return readable;
  }
}
