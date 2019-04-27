import 'babel-polyfill';  // eslint-disable-line import/no-extraneous-dependencies
import argv from 'argv';
import ZaicoOpes from './ZaicoOpe';
import JsonUtil from './util/JsonUtil'

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
  description: 'run mode. verify(default), add, update, delete, updateAdd, cache, deleteDuplicate',
} ];

argv.option([ ...fixedArgs]);
const args = argv.run();
const mode = args.options.mode || 'verify';
const opeCreator = ZaicoOpes[mode];

if (!opeCreator) {
  argv.help();
  process.exit(1);
} else {
  try {
    const rc = JsonUtil.loadJson('./.zaicoregisterrc');
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
