'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _JSONStream = require('JSONStream');

var _JSONStream2 = _interopRequireDefault(_JSONStream);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ArrayWriter = function () {
  function ArrayWriter(stream) {
    _classCallCheck(this, ArrayWriter);

    this._stream = stream;
    this._cnt = 0;
    this._stream.write('[');
  }

  _createClass(ArrayWriter, [{
    key: 'write',
    value: function write(arr) {
      var _this = this;

      arr.forEach(function (data) {
        var pre = _this._cnt++ ? ',' : '';
        _this._stream.write(pre + JSON.stringify(data) + '\n');
      });
    }
  }, {
    key: 'end',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', new Promise(function (resolve) {
                  _this2._stream.write(']');
                  _this2._stream.end(function () {
                    return resolve();
                  });
                }));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function end() {
        return _ref.apply(this, arguments);
      }

      return end;
    }()
  }]);

  return ArrayWriter;
}();

var JsonUtil = function () {
  function JsonUtil() {
    _classCallCheck(this, JsonUtil);
  }

  _createClass(JsonUtil, null, [{
    key: '_existPath',
    value: function _existPath(path) {
      if (!_fs2.default.existsSync(path)) {
        throw new Error('\u30D5\u30A1\u30A4\u30EB ' + path + ' \u304C\u5B58\u5728\u3057\u307E\u305B\u3093\u3002\u30D1\u30B9\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002');
      }
    }
  }, {
    key: 'loadJson',
    value: function loadJson(path) {
      this._existPath(path);
      try {
        return JSON.parse(_fs2.default.readFileSync(path, 'utf-8'));
      } catch (e) {
        throw new Error('\u30D5\u30A1\u30A4\u30EB ' + path + ' \u306E JSON \u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F ' + e);
      }
    }
  }, {
    key: 'toJSONArrayInputStream',
    value: function toJSONArrayInputStream(path) {
      this._existPath(path);
      var is = _fs2.default.createReadStream(path, 'utf-8');

      for (var _len = arguments.length, writables = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        writables[_key - 1] = arguments[_key];
      }

      return [_JSONStream2.default.parse('*')].concat(writables).reduce(function (is, w) {
        return is.pipe(w);
      }, is);
    }
  }, {
    key: 'createObjectArrayWriter',
    value: function createObjectArrayWriter(stream) {
      return new ArrayWriter(stream);
    }
  }]);

  return JsonUtil;
}();

exports.default = JsonUtil;
//# sourceMappingURL=JsonUtil.js.map