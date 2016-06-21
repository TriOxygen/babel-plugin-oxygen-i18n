export default function buildMessages(cache, buildStats) {

  const stats = {};
  const collisions = {};

  const dict = {};
  Object.keys(cache).forEach(filename => {
    const fileDeclarations = cache[filename];
    fileDeclarations.messagesBundle.forEach(messages => {
      Object.keys(messages).forEach(locale => {
        dict[locale] = dict[locale] || {};
        stats[locale] = stats[locale] || {};
        if (buildStats) {
          Object.keys(messages[locale]).forEach(key => {
            const value = messages[locale][key];
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
    })
  });
  const output = {};
  Object.keys(dict).forEach(locale => {
    output[locale] = output[locale] || [];
    Object.keys(dict[locale]).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).forEach(key => {
      const value = dict[locale][key];
      const escapedKey = key.replace(/"/g, '\\"');
      const escapedValue = value.replace(/"/g, '\\"');
      output[locale].push(`    "${escapedKey}": "${escapedValue}"`);
    });
  });

  const outputString = Object.keys(output).map(locale => {
    return [
      `  "${locale}": {\n`,
      output[locale].join(',\n'),
      '\n  }'
    ].join('');
  }).join(',\n');

  if (buildStats) {
    Object.keys(collisions).forEach(locale => {
      collisions[locale] = collisions[locale].reduce(( previous, current) => {
        previous[current] = stats[locale][current].reduce(( stat, filename) => {
          cache[filename].messagesBundle.forEach(messages => {
            if (messages[locale][current]) {
              stat[filename] = messages[locale][current];
            }
          })
          return stat;
        }, {});
        return previous;
      }, {});
    });
  }

  return {
    output: '{\n' + outputString +'\n}',
    stats,
    collisions
  }
}