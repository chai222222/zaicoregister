'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _pIteration = require('p-iteration');

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _JsonUtil = require('./util/JsonUtil');

var _JsonUtil2 = _interopRequireDefault(_JsonUtil);

var _ZaicoRequester = require('./ZaicoRequester');

var _ZaicoRequester2 = _interopRequireDefault(_ZaicoRequester);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ZaioOpeBase = function () {
  function ZaioOpeBase(config, options) {
    _classCallCheck(this, ZaioOpeBase);

    this.config = config;
    this.options = options;
    this.context = {};
    this.context.orgData = [];
    this.requester = new _ZaicoRequester2.default(config, options);
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
    value: function createRequestData(method, data, found) {
      var _this = this;

      var init = _lodash2.default.cloneDeep(this.config.initialValue[method] || {});
      var convert = this.config.convert || {};
      var newData = _lodash2.default.fromPairs(_lodash2.default.toPairs(Object.assign(init, data)).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];

        return [_this.mappingKey(key), _this.convert(convert[key], value)];
      }));
      newData = this.replaceData(method, newData, found);
      newData = this.assignData(method, newData);
      return newData;
    }
  }, {
    key: 'log',
    value: function log() {
      var _console;

      (_console = console).log.apply(_console, arguments);
    }
  }, {
    key: 'mappingKey',
    value: function mappingKey(key) {
      return this.config.mapping[key] || key;
    }
  }, {
    key: 'replaceData',
    value: function replaceData(method, data, orgData) {
      var refData = Object.assign({}, orgData || {}, data);
      var replaceData = _lodash2.default.get(this.config, 'replaceValue.' + method);
      if (replaceData) {
        _lodash2.default.toPairs(replaceData).forEach(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
              k = _ref4[0],
              v = _ref4[1];

          if (!data[k] && refData[k] && Array.isArray(v)) {
            data[k] = JSON.parse(v.reduce(function (cur, info) {
              if (Array.isArray(info.regexp) && typeof info.replace === 'string') {
                var newRep = info.replace.replace(/\$\{(\w+)\}/g, function (m, p1) {
                  return refData[p1] || '';
                });
                return cur.replace(new (Function.prototype.bind.apply(RegExp, [null].concat(_toConsumableArray(info.regexp))))(), newRep);
              }
              return cur;
            }, JSON.stringify(refData[k])));
          }
        });
      }
      return data;
    }
  }, {
    key: 'assignData',
    value: function assignData(method, data) {
      var assignData = _lodash2.default.get(this.config, 'assignValue.' + method);
      if (assignData) {
        _lodash2.default.toPairs(assignData).forEach(function (_ref5) {
          var _ref6 = _slicedToArray(_ref5, 2),
              k = _ref6[0],
              v = _ref6[1];

          if (!data[k]) {
            data[k] = JSON.parse(JSON.stringify(v).replace(/\$\{(\w+)\}/g, function (m, p1) {
              return data[p1] || '';
            }));
          }
        });
      }
      return data;
    }
  }, {
    key: 'loadCacheData',
    value: function loadCacheData() {
      this.log('** read cahce', this.config.cacheFile);
      this.context.data = _JsonUtil2.default.loadJson(this.config.cacheFile);
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
    key: 'removeCacheData',
    value: function removeCacheData() {
      this.log('** remove cahce', this.config.cacheFile);
      _fs2.default.unlinkSync(this.config.cacheFile);
    }
  }, {
    key: 'zaicoDataToCache',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var out;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.log('** get all zaico data', this.config.cacheFile);
                out = _fs2.default.createWriteStream(this.config.cacheFile);
                _context.next = 4;
                return this.requester.listToArrayWriter(_JsonUtil2.default.createObjectArrayWriter(out));

              case 4:
                return _context.abrupt('return', _context.sent);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function zaicoDataToCache() {
        return _ref7.apply(this, arguments);
      }

      return zaicoDataToCache;
    }()
  }, {
    key: 'useCache',
    value: function useCache() {
      return this.options.cache && this.config.cacheFile;
    }
  }, {
    key: 'listZaico',
    value: function listZaico(jan) {
      var _this2 = this;

      return this.context.data.filter(function (z) {
        return z[_this2.mappingKey('jan')] === jan;
      });
    }
  }, {
    key: 'findZaicoByKey',
    value: function findZaicoByKey(value, key) {
      return this.context.data.find(function (z) {
        return z[key] === value;
      });
    }
  }, {
    key: 'findZaico',
    value: function findZaico(jan) {
      return this.findZaicoByKey(jan, this.mappingKey('jan'));
    }
  }, {
    key: 'cloneData',
    value: function cloneData() {
      this.context.orgData = _lodash2.default.cloneDeep(this.context.data);
    }
  }, {
    key: 'isChangedData',
    value: function isChangedData() {
      return !_lodash2.default.isEqual(this.context.data, this.context.orgData);
    }
  }, {
    key: 'canProcess',
    value: function canProcess(files) {
      return files.length > 0;
    }
  }, {
    key: 'beforeFiles',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (_fs2.default.existsSync(this.config.cacheFile)) {
                  _context2.next = 3;
                  break;
                }

                _context2.next = 3;
                return this.zaicoDataToCache();

              case 3:
                this.loadCacheData();

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function beforeFiles() {
        return _ref8.apply(this, arguments);
      }

      return beforeFiles;
    }()
  }, {
    key: 'afterFiles',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (this.useCache()) {
                  if (this.isChangedData() && !this.options.dryrun) {
                    this.saveCacheData();
                  }
                } else {
                  this.removeCacheData();
                }

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function afterFiles() {
        return _ref9.apply(this, arguments);
      }

      return afterFiles;
    }()
  }, {
    key: 'beforeRows',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
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
        return _ref10.apply(this, arguments);
      }

      return beforeRows;
    }()
  }, {
    key: 'afterRows',
    value: function () {
      var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
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
        return _ref11.apply(this, arguments);
      }

      return afterRows;
    }()
  }, {
    key: 'beforeRow',
    value: function () {
      var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
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
        return _ref12.apply(this, arguments);
      }

      return beforeRow;
    }()
  }, {
    key: 'afterRow',
    value: function () {
      var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
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
        return _ref13.apply(this, arguments);
      }

      return afterRow;
    }()
  }, {
    key: 'eachRow',
    value: function () {
      var _ref14 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
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
        return _ref14.apply(this, arguments);
      }

      return eachRow;
    }()
  }, {
    key: 'updateDatum',
    value: function () {
      var _ref15 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(id) {
        var del = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var getRes, idx;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (!this.useCache()) {
                  _context9.next = 9;
                  break;
                }

                if (!del) {
                  _context9.next = 5;
                  break;
                }

                this.context.data = this.context.data.filter(function (row) {
                  return row.id !== id;
                });
                _context9.next = 9;
                break;

              case 5:
                _context9.next = 7;
                return this.requester.info(id);

              case 7:
                getRes = _context9.sent;

                if (!_lodash2.default.isEmpty(getRes)) {
                  idx = this.context.data.findIndex(function (row) {
                    return row.id === id;
                  });

                  if (idx >= 0) {
                    this.context.data[idx] = getRes.data;
                  } else {
                    this.context.data.push(getRes.data);
                  }
                }

              case 9:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function updateDatum(_x) {
        return _ref15.apply(this, arguments);
      }

      return updateDatum;
    }()
  }, {
    key: 'processFiles',
    value: function () {
      var _ref16 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(filePaths) {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                if (this.canProcess(filePaths)) {
                  _context10.next = 2;
                  break;
                }

                return _context10.abrupt('return', false);

              case 2:
                _context10.next = 4;
                return this.beforeFiles();

              case 4:
                _context10.next = 6;
                return this._processFiles(filePaths);

              case 6:
                _context10.next = 8;
                return this.afterFiles();

              case 8:
                return _context10.abrupt('return', true);

              case 9:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function processFiles(_x3) {
        return _ref16.apply(this, arguments);
      }

      return processFiles;
    }()
  }, {
    key: '_processFiles',
    value: function () {
      var _ref17 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(filePaths) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return (0, _pIteration.forEachSeries)(filePaths, function () {
                  var _ref18 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(f) {
                    return regeneratorRuntime.wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            _context11.next = 2;
                            return _this3._processFile(f);

                          case 2:
                            return _context11.abrupt('return', _context11.sent);

                          case 3:
                          case 'end':
                            return _context11.stop();
                        }
                      }
                    }, _callee11, _this3);
                  }));

                  return function (_x5) {
                    return _ref18.apply(this, arguments);
                  };
                }());

              case 2:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function _processFiles(_x4) {
        return _ref17.apply(this, arguments);
      }

      return _processFiles;
    }()
  }, {
    key: '_processFile',
    value: function () {
      var _ref19 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(filePath) {
        var _this4 = this;

        var jangetterResult, rows;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                this.context.filePath = filePath; // 対象ファイル
                this.context.fileDir = _path2.default.dirname(filePath); // 対象dir
                jangetterResult = _JsonUtil2.default.loadJson(filePath);

                this.log('***', jangetterResult.title, '***');
                rows = jangetterResult.rows;

                if (!Array.isArray(rows)) {
                  _context14.next = 14;
                  break;
                }

                _context14.next = 8;
                return this.beforeRows(rows);

              case 8:
                _context14.next = 10;
                return (0, _pIteration.forEachSeries)(rows, function () {
                  var _ref20 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(row, idx) {
                    return regeneratorRuntime.wrap(function _callee13$(_context13) {
                      while (1) {
                        switch (_context13.prev = _context13.next) {
                          case 0:
                            _context13.next = 2;
                            return _this4.beforeRow(row);

                          case 2:
                            _this4.log('* [' + (idx + 1) + '/' + rows.length + ']', row.title);
                            _context13.next = 5;
                            return _this4.eachRow(row);

                          case 5:
                            _context13.next = 7;
                            return _this4.afterRow(row);

                          case 7:
                          case 'end':
                            return _context13.stop();
                        }
                      }
                    }, _callee13, _this4);
                  }));

                  return function (_x7, _x8) {
                    return _ref20.apply(this, arguments);
                  };
                }());

              case 10:
                _context14.next = 12;
                return this.afterRows(rows);

              case 12:
                _context14.next = 15;
                break;

              case 14:
                this.log('*** rows is not array.');

              case 15:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function _processFile(_x6) {
        return _ref19.apply(this, arguments);
      }

      return _processFile;
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
      var _ref21 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(row) {
        var msgs, list, msg;
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                msgs = ['未登録', '登録済み', '**複数登録済み**'];
                list = this.listZaico(row.jan);
                msg = msgs[list.length > 1 ? 2 : list.length];

                this.log(msg, list.map(function (row) {
                  return row.jan;
                }).join(','));

              case 4:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function eachRow(_x9) {
        return _ref21.apply(this, arguments);
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
      var _ref22 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(row) {
        var data, res;
        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                if (!(!this.options.force && this.findZaico(row.jan))) {
                  _context16.next = 3;
                  break;
                }

                this.log('すでにJANが登録されています', row.jan, row.title);
                return _context16.abrupt('return');

              case 3:
                data = this.createRequestData('add', row);
                _context16.next = 6;
                return this.requester.add(data);

              case 6:
                res = _context16.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context16.next = 10;
                  break;
                }

                _context16.next = 10;
                return this.updateDatum(res.data.data_id);

              case 10:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function eachRow(_x10) {
        return _ref22.apply(this, arguments);
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
      var _ref23 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(row) {
        var found, data, res;
        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                found = this.findZaico(row.jan);

                if (!found) {
                  _context17.next = 12;
                  break;
                }

                data = this.createRequestData('update', row, found);

                if (!(this.options.force || !_lodash2.default.toPairs(data).every(function (_ref24) {
                  var _ref25 = _slicedToArray(_ref24, 2),
                      k = _ref25[0],
                      v = _ref25[1];

                  return _lodash2.default.isEqual(v, found[k]);
                }))) {
                  _context17.next = 10;
                  break;
                }

                _context17.next = 6;
                return this.requester.update(found.id, data);

              case 6:
                res = _context17.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context17.next = 10;
                  break;
                }

                _context17.next = 10;
                return this.updateDatum(found.id);

              case 10:
                _context17.next = 13;
                break;

              case 12:
                this.log('未登録のため更新できません', row.jan, row.title);

              case 13:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function eachRow(_x11) {
        return _ref23.apply(this, arguments);
      }

      return eachRow;
    }()
  }]);

  return UpdateOperation;
}(ZaioOpeBase);

