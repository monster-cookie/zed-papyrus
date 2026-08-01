# Testing

This record separates automated grammar validation from manual Zed acceptance. Configuration alone is not treated as evidence that a feature works.

## Automated results

Results recorded on Windows x64 on 2026-08-01:

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run grammar:generate` | Pass | Generated parser reports Tree-sitter `LANGUAGE_VERSION 15`. |
| `npm run grammar:build` | Pass | Created `grammar/papyrus.wasm` using Tree-sitter CLI 0.26.11. |
| `npm run grammar:test` | Pass | Parsed two valid and one invalid original fixtures, validated one valid and one invalid inline regression case, checked 17 required Starfield node types, and compiled six Zed queries. |
| `npm run grammar:test:native` | Pass | Both native Tree-sitter corpus cases passed: declarations/members and Starfield guard blocks. |
| Installed Starfield source audit | Pass | Recursively parsed 5,086 authoritative `.psc` files with zero `ERROR` and zero `MISSING` nodes, including all 3,013 files under `Fragments`. |

The valid fixtures cover scripts, inheritance, imports, structs, custom events, guard declarations and requirements, properties and groups, native/global functions, events, states, arrays, `new`, casts, qualified struct types, calls, control flow, and line continuation. Regression coverage also verifies files without a final newline, bare and parenthesized guard lists, guarded properties with `RequiresGuard` before `Auto`, semicolons at the start of concatenated string segments, and rejection of same-line declarations. The invalid fixture deliberately omits `EndIf` and must contain a Tree-sitter error or missing node.

The installed-source audit reads the local Starfield scripts in place and does not copy Bethesda source files into this repository.

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
| Run `Papyrus: test grammar and queries` from Zed's task picker | Pass | The task parsed two valid and one invalid fixture, verified 17 required node types, compiled six queries, and finished successfully. |
| Verify Vim text objects | Not run | Deferred because Vim mode is a global editor setting; the text-object query compiles successfully but has not been exercised manually. |

Use `dev: open highlights tree view` to inspect grammar captures and syntax-tree error nodes.

## Release validation commands

```powershell
npm install
npm run grammar:generate
npm run grammar:build
npm run grammar:test
npm run grammar:test:native
git diff --check
```
