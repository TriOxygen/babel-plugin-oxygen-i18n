# babel-plugin-oxygen-i18n

A plugin for Babel v6 which moves translations (and sorts them) to a specified bundle file.

This has the added benefit that you can keep your translations local to your components. Whenever you remove a component, the translations (if they are not used in any other component) will also be removed from your bundle.

Since everything is bundled, it becomes easier to handle translations in other languages.

## TODO
- ~~Translation collision checking~~
- List missing translations ?
- more ?

## License

Released under The MIT License.