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

var _pIteration = require('p-iteration');

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ZaioOpeBase = function () {
  function ZaioOpeBase(config, options) {
    _classCallCheck(this, ZaioOpeBase);

    this.config = config;
    this.options = options;
    this.context = {};
    this.context.orgData = [];
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
    key: 'loadCacheData',
    value: function loadCacheData() {
      this.log('** read cahce', this.config.cacheFile);
      this.context.data = JSON.parse(_fs2.default.readFileSync(this.config.cacheFile, 'utf-8'));
      this.cloneData();
    }
  }, {
    key: 'saveCacheData',
    value: function saveCacheData() {
      this.log('** write cahce', this.config.cacheFile);
      _fs2.default.writeFileSync(this.config.cacheFile, JSON.stringify(this.context.data, null, '  '), 'utf-8');
      this.cloneData();
    }
  }, {
    key: 'getZaicoData',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this2 = this;

        var headers, nextUrl, allData, res, link, m;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.log('** get list', this.config.cacheFile);
                headers = this.createRequestHeaders();
                nextUrl = this.config.apiUrl + '?page=1'; // 先頭ページからアクセス

                allData = [];

              case 4:
                if (!nextUrl) {
                  _context.next = 13;
                  break;
                }

                this.log('** get list', nextUrl);
                _context.next = 8;
                return _axios2.default.get(nextUrl, { headers: headers }).catch(function (e) {
                  return _this2.err(e);
                });

              case 8:
                res = _context.sent;

                nextUrl = undefined;
                if (res && Array.isArray(res.data)) {
                  allData.push.apply(allData, _toConsumableArray(res.data));
                  link = res.headers.link;
                  m = void 0;

                  if (link && (m = /<([^>]+)>; *rel="next"/.exec(link))) {
                    nextUrl = m[1];
                  }
                }
                _context.next = 4;
                break;

              case 13:
                return _context.abrupt('return', allData);

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getZaicoData() {
        return _ref3.apply(this, arguments);
      }

      return getZaicoData;
    }()
  }, {
    key: 'useCache',
    value: function useCache() {
      return this.options.cache && this.config.cacheFile;
    }
  }, {
    key: 'listZaico',
    value: function listZaico(jan) {
      var _this3 = this;

      return this.context.data.filter(function (z) {
        return z[_this3.mappingKey('jan')] === jan;
      });
    }
  }, {
    key: 'findZaico',
    value: function findZaico(jan) {
      var _this4 = this;

      return this.context.data.find(function (z) {
        return z[_this4.mappingKey('jan')] === jan;
      });
    }
  }, {
    key: 'cloneData',
    value: function cloneData() {
      this.context.orgData = _lodash2.default.cloneDeep(this.context.data);
    }
  }, {
    key: 'isChangedData',
    value: function isChangedData() {
      return JSON.stringify(this.context.data) !== JSON.stringify(this.context.orgData);
    }
  }, {
    key: 'beforeFiles',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var list;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this.useCache()) {
                  _context2.next = 4;
                  break;
                }

                if (!_fs2.default.existsSync(this.config.cacheFile)) {
                  _context2.next = 4;
                  break;
                }

                this.loadCacheData();
                return _context2.abrupt('return');

              case 4:
                this.context.data = [];
                _context2.next = 7;
                return this.getZaicoData();

              case 7:
                list = _context2.sent;

                if (list) {
                  this.context.data = list;
                  if (this.useCache()) {
                    this.saveCacheData();
                  }
                }

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function beforeFiles() {
        return _ref4.apply(this, arguments);
      }

      return beforeFiles;
    }()
  }, {
    key: 'afterFiles',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (this.useCache() && this.isChangedData()) {
                  this.saveCacheData();
                }

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function afterFiles() {
        return _ref5.apply(this, arguments);
      }

      return afterFiles;
    }()
  }, {
    key: 'beforeRows',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function beforeRows() {
        return _ref6.apply(this, arguments);
      }

      return beforeRows;
    }()
  }, {
    key: 'afterRows',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function afterRows() {
        return _ref7.apply(this, arguments);
      }

      return afterRows;
    }()
  }, {
    key: 'beforeRow',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function beforeRow() {
        return _ref8.apply(this, arguments);
      }

      return beforeRow;
    }()
  }, {
    key: 'afterRow',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function afterRow() {
        return _ref9.apply(this, arguments);
      }

      return afterRow;
    }()
  }, {
    key: 'eachRow',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function eachRow() {
        return _ref10.apply(this, arguments);
      }

      return eachRow;
    }()
  }, {
    key: 'updateDatum',
    value: function () {
      var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(id) {
        var _this5 = this;

        var del = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var headers, getRes, idx;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (!this.useCache()) {
                  _context9.next = 10;
                  break;
                }

                if (!del) {
                  _context9.next = 5;
                  break;
                }

                this.context.data = this.context.data.filter(function (row) {
                  return row.id !== id;
                });
                _context9.next = 10;
                break;

              case 5:
                headers = this.createRequestHeaders();
                _context9.next = 8;
                return _axios2.default.get(this.config.apiUrl + '/' + id, { headers: headers }).catch(function (e) {
                  return _this5.err(e);
                });

              case 8:
                getRes = _context9.sent;

                if (getRes) {
                  idx = this.context.data.findIndex(function (row) {
                    return row.id === id;
                  });

                  if (idx >= 0) {
                    this.context.data[idx] = getRes.data;
                  } else {
                    this.context.data.push(getRes.data);
                  }
                }

              case 10:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function updateDatum(_x) {
        return _ref11.apply(this, arguments);
      }

      return updateDatum;
    }()
  }, {
    key: 'processFiles',
    value: function () {
      var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(filePaths) {
        var _this6 = this;

        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return this.beforeFiles();

              case 2:
                _context11.next = 4;
                return (0, _pIteration.forEachSeries)(filePaths, function () {
                  var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(f) {
                    return regeneratorRuntime.wrap(function _callee10$(_context10) {
                      while (1) {
                        switch (_context10.prev = _context10.next) {
                          case 0:
                            _context10.next = 2;
                            return _this6.processFile(f);

                          case 2:
                            return _context10.abrupt('return', _context10.sent);

                          case 3:
                          case 'end':
                            return _context10.stop();
                        }
                      }
                    }, _callee10, _this6);
                  }));

                  return function (_x4) {
                    return _ref13.apply(this, arguments);
                  };
                }());

              case 4:
                _context11.next = 6;
                return this.afterFiles();

              case 6:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function processFiles(_x3) {
        return _ref12.apply(this, arguments);
      }

      return processFiles;
    }()
  }, {
    key: 'processFile',
    value: function () {
      var _ref14 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(filePath) {
        var _this7 = this;

        var jangetterResult, rows;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                this.context.filePath = filePath; // 対象ファイル
                this.context.fileDir = _path2.default.dirname(filePath); // 対象dir
                jangetterResult = JSON.parse(_fs2.default.readFileSync(filePath, 'utf8'));

                this.log('***', jangetterResult.title, '***');
                rows = jangetterResult.rows;

                if (!Array.isArray(rows)) {
                  _context13.next = 14;
                  break;
                }

                _context13.next = 8;
                return this.beforeRows(rows);

              case 8:
                _context13.next = 10;
                return (0, _pIteration.forEachSeries)(rows, function () {
                  var _ref15 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(row) {
                    return regeneratorRuntime.wrap(function _callee12$(_context12) {
                      while (1) {
                        switch (_context12.prev = _context12.next) {
                          case 0:
                            _context12.next = 2;
                            return _this7.beforeRow(row);

                          case 2:
                            _this7.log('*', row.title);
                            _context12.next = 5;
                            return _this7.eachRow(row);

                          case 5:
                            _context12.next = 7;
                            return _this7.afterRow(row);

                          case 7:
                          case 'end':
                            return _context12.stop();
                        }
                      }
                    }, _callee12, _this7);
                  }));

                  return function (_x6) {
                    return _ref15.apply(this, arguments);
                  };
                }());

              case 10:
                _context13.next = 12;
                return this.afterRows(rows);

              case 12:
                _context13.next = 15;
                break;

              case 14:
                this.log('*** rows is not array.');

              case 15:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function processFile(_x5) {
        return _ref14.apply(this, arguments);
      }

      return processFile;
    }()
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
    value: function () {
      var _ref16 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(row) {
        var msgs, list, msg;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                msgs = ['未登録', '登録済み', '**複数登録済み**'];
                list = this.listZaico(row.jan);
                msg = msgs[list.length > 1 ? 2 : list.length];

                this.log(msg, list.map(function (row) {
                  return row.jan;
                }).join(','));

              case 4:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function eachRow(_x7) {
        return _ref16.apply(this, arguments);
      }

      return eachRow;
    }()
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
      var _ref17 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(row) {
        var _this10 = this;

        var headers, data, res;
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                headers = this.createRequestHeaders();
                data = this.createRequestData('add', row);
                // this.log(row,data);

                _context15.next = 4;
                return _axios2.default.post(this.config.apiUrl, data, { headers: headers }).catch(function (e) {
                  return _this10.err(e);
                });

              case 4:
                res = _context15.sent;

                this.log('追加', row.jan, res.data.data_id);

                if (!res) {
                  _context15.next = 9;
                  break;
                }

                _context15.next = 9;
                return this.updateDatum(res.data.data_id);

              case 9:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function eachRow(_x8) {
        return _ref17.apply(this, arguments);
      }

      return eachRow;
    }()
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
      var _ref18 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(row) {
        var _this12 = this;

        var found, headers, data, res;
        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                found = this.findZaico(row.jan);

                if (!found) {
                  _context16.next = 13;
                  break;
                }

                headers = this.createRequestHeaders();
                data = this.createRequestData('update', row);
                _context16.next = 6;
                return _axios2.default.put(this.config.apiUrl + '/' + found.id, data, { headers: headers }).catch(function (e) {
                  return _this12.err(e);
                });

              case 6:
                res = _context16.sent;

                this.log('更新', row.jan, found.id);

                if (!res) {
                  _context16.next = 11;
                  break;
                }

                _context16.next = 11;
                return this.updateDatum(found.id);

              case 11:
                _context16.next = 14;
                break;

              case 13:
                this.log('未登録のため更新できません', row.jan, row.title);

              case 14:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function eachRow(_x9) {
        return _ref18.apply(this, arguments);
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
      var _ref19 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(row) {
        var _this14 = this;

        var found, headers, res;
        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                found = this.findZaico(row.jan);

                if (!found) {
                  _context17.next = 12;
                  break;
                }

                headers = this.createRequestHeaders();
                _context17.next = 5;
                return _axios2.default.delete(this.config.apiUrl + '/' + found.id, { headers: headers }).catch(function (e) {
                  return _this14.err(e);
                });

              case 5:
                res = _context17.sent;

                this.log('削除', row.jan, found.id);

                if (!res) {
                  _context17.next = 10;
                  break;
                }

                _context17.next = 10;
                return this.updateDatum(found.id, true);

              case 10:
                _context17.next = 13;
                break;

              case 12:
                this.log('未登録のため削除できません', row.jan, row.title);

              case 13:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function eachRow(_x10) {
        return _ref19.apply(this, arguments);
      }

      return eachRow;
    }()
  }]);

  return DeleteOperation;
}(ZaioOpeBase);

