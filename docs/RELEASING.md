# Releasing the Zed extension

## Two-repository release order

The initial extension release depends on native assets from [`papyrus-language-server`](https://github.com/monster-cookie/papyrus-language-server). Release in this order:

1. Complete and record the language-server CI checks on `master`.
2. Create the user-owned `v0.1.0` tag at commit `f4baf7da54ed6fca79ff81ae211b3364282630b6` and push that tag.
3. Confirm the language-server release workflow publishes these archives and matching `.sha256` files:
   - `papyrus-language-server-x86_64-pc-windows-msvc.zip`;
   - `papyrus-language-server-x86_64-unknown-linux-gnu.tar.gz`;
   - `papyrus-language-server-x86_64-apple-darwin.tar.gz`;
   - `papyrus-language-server-aarch64-apple-darwin.tar.gz`.
4. Complete local-binary and clean automatic-download Zed acceptance from `docs/TESTING.md`.
5. Complete the `zed-papyrus` Linux CI checks on the intended release commit.
6. Advance the extension version only after both repositories' release paths and supported platform builds are validated.
7. Submit the Zed extension revision to the marketplace registry.

The `papyrus-language-server` `v0.1.0` tag, four native archives, matching checksum files, and GitHub release were successfully published on August 2nd, 2026. Clean automatic-download acceptance remains the next release gate.

The user performs all Git tags, commits, pushes, and pull requests.

## Marketplace model

This repository does not produce a standalone marketplace archive. Zed publishes extensions from the [`zed-industries/extensions`](https://github.com/zed-industries/extensions) registry after a registry pull request is reviewed and merged.

The registry references this public repository as a Git submodule. Zed compiles the Rust adapter to WebAssembly and builds the pinned grammar; the native language server is downloaded at runtime and is never bundled into the extension repository.

## Extension release prerequisites

Before publishing a version:

- complete the Cargo validation suite in `docs/TESTING.md`;
- complete Windows Zed syntax and diagnostic acceptance;
- validate the pinned automatic download after the server release exists;
- confirm `Cargo.toml` and `extension.toml` contain the same semantic version;
- confirm the grammar revision is the full canonical commit SHA;
- confirm the referenced grammar commit and release are public;
- retain the accepted root `LICENSE` file;
- exclude Bethesda source, local game paths, native server binaries, `extension.wasm`, and `target` output.

## Version and tag policy

Release tags use `v<major>.<minor>.<patch>` and identify commits reachable from `master`. The extension remains `0.1.0` during integration. Advancing to `1.0.0` requires successful native server release builds for Windows, Linux, and both macOS architectures plus successful Zed extension validation.

The current extension CI does not publish releases. Any future automated marketplace workflow requires a separate approved plan and must run only from version tags associated with `master`.

## Initial marketplace submission

1. Fork `zed-industries/extensions` to a personal GitHub account.
2. Add this public repository as an HTTPS submodule at `extensions/papyrus`.
3. Add the `papyrus` entry and matching version to the registry's `extensions.toml`.
4. Run the registry's required sorting and validation commands.
5. Open a pull request to `zed-industries/extensions` and complete its review process.

Updating an existing marketplace version requires advancing the registry submodule and matching version in a new registry pull request.

