'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _JsonUtil = require('./util/JsonUtil');

var _JsonUtil2 = _interopRequireDefault(_JsonUtil);

var _through2Filter = require('through2-filter');

var _through2Filter2 = _interopRequireDefault(_through2Filter);

var _through2Map = require('through2-map');

var _through2Map2 = _interopRequireDefault(_through2Map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EditManage = function () {
  function EditManage(path) {
    _classCallCheck(this, EditManage);

    this._editTmpPath = path;
    this._editArrWriter = null;
    this._editedData = null;
    this._flags = {};
    this._counts = [0, 0, 0];
  }

  _createClass(EditManage, [{
    key: 'addData',
    value: function addData(mode) {
      var _this = this;

      for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        data[_key - 1] = arguments[_key];
      }

      this._counts[mode] += data.length;
      data.forEach(function (data) {
        return _this._flags[data.id + ''] = mode;
      });
      if (mode !== EditManage.DELETE) this._addUpdatedData.apply(this, data);
    }
  }, {
    key: '_addUpdatedData',
    value: function _addUpdatedData() {
      if (!this._editArrWriter) {
        this._editArrWriter = _JsonUtil2.default.createObjectArrayWriter(this._editTmpPath);
      }

      for (var _len2 = arguments.length, data = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        data[_key2] = arguments[_key2];
      }

      this._editArrWriter.write(data);
    }
  }, {
    key: 'end',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this._editArrWriter) {
                  _context.next = 7;
                  break;
                }

                _context.next = 3;
                return this._editArrWriter.end();

              case 3:
                // TODO: 変更分が大きくてメモリ問題がでたら遅いけどファイルI/Oに変更する
                this._editedData = _JsonUtil2.default.loadJson(this._editTmpPath);
                _fs2.default.unlinkSync(this._editTmpPath);
                _context.next = 8;
                break;

              case 7:
                this._editedData = [];

              case 8:
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
  }, {
    key: 'isEdited',
    value: function isEdited() {
      return !_lodash2.default.isEmpty(this._flags);
    }
  }, {
    key: 'counts',
    value: function counts(mode) {
      return this._counts[mode];
    }
  }, {
    key: 'createDeletedFilter',
    value: function createDeletedFilter() {
      var _this2 = this;

      return (0, _through2Filter2.default)({
        objectMode: true
      }, function (chunk) {
        return _this2._flags[chunk.id + ''] !== EditManage.DELETE;
      });
    }
  }, {
    key: 'createUpdatedMapper',
    value: function createUpdatedMapper() {
      var _this3 = this;

      return (0, _through2Map2.default)({
        objectMode: true
      }, function (chunk) {
        if (_this3._flags[String(chunk.id)] !== EditManage.UPDATE) {
          return chunk;
        }
        return _this3._editedData.find(function (data) {
          return data.id === chunk.id;
        }) || chunk;
      });
    }
  }, {
    key: 'createAppendedReadable',
    value: function createAppendedReadable() {
      var _this4 = this;

      return _JsonUtil2.default.createObjectArrayReadble(this._editedData.filter(function (data) {
        return _this4._flags[data.id + ''] === EditManage.APPEND;
      }));
    }
  }]);

  return EditManage;
}();

EditManage.DELETE = 0;
EditManage.UPDATE = 1;
EditManage.APPEND = 2;
exports.default = EditManage;
//# sourceMappingURL=EditManage.js.map