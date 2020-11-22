'use strict';

require('babel-polyfill');

var _argv = require('argv');

var _argv2 = _interopRequireDefault(_argv);

var _ZaicoOpe = require('./ZaicoOpe');

var _ZaicoOpe2 = _interopRequireDefault(_ZaicoOpe);

var _JsonUtil = require('./util/JsonUtil');

var _JsonUtil2 = _interopRequireDefault(_JsonUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var modeHelp = Object.keys(_ZaicoOpe2.default).map(function (v, idx) {
  return idx ? v : v + '(default)';
}).join(', '); // eslint-disable-line import/no-extraneous-dependencies


var fixedArgs = [{
  name: 'cache',
  short: 'c',
  type: 'boolean',
  description: 'enable cache'
}, {
  name: 'dryrun',
  type: 'boolean',
  description: 'dry run mode'
}, {
  name: 'force',
  short: 'f',
  type: 'boolean',
  description: 'force mode'
}, {
  name: 'latest',
  type: 'boolean',
  description: 'keep latest in deleteDuplicate mode'
}, {
  name: 'oldest',
  type: 'boolean',
  description: 'keep oldest in deleteDuplicate mode'
}, {
  name: 'mode',
  short: 'm',
  type: 'string',
  description: 'run mode. ' + modeHelp
}];

var rcDefault = {
  cacheFile: './zr_cache.json',
  editedFile: './zr_edited.json',
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
  }
};

_argv2.default.option([].concat(fixedArgs));
var args = _argv2.default.run();
var mode = args.options.mode || Object.keys(_ZaicoOpe2.default).shift();
var opeCreator = _ZaicoOpe2.default[mode];

if (!opeCreator) {
  console.log('mode[' + mode + ']\u304C\u5B9A\u7FA9\u3055\u308C\u3066\u3044\u307E\u305B\u3093');
  _argv2.default.help();
  process.exit(1);
} else {
  try {
    var rc = Object.assign(rcDefault, _JsonUtil2.default.loadJson('./.zaicoregisterrc'));
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