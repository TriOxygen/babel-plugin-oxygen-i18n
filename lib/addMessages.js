"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addMessages;
function addMessages(messages, options, output) {
  Object.keys(messages).forEach(function (locale) {
    output[locale] = output[locale] || {};
    Object.assign(output[locale], messages[locale]);
  });
  return output;
}
module.exports = exports['default'];