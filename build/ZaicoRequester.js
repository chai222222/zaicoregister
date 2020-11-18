'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _timers = require('./util/timers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ZaicoRequester = function () {
  function ZaicoRequester(config, options) {
    _classCallCheck(this, ZaicoRequester);

    this._config = config;
    this._options = options;
    this._requestCount = 0;
  }

  _createClass(ZaicoRequester, [{
    key: '_createRequestHeaders',
    value: function _createRequestHeaders() {
      return {
        Authorization: 'Bearer ' + this._config.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }
  }, {
    key: '_createRequestConfig',
    value: function _createRequestConfig() {
      return {
        headers: this._createRequestHeaders()
      };
    }
  }, {
    key: '_getWaitPromise',
    value: function _getWaitPromise() {
      var waitPerCount = _lodash2.default.get(this._config, 'waitPerCount', 10);
      this._requestCount++;
      if (this._requestCount % waitPerCount < 1) {
        var waitMills = _lodash2.default.get(this._config, 'waitMills', 2000);
        if (waitMills > 0) {
          console.log('[WAIT][' + waitMills + '\u30DF\u30EA\u79D2][' + this._requestCount + '\u30EA\u30AF\u30A8\u30B9\u30C8]');
          return (0, _timers.sleep)(waitMills);
        }
      }
      return Promise.resolve();
    }
  }, {
    key: 'log',
    value: function log() {
      var _console;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (this._options.dryrun) args.unshift('[DRYRUN]');
      (_console = console).log.apply(_console, _toConsumableArray(args.map(function (v) {
        return v === undefined ? '""' : v;
      })));
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
      return Promise.resolve(nul);
    }
  }, {
    key: 'apiUrl',
    value: function apiUrl() {
      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      return id ? this._config.apiUrl + '/' + id : this._config.apiUrl;
    }
  }, {
    key: '_zaicoOperation',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(apiFunc, logFunc) {
        var res;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._getWaitPromise();

              case 2:
                if (!this._options.dryrun) {
                  _context.next = 6;
                  break;
                }

                _context.t0 = {};
                _context.next = 9;
                break;

              case 6:
                _context.next = 8;
                return apiFunc();

              case 8:
                _context.t0 = _context.sent;

              case 9:
                res = _context.t0;

                logFunc(res);
                return _context.abrupt('return', res);

              case 12:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _zaicoOperation(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return _zaicoOperation;
    }()
  }, {
    key: 'list',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        var nextUrl, allData, res, link, m;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                nextUrl = this._config.apiUrl + '?page=1'; // 先頭ページからアクセス

                allData = [];

              case 2:
                if (!nextUrl) {
                  _context2.next = 13;
                  break;
                }

                _context2.next = 5;
                return this._getWaitPromise();

              case 5:
                this.log('** get list', nextUrl);
                _context2.next = 8;
                return _axios2.default.get(nextUrl, this._createRequestConfig()).catch(function (e) {
                  return _this.err(e);
                });

              case 8:
                res = _context2.sent;

                nextUrl = undefined;
                if (res && Array.isArray(res.data)) {
                  allData.push.apply(allData, _toConsumableArray(res.data));
                  link = res.headers.link;
                  m = void 0;

                  if (link && (m = /<([^>]+)>; *rel="next"/.exec(link)) && m[1].indexOf('?page') > 0) {
                    nextUrl = m[1];
                  }
                }
                _context2.next = 2;
                break;

              case 13:
                return _context2.abrupt('return', allData);

              case 14:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function list() {
        return _ref2.apply(this, arguments);
      }

      return list;
    }()
  }, {
    key: 'info',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(id) {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this._zaicoOperation(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          _context3.next = 2;
                          return _axios2.default.get(_this2.apiUrl(id), _this2._createRequestConfig()).catch(function (e) {
                            return _this2.err(e);
                          });

                        case 2:
                          return _context3.abrupt('return', _context3.sent);

                        case 3:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this2);
                })), function (res) {});

              case 2:
                return _context4.abrupt('return', _context4.sent);

              case 3:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function info(_x4) {
        return _ref3.apply(this, arguments);
      }

      return info;
    }()
  }, {
    key: 'add',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(data) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this._zaicoOperation(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
                  return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          _context5.next = 2;
                          return _axios2.default.post(_this3.apiUrl(), data, _this3._createRequestConfig()).catch(function (e) {
                            return _this3.err(e);
                          });

                        case 2:
                          return _context5.abrupt('return', _context5.sent);

                        case 3:
                        case 'end':
                          return _context5.stop();
                      }
                    }
                  }, _callee5, _this3);
                })), function (res) {
                  _this3.log('追加', data.code, _lodash2.default.get(res, 'data.data_id', ''));
                });

              case 2:
                return _context6.abrupt('return', _context6.sent);

              case 3:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function add(_x5) {
        return _ref5.apply(this, arguments);
      }

      return add;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(id, data) {
        var _this4 = this;

        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this._zaicoOperation(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
                  return regeneratorRuntime.wrap(function _callee7$(_context7) {
                    while (1) {
                      switch (_context7.prev = _context7.next) {
                        case 0:
                          _context7.next = 2;
                          return _axios2.default.put(_this4.apiUrl(id), data, _this4._createRequestConfig()).catch(function (e) {
                            return _this4.err(e);
                          });

                        case 2:
                          return _context7.abrupt('return', _context7.sent);

                        case 3:
                        case 'end':
                          return _context7.stop();
                      }
                    }
                  }, _callee7, _this4);
                })), function (res) {
                  _this4.log('更新', data.code, id);
                });

              case 2:
                return _context8.abrupt('return', _context8.sent);

              case 3:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function update(_x6, _x7) {
        return _ref7.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(id, jan) {
        var _this5 = this;

        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this._zaicoOperation(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
                  return regeneratorRuntime.wrap(function _callee9$(_context9) {
                    while (1) {
                      switch (_context9.prev = _context9.next) {
                        case 0:
                          _context9.next = 2;
                          return _axios2.default.delete(_this5.apiUrl(id), _this5._createRequestConfig()).catch(function (e) {
                            return _this5.err(e);
                          });

                        case 2:
                          return _context9.abrupt('return', _context9.sent);

                        case 3:
                        case 'end':
                          return _context9.stop();
                      }
                    }
                  }, _callee9, _this5);
                })), function (res) {
                  _this5.log('削除', jan, id);
                });

              case 2:
                return _context10.abrupt('return', _context10.sent);

              case 3:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function remove(_x8, _x9) {
        return _ref9.apply(this, arguments);
      }

      return remove;
    }()
  }]);

  return ZaicoRequester;
}();

exports.default = ZaicoRequester;
//# sourceMappingURL=ZaicoRequester.js.map