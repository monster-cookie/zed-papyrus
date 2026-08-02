# Troubleshooting

## Zed cannot find the `v0.1.0` language-server release

Automatic download requires the public `papyrus-language-server` `v0.1.0` GitHub release. Until that release exists, build the server locally and configure its native executable under:

```json
{
  "lsp": {
    "papyrus-language-server": {
      "binary": {
        "path": "C:\\absolute\\path\\papyrus-language-server.exe"
      }
    }
  }
}
```

Use a native path on Linux or macOS. Do not include literal quote characters around the stored path and do not use an npm `.cmd` shim or `cmd.exe` wrapper.

## A configured or PATH-installed server does not start

The extension prefers a configured path and then Zed's worktree `PATH` before downloading. Confirm the selected file is the native `papyrus-language-server` executable. Restart Zed after changing the system `PATH`, because a running Zed process may retain its earlier environment.

Open `zed: open log` to inspect the exact command and server standard error. The server reserves standard output for LSP protocol traffic.

## Zed reports an unsupported platform

Automatic archives exist only for Windows x64, Linux x64 using glibc, macOS Intel, and macOS Apple Silicon. Other architectures must use a compatible explicitly configured build.

## The invalid fixture does not show a diagnostic

Confirm all three layers independently:

1. The status bar identifies the buffer as **Papyrus**.
2. `zed: open log` shows `papyrus-language-server` starting without an installation or process error.
3. `test-data/invalid/InvalidSyntax.psc` still omits `EndIf`.

A healthy 0.1 server should publish `Missing EndIf before EndFunction` at `EndFunction` without requiring a save. Inserting `EndIf` should clear the diagnostic.

If syntax highlighting and outline work but no diagnostic appears, the grammar is loaded but the language server is not necessarily healthy.

## A `.psc` file is plain text

Confirm the Papyrus development extension is installed and Zed's language selector shows **Papyrus**. If another extension also claims `.psc`, select Papyrus explicitly and inspect `zed: open log` for grammar-loading errors.

## Highlighting or outline entries look wrong

Use `dev: open highlights tree view` to compare syntax nodes and captures. Reduce the issue to a redistributable fixture, then run:

```powershell
cargo test --locked
```

The test compiles all queries and exercises their declared captures against valid fixtures.

## Rust extension compilation fails

Zed requires Rust installed through `rustup` for development extensions. From a terminal, run:

```powershell
rustup target add wasm32-wasip2
cargo check --locked --target wasm32-wasip2
```

If Cargo cannot fetch the pinned grammar, confirm the public language-server repository and commit are reachable from the machine.

## `Ctrl+Shift+R` reruns one task instead of showing the picker

When Zed's terminal has focus, `Ctrl+Shift+R` reruns the last task. Click inside the editor first, or open the command palette and run `task: spawn`.
