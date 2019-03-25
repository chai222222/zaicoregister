'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ZaioOpeBase = function () {
  function ZaioOpeBase(config, options) {
    _classCallCheck(this, ZaioOpeBase);

    this.config = config;
    this.options = options;
    this.context = {};
  }

  _createClass(ZaioOpeBase, [{
    key: '_cvtArgPath',
    value: function _cvtArgPath(filePath) {
      return _path2.default.isAbsolute(filePath) ? filePath : _path2.default.resolve(this.context.fileDir + '/' + filePath);
    }
  }, {
    key: 'convert',
    value: function convert(cvtName, value) {
      if (!cvtName) return value;
      if (!ZaioOpeBase.Converters[cvtName]) throw new Error('Converter ' + cvtName + ' is not defined.');
      var _ZaioOpeBase$Converte = ZaioOpeBase.Converters[cvtName],
          type = _ZaioOpeBase$Converte.type,
          cvt = _ZaioOpeBase$Converte.cvt;

      var argCvt = '_cvtArg' + type.charAt(0).toLocaleUpperCase() + type.substr(1);
      if (typeof this[argCvt] !== 'function') throw new Error('Converter arg processor ' + argCvt + ' is not defined.');
      return cvt(this[argCvt](value));
    }
  }, {
    key: 'createRequestData',
    value: function createRequestData(method, data) {
      var _this = this;

      var init = this.config.initialValue[method] || {};
      var convert = this.config.convert || {};
      return _lodash2.default.fromPairs(_lodash2.default.toPairs(Object.assign(init, data)).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];

        return [_this.mappingKey(key), _this.convert(convert[key], value)];
      }));
    }
  }, {
    key: 'createRequestHeaders',
    value: function createRequestHeaders() {
      return {
        Authorization: 'Bearer ' + this.config.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }
  }, {
    key: 'log',
    value: function log() {
      var _console;

      (_console = console).log.apply(_console, arguments);
    }
  }, {
    key: 'err',
    value: function err(_err) {
      if (_err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(_err.response.data);
        console.log(_err.response.status); // 例：400
        console.log(_err.response.statusText); // Bad Request
        console.log(_err.response.headers);
      } else if (_err.request) {
        // The request was made but no response was received
        // `err.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(_err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', _err.message);
      }
      console.log(_err.config);
      if (_err.stack) console.log(_err.stack);
    }
  }, {
    key: 'mappingKey',
    value: function mappingKey(key) {
      return this.config.mapping[key] || key;
    }
  }, {
    key: 'loadContextData',
    value: function loadContextData() {
      this.log('** read cahce', this.config.cacheFile);
      this.context.data = JSON.parse(_fs2.default.readFileSync(this.config.cacheFile, 'utf-8'));
    }
  }, {
    key: 'saveContextData',
    value: function saveContextData() {
      this.log('** write cahce', this.config.cacheFile);
      _fs2.default.writeFileSync(this.config.cacheFile, JSON.stringify(this.context.data, null, '  '), 'utf-8');
    }
  }, {
    key: 'useCache',
    value: function useCache() {
      return this.options.cache && this.config.cacheFile;
    }
  }, {
    key: 'findZaico',
    value: function findZaico(jan) {
      var _this2 = this;

      return this.context.data.find(function (z) {
        return z[_this2.mappingKey('jan')] === jan;
      });
    }
  }, {
    key: 'beforeRows',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this3 = this;

        var headers, res;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.useCache()) {
                  _context.next = 4;
                  break;
                }

                if (!_fs2.default.existsSync(this.config.cacheFile)) {
                  _context.next = 4;
                  break;
                }

                this.loadContextData();
                return _context.abrupt('return');

              case 4:
                headers = this.createRequestHeaders();

                this.context.data = [];
                this.log('** get list', this.config.cacheFile);
                _context.next = 9;
                return _axios2.default.get(this.config.apiUrl, { headers: headers }).catch(function (e) {
                  return _this3.err(e);
                });

              case 9:
                res = _context.sent;

                this.context.data = res.data;
                if (this.useCache()) {
                  this.saveContextData();
                }

              case 12:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function beforeRows() {
        return _ref3.apply(this, arguments);
      }

      return beforeRows;
    }()
  }, {
    key: 'afterRows',
    value: function afterRows() {}
  }, {
    key: 'beforeRow',
    value: function beforeRow() {}
  }, {
    key: 'afterRow',
    value: function afterRow() {}
  }, {
    key: 'eachRow',
    value: function eachRow() {}
  }, {
    key: 'processFile',
    value: function processFile(filePath) {
      var _this4 = this;

      this.context.filePath = filePath; // 対象ファイル
      this.context.fileDir = _path2.default.dirname(filePath); // 対象dir
      var jangetterResult = JSON.parse(_fs2.default.readFileSync(filePath, 'utf8'));
      this.log('***', jangetterResult.title, '***');
      var rows = jangetterResult.rows;
      if (Array.isArray(rows)) {
        this.beforeRows(rows);
        rows.forEach(function (row) {
          _this4.beforeRow(row);
          _this4.log('*', row.title);
          _this4.eachRow(row);
          _this4.afterRow(row);
        });
        this.afterRows(rows);
      } else {
        this.log('*** rows is not array.');
      }
    }
  }]);

  return ZaioOpeBase;
}();