var UpdateOrAddOperation = function (_ZaioOpeBase4) {
  _inherits(UpdateOrAddOperation, _ZaioOpeBase4);

  function UpdateOrAddOperation() {
    _classCallCheck(this, UpdateOrAddOperation);

    return _possibleConstructorReturn(this, (UpdateOrAddOperation.__proto__ || Object.getPrototypeOf(UpdateOrAddOperation)).apply(this, arguments));
  }

  _createClass(UpdateOrAddOperation, [{
    key: 'eachRow',
    value: function () {
      var _ref26 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18(row) {
        var found, data, res, _data, _res;

        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                found = this.findZaico(row.jan);

                if (!found) {
                  _context18.next = 12;
                  break;
                }

                data = this.createRequestData('update', row, found);

                if (!(this.options.force || !_lodash2.default.toPairs(data).every(function (_ref27) {
                  var _ref28 = _slicedToArray(_ref27, 2),
                      k = _ref28[0],
                      v = _ref28[1];

                  return _lodash2.default.isEqual(v, found[k]);
                }))) {
                  _context18.next = 10;
                  break;
                }

                _context18.next = 6;
                return this.requester.update(found.id, data);

              case 6:
                res = _context18.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context18.next = 10;
                  break;
                }

                _context18.next = 10;
                return this.updateDatum(found.id);

              case 10:
                _context18.next = 19;
                break;

              case 12:
                _data = this.createRequestData('add', row);
                _context18.next = 15;
                return this.requester.add(_data);

              case 15:
                _res = _context18.sent;

                if (_lodash2.default.isEmpty(_res)) {
                  _context18.next = 19;
                  break;
                }

                _context18.next = 19;
                return this.updateDatum(_res.data.data_id);

              case 19:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function eachRow(_x12) {
        return _ref26.apply(this, arguments);
      }

      return eachRow;
    }()
  }]);

  return UpdateOrAddOperation;
}(ZaioOpeBase);

