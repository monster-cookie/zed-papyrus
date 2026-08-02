# Testing

This record separates automated grammar validation from manual Zed acceptance. Configuration alone is not treated as evidence that a feature works.

## Automated results

Results recorded on Windows x64 on 2026-08-01:

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run extension:test` | Pass | Validated the extension manifest, grammar pin, license, language assets, and CI package scripts. |
| `npm run grammar:generate` | Pass | Generated parser reports Tree-sitter `LANGUAGE_VERSION 15`. |
| `npm run grammar:build` | Pass | Created `grammar/papyrus.wasm` using Tree-sitter CLI 0.26.11. |
| `npm run grammar:test` | Pass | Parsed two valid and one invalid original fixture for each of Starfield, Skyrim, and Fallout 4; validated two inline regression cases; covered 55 concrete named grammar nodes; and exercised all 30 declared capture names across six Zed queries. |
| `npm run grammar:test:native` | Pass | All 14 exact-tree corpus cases passed across comments, declarations, Skyrim and Fallout 4 dialect syntax, representative errors, expressions, Starfield guards, and statements. The two concrete nodes not exercised by whole-file fixtures are covered here. |
| Installed Starfield source audit | Pass | Recursively parsed 5,086 `.psc` files with zero `ERROR` and zero `MISSING` nodes, including 3,331 files under `Fragments`. |
| Installed Skyrim Anniversary Edition source audit | Pass | Recursively parsed 14,301 `.psc` files with zero `ERROR` and zero `MISSING` nodes, including 10,437 generated fragment scripts stored in the flat source layout. |
| Installed Fallout 4 vanilla source audit | Pass | Recursively parsed 10,282 unique Base, Creation Club, and DLC `.psc` files with zero `ERROR` and zero `MISSING` nodes, including 7,138 files under `Fragments`. The full 10,689-file extracted tree, including existing F4SE, mod, and user sources, also parsed cleanly. |

The valid fixtures cover scripts, inheritance, imports, structs, custom events, guard declarations and requirements, properties and groups, native/global functions, events, states, arrays, `new`, casts and type tests, qualified struct types, calls, expressions, control flow, line continuation, and all three comment forms. Regression coverage also verifies files without a final newline, bare and parenthesized guard lists, guarded properties with `RequiresGuard` before `Auto`, semicolons at the start of concatenated string segments, documentation comments whose content begins with a semicolon, slash-adjacent multiline-comment delimiters, and all declared Zed query captures.

The Starfield invalid fixture omits `EndIf`; the Skyrim fixture omits `EndState`; and the Fallout 4 fixture omits `EndStruct`. The test harness requires the expected `ERROR` or `MISSING` node for each dialect. Native corpus tests additionally isolate malformed parameter lists, same-line declarations, and an unterminated documentation comment with exact expected syntax trees.

The installed-source audits read local game scripts in place and do not copy Bethesda source files into this repository. Only original synthetic fixtures are committed.

## Continuous integration

`.github/workflows/ci.yml` runs on Ubuntu for pull requests targeting `master`, pushes to `master`, and manual dispatches. The workflow uses read-only repository permissions and Node.js 24 to:

1. install the exact development dependencies from `package-lock.json`;
2. validate the extension manifest, grammar pin, license, language assets, and required package scripts;
3. regenerate the committed ABI-15 parser and reject generated-artifact drift;
4. build the WebAssembly grammar;
5. run the fixture and Zed-query checks;
6. run the native Tree-sitter corpus.

The workflow does not publish releases, use repository secrets, or access installed game files. The authoritative installed game corpora remain local release-validation checks because Bethesda source files are not redistributed with this project.

## Manual Zed acceptance checklist

Results observed in Zed Preview on Windows on 2026-07-31:

| Test | Result | Observation |
| --- | --- | --- |
| Install the repository with **Install Dev Extension** | Pass | Zed installed the development extension. |
| Open `test-data/starfield/BasicStarfield.psc` and confirm language is Papyrus | Pass | Zed identified the buffer as Papyrus. |
| Inspect Tree-sitter highlighting | Pass | Papyrus syntax categories were visibly highlighted. |
| Inspect `test-data/starfield/AdvancedStarfield.psc` highlighting | Pass | Advanced Starfield structures highlighted as expected. |
| Verify outline items | Pass | The outline displayed Papyrus symbols. |
| Toggle `;` comments with `Ctrl+/` | Pass | Comment and uncomment worked as expected. |
| Verify indentation for functions, conditions, states, structs, and guard blocks | Pass | Inner indentation and closing-keyword dedentation behaved as expected. |
| Verify bracket matching and autoclose | Pass | Parentheses, square brackets, quotes, and documentation-comment braces behaved as expected. |
| Inspect the invalid fixture in Zed's syntax tree | Pass | Zed displayed `ERROR [3:1-7:1]` across the function containing the unclosed `If`; Tree-sitter does not emit a human-readable diagnostic. |
| Run `Papyrus: test grammar and queries` from Zed's task picker | Pass | The original Starfield-only task completed successfully before the cross-dialect expansion. |
| Re-run the expanded cross-dialect grammar task | Not run | The updated task now reports all three dialect suites, concrete-node coverage, and exercised query captures; manual Zed confirmation remains. |
| Verify Vim text objects | Not run | Deferred because Vim mode is a global editor setting; the text-object query compiles successfully but has not been exercised manually. |

Use `dev: open highlights tree view` to inspect grammar captures and syntax-tree error nodes.

## Release validation commands

```powershell
npm install
npm run extension:test
npm run grammar:generate
npm run grammar:build
npm run grammar:test
npm run grammar:test:native
git diff --check
```
