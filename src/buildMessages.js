export default function buildMessages(cache) {
  const dict = {};
  Object.keys(cache).forEach(filename => {
    const fileDeclarations = cache[filename];
    fileDeclarations.messagesBundle.forEach(messages => {
      Object.keys(messages).forEach(locale => {
        dict[locale] = dict[locale] || {};
        Object.assign(dict[locale], messages[locale]);
      });
    })
  });
  const output = {};
  Object.keys(dict).forEach(locale => {
    output[locale] = output[locale] || [];
    Object.keys(dict[locale]).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).forEach(key => {
      const value = dict[locale][key];
      const escapedKey = key.replace(/'/g, "\\'");
      const escapedValue = value.replace(/'/g, "\\'");
      output[locale].push(`    '${escapedKey}': '${escapedValue}'`);
    });
  });

  const outputString = Object.keys(output).map(locale => {
    return [
      `  ['${locale}']: {\n`,
      output[locale].join(',\n'),
      '\n  }'
    ].join('');
  }).join(',\n');


  return 'export default {\n' + outputString +'\n}\n\n';
}