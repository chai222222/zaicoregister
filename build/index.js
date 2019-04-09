'use strict';

require('babel-polyfill');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _argv = require('argv');

var _argv2 = _interopRequireDefault(_argv);

var _ZaicoOpe = require('./ZaicoOpe');

var _ZaicoOpe2 = _interopRequireDefault(_ZaicoOpe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fixedArgs = [{
  name: 'cache',
  short: 'c',
  type: 'boolean',
  description: 'enable cache'
}, {
  name: 'mode',
  short: 'm',
  type: 'string',
  description: 'run mode. verify(default), add, update, delete, updateAdd, cache'
}]; // eslint-disable-line import/no-extraneous-dependencies


_argv2.default.option([].concat(fixedArgs));
var args = _argv2.default.run();
var mode = args.options.mode || 'verify';
var opeCreator = _ZaicoOpe2.default[mode];

if (!opeCreator) {
  _argv2.default.help();
  process.exit(1);
} else {
  var rc = JSON.parse(_fs2.default.readFileSync('./.zaicoregisterrc', 'utf8'));
  opeCreator(rc, args.options).processFiles(args.targets).then(function (res) {
    if (!res) {
      _argv2.default.help();
      process.exit(2);
    }
  }).catch(function (e) {
    console.log(e);
  });
}
//# sourceMappingURL=index.js.map