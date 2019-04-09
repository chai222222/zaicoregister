import fs from 'fs';

export default class JsonUtil {

  static loadJson(path, throwIfNotExist = true) {
    if (throwIfNotExist && !fs.existsSync(path)) {
      throw new Error(`ファイル ${path} が存在しません。パスを確認してください。`);
    }
    try {
      return JSON.parse(fs.readFileSync(path, 'utf-8'));
    } catch (e) {
      throw new Error(`ファイル ${path} の JSON 読み込みに失敗しました ${e}`);
    }
  }
}
