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
  bundleFile: 'messages.json',
  cacheDir: 'tmp/cache/',
  generate: true
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

let _timer = null;


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
        if (this.opts.generate && Object.keys(context[KEY].cache).length > 0 && this.opts.bundleFile) {
          if (_timer) {
            clearTimeout(_timer);
          }
          _timer = setTimeout(() => {
            const { bundleFile, statsFile} = this.opts;
            mkDirPSync(dirname(bundleFile));
            const {output, collisions, stats} = buildMessages(context[KEY].cache, !!statsFile);
            // console.log(statsFile, { collisions, stats })
            if (statsFile) {
              writeFileSync(statsFile, JSON.stringify({ collisions, stats }, undefined, '  '), { encoding: 'utf8'})
            }
            writeFileSync(bundleFile, output, { encoding: 'utf8' });
            _timer = null;
          }, 150);
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
  opts.bundleFile = join(process.cwd(), opts.bundleFile);
  if (opts.statsFile) {
    opts.statsFile = join(process.cwd(), opts.statsFile);
  }

  return opts;
}