var DeleteOperation = function (_ZaioOpeBase5) {
  _inherits(DeleteOperation, _ZaioOpeBase5);

  function DeleteOperation() {
    _classCallCheck(this, DeleteOperation);

    return _possibleConstructorReturn(this, (DeleteOperation.__proto__ || Object.getPrototypeOf(DeleteOperation)).apply(this, arguments));
  }

  _createClass(DeleteOperation, [{
    key: 'eachRow',
    value: function () {
      var _ref29 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(row) {
        var found, res;
        return regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                found = this.findZaico(row.jan);

                if (!found) {
                  _context19.next = 10;
                  break;
                }

                _context19.next = 4;
                return this.requester.remove(found.id, row.jan);

              case 4:
                res = _context19.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context19.next = 8;
                  break;
                }

                _context19.next = 8;
                return this.updateDatum(found.id, true);

              case 8:
                _context19.next = 11;
                break;

              case 10:
                this.log('未登録のため削除できません', row.jan, row.title);

              case 11:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function eachRow(_x13) {
        return _ref29.apply(this, arguments);
      }

      return eachRow;
    }()
  }]);

  return DeleteOperation;
}(ZaioOpeBase);

var CacheUpdateOperation = function (_ZaioOpeBase6) {
  _inherits(CacheUpdateOperation, _ZaioOpeBase6);

  function CacheUpdateOperation() {
    _classCallCheck(this, CacheUpdateOperation);

    return _possibleConstructorReturn(this, (CacheUpdateOperation.__proto__ || Object.getPrototypeOf(CacheUpdateOperation)).apply(this, arguments));
  }

  _createClass(CacheUpdateOperation, [{
    key: 'beforeFiles',
    value: function () {
      var _ref30 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20() {
        return regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                _context20.next = 2;
                return this.zaicoDataToCache();

              case 2:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function beforeFiles() {
        return _ref30.apply(this, arguments);
      }

      return beforeFiles;
    }()
  }, {
    key: '_processFiles',
    value: function () {
      var _ref31 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21() {
        return regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function _processFiles() {
        return _ref31.apply(this, arguments);
      }

      return _processFiles;
    }()
  }, {
    key: 'useCache',
    value: function useCache() {
      return true;
    }
  }, {
    key: 'isChangedData',
    value: function isChangedData() {
      return false;
    }
  }, {
    key: 'canProcess',
    value: function canProcess() {
      return true;
    }
  }]);

  return CacheUpdateOperation;
}(ZaioOpeBase);

/**
 * JANの重複を削除します。
 * - JANが重複していること
 * - 更新日時、作成日時が同じであること
 */


var DeleteDuplicateOperation = function (_ZaioOpeBase7) {
  _inherits(DeleteDuplicateOperation, _ZaioOpeBase7);

  function DeleteDuplicateOperation() {
    _classCallCheck(this, DeleteDuplicateOperation);

    return _possibleConstructorReturn(this, (DeleteDuplicateOperation.__proto__ || Object.getPrototypeOf(DeleteDuplicateOperation)).apply(this, arguments));
  }

  _createClass(DeleteDuplicateOperation, [{
    key: 'canProcess',
    value: function canProcess() {
      return true;
    }
  }, {
    key: '_processFiles',
    value: function () {
      var _ref32 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee24() {
        var _this12 = this;

        var janKey, jan2DataArr, removeJan;
        return regeneratorRuntime.wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                janKey = this.mappingKey('jan');
                jan2DataArr = this.context.data.reduce(function (o, val) {
                  (o[val[janKey]] || (o[val[janKey]] = [])).push(val);
                  return o;
                }, {});
                removeJan = _lodash2.default.toPairs(jan2DataArr).map(function (_ref33) {
                  var _ref34 = _slicedToArray(_ref33, 2),
                      jan = _ref34[0],
                      arr = _ref34[1];

                  if (arr.length === 1) return undefined;
                  var data = arr.filter(function (v) {
                    return v.created_at === v.updated_at;
                  });
                  if (data.length === arr.length) {
                    var _options = _this12.options,
                        latest = _options.latest,
                        oldest = _options.oldest,
                        force = _options.force;

                    if (latest) return { jan: jan, data: data.slice(0, data.length - 1) };
                    if (oldest) return { jan: jan, data: data.slice(1, data.length) };
                    if (!force) {
                      _this12.log.apply(_this12, ['\u91CD\u8907\u3057\u305FJAN\u306E\u5168\u3066\u304C\u4F5C\u6210\u65E5\u30FB\u4FEE\u6B63\u65E5\u304C\u540C\u3058\u3067\u3059[' + jan + ']'].concat(_toConsumableArray(arr.map(function (v) {
                        return v.id;
                      }))));
                      return undefined;
                    }
                  } else if (data.length - arr.length > 1) {
                    var res = arr.filter(function (v) {
                      return v.created_at !== v.updated_at;
                    });
                    _this12.log.apply(_this12, ['\u91CD\u8907\u3057\u305FJAN\u306B\u4F5C\u6210\u65E5\u30FB\u4FEE\u6B63\u65E5\u304C\u9055\u3046\u3082\u306E\u304C\u8907\u6570\u542B\u307E\u308C\u307E\u3059\u3002\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u66F4\u65B0\u3057\u3001verify\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055[' + jan + ']'].concat(_toConsumableArray(res.map(function (v) {
                      return v.id;
                    }))));
                  }
                  return { jan: jan, data: data };
                }).filter(function (v) {
                  return v !== undefined;
                });
                _context24.next = 5;
                return (0, _pIteration.forEachSeries)(removeJan, function () {
                  var _ref35 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee23(_ref36) {
                    var jan = _ref36.jan,
                        data = _ref36.data;
                    return regeneratorRuntime.wrap(function _callee23$(_context23) {
                      while (1) {
                        switch (_context23.prev = _context23.next) {
                          case 0:
                            _context23.next = 2;
                            return (0, _pIteration.forEachSeries)(data, function () {
                              var _ref37 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee22(d) {
                                var res;
                                return regeneratorRuntime.wrap(function _callee22$(_context22) {
                                  while (1) {
                                    switch (_context22.prev = _context22.next) {
                                      case 0:
                                        _context22.next = 2;
                                        return _this12.requester.remove(d.id, jan);

                                      case 2:
                                        res = _context22.sent;

                                        if (_lodash2.default.isEmpty(res)) {
                                          _context22.next = 6;
                                          break;
                                        }

                                        _context22.next = 6;
                                        return _this12.updateDatum(d.id, true);

                                      case 6:
                                      case 'end':
                                        return _context22.stop();
                                    }
                                  }
                                }, _callee22, _this12);
                              }));

                              return function (_x15) {
                                return _ref37.apply(this, arguments);
                              };
                            }());

                          case 2:
                          case 'end':
                            return _context23.stop();
                        }
                      }
                    }, _callee23, _this12);
                  }));

                  return function (_x14) {
                    return _ref35.apply(this, arguments);
                  };
                }());

              case 5:
              case 'end':
                return _context24.stop();
            }
          }
        }, _callee24, this);
      }));

      function _processFiles() {
        return _ref32.apply(this, arguments);
      }

      return _processFiles;
    }()
  }]);

  return DeleteDuplicateOperation;
}(ZaioOpeBase);

