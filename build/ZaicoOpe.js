'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _pIteration = require('p-iteration');

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _JSONStream = require('JSONStream');

var _JSONStream2 = _interopRequireDefault(_JSONStream);

var _JsonUtil = require('./util/JsonUtil');

var _JsonUtil2 = _interopRequireDefault(_JsonUtil);

var _ZaicoRequester = require('./ZaicoRequester');

var _ZaicoRequester2 = _interopRequireDefault(_ZaicoRequester);

var _EditManage = require('./EditManage');

var _EditManage2 = _interopRequireDefault(_EditManage);

var _combinedStream = require('combined-stream');

var _combinedStream2 = _interopRequireDefault(_combinedStream);

var _through2Filter = require('through2-filter');

var _through2Filter2 = _interopRequireDefault(_through2Filter);

var _through2Map = require('through2-map');

var _through2Map2 = _interopRequireDefault(_through2Map);

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
    this.requester = new _ZaicoRequester2.default(config, options);
    this._editManage = new _EditManage2.default(config.editTmpFile);
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
    key: 'updateCacheData',
    value: function updateCacheData() {
      var _this2 = this;

      this.log('** update cahce', this.config.cacheFile);
      return new Promise(function (resolve) {
        _fs2.default.renameSync(_this2.config.cacheFile, _this2.config.cacheOldFile);
        var dest = [];
        if (_this2._editManage.counts(_EditManage2.default.DELETE)) dest.push(_this2._editManage.createDeletedFilter());
        if (_this2._editManage.counts(_EditManage2.default.UPDATE)) dest.push(_this2._editManage.createUpdatedMapper());
        var cacheFileStream = _JsonUtil2.default.toJSONArrayInputStream.apply(_JsonUtil2.default, [_this2.config.cacheOldFile].concat(dest));
        (_this2._editManage.counts(_EditManage2.default.APPEND) ? function () {
          var cs = _combinedStream2.default.create();
          cs.append(cacheFileStream);
          cs.append(_this2._editManage.createAppendedReadable());
          return cs;
        } : function () {
          return cacheFileStream;
        })().pipe(_JSONStream2.default.stringify()).pipe(_fs2.default.createWriteStream(_this2.config.cacheFile)).on('end', function () {
          return resolve();
        });
      });
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
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.log('** get all zaico data', this.config.cacheFile);
                _context.next = 3;
                return this.requester.listToArrayWriter(_JsonUtil2.default.createObjectArrayWriter(this.config.cacheFile));

              case 3:
                return _context.abrupt('return', _context.sent);

              case 4:
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
    key: '_listZaico',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(fn) {
        var _this3 = this;

        var mapFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (obj) {
          return obj;
        };
        var result;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                result = [];
                return _context2.abrupt('return', new Promise(function (resolve) {
                  _JsonUtil2.default.toJSONArrayInputStream(_this3.config.cacheFile).pipe((0, _through2Filter2.default)({ objectMode: true }, fn)).pipe((0, _through2Map2.default)({ objectMode: true }, mapFn)).on('data', function (data) {
                    return result.push(data);
                  }).on('end', function () {
                    return resolve(result);
                  });
                }));

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _listZaico(_x) {
        return _ref8.apply(this, arguments);
      }

      return _listZaico;
    }()
  }, {
    key: 'listZaico',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(jan) {
        var _this4 = this;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._listZaico(function (z) {
                  return z[_this4.mappingKey('jan')] === jan;
                });

              case 2:
                return _context3.abrupt('return', _context3.sent);

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function listZaico(_x3) {
        return _ref9.apply(this, arguments);
      }

      return listZaico;
    }()
  }, {
    key: 'findZaicoByKey',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(value, key) {
        var res;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this._listZaico(function (z) {
                  return z[key] === value;
                });

              case 2:
                res = _context4.sent;
                return _context4.abrupt('return', res.length > 0 && res[0]);

              case 4:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function findZaicoByKey(_x4, _x5) {
        return _ref10.apply(this, arguments);
      }

      return findZaicoByKey;
    }()
  }, {
    key: 'findZaico',
    value: function () {
      var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(jan) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.findZaicoByKey(jan, this.mappingKey('jan'));

              case 2:
                return _context5.abrupt('return', _context5.sent);

              case 3:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function findZaico(_x6) {
        return _ref11.apply(this, arguments);
      }

      return findZaico;
    }()
  }, {
    key: 'isChangedData',
    value: function isChangedData() {
      return this._editManage.isEdited();
    }
  }, {
    key: 'canProcess',
    value: function canProcess(files) {
      return files.length > 0;
    }
  }, {
    key: 'beforeFiles',
    value: function () {
      var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (_fs2.default.existsSync(this.config.cacheFile)) {
                  _context6.next = 3;
                  break;
                }

                _context6.next = 3;
                return this.zaicoDataToCache();

              case 3:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function beforeFiles() {
        return _ref12.apply(this, arguments);
      }

      return beforeFiles;
    }()
  }, {
    key: 'afterFiles',
    value: function () {
      var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this._editManage.end();

              case 2:
                if (!this.useCache()) {
                  _context7.next = 8;
                  break;
                }

                if (!this.isChangedData()) {
                  _context7.next = 6;
                  break;
                }

                _context7.next = 6;
                return this.updateCacheData();

              case 6:
                _context7.next = 9;
                break;

              case 8:
                this.removeCacheData();

              case 9:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function afterFiles() {
        return _ref13.apply(this, arguments);
      }

      return afterFiles;
    }()
  }, {
    key: 'beforeRows',
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

      function beforeRows() {
        return _ref14.apply(this, arguments);
      }

      return beforeRows;
    }()
  }, {
    key: 'afterRows',
    value: function () {
      var _ref15 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function afterRows() {
        return _ref15.apply(this, arguments);
      }

      return afterRows;
    }()
  }, {
    key: 'beforeRow',
    value: function () {
      var _ref16 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function beforeRow() {
        return _ref16.apply(this, arguments);
      }

      return beforeRow;
    }()
  }, {
    key: 'afterRow',
    value: function () {
      var _ref17 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function afterRow() {
        return _ref17.apply(this, arguments);
      }

      return afterRow;
    }()
  }, {
    key: 'eachRow',
    value: function () {
      var _ref18 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function eachRow() {
        return _ref18.apply(this, arguments);
      }

      return eachRow;
    }()
  }, {
    key: 'updateDatum',
    value: function () {
      var _ref19 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(mode, id, data) {
        var getRes, dummy;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                if (!this.useCache()) {
                  _context13.next = 9;
                  break;
                }

                if (!(mode === _EditManage2.default.DELETE)) {
                  _context13.next = 5;
                  break;
                }

                this._editManage.addData(mode, { id: id });
                _context13.next = 9;
                break;

              case 5:
                _context13.next = 7;
                return this.requester.info(id);

              case 7:
                getRes = _context13.sent;

                if (!_lodash2.default.isEmpty(getRes)) {
                  this._editManage.addData(mode, getRes.data);
                } else if (this.options.dryrun) {
                  dummy = _extends({}, data, { id: id });

                  delete dummy.item_image;
                  dummy.updated_at = '2222-22-22T22:22:22+09:00';
                  this._editManage.addData(mode, dummy);
                }

              case 9:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function updateDatum(_x7, _x8, _x9) {
        return _ref19.apply(this, arguments);
      }

      return updateDatum;
    }()
  }, {
    key: 'processFiles',
    value: function () {
      var _ref20 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(filePaths) {
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                if (this.canProcess(filePaths)) {
                  _context14.next = 2;
                  break;
                }

                return _context14.abrupt('return', false);

              case 2:
                _context14.next = 4;
                return this.beforeFiles();

              case 4:
                _context14.next = 6;
                return this._processFiles(filePaths);

              case 6:
                _context14.next = 8;
                return this.afterFiles();

              case 8:
                return _context14.abrupt('return', true);

              case 9:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function processFiles(_x10) {
        return _ref20.apply(this, arguments);
      }

      return processFiles;
    }()
  }, {
    key: '_processFiles',
    value: function () {
      var _ref21 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(filePaths) {
        var _this5 = this;

        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                _context16.next = 2;
                return (0, _pIteration.forEachSeries)(filePaths, function () {
                  var _ref22 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(f) {
                    return regeneratorRuntime.wrap(function _callee15$(_context15) {
                      while (1) {
                        switch (_context15.prev = _context15.next) {
                          case 0:
                            _context15.next = 2;
                            return _this5._processFile(f);

                          case 2:
                            return _context15.abrupt('return', _context15.sent);

                          case 3:
                          case 'end':
                            return _context15.stop();
                        }
                      }
                    }, _callee15, _this5);
                  }));

                  return function (_x12) {
                    return _ref22.apply(this, arguments);
                  };
                }());

              case 2:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function _processFiles(_x11) {
        return _ref21.apply(this, arguments);
      }

      return _processFiles;
    }()
  }, {
    key: '_processFile',
    value: function () {
      var _ref23 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18(filePath) {
        var _this6 = this;

        var jangetterResult, rows;
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                this.context.filePath = filePath; // 対象ファイル
                this.context.fileDir = _path2.default.dirname(filePath); // 対象dir
                this.log('*** load 編集ファイル ***');
                jangetterResult = _JsonUtil2.default.loadJson(filePath);

                this.log('***', jangetterResult.title, '***');
                rows = jangetterResult.rows;

                if (!Array.isArray(rows)) {
                  _context18.next = 15;
                  break;
                }

                _context18.next = 9;
                return this.beforeRows(rows);

              case 9:
                _context18.next = 11;
                return (0, _pIteration.forEachSeries)(rows, function () {
                  var _ref24 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(row, idx) {
                    return regeneratorRuntime.wrap(function _callee17$(_context17) {
                      while (1) {
                        switch (_context17.prev = _context17.next) {
                          case 0:
                            _context17.next = 2;
                            return _this6.beforeRow(row);

                          case 2:
                            _this6._writeRowTitle('* [' + (idx + 1) + '/' + rows.length + ']', row.title);
                            _context17.next = 5;
                            return _this6.eachRow(row);

                          case 5:
                            _context17.next = 7;
                            return _this6.afterRow(row);

                          case 7:
                          case 'end':
                            return _context17.stop();
                        }
                      }
                    }, _callee17, _this6);
                  }));

                  return function (_x14, _x15) {
                    return _ref24.apply(this, arguments);
                  };
                }());

              case 11:
                _context18.next = 13;
                return this.afterRows(rows);

              case 13:
                _context18.next = 16;
                break;

              case 15:
                this.log('*** rows is not array.');

              case 16:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function _processFile(_x13) {
        return _ref23.apply(this, arguments);
      }

      return _processFile;
    }()
  }, {
    key: '_writeRowTitle',
    value: function _writeRowTitle() {
      // readline.clearLine(process.stdout);
      // readline.cursorTo(process.stdout, 0);
      // process.stdout.write(str.join(' '));
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
    value: function () {
      var _ref25 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(row) {
        var janKey, msgs, list, msg;
        return regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                janKey = this.mappingKey('jan');
                msgs = ['未登録', '登録済み', '**複数登録済み**'];
                _context19.next = 4;
                return this.listZaico(row.jan);

              case 4:
                list = _context19.sent;
                msg = msgs[list.length > 1 ? 2 : list.length];

                this.log(msg, list.map(function (row) {
                  return row[janKey];
                }).join(','));

              case 7:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function eachRow(_x16) {
        return _ref25.apply(this, arguments);
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
      var _ref26 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20(row) {
        var data, res;
        return regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                _context20.t0 = !this.options.force;

                if (!_context20.t0) {
                  _context20.next = 5;
                  break;
                }

                _context20.next = 4;
                return this.findZaico(row.jan);

              case 4:
                _context20.t0 = _context20.sent;

              case 5:
                if (!_context20.t0) {
                  _context20.next = 8;
                  break;
                }

                this.log('すでにJANが登録されています', row.jan, row.title);
                return _context20.abrupt('return');

              case 8:
                data = this.createRequestData('add', row);
                _context20.next = 11;
                return this.requester.add(data);

              case 11:
                res = _context20.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context20.next = 15;
                  break;
                }

                _context20.next = 15;
                return this.updateDatum(_EditManage2.default.APPEND, res.data.data_id, data);

              case 15:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function eachRow(_x17) {
        return _ref26.apply(this, arguments);
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
      var _ref27 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21(row) {
        var found, data, res;
        return regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                _context21.next = 2;
                return this.findZaico(row.jan);

              case 2:
                found = _context21.sent;

                if (!found) {
                  _context21.next = 14;
                  break;
                }

                data = this.createRequestData('update', row, found);

                if (!(this.options.force || !_lodash2.default.toPairs(data).every(function (_ref28) {
                  var _ref29 = _slicedToArray(_ref28, 2),
                      k = _ref29[0],
                      v = _ref29[1];

                  return _lodash2.default.isEqual(v, found[k]);
                }))) {
                  _context21.next = 12;
                  break;
                }

                _context21.next = 8;
                return this.requester.update(found.id, data);

              case 8:
                res = _context21.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context21.next = 12;
                  break;
                }

                _context21.next = 12;
                return this.updateDatum(_EditManage2.default.UPDATE, found.id, found);

              case 12:
                _context21.next = 15;
                break;

              case 14:
                this.log('未登録のため更新できません', row.jan, row.title);

              case 15:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function eachRow(_x18) {
        return _ref27.apply(this, arguments);
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
      var _ref30 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee22(row) {
        var found, data, res, _data, _res;

        return regeneratorRuntime.wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                _context22.next = 2;
                return this.findZaico(row.jan);

              case 2:
                found = _context22.sent;

                if (!found) {
                  _context22.next = 14;
                  break;
                }

                data = this.createRequestData('update', row, found);

                if (!(this.options.force || !_lodash2.default.toPairs(data).every(function (_ref31) {
                  var _ref32 = _slicedToArray(_ref31, 2),
                      k = _ref32[0],
                      v = _ref32[1];

                  return _lodash2.default.isEqual(v, found[k]);
                }))) {
                  _context22.next = 12;
                  break;
                }

                _context22.next = 8;
                return this.requester.update(found.id, data);

              case 8:
                res = _context22.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context22.next = 12;
                  break;
                }

                _context22.next = 12;
                return this.updateDatum(_EditManage2.default.UPDATE, found.id, found);

              case 12:
                _context22.next = 21;
                break;

              case 14:
                _data = this.createRequestData('add', row);
                _context22.next = 17;
                return this.requester.add(_data);

              case 17:
                _res = _context22.sent;

                if (_lodash2.default.isEmpty(_res)) {
                  _context22.next = 21;
                  break;
                }

                _context22.next = 21;
                return this.updateDatum(_EditManage2.default.APPEND, _res.data.data_id, _data);

              case 21:
              case 'end':
                return _context22.stop();
            }
          }
        }, _callee22, this);
      }));

      function eachRow(_x19) {
        return _ref30.apply(this, arguments);
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
      var _ref33 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee23(row) {
        var found, res;
        return regeneratorRuntime.wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                _context23.next = 2;
                return this.findZaico(row.jan);

              case 2:
                found = _context23.sent;

                if (!found) {
                  _context23.next = 12;
                  break;
                }

                _context23.next = 6;
                return this.requester.remove(found.id, row.jan);

              case 6:
                res = _context23.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context23.next = 10;
                  break;
                }

                _context23.next = 10;
                return this.updateDatum(_EditManage2.default.DELETE, found.id);

              case 10:
                _context23.next = 13;
                break;

              case 12:
                this.log('未登録のため削除できません', row.jan, row.title);

              case 13:
              case 'end':
                return _context23.stop();
            }
          }
        }, _callee23, this);
      }));

      function eachRow(_x20) {
        return _ref33.apply(this, arguments);
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
      var _ref34 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee24() {
        return regeneratorRuntime.wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                _context24.next = 2;
                return this.zaicoDataToCache();

              case 2:
              case 'end':
                return _context24.stop();
            }
          }
        }, _callee24, this);
      }));

      function beforeFiles() {
        return _ref34.apply(this, arguments);
      }

      return beforeFiles;
    }()
  }, {
    key: '_processFiles',
    value: function () {
      var _ref35 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee25() {
        return regeneratorRuntime.wrap(function _callee25$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
              case 'end':
                return _context25.stop();
            }
          }
        }, _callee25, this);
      }));

      function _processFiles() {
        return _ref35.apply(this, arguments);
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
    key: '_createJanCountObj',
    value: function () {
      var _ref36 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee26() {
        var _this14 = this;

        var janKey, obj;
        return regeneratorRuntime.wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                janKey = this.mappingKey('jan');
                obj = {};
                return _context26.abrupt('return', new Promise(function (resolve) {
                  _JsonUtil2.default.toJSONArrayInputStream(_this14.config.cacheFile).on('data', function (data) {
                    var jan = data[janKey];
                    if (obj[jan]) {
                      obj[jan]++;
                    } else {
                      obj[jan] = 1;
                    }
                  }).on('end', function () {
                    return resolve(obj);
                  });
                }));

              case 3:
              case 'end':
                return _context26.stop();
            }
          }
        }, _callee26, this);
      }));

      function _createJanCountObj() {
        return _ref36.apply(this, arguments);
      }

      return _createJanCountObj;
    }()
  }, {
    key: '_createDupJan2Data',
    value: function () {
      var _ref37 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee27(janCountsObj) {
        var _this15 = this;

        var janKey, obj;
        return regeneratorRuntime.wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                janKey = this.mappingKey('jan');
                obj = {};
                return _context27.abrupt('return', new Promise(function (resolve) {
                  _JsonUtil2.default.toJSONArrayInputStream(_this15.config.cacheFile).pipe((0, _through2Filter2.default)({ objectMode: true }, function (data) {
                    return janCountsObj[data[janKey]] > 1;
                  })).on('data', function (data) {
                    var jan = data[janKey];
                    if (obj[jan]) {
                      obj[jan].push(data);
                    } else {
                      obj[jan] = [data];
                    }
                  }).on('end', function () {
                    return resolve(obj);
                  });
                }));

              case 3:
              case 'end':
                return _context27.stop();
            }
          }
        }, _callee27, this);
      }));

      function _createDupJan2Data(_x21) {
        return _ref37.apply(this, arguments);
      }

      return _createDupJan2Data;
    }()
  }, {
    key: '_processFiles',
    value: function () {
      var _ref38 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee30() {
        var _this16 = this;

        var janCounts, dupJanObj, removeJan;
        return regeneratorRuntime.wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                _context30.next = 2;
                return this._createJanCountObj();

              case 2:
                janCounts = _context30.sent;
                _context30.next = 5;
                return this._createDupJan2Data(janCounts);

              case 5:
                dupJanObj = _context30.sent;
                removeJan = _lodash2.default.toPairs(dupJanObj).map(function (_ref39) {
                  var _ref40 = _slicedToArray(_ref39, 2),
                      jan = _ref40[0],
                      arr = _ref40[1];

                  if (arr.length === 1) return undefined; // フィルタしてるので必ず複数だけど前のままにする
                  var data = arr.filter(function (v) {
                    return v.created_at === v.updated_at;
                  });
                  if (data.length === arr.length) {
                    var _options = _this16.options,
                        latest = _options.latest,
                        oldest = _options.oldest,
                        force = _options.force;

                    if (latest) return { jan: jan, data: data.slice(0, data.length - 1) };
                    if (oldest) return { jan: jan, data: data.slice(1, data.length) };
                    if (!force) {
                      _this16.log.apply(_this16, ['\u91CD\u8907\u3057\u305FJAN\u306E\u5168\u3066\u304C\u4F5C\u6210\u65E5\u30FB\u4FEE\u6B63\u65E5\u304C\u540C\u3058\u3067\u3059[' + jan + ']'].concat(_toConsumableArray(arr.map(function (v) {
                        return v.id;
                      }))));
                      return undefined;
                    }
                  } else if (data.length - arr.length > 1) {
                    var res = arr.filter(function (v) {
                      return v.created_at !== v.updated_at;
                    });
                    _this16.log.apply(_this16, ['\u91CD\u8907\u3057\u305FJAN\u306B\u4F5C\u6210\u65E5\u30FB\u4FEE\u6B63\u65E5\u304C\u9055\u3046\u3082\u306E\u304C\u8907\u6570\u542B\u307E\u308C\u307E\u3059\u3002\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u66F4\u65B0\u3057\u3001verify\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055[' + jan + ']'].concat(_toConsumableArray(res.map(function (v) {
                      return v.id;
                    }))));
                  }
                  return { jan: jan, data: data };
                }).filter(function (v) {
                  return v !== undefined;
                });
                _context30.next = 9;
                return (0, _pIteration.forEachSeries)(removeJan, function () {
                  var _ref41 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee29(_ref42) {
                    var jan = _ref42.jan,
                        data = _ref42.data;
                    return regeneratorRuntime.wrap(function _callee29$(_context29) {
                      while (1) {
                        switch (_context29.prev = _context29.next) {
                          case 0:
                            _context29.next = 2;
                            return (0, _pIteration.forEachSeries)(data, function () {
                              var _ref43 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee28(d) {
                                var res;
                                return regeneratorRuntime.wrap(function _callee28$(_context28) {
                                  while (1) {
                                    switch (_context28.prev = _context28.next) {
                                      case 0:
                                        _context28.next = 2;
                                        return _this16.requester.remove(d.id, jan);

                                      case 2:
                                        res = _context28.sent;

                                        if (_lodash2.default.isEmpty(res)) {
                                          _context28.next = 6;
                                          break;
                                        }

                                        _context28.next = 6;
                                        return _this16.updateDatum(_EditManage2.default.DELETE, d.id);

                                      case 6:
                                      case 'end':
                                        return _context28.stop();
                                    }
                                  }
                                }, _callee28, _this16);
                              }));

                              return function (_x23) {
                                return _ref43.apply(this, arguments);
                              };
                            }());

                          case 2:
                          case 'end':
                            return _context29.stop();
                        }
                      }
                    }, _callee29, _this16);
                  }));

                  return function (_x22) {
                    return _ref41.apply(this, arguments);
                  };
                }());

              case 9:
              case 'end':
                return _context30.stop();
            }
          }
        }, _callee30, this);
      }));

      function _processFiles() {
        return _ref38.apply(this, arguments);
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
      var _ref44 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee32(filePath) {
        var _this18 = this;

        var zaicos;
        return regeneratorRuntime.wrap(function _callee32$(_context32) {
          while (1) {
            switch (_context32.prev = _context32.next) {
              case 0:
                this.context.filePath = filePath; // 対象ファイル
                this.context.fileDir = _path2.default.dirname(filePath); // 対象dir
                this.log('*** load 編集ファイル ***');
                zaicos = _JsonUtil2.default.loadJson(filePath);

                this.log('*** cacheファイル操作 ***');

                if (!Array.isArray(zaicos)) {
                  _context32.next = 14;
                  break;
                }

                _context32.next = 8;
                return this.beforeRows(zaicos);

              case 8:
                _context32.next = 10;
                return (0, _pIteration.forEachSeries)(zaicos, function () {
                  var _ref45 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee31(zaico, idx) {
                    return regeneratorRuntime.wrap(function _callee31$(_context31) {
                      while (1) {
                        switch (_context31.prev = _context31.next) {
                          case 0:
                            _context31.next = 2;
                            return _this18.beforeRow(zaico);

                          case 2:
                            _this18._writeRowTitle('* [' + (idx + 1) + '/' + zaicos.length + ']', zaico.title);
                            _context31.next = 5;
                            return _this18.eachRow(zaico);

                          case 5:
                            _context31.next = 7;
                            return _this18.afterRow(zaico);

                          case 7:
                          case 'end':
                            return _context31.stop();
                        }
                      }
                    }, _callee31, _this18);
                  }));

                  return function (_x25, _x26) {
                    return _ref45.apply(this, arguments);
                  };
                }());

              case 10:
                _context32.next = 12;
                return this.afterRows(zaicos);

              case 12:
                _context32.next = 15;
                break;

              case 14:
                this.log('*** ' + filePath + ' is not array.');

              case 15:
              case 'end':
                return _context32.stop();
            }
          }
        }, _callee32, this);
      }));

      function _processFile(_x24) {
        return _ref44.apply(this, arguments);
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
    key: 'beforeRows',
    value: function () {
      var _ref46 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee33(zaicos) {
        var _this20 = this;

        var idHash;
        return regeneratorRuntime.wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                // 差分更新で無視するキー
                this.ignoreKeys = new Set(_lodash2.default.get(this.config, 'ignoreKeys.diffUpdate', []));
                this.log('** 差分更新前処理[cacheファイルハッシュ作成]開始 **');
                _context33.next = 4;
                return this._listZaico(function (_ref47) {
                  var id = _ref47.id;
                  return !!id;
                }, function (zaico) {
                  return [zaico.id, { code: zaico.code, hash: _this20.hash(_this20.diffZaico(zaico)) }];
                });

              case 4:
                idHash = _context33.sent;

                this.id2HashObj = new Map(idHash); // キャッシュデータの id をキー、データのハッシュ文字列をバリュー
                this.log('** 差分更新前処理[cacheファイルハッシュ作成]終了 **');

              case 7:
              case 'end':
                return _context33.stop();
            }
          }
        }, _callee33, this);
      }));

      function beforeRows(_x27) {
        return _ref46.apply(this, arguments);
      }

      return beforeRows;
    }()
  }, {
    key: 'hash',
    value: function hash(obj) {
      var md5 = _crypto2.default.createHash('md5');
      md5.update(JSON.stringify(obj));
      return md5.digest('hex');
    }

    /**
     * 在庫データ同士を比較し、差分があるデータを抽出します。
     * ignoreKeys.diffUpdateにあるキーは除外されます。
     * キャッシュ在庫データを省略したときは編集在庫データから ignoreKeys.diffUpdateにあるキーを除外した結果を返します。
     *
     * @param {Object} editZaico 編集在庫データ
     * @param {?Object} cacheZaico キャッシュ在庫データ
     * @return {Object} 差分として残った key, value を持ったオブジェクト
     */

  }, {
    key: 'diffZaico',
    value: function diffZaico(editZaico, cacheZaico) {
      var _this21 = this;

      return _lodash2.default.pickBy(editZaico, function (v, k) {
        return !_this21.ignoreKeys.has(k) && (!cacheZaico || k in cacheZaico && !_lodash2.default.isEqual(v, cacheZaico[k]));
      });
    }
  }, {
    key: 'eachRow',
    value: function () {
      var _ref48 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee34(zaico) {
        var hashObj, res, found, diff, _res2;

        return regeneratorRuntime.wrap(function _callee34$(_context34) {
          while (1) {
            switch (_context34.prev = _context34.next) {
              case 0:
                hashObj = this.id2HashObj.get(zaico.id);

                if (!hashObj) {
                  _context34.next = 26;
                  break;
                }

                if (!(Object.keys(zaico).length === 1)) {
                  _context34.next = 11;
                  break;
                }

                _context34.next = 5;
                return this.requester.remove(zaico.id, hashObj.code);

              case 5:
                res = _context34.sent;

                if (_lodash2.default.isEmpty(res)) {
                  _context34.next = 9;
                  break;
                }

                _context34.next = 9;
                return this.updateDatum(_EditManage2.default.DELETE, zaico.id);

              case 9:
                _context34.next = 24;
                break;

              case 11:
                if (!(this.hash(this.diffZaico(zaico)) !== hashObj.hash)) {
                  _context34.next = 24;
                  break;
                }

                this.log('DIFF HASH');
                _context34.next = 15;
                return this.findZaicoByKey(zaico.id, 'id');

              case 15:
                found = _context34.sent;
                diff = this.diffZaico(zaico, found);

                this.log('\ndiff [' + found.title + '] ' + JSON.stringify(diff, null, 2) + '\n');
                _context34.next = 20;
                return this.requester.update(found.id, diff);

              case 20:
                _res2 = _context34.sent;

                if (_lodash2.default.isEmpty(_res2)) {
                  _context34.next = 24;
                  break;
                }

                _context34.next = 24;
                return this.updateDatum(_EditManage2.default.UPDATE, found.id, found);

              case 24:
                _context34.next = 27;
                break;

              case 26:
                this.log('ID[' + zaico.id + ']\u306E\u30C7\u30FC\u30BF\u304C\u672A\u767B\u9332\u306E\u305F\u3081\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093', JSON.stringify(zaico));

              case 27:
              case 'end':
                return _context34.stop();
            }
          }
        }, _callee34, this);
      }));

      function eachRow(_x28) {
        return _ref48.apply(this, arguments);
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