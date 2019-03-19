import axios from 'axios';
import fs from 'fs';

class ZaioOpeBase {

  constructor(config) {
    this.config = config;
  }

  log(...args) {
    console.log(...args);
  }

  mappingKey(key) {
    return this.config.mapping[key] || key;
  }

  beforeRows() { }
  afterRows() { }
  beforeRow() { }
  afterRow() { }
  eachRow() { }

  processFile(path) {
    const jangetterResult = JSON.parse(fs.readFileSync(path, 'utf8'));
    this.log('***', jangetterResult.title, '***');
    const rows = jangetterResult.rows;
    if (Array.isArray(rows)) {
      this.beforeRows(rows);
      rows.forEach((row => {
        this.beforeRow(row);
        this.eachRow(row);
        this.afterRow(row);
      }))
      this.afterRows(rows);
    } else {
      this.log('*** rows is not array.');
    }
  }
}

class Verify extends ZaioOpeBase {
  beforeRows() {
    this.data = [];
    axios.get(this.config.apiUrl).then(res => {
      this.data = res.data;
    }).catch(err => {
      console.log(err);
    });
  }

  eachRow(row) {
    const found = this.data.find(z => z[this.mappingKey('jan')] === row.jan);
    if (found) {
      this.log('@@@ exist', found);
    } else {
      this.log('### not exist', row.jan);
    }
  }
}

const base64Keys = new Set(['picture']);

const doData = (method, config, row) => {
  Object.keys(row).map(k => base64Keys.has(k) ? fs.readFileSync(row[k]).toString('base64') : row[k]);
}

class Add extends ZaioOpeBase {
}

class Update extends ZaioOpeBase {
}

class Delete extends ZaioOpeBase {
}

export default {
  verify: (...args) => new Verify(...args),
}