var CacheFileOperationBase = function (_ZaioOpeBase8) {
  _inherits(CacheFileOperationBase, _ZaioOpeBase8);

  function CacheFileOperationBase() {
    _classCallCheck(this, CacheFileOperationBase);

    return _possibleConstructorReturn(this, (CacheFileOperationBase.__proto__ || Object.getPrototypeOf(CacheFileOperationBase)).apply(this, arguments));
  }

  _createClass(CacheFileOperationBase, [{
    key: '_processFile',
    value: function () {
      var _ref38 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee26(filePath) {
        var _this14 = this;

        var zaicos;
        return regeneratorRuntime.wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                this.context.filePath = filePath; // 対象ファイル
                this.context.fileDir = _path2.default.dirname(filePath); // 対象dir
                zaicos = _JsonUtil2.default.loadJson(filePath);

                this.log('*** cacheファイル操作 ***');

                if (!Array.isArray(zaicos)) {
                  _context26.next = 13;
                  break;
                }

                _context26.next = 7;
                return this.beforeRows(zaicos);

              case 7:
                _context26.next = 9;
                return (0, _pIteration.forEachSeries)(zaicos, function () {
                  var _ref39 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee25(zaico, idx) {
                    return regeneratorRuntime.wrap(function _callee25$(_context25) {
                      while (1) {
                        switch (_context25.prev = _context25.next) {
                          case 0:
                            _context25.next = 2;
                            return _this14.beforeRow(zaico);

                          case 2:
                            _this14.log('* [' + (idx + 1) + '/' + zaicos.length + ']', zaico.title);
                            _context25.next = 5;
                            return _this14.eachRow(zaico);

                          case 5:
                            _context25.next = 7;
                            return _this14.afterRow(zaico);

                          case 7:
                          case 'end':
                            return _context25.stop();
                        }
                      }
                    }, _callee25, _this14);
                  }));

                  return function (_x17, _x18) {
                    return _ref39.apply(this, arguments);
                  };
                }());

              case 9:
                _context26.next = 11;
                return this.afterRows(zaicos);

              case 11:
                _context26.next = 14;
                break;

              case 13:
                this.log('*** ' + filePath + ' is not array.');

              case 14:
              case 'end':
                return _context26.stop();
            }
          }
        }, _callee26, this);
      }));

      function _processFile(_x16) {
        return _ref38.apply(this, arguments);
      }

      return _processFile;
    }()
  }]);

  return CacheFileOperationBase;
}(ZaioOpeBase);

