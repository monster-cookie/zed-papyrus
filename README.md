# Papyrus syntax support for Zed

Starfield-first Bethesda Papyrus syntax support for [Zed](https://zed.dev/), powered by an original Tree-sitter grammar.

## Current status

The initial release deliberately focuses on portable, dependency-light language definition features:

- `.psc` file recognition;
- syntax highlighting;
- line comments;
- indentation and matching/autoclose for parentheses, square brackets, documentation-comment braces, and quotes;
- outline symbols;
- Vim text objects.

The grammar directly models modern Starfield structures, including structs, custom events, groups, properties, functions and events, states, arrays, casts, qualified struct types, line continuations, and guard constructs. Compiled `.pex` files are deliberately not associated with the language.

Language-server features such as completion, hover, go to definition, references, semantic diagnostics, rename, and formatting are deferred to a later phase. Tree-sitter represents malformed structure with error or missing nodes, but it does not publish editor diagnostics by itself. For example, the missing `EndIf` fixture is rejected by the grammar tests without producing a Problems-panel entry or diagnostic underline in Zed.

## Install as a Zed development extension

1. Clone this repository.
2. Open Zed's Extensions page with `Ctrl+Shift+X`.
3. Choose **Install Dev Extension**.
4. Select the repository root containing `extension.toml`.
5. Open a folder containing `.psc` source files.

The grammar-only extension does not require Rust, Papyrus-Lsp, a Papyrus compiler, or game files. If Zed previously loaded the language-server build from this repository, reinstall the development extension and restart Zed once to clear the old adapter.

## Development

Grammar development requires Node.js 18 or later and npm:

```powershell
npm install
npm run grammar:generate
npm run grammar:build
npm run grammar:test
```

The repository's `.zed/tasks.json` exposes the same install, generate, build, and test commands through Zed's task picker (`Ctrl+Shift+R` when the editor has focus).

The grammar is pinned by `extension.toml` to an immutable commit in this repository. If the grammar changes, publish the grammar commit first and update the manifest revision in a later commit.

See the [implementation plan](docs/IMPLEMENTATION-PLAN.md), [testing record](docs/TESTING.md), and [troubleshooting guide](docs/TROUBLESHOOTING.md).

## Compatibility

Starfield is the validated target for the initial release. Skyrim and Fallout 4 support is a future compatibility milestone; the grammar does not claim complete coverage for their dialects yet.

## Non-goals for the initial release

The grammar-only release does not provide a language server, Papyrus debugging, compilation, `.pex` decompilation, BA2 or ESM indexing, Creation Kit automation, or game-installation changes.

## License

This repository and its original grammar are licensed under GPL-3.0-or-later; see [LICENSE](LICENSE). Development dependencies `tree-sitter-cli` and `web-tree-sitter` are MIT-licensed.

Contributions should use original, redistributable fixtures and update the automated grammar checks and manual testing record.
