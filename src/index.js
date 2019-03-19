import 'babel-polyfill';  // eslint-disable-line import/no-extraneous-dependencies
import fs from 'fs';
import argv from 'argv';

const fixedArgs = [ {
  name: 'mode',
  short: 'm',
  type: 'string',
  description: 'run mode. verify(default), add, update, delete',
} ];

argv.option([ ...fixedArgs]);
const args = argv.run();
const mode = args.options.mode || 'verify';

if (args.targets.length < 1) {
  argv.help();
  process.exit(0);
}

const rc = JSON.parse(fs.readFileSync('./zaicoregisterrc', 'utf8'));


args.targets.forEach()