var DiffUpdateOperation = function (_CacheFileOperationBa) {
  _inherits(DiffUpdateOperation, _CacheFileOperationBa);

  function DiffUpdateOperation() {
    _classCallCheck(this, DiffUpdateOperation);

    return _possibleConstructorReturn(this, (DiffUpdateOperation.__proto__ || Object.getPrototypeOf(DiffUpdateOperation)).apply(this, arguments));
  }

  _createClass(DiffUpdateOperation, [{
    key: 'eachRow',
    value: function () {
      var _ref40 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee27(zaico) {
        var found, res, ignore, diff, _res2;

        return regeneratorRuntime.wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                found = this.findZaicoByKey(zaico.id, 'id');

                if (!found) {
                  _context27.next = 23;
                  break;
                }

                if (!(Object.keys(zaico).length === 1)) {
                  _context27.next = 11;
                  break;
                }

                _context27.next = 5;
                return this.requester.remove(found.id, found.code);

              case 5:
                res = _context27.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context27.next = 9;
                  break;
                }

                _context27.next = 9;
                return this.updateDatum(found.id, true);

              case 9:
                _context27.next = 21;
                break;

              case 11:
                // 更新
                // 差分をとって除外キーになってなくて違いがあるデータを残す
                ignore = new Set(_lodash2.default.get(this.config, 'ignoreKeys.diffUpdate', []));
                diff = _lodash2.default.pickBy(zaico, function (v, k) {
                  return k in found && !ignore.has(k) && !_lodash2.default.isEqual(v, found[k]);
                });

                if (_lodash2.default.isEmpty(diff)) {
                  _context27.next = 21;
                  break;
                }

                this.log('diff', JSON.stringify(diff));
                _context27.next = 17;
                return this.requester.update(found.id, diff);

              case 17:
                _res2 = _context27.sent;

                if (_lodash2.default.isEmpty(_res2)) {
                  _context27.next = 21;
                  break;
                }

                _context27.next = 21;
                return this.updateDatum(found.id);

              case 21:
                _context27.next = 24;
                break;

              case 23:
                this.log('ID[' + zaico.id + '\u306E\u30C7\u30FC\u30BF\u304C\u672A\u767B\u9332\u306E\u305F\u3081\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093', zaico.jan, zaico.title);

              case 24:
              case 'end':
                return _context27.stop();
            }
          }
        }, _callee27, this);
      }));

      function eachRow(_x19) {
        return _ref40.apply(this, arguments);
      }

      return eachRow;
    }()
  }]);

  return DiffUpdateOperation;
}(CacheFileOperationBase);

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
  updateAdd: function updateAdd() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return new (Function.prototype.bind.apply(UpdateOrAddOperation, [null].concat(args)))();
  },
  delete: function _delete() {
    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    return new (Function.prototype.bind.apply(DeleteOperation, [null].concat(args)))();
  },
  deleteDuplicate: function deleteDuplicate() {
    for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args[_key6] = arguments[_key6];
    }

    return new (Function.prototype.bind.apply(DeleteDuplicateOperation, [null].concat(args)))();
  },
  cache: function cache() {
    for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
      args[_key7] = arguments[_key7];
    }

    return new (Function.prototype.bind.apply(CacheUpdateOperation, [null].concat(args)))();
  },
  diffUpdate: function diffUpdate() {
    for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
      args[_key8] = arguments[_key8];
    }

    return new (Function.prototype.bind.apply(DiffUpdateOperation, [null].concat(args)))();
  }
};
//# sourceMappingURL=ZaicoOpe.js.map