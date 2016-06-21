export default function addMessages (messages, options, output) {
  Object.keys(messages).forEach(locale => {
    output[locale] = output[locale] || {};
    Object.assign(output[locale], messages[locale]);
  });
  return output;
}