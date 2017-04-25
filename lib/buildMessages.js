'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = buildMessages;
function buildMessages(cache, buildStats) {

  var stats = {};
  var collisions = {};

  var dict = {};
  Object.keys(cache).forEach(function (filename) {
    var fileDeclarations = cache[filename];
    fileDeclarations.messagesBundle.forEach(function (messages) {
      Object.keys(messages).forEach(function (locale) {
        dict[locale] = dict[locale] || {};
        stats[locale] = stats[locale] || {};
        if (buildStats) {
          Object.keys(messages[locale]).forEach(function (key) {
            var value = messages[locale][key];
            stats[locale][key] = stats[locale][key] || [];
            stats[locale][key].push(filename);
            if (dict[locale][key] && dict[locale][key] != value) {
              collisions[locale] = collisions[locale] || [];
              collisions[locale].push(key);
            }
          });
        }
        Object.assign(dict[locale], messages[locale]);
      });
    });
  });
  var output = {};
  Object.keys(dict).forEach(function (locale) {
    output[locale] = output[locale] || [];
    Object.keys(dict[locale]).sort(function (a, b) {
      return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    }).forEach(function (key) {
      var value = dict[locale][key];
      var escapedKey = key.replace(/"/g, '\\"');
      var escapedValue = value.replace(/"/g, '\\"');
      output[locale].push('    "' + escapedKey + '": "' + escapedValue + '"');
    });
  });

  var outputString = Object.keys(output).map(function (locale) {
    return ['  "' + locale + '": {\n', output[locale].join(',\n'), '\n  }'].join('');
  }).join(',\n');

  if (buildStats) {
    Object.keys(collisions).forEach(function (locale) {
      collisions[locale] = collisions[locale].reduce(function (previous, current) {
        previous[current] = stats[locale][current].reduce(function (stat, filename) {
          cache[filename].messagesBundle.forEach(function (messages) {
            if (messages[locale][current]) {
              stat[filename] = messages[locale][current];
            }
          });
          return stat;
        }, {});
        return previous;
      }, {});
    });
  }

  return {
    output: '{\n' + outputString + '\n}',
    stats: stats,
    collisions: collisions
  };
}
module.exports = exports['default'];