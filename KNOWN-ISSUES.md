# Known issues and deferred work

## Grammar errors are not editor diagnostics

The initial release is a grammar-only Zed extension. Tree-sitter identifies malformed structure with `ERROR` or missing syntax nodes, but Zed does not turn those nodes into diagnostic underlines, hover messages, inline messages, or Problems-panel entries.

The fixture `test-data/invalid/InvalidSyntax.psc` deliberately omits `EndIf`. Its current expected behavior is:

- automated grammar validation confirms that the syntax tree contains an error;
- Zed's `dev: open syntax tree view` displays an `ERROR` spanning the affected function;
- the editor does not display a human-readable “missing `EndIf`” diagnostic.

User-facing diagnostics require a language server. This is a known limitation of the grammar-only release, not a grammar-test failure.

### Future diagnostic acceptance criteria

Before language-server support is released, the invalid fixture must demonstrate all of the following in Zed:

- an error diagnostic appears without saving the file;
- the range identifies the unclosed `If` or its conflicting `EndFunction` rather than marking the entire file;
- the message explicitly identifies the missing `EndIf`;
- hovering the underline displays the complete message;
- the error appears in Zed's diagnostics view;
- inserting `EndIf` clears the diagnostic promptly;
- the behavior is validated on Windows, macOS, and Linux.

## Deferred language-server integration findings

The first Papyrus-Lsp prototype was removed before release. Re-evaluate the current upstream version before relying on these observations because upstream behavior may change.

### Cross-platform process launch

- Windows npm installations commonly expose `.cmd` shims, while macOS and Linux expose directly executable shims without that suffix.
- The Zed extension runs as WebAssembly and delegates process creation to the host, so manually embedded quote characters can reach `cmd.exe` literally.
- During the prototype, the verified Windows argument shape for a batch shim was `cmd.exe /d /s /c call <shim> <arguments>`. Direct executables must continue to launch without `cmd.exe` on macOS and Linux.
- Zed inherits its environment when launched. Installing a command or changing `PATH` may require restarting Zed before executable discovery succeeds.
- Future adapters need tests for configured paths containing spaces, PATH discovery, arguments, environment overrides, and missing-runtime errors on every supported platform.

### Papyrus-Lsp packaging

Papyrus-Lsp 1.4.1 was not available as a normal npm registry installation during the prototype. Its installation script invoked `tsc` while TypeScript was declared as a development dependency, causing production-style npm installation to fail when development dependencies were absent.

Do not encode the prototype's local build workaround into the extension. Reassess upstream packaging, licensing, release artifacts, runtime requirements, and update behavior before selecting an installation strategy.

### Windows file URI handling in `papyrus-check`

The tested Papyrus-Lsp 1.4.1 command-line checker converted a Windows URI such as `file:///C:/Project/Script.psc` by stripping only the `file://` prefix. That left `/C:/Project/Script.psc`, which Node interpreted incorrectly on Windows. When the server could not read the requested file, the pull-diagnostic path returned an empty result, allowing invalid input to be reported as clean.

Before using `papyrus-check` for Zed tasks or release validation:

- verify Windows paths with the standard Node `fileURLToPath` conversion or an equivalent platform-aware implementation;
- require a deliberately invalid fixture to produce a nonzero result;
- distinguish “file could not be read” from “file contains no diagnostics”;
- test paths containing spaces and non-ASCII characters.

### Feature validation

Do not treat generic word completion as proof that the language server is running. A future acceptance pass must first confirm a healthy server process, then independently validate completion from vanilla Starfield sources, signature help, hover, go to definition, references, document/workspace symbols, diagnostics, rename, formatting, semantic tokens, and compiler-unavailable behavior.
