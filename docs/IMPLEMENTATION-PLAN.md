# Implementation plan

## Release decision

The initial marketplace release includes both portable syntax support and the diagnostic-first `papyrus-language-server`. User-facing diagnostics are required because Tree-sitter error nodes alone do not create Zed underlines, hover messages, or Problems-panel entries.

The abandoned third-party `Papyrus-Lsp` prototype is not used. The replacement is the original, native Rust server in [`monster-cookie/papyrus-language-server`](https://github.com/monster-cookie/papyrus-language-server).

## Repository ownership

`papyrus-language-server` is the single source of truth for:

- the original Tree-sitter Papyrus grammar;
- generated parser sources and Rust grammar binding;
- editor-neutral syntax diagnostics;
- native language-server release archives.

`zed-papyrus` owns only:

- Zed language metadata;
- highlighting, indentation, outline, bracket, override, and text-object queries;
- the Zed WebAssembly adapter;
- original editor-validation fixtures and tests;
- Zed-specific installation, testing, and release documentation.

The grammar manifest and Rust development dependency are both pinned to `fdf32993ed9331e8731180fa50281abc12344083`.

## Dependencies and licenses

| Dependency | Purpose | Constraint | License |
| --- | --- | --- | --- |
| `zed_extension_api` | Zed WebAssembly adapter API | `0.7.0` | Apache-2.0 |
| `tree-sitter` | Native fixture and query validation | `0.26.11` | MIT |
| `tree-sitter-papyrus` | Canonical grammar under test | Exact Git commit | GPL-3.0-or-later |
| `toml` | Manifest and language-config validation | `0.9`, locked | MIT OR Apache-2.0 |

The test-only dependencies are not bundled into the installed extension. Exact resolutions are recorded in `Cargo.lock`.

## Adapter architecture

1. Read Zed's `papyrus-language-server` binary settings.
2. Use an explicitly configured binary path when present, preserving configured arguments and environment variables.
3. Otherwise ask the worktree for `papyrus-language-server` on `PATH`.
4. Otherwise map Zed's host OS and architecture to an exact `v0.1.0` release asset.
5. Download and extract that asset into the versioned Zed extension work directory.
6. Mark Unix executables executable, validate the expected root executable exists, and cache its path.
7. Launch the native server directly over standard input and standard output.

The adapter uses a fixed release tag rather than a latest-release lookup. Unsupported architectures fail explicitly and can still use a configured compatible build.

## Validation architecture

Rust tests replace the previous repository-local Node grammar toolchain. They:

- parse Basic and Advanced Starfield, Skyrim, and Fallout 4 fixtures;
- require each Invalid fixture to contain its expected error or missing node;
- validate inline valid and invalid regressions;
- enforce concrete named grammar-node coverage;
- compile all six Zed query files and exercise every declared capture;
- validate the extension manifest, language assets, version synchronization, immutable grammar pin, and removal of duplicate grammar sources;
- verify all supported and unsupported platform mappings.

Native grammar corpus generation and exact-tree tests remain in the canonical language-server repository.

## Risks and mitigations

- **Unpublished automatic download:** use a configured local binary until `v0.1.0` is published, then run the clean-download acceptance test.
- **Platform mismatch:** maintain an explicit allow-list that matches the release workflow's four artifacts.
- **Grammar drift:** use the same immutable revision in the manifest and Cargo dependency.
- **Duplicate ownership:** reject retired local grammar and Node-toolchain files in the manifest test.
- **Diagnostic scope:** document that 0.1 provides syntax diagnostics, not completion or semantic project analysis.
- **Redistribution:** commit only original synthetic fixtures; never copy Bethesda scripts, compilers, flags files, or game paths.

## Milestones

1. Cross-dialect canonical grammar and installed-source audits — complete.
2. Native Rust diagnostic server with human-readable missing closers — complete in `papyrus-language-server`.
3. Zed Rust adapter and canonical grammar consumption — implemented; automated validation pending the final release command pass.
4. Local-binary Windows Zed diagnostic acceptance — pending.
5. `papyrus-language-server` `v0.1.0` four-platform release — pending user-created tag and release workflow.
6. Clean automatic-download Windows Zed acceptance — pending the server release.
7. Initial Zed marketplace submission — pending release acceptance.

