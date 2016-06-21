"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = buildMessages;
function buildMessages(cache) {
  var dict = {};
  Object.keys(cache).forEach(function (filename) {
    var fileDeclarations = cache[filename];
    fileDeclarations.messagesBundle.forEach(function (messages) {
      Object.keys(messages).forEach(function (locale) {
        dict[locale] = dict[locale] || {};
        Object.assign(dict[locale], messages[locale]);
      });
    });
  });
  var output = {};
  Object.keys(dict).forEach(function (locale) {
    output[locale] = output[locale] || [];
    Object.keys(dict[locale]).sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    }).forEach(function (key) {
      var value = dict[locale][key];
      var escapedKey = key.replace(/'/g, "\\'");
      var escapedValue = value.replace(/'/g, "\\'");
      output[locale].push("    '" + escapedKey + "': '" + escapedValue + "'");
    });
  });

  var outputString = Object.keys(output).map(function (locale) {
    return ["  ['" + locale + "']: {\n", output[locale].join(',\n'), '\n  }'].join('');
  }).join(',\n');

  return 'export default {\n' + outputString + '\n}\n\n';
}
module.exports = exports['default'];