ZaioOpeBase.Converters = {
  fileToBase64: {
    type: 'path',
    // <img src="data:image/png;base64,xxxxx..." />
    cvt: function cvt(filePath) {
      var mimeType = _mime2.default.getType(filePath.replace(/^.*\./, ''));
      if (mimeType === 'application/octet-stream') throw new Error('Couldn\'t get mime from ' + filePath);
      var body = _fs2.default.readFileSync(filePath, 'base64');
      return 'data:' + mimeType + ';base64,' + body;
    }
  }
};

var VerifyOperation = function (_ZaioOpeBase) {
  _inherits(VerifyOperation, _ZaioOpeBase);

  function VerifyOperation() {
    _classCallCheck(this, VerifyOperation);

    return _possibleConstructorReturn(this, (VerifyOperation.__proto__ || Object.getPrototypeOf(VerifyOperation)).apply(this, arguments));
  }

  _createClass(VerifyOperation, [{
    key: 'eachRow',
    value: function eachRow(row) {
      var found = this.findZaico(row.jan);
      var msg = found ? '登録済' : '未登録';
      this.log(msg, row.jan);
    }
  }]);

  return VerifyOperation;
}(ZaioOpeBase);

var AddOperation = function (_ZaioOpeBase2) {
  _inherits(AddOperation, _ZaioOpeBase2);

  function AddOperation() {
    _classCallCheck(this, AddOperation);

    return _possibleConstructorReturn(this, (AddOperation.__proto__ || Object.getPrototypeOf(AddOperation)).apply(this, arguments));
  }

  _createClass(AddOperation, [{
    key: 'eachRow',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(row) {
        var _this7 = this;

        var headers, data, res, getRes;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                headers = this.createRequestHeaders();
                data = this.createRequestData('add', row);
                // this.log(row,data);

                _context2.next = 4;
                return _axios2.default.post(this.config.apiUrl, data, { headers: headers }).catch(function (e) {
                  return _this7.err(e);
                });

              case 4:
                res = _context2.sent;

                if (!(res.data && this.useCache())) {
                  _context2.next = 10;
                  break;
                }

                _context2.next = 8;
                return _axios2.default.get(this.config.apiUrl + '/' + res.data.data_id, { headers: headers }).catch(function (e) {
                  return _this7.err(e);
                });

              case 8:
                getRes = _context2.sent;

                if (getRes) this.context.data.push(getRes.data);

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function eachRow(_x) {
        return _ref4.apply(this, arguments);
      }

      return eachRow;
    }()
  }, {
    key: 'afterRows',
    value: function afterRows() {
      if (this.useCache()) {
        this.saveContextData();
      }
    }
  }]);

  return AddOperation;
}(ZaioOpeBase);

var UpdateOperation = function (_ZaioOpeBase3) {
  _inherits(UpdateOperation, _ZaioOpeBase3);

  function UpdateOperation() {
    _classCallCheck(this, UpdateOperation);

    return _possibleConstructorReturn(this, (UpdateOperation.__proto__ || Object.getPrototypeOf(UpdateOperation)).apply(this, arguments));
  }

  _createClass(UpdateOperation, [{
    key: 'eachRow',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(row) {
        var _this9 = this;

        var found, headers, data, res;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                found = this.findZaico(row.jan);

                if (!found) {
                  _context3.next = 9;
                  break;
                }

                headers = this.createRequestHeaders();
                data = this.createRequestData('update', row);
                _context3.next = 6;
                return _axios2.default.put(this.config.apiUrl + '/' + found.id, data, { headers: headers }).catch(function (e) {
                  return _this9.err(e);
                });

              case 6:
                res = _context3.sent;
                _context3.next = 10;
                break;

              case 9:
                this.log('未登録のため更新できません', row.jan, row.title);

              case 10:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function eachRow(_x2) {
        return _ref5.apply(this, arguments);
      }

      return eachRow;
    }()
  }]);

  return UpdateOperation;
}(ZaioOpeBase);

var DeleteOperation = function (_ZaioOpeBase4) {
  _inherits(DeleteOperation, _ZaioOpeBase4);

  function DeleteOperation() {
    _classCallCheck(this, DeleteOperation);

    return _possibleConstructorReturn(this, (DeleteOperation.__proto__ || Object.getPrototypeOf(DeleteOperation)).apply(this, arguments));
  }

  _createClass(DeleteOperation, [{
    key: 'eachRow',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(row) {
        var _this11 = this;

        var found, headers, res;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                found = this.findZaico(row.jan);

                if (!found) {
                  _context4.next = 8;
                  break;
                }

                headers = this.createRequestHeaders();
                _context4.next = 5;
                return _axios2.default.delete(this.config.apiUrl + '/' + found.id, { headers: headers }).catch(function (e) {
                  return _this11.err(e);
                });

              case 5:
                res = _context4.sent;
                _context4.next = 9;
                break;

              case 8:
                this.log('未登録のため削除できません', row.jan, row.title);

              case 9:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function eachRow(_x3) {
        return _ref6.apply(this, arguments);
      }

      return eachRow;
    }()
  }]);

  return DeleteOperation;
}(ZaioOpeBase);

exports.default = {
  verify: function verify() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new (Function.prototype.bind.apply(VerifyOperation, [null].concat(args)))();
  },
  add: function add() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return new (Function.prototype.bind.apply(AddOperation, [null].concat(args)))();
  },
  update: function update() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    return new (Function.prototype.bind.apply(UpdateOperation, [null].concat(args)))();
  },
  delete: function _delete() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return new (Function.prototype.bind.apply(DeleteOperation, [null].concat(args)))();
  }
};
//# sourceMappingURL=ZaicoOpe.js.map