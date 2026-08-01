# Tree-sitter Papyrus grammar

This directory contains the original Starfield-first Tree-sitter grammar used by the Zed Papyrus extension. It is a custom implementation and does not derive from or incorporate another Papyrus grammar.

The grammar targets Tree-sitter ABI 15 and recognizes the core modern Papyrus structures used by Starfield, including:

- scripts, imports, variables, properties, groups, structs, custom events, functions, events, and states;
- arrays, qualified struct types, member access, calls, casts, type tests, and `new` expressions;
- `Guard`, `RequiresGuard`, `LockGuard`, `TryLockGuard`, `ElseTryLockGuard`, and related block endings;
- Papyrus comments, documentation comments, and line continuations.

Tree-sitter provides tolerant structural parsing for editor features. Semantic validation, symbol resolution, and compiler diagnostics belong to Papyrus-Lsp and the Papyrus compiler rather than this grammar.

## Development

From the repository root:

```powershell
npm install
npm run grammar:generate
npm run grammar:build
npm run grammar:test
```

`grammar:generate` refreshes the committed ABI-15 C parser and node metadata. `grammar:build` creates the ignored `grammar/papyrus.wasm` artifact. `grammar:test` loads that artifact with `web-tree-sitter`, requires valid Starfield fixtures to parse without errors, requires invalid fixtures to produce an error, and checks coverage of the major syntax nodes.

The conventional corpus is under `test/corpus`. `npm run grammar:test:native` runs it when a native C compiler is available.
