# Testing

This record separates automated extension validation, canonical grammar evidence, and manual Zed acceptance. Configuration alone is not treated as evidence that a feature works.

## Current automated extension results

Results recorded on Windows x64 on 2026-08-01:

| Check | Result | Evidence |
| --- | --- | --- |
| `cargo test` | Pass | Two adapter tests, two manifest/ownership tests, and two grammar/query tests passed. |
| `cargo clippy --locked --all-targets -- -D warnings` | Pass | The extension and all test targets compiled without Clippy warnings. |
| `cargo fmt --all -- --check` | Pass | All Rust source and tests match `rustfmt`. |
| `cargo test --locked` | Pass | All six tests and documentation tests passed against `Cargo.lock`. |
| `cargo check --locked --target wasm32-wasip2` | Pass | The adapter compiled successfully for Zed's WebAssembly target. |

The grammar/query test parses two valid and one invalid fixture for each of Starfield, Skyrim, and Fallout 4. It also validates inline regressions, enforces concrete named grammar-node coverage, compiles all six Zed Tree-sitter queries, and exercises every declared capture.

The manifest test confirms the extension and Cargo versions match, the grammar is pinned to the canonical language-server commit, the language server is registered for Papyrus, all Zed language assets exist, and the retired duplicate grammar/Node toolchain is absent.

## Canonical grammar and source-audit evidence

The following validation was completed before grammar ownership moved to `papyrus-language-server`:

| Check | Result | Evidence |
| --- | --- | --- |
| Installed Starfield source audit | Pass | Recursively parsed 5,086 `.psc` files with zero `ERROR` and zero `MISSING` nodes, including 3,331 files under `Fragments`. |
| Installed Skyrim Anniversary Edition source audit | Pass | Recursively parsed 14,301 `.psc` files with zero `ERROR` and zero `MISSING` nodes, including 10,437 generated fragment scripts. |
| Installed Fallout 4 vanilla source audit | Pass | Parsed 10,282 unique Base, Creation Club, and DLC `.psc` files cleanly, including 7,138 files under `Fragments`. |

The audits read local game scripts in place and did not copy Bethesda source into either repository. These results remain grammar evidence because the Zed extension pins the same canonical parser revision.

The language-server repository additionally owns parser generation, WebAssembly fixture validation, native corpus tests, protocol-session tests, diagnostic-range tests, UTF-16 handling, and the human-readable missing-closer cases.

## Existing manual syntax acceptance

The grammar-only development extension previously passed these Windows Zed checks:

- `.psc` recognition and Papyrus language selection;
- Basic and Advanced fixture highlighting;
- outline symbols;
- `Ctrl+/` line-comment toggling;
- indentation and closing-keyword dedentation;
- parentheses, square brackets, quotes, and documentation-comment brace matching/autoclose;
- task-picker execution of the grammar/query validation.

Vim text objects remain untested manually because Vim mode is a global editor setting; the query and captures are validated automatically.

## Diagnostic acceptance with a local server binary

Before the server release exists:

1. Build `papyrus-language-server` in release mode.
2. Configure its absolute executable path under `lsp.papyrus-language-server.binary.path` in Zed settings.
3. Reinstall this repository as a development extension.
4. Open `test-data/invalid/InvalidSyntax.psc`.
5. Confirm `Missing EndIf before EndFunction` appears without saving.
6. Confirm hover and the diagnostics view show the message at `EndFunction`.
7. Insert `EndIf` and confirm the diagnostic clears promptly.
8. Reopen valid Starfield, Skyrim, and Fallout 4 fixtures and confirm no diagnostics appear.

## Automatic-download acceptance

After the `papyrus-language-server` `v0.1.0` release publishes all four archives:

1. Remove the configured binary override and ensure the server is not on Zed's `PATH`.
2. Remove the extension's downloaded server work directory or reinstall the development extension.
3. Open a `.psc` file and confirm Zed reports download/install progress.
4. Confirm the Windows x64 archive is selected, extracted, and launched directly.
5. Repeat the invalid/valid diagnostic acceptance above.
6. Confirm Linux x64 and both macOS assets build successfully in the language-server release workflow; manual Zed runtime testing on those hosts remains separate evidence.

## Release validation commands

```powershell
rustup target add wasm32-wasip2
cargo fmt --all -- --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
cargo check --locked --target wasm32-wasip2
```

CI runs the same four Cargo checks on Ubuntu for pull requests targeting `master`, pushes to `master`, and manual dispatches. It uses read-only repository permissions and does not access installed game files or secrets.