var CacheUpdateOperation = function (_ZaioOpeBase5) {
  _inherits(CacheUpdateOperation, _ZaioOpeBase5);

  function CacheUpdateOperation() {
    _classCallCheck(this, CacheUpdateOperation);

    return _possibleConstructorReturn(this, (CacheUpdateOperation.__proto__ || Object.getPrototypeOf(CacheUpdateOperation)).apply(this, arguments));
  }

  _createClass(CacheUpdateOperation, [{
    key: 'beforeFiles',
    value: function () {
      var _ref20 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18() {
        var list;
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                _context18.next = 2;
                return this.getZaicoData();

              case 2:
                list = _context18.sent;

                if (list) this.context.data = list;

              case 4:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function beforeFiles() {
        return _ref20.apply(this, arguments);
      }

      return beforeFiles;
    }()
  }, {
    key: 'processFile',
    value: function () {
      var _ref21 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19() {
        return regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function processFile() {
        return _ref21.apply(this, arguments);
      }

      return processFile;
    }()
  }, {
    key: 'useCache',
    value: function useCache() {
      return true;
    }
  }, {
    key: 'isChangedData',
    value: function isChangedData() {
      return true;
    }
  }]);

  return CacheUpdateOperation;
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
  },
  cache: function cache() {
    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    return new (Function.prototype.bind.apply(CacheUpdateOperation, [null].concat(args)))();
  }
};
//# sourceMappingURL=ZaicoOpe.js.map