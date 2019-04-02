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
  description: 'run mode. verify(default), add, update, delete, cache',
} ];

argv.option([ ...fixedArgs]);
const args = argv.run();
const mode = args.options.mode || 'verify';
const opeCreator = ZaicoOpes[mode];

if (args.targets.length < 1 || !opeCreator) {
  argv.help();
  process.exit(0);
}

const rc = JSON.parse(fs.readFileSync('./.zaicoregisterrc', 'utf8'));
const ope = opeCreator(rc, args.options);
ope.processFiles(args.targets);

