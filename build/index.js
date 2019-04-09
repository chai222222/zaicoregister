'use strict';

require('babel-polyfill');

var _argv = require('argv');

var _argv2 = _interopRequireDefault(_argv);

var _ZaicoOpe = require('./ZaicoOpe');

var _ZaicoOpe2 = _interopRequireDefault(_ZaicoOpe);

var _JsonUtil = require('./util/JsonUtil');

var _JsonUtil2 = _interopRequireDefault(_JsonUtil);

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
  try {
    var rc = _JsonUtil2.default.loadJson('./.zaicoregisterrc');
    opeCreator(rc, args.options).processFiles(args.targets).then(function (res) {
      if (!res) {
        _argv2.default.help();
        process.exit(2);
      }
    }).catch(function (e) {
      throw e;
    });
  } catch (e) {
    console.log(e);
    process.exit(3);
  }
}
//# sourceMappingURL=index.js.map