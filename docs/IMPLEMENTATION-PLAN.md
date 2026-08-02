# Implementation plan

## Release decision

Version 0.1 is a grammar-only Zed extension. Language-server integration was prototyped during development, but its runtime installation, process-launch, and upstream diagnostic behavior added platform-specific failure modes that were not appropriate for the first release.

The adapter and its configuration were removed rather than shipped in a partially working state. Language-server support remains a separate future phase and is not required to install or use the syntax extension.

## Grammar selection

No third-party Papyrus grammar is used. The previously attempted `ayooh/tree-sitter-papyrus` integration was explicitly rejected after failing the project's practical Starfield requirements, and it will not be reused or repaired for this project.

The selected implementation is an original Starfield-first grammar under `grammar/`, generated at Tree-sitter ABI 15. It directly models modern source constructs including Starfield guards. The grammar is GPL-3.0-or-later under this repository's license and contains no copied third-party Papyrus grammar code.

## Dependencies and licenses

| Dependency | Purpose | Version | License |
| --- | --- | --- | --- |
| `tree-sitter-cli` | ABI-15 parser generation and WASM build | 0.26.11, exact | MIT |
| `web-tree-sitter` | Cross-platform WASM fixture and query validation | 0.26.11, exact | MIT |

Both packages are development dependencies. The installed Zed extension does not launch an external runtime or language server.

## Architecture

1. `grammar/grammar.js` defines Papyrus syntax and generates committed ABI-15 C artifacts.
2. Zed obtains the pinned grammar revision and builds the grammar under `grammar/`.
3. `languages/papyrus` maps grammar nodes to highlighting, indentation, outline, brackets, overrides, and text objects.
4. `scripts/test-grammar.mjs` loads the WASM grammar, validates original Starfield, Skyrim, and Fallout 4 fixture suites, enforces dialect and concrete-node coverage, and executes every declared Zed query capture against valid fixtures.
5. Native Tree-sitter corpus tests assert exact syntax trees for focused declarations, comments, expressions, statements, dialect features, guard blocks, and representative invalid input.

## Risks and mitigations

- **Same-repository grammar:** keep the immutable grammar revision in `extension.toml`; publish grammar changes before updating that pin.
- **Grammar breadth:** exercise original Basic, Advanced, and Invalid fixtures for Starfield, Skyrim, and Fallout 4; require concrete-node coverage; and assert exact focused trees in the native corpus.
- **Editor versus diagnostics expectations:** document that Tree-sitter errors are structural and do not appear as language-server diagnostics.
- **Dialect coverage:** retain Starfield-first positioning while recording original-fixture coverage and complete local installed-source audits for Skyrim Anniversary Edition and Fallout 4. Treat this as syntax evidence rather than compiler or semantic equivalence.
- **Future language server:** design and validate it as an independent milestone with explicit cross-platform packaging and process tests before adding it back to the manifest.

## Milestones

1. Original ABI-15 grammar and fixtures — implemented and published at `6acf139cda738014f37fca2325248bbe77f0c811`.
2. Zed language metadata and Tree-sitter queries — implemented; every declared capture compiles and is exercised by valid fixtures.
3. Windows Zed syntax acceptance — recognition, highlighting, outline, comments, indentation, bracket matching, syntax-tree inspection, and the original task-picker run passed; Vim text objects remain deferred.
4. Skyrim and Fallout 4 validation — implemented with original Basic, Advanced, and Invalid fixtures, exact-tree unit cases, and clean complete installed-source audits.
5. Cross-platform language-server integration — deferred to a separate future phase.
