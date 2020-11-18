"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var sleep = exports.sleep = function sleep(waitMills) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, waitMills);
  });
};
//# sourceMappingURL=timers.js.map