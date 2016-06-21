import assert from 'assert';
import { writeFileSync } from 'fs';
import { relative, join, dirname, resolve } from 'path';
import { sync as mkDirPSync } from 'mkdirp';
import buildMessages from './buildMessages';
import addMessages from './addMessages';
import transformObjectExpressionIntoObject from './transformObjectExpressionIntoObject';

const KEY = 'OXYGEN_I18N'

const DEFAULT_OPTIONS = {
  identifier: 'addTranslations',
  bundleFile: 'messages.js',
  cacheDir: 'tmp/cache/'
};

export default function plugin(context) {
  context[KEY] = {
    cache: {},
    visiting: {},
  };

  return {
    visitor: visitor(context),
  };
}


function visitor(context) {
  const t = context.types;

  return {
    Program: {
      enter() {
        const filename = relative(process.cwd(), this.file.opts.filename);
        this.opts = buildOptions(this.opts, filename);
        this.oxygenI18n = {
          messagesBundle: [],
          messageCount: 0
        };
        context[KEY].visiting[filename] = true;
      },

      exit() {
        const { filename } = this.opts;
        if (!context[KEY].visiting[filename]) return;

        if (this.oxygenI18n.messageCount > 0) {
          context[KEY].cache[filename] = this.oxygenI18n;
        } else {
          delete context[KEY].cache[filename];
        }
        if (Object.keys(context[KEY].cache).length > 0 && this.opts.bundleFile) {
          const bundleFile = join(process.cwd(), this.opts.bundleFile);
          mkDirPSync(dirname(bundleFile));
          const bundleMessages = buildMessages(context[KEY].cache, this.opts);
          writeFileSync(bundleFile, bundleMessages, { encoding: 'utf8' });
        }
        context[KEY].visiting[filename] = false;
      },
    },

    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: this.opts.identifier })) {
        return;
      }
      const expr = path.node.arguments[0];
      const { context } = this.opts;

      assert(expr, 'oxygenI18n(...) call is missing an argument');

      const messagesBundle = {};
      const obj = transformObjectExpressionIntoObject(expr, context);
      addMessages(obj, Object.assign({}, this.opts), messagesBundle);
      this.oxygenI18n.messagesBundle.push(messagesBundle);
      this.oxygenI18n.messageCount += Object.keys(messagesBundle).length;
      path.remove();
    },
  };
}

const contextFileCache = {};

function buildOptions(options, filename) {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options, { filename });

  if (typeof options.context === 'string') {
    const file = resolve(options.context);
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
