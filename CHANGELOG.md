# Changelog

## Version 0.1.0 (August 2nd, 2026)

- Added the native Rust Zed adapter for `papyrus-language-server` syntax diagnostics.
- Added configured-path, worktree `PATH`, and pinned `v0.1.0` release resolution for Windows x64, Linux x64, macOS Intel, and macOS Apple Silicon versions of `papyrus-language-server`.
- Moved canonical grammar ownership to `papyrus-language-server` at immutable release revision `f4baf7da54ed6fca79ff81ae211b3364282630b6`.
- Replaced the duplicate grammar and Node development toolchain with Rust fixture, query, manifest, and platform-mapping tests.
- Added Cargo-based Zed tasks and Linux CI validation for formatting, Clippy, tests, and the `wasm32-wasip2` extension target.
- Added an original ABI-15 Starfield-first Papyrus grammar, including guard constructs.
- Added Zed language metadata and queries for highlighting, brackets, indentation, outline symbols, overrides, and text objects.
- Added matching and autoclose support for `{...}` documentation comments.
- Added original Starfield fixtures, WASM grammar/query validation, Zed settings and grammar-development tasks, and installation/testing documentation.
- Added original Basic, Advanced, and Invalid Skyrim Anniversary Edition and Fallout 4 fixtures.
- Added native grammar unit coverage for comments, declarations, dialect features, expressions, statements, and representative syntax errors.
- Added whole-fixture concrete-node coverage and execution checks for every declared Zed query capture.
- Fixed documentation comments beginning with a semicolon and multiline comments with slash-adjacent closing delimiters.
- Validated the grammar against the complete locally installed Starfield, Skyrim Anniversary Edition, and Fallout 4 vanilla source corpora.
