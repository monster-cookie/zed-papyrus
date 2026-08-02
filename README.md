# Papyrus language support for Zed

Bethesda Papyrus language support for [Zed](https://zed.dev/), covering the dialects used by Starfield, Skyrim Anniversary Edition, and Fallout 4.

## Current status

The extension provides:

- `.psc` file recognition;
- syntax highlighting;
- line, multiline, and documentation comments;
- indentation and closing-keyword dedentation;
- bracket matching and autoclose;
- outline symbols;
- Vim text-object queries;
- native, unsaved-buffer syntax diagnostics from `papyrus-language-server`.

The first language-server milestone reports parser and structural errors, including a human-readable `Missing EndIf before EndFunction` diagnostic. Completion, hover, navigation, references, workspace indexing, semantic analysis, compilation, and debugging remain future work.

## Architecture

[`papyrus-language-server`](https://github.com/monster-cookie/papyrus-language-server) is the single source of truth for the original cross-dialect Tree-sitter grammar and editor-neutral analysis. This repository retains only Zed-specific language metadata, Tree-sitter queries, the extension adapter, and original redistributable fixtures.

Both the grammar and Rust test dependency are pinned to release commit `f4baf7da54ed6fca79ff81ae211b3364282630b6`. The adapter targets the language-server `v0.1.0` release rather than following an unpinned latest release.

## Install as a Zed development extension

1. Clone this repository.
2. Open Zed's Extensions page with `Ctrl+Shift+X`.
3. Choose **Install Dev Extension**.
4. Select the repository root containing `extension.toml`.
5. Open a folder containing `.psc` source files.

Zed compiles the Rust adapter to WebAssembly when the development extension is installed. Rust must be installed through `rustup`, as required by Zed's extension development environment.

### Language-server resolution

The extension resolves `papyrus-language-server` in this order:

1. the user-configured Zed binary path;
2. an executable named `papyrus-language-server` available through Zed's worktree `PATH`;
3. the pinned `v0.1.0` GitHub release for Windows x64, Linux x64, macOS Intel, or macOS Apple Silicon.

The published language-server `v0.1.0` release supports automatic download on all four listed platforms. To test a local build or explicitly override the downloaded server, configure its executable path:

```json
{
  "lsp": {
    "papyrus-language-server": {
      "binary": {
        "path": "C:\\Repositories\\Personal\\papyrus-language-server\\target\\release\\papyrus-language-server.exe",
        "arguments": [],
        "env": {}
      }
    }
  }
}
```

Use the native executable path for Linux or macOS. Do not add embedded quote characters or a Windows `cmd.exe` wrapper; the language server is a directly executable native binary on every supported platform.

## Development

Install the Zed WebAssembly target once, then run the checked-in Cargo validation:

```powershell
rustup target add wasm32-wasip2
cargo fmt --all -- --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
cargo check --locked --target wasm32-wasip2
```

The repository's `.zed/tasks.json` exposes the same formatting, linting, testing, and WebAssembly checks through Zed's task picker.

The Rust tests parse the original Basic, Advanced, and Invalid fixtures for all three supported game dialects, enforce grammar-node coverage, compile every Zed Tree-sitter query, exercise every declared capture, validate the manifest, and verify release-asset selection.

See the [implementation plan](docs/IMPLEMENTATION-PLAN.md), [testing record](docs/TESTING.md), [release process](docs/RELEASING.md), [known issues](KNOWN-ISSUES.md), and [troubleshooting guide](docs/TROUBLESHOOTING.md).

## Compatibility evidence

The canonical grammar was recursively validated against locally installed vanilla source corpora for Starfield, Skyrim Anniversary Edition, and Fallout 4. Bethesda source files are never copied into either repository. These audits provide broad syntax-compatibility evidence; they do not claim compiler or semantic equivalence.

## License

This Zed extension and the canonical grammar/language server are licensed under GPL-3.0-or-later; see [LICENSE](LICENSE). Third-party Rust dependency licenses are recorded in the respective Cargo dependency graphs.

Contributions must use original, redistributable fixtures and update the relevant automated checks.

