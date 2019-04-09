import 'babel-polyfill';  // eslint-disable-line import/no-extraneous-dependencies
import fs from 'fs';
import argv from 'argv';
import ZaicoOpes from './ZaicoOpe';

const fixedArgs = [ {
  name: 'cache',
  short: 'c',
  type: 'boolean',
  description: 'enable cache',
}, {
  name: 'mode',
  short: 'm',
  type: 'string',
  description: 'run mode. verify(default), add, update, delete, updateAdd, cache',
} ];

argv.option([ ...fixedArgs]);
const args = argv.run();
const mode = args.options.mode || 'verify';
const opeCreator = ZaicoOpes[mode];

if (!opeCreator) {
  argv.help();
  process.exit(1);
} else {
  const rc = JSON.parse(fs.readFileSync('./.zaicoregisterrc', 'utf8'));
  opeCreator(rc, args.options).processFiles(args.targets).then(res => {
    if (!res) {
      argv.help();
      process.exit(2);
    }
  }).catch(e => {
    console.log(e);
  });
}
