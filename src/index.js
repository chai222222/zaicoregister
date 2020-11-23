import 'babel-polyfill';  // eslint-disable-line import/no-extraneous-dependencies
import argv from 'argv';
import ZaicoOpes from './ZaicoOpe';
import JsonUtil from './util/JsonUtil'

const modeHelp = Object.keys(ZaicoOpes)
  .map((v, idx) => idx ? v : `${v}(default)`)
  .join(', ');

const fixedArgs = [ {
  name: 'cache',
  short: 'c',
  type: 'boolean',
  description: 'enable cache',
}, {
  name: 'dryrun',
  type: 'boolean',
  description: 'dry run mode',
}, {
  name: 'force',
  short: 'f',
  type: 'boolean',
  description: 'force mode',
}, {
  name: 'latest',
  type: 'boolean',
  description: 'keep latest in deleteDuplicate mode',
}, {
  name: 'oldest',
  type: 'boolean',
  description: 'keep oldest in deleteDuplicate mode',
}, {
  name: 'mode',
  short: 'm',
  type: 'string',
  description: `run mode. ${modeHelp}`,
} ];

const rcDefault = {
  cacheFile: './zr_cache.json',
  cacheOldFile: './zr_cache_old.json',
  editTmpFile: './zr_edit.json',
  apiUrl: 'https://web.zaico.co.jp/api/v1/inventories',
  waitMills: 2000,
  waitPerCount: 10,
  requestMaxPage: 0,
  mapping: {
    jan: 'code',
    picture: 'item_image'
  },
  convert: {
    picture: 'fileToBase64'
  },
};

argv.option([ ...fixedArgs]);
const args = argv.run();
const mode = args.options.mode || Object.keys(ZaicoOpes).shift();
const opeCreator = ZaicoOpes[mode];

if (!opeCreator) {
  console.log(`mode[${mode}]が定義されていません`);
  argv.help();
  process.exit(1);
} else {
  try {
    const rc = Object.assign(rcDefault, JsonUtil.loadJson('./.zaicoregisterrc'));
    if (args.options.dryrun) console.log('** [DRYRUN] **');
    opeCreator(rc, args.options).processFiles(args.targets).then(res => {
      if (!res) {
        argv.help();
        process.exit(2);
      }
    }).catch(e => {
      throw e;
    });
  } catch (e) {
    console.log(e);
    process.exit(3);
  }
}
