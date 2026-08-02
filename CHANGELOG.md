# Changelog

## Unreleased

- Added an original ABI-15 Starfield-first Papyrus grammar, including guard constructs.
- Added Zed language metadata and queries for highlighting, brackets, indentation, outline symbols, overrides, and text objects.
- Added matching and autoclose support for `{...}` documentation comments.
- Added original Starfield fixtures, WASM grammar/query validation, Zed settings and grammar-development tasks, and installation/testing documentation.
- Added original Basic, Advanced, and Invalid Skyrim Anniversary Edition and Fallout 4 fixtures.
- Added native grammar unit coverage for comments, declarations, dialect features, expressions, statements, and representative syntax errors.
- Added whole-fixture concrete-node coverage and execution checks for every declared Zed query capture.
- Fixed documentation comments beginning with a semicolon and multiline comments with slash-adjacent closing delimiters.
- Validated the grammar against the complete locally installed Starfield, Skyrim Anniversary Edition, and Fallout 4 vanilla source corpora.
- Scoped the initial release to syntax support; language-server integration is deferred to a separately validated future phase.
