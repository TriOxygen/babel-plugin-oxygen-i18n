'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = plugin;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _fs = require('fs');

var _path = require('path');

var _mkdirp = require('mkdirp');

var _buildMessages = require('./buildMessages');

var _buildMessages2 = _interopRequireDefault(_buildMessages);

var _addMessages = require('./addMessages');

var _addMessages2 = _interopRequireDefault(_addMessages);

var _transformObjectExpressionIntoObject = require('./transformObjectExpressionIntoObject');

var _transformObjectExpressionIntoObject2 = _interopRequireDefault(_transformObjectExpressionIntoObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var KEY = 'OXYGEN_I18N';

var DEFAULT_OPTIONS = {
  identifier: 'addTranslations',
  bundleFile: 'messages.js',
  cacheDir: 'tmp/cache/'
};

function plugin(context) {
  context[KEY] = {
    cache: {},
    visiting: {}
  };

  return {
    visitor: visitor(context)
  };
}

function visitor(context) {
  var t = context.types;

  return {
    Program: {
      enter: function enter() {
        var filename = (0, _path.relative)(process.cwd(), this.file.opts.filename);
        this.opts = buildOptions(this.opts, filename);
        this.oxygenI18n = {
          messagesBundle: [],
          messageCount: 0
        };
        context[KEY].visiting[filename] = true;
      },
      exit: function exit() {
        var filename = this.opts.filename;

        if (!context[KEY].visiting[filename]) return;

        if (this.oxygenI18n.messageCount > 0) {
          context[KEY].cache[filename] = this.oxygenI18n;
        } else {
          delete context[KEY].cache[filename];
        }
        if (Object.keys(context[KEY].cache).length > 0 && this.opts.bundleFile) {
          var bundleFile = (0, _path.join)(process.cwd(), this.opts.bundleFile);
          (0, _mkdirp.sync)((0, _path.dirname)(bundleFile));
          var bundleMessages = (0, _buildMessages2.default)(context[KEY].cache, this.opts);
          (0, _fs.writeFileSync)(bundleFile, bundleMessages, { encoding: 'utf8' });
        }
        context[KEY].visiting[filename] = false;
      }
    },

    CallExpression: function CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: this.opts.identifier })) {
        return;
      }
      var expr = path.node.arguments[0];
      var context = this.opts.context;


      (0, _assert2.default)(expr, 'oxygenI18n(...) call is missing an argument');

      var messagesBundle = {};
      var obj = (0, _transformObjectExpressionIntoObject2.default)(expr, context);
      (0, _addMessages2.default)(obj, Object.assign({}, this.opts), messagesBundle);
      this.oxygenI18n.messagesBundle.push(messagesBundle);
      this.oxygenI18n.messageCount += Object.keys(messagesBundle).length;
      path.remove();
    }
  };
}

var contextFileCache = {};

function buildOptions(options, filename) {
  var opts = Object.assign({}, DEFAULT_OPTIONS, options, { filename: filename });

  if (typeof options.context === 'string') {
    var file = (0, _path.resolve)(options.context);
    if (typeof contextFileCache[file] === 'undefined') {
      try {
        contextFileCache[file] = require(file);
      } catch (error) {
        console.error(error);
      }
    }

    opts.context = contextFileCache[file];
  }

  return opts;
}
module.exports = exports['default'];