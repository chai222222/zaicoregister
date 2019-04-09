'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JsonUtil = function () {
  function JsonUtil() {
    _classCallCheck(this, JsonUtil);
  }

  _createClass(JsonUtil, null, [{
    key: 'loadJson',
    value: function loadJson(path) {
      var throwIfNotExist = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (throwIfNotExist && !_fs2.default.existsSync(path)) {
        throw new Error('\u30D5\u30A1\u30A4\u30EB ' + path + ' \u304C\u5B58\u5728\u3057\u307E\u305B\u3093\u3002\u30D1\u30B9\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002');
      }
      try {
        return JSON.parse(_fs2.default.readFileSync(path, 'utf-8'));
      } catch (e) {
        throw new Error('\u30D5\u30A1\u30A4\u30EB ' + path + ' \u306E JSON \u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F ' + e);
      }
    }
  }]);

  return JsonUtil;
}();

exports.default = JsonUtil;
//# sourceMappingURL=JsonUtil.js.map