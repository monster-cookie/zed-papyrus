# Troubleshooting

## Zed still reports a `papyrus-lsp` failure

The initial release no longer registers or starts a language server. If Zed previously loaded an older development build:

1. Run `zed: install dev extension`.
2. Select this repository root again.
3. Restart Zed.

The repository should not contain `extension.wasm`, `Cargo.toml`, or a `[language_servers]` section in `extension.toml`.

## A `.psc` file is plain text

Confirm that the Papyrus development extension is installed and that Zed's language selector shows **Papyrus**. If another extension also claims `.psc`, use the language selector to choose Papyrus and inspect `zed: open log` for grammar-loading errors.

## Highlighting or outline entries look wrong

Run `dev: open highlights tree view` to compare syntax nodes and highlight captures. Reduce the problem to a redistributable `.psc` fixture and run:

```powershell
npm run grammar:build
npm run grammar:test
```

## Missing syntax does not appear in the Problems panel

Tree-sitter supplies structural parsing for highlighting, indentation, outline, and related editor features. It can represent invalid input with `ERROR` or missing nodes, but it does not publish language-server diagnostics.

The automated invalid-fixture test verifies that `InvalidSyntax.psc` is structurally rejected. Inspect the syntax tree in Zed to see that result. Problems-panel messages and diagnostic underlines are deferred until a future language-server phase.

## Grammar development commands fail

Install Node.js 18 or later, run `npm install`, and regenerate before building:

```powershell
npm run grammar:generate
npm run grammar:build
npm run grammar:test
```

`grammar:build` may download or invoke Tree-sitter's WASI SDK in the user cache. The generated `grammar/papyrus.wasm` file is intentionally ignored.

## `Ctrl+Shift+R` reruns one task instead of showing the picker

When Zed's terminal has focus, `Ctrl+Shift+R` reruns the last task. Click inside the editor first, or open the command palette and run `task: spawn`.
