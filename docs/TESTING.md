# Testing

This record separates automated grammar validation from manual Zed acceptance. Configuration alone is not treated as evidence that a feature works.

## Automated results

Results recorded on Windows x64 on 2026-07-31:

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run grammar:generate` | Pass | Generated parser reports Tree-sitter `LANGUAGE_VERSION 15`. |
| `npm run grammar:build` | Pass | Created `grammar/papyrus.wasm` using Tree-sitter CLI 0.26.11. |
| `npm run grammar:test` | Pass | Parsed two valid and one invalid original fixtures, checked 16 required Starfield node types, and compiled six Zed queries. |
| `npm run grammar:test:native` | Pass | Both native Tree-sitter corpus cases passed: declarations/members and Starfield guard blocks. |

The valid fixtures cover scripts, inheritance, imports, structs, custom events, guard declarations and requirements, properties and groups, native/global functions, events, states, arrays, `new`, casts, qualified struct types, calls, control flow, and line continuation. The invalid fixture deliberately omits `EndIf` and must contain a Tree-sitter error or missing node.

## Manual Zed acceptance checklist

Results observed in Zed Preview on Windows on 2026-07-31:

| Test | Result | Observation |
| --- | --- | --- |
| Install the repository with **Install Dev Extension** | Pass | Zed installed the development extension. |
| Open `test-data/starfield/BasicStarfield.psc` and confirm language is Papyrus | Pass | Zed identified the buffer as Papyrus. |
| Inspect Tree-sitter highlighting | Pass | Papyrus syntax categories were visibly highlighted. |
| Verify outline items | Pass | The outline displayed Papyrus symbols. |
| Toggle `;` comments | Not run | Manual acceptance remains. |
| Verify indentation for functions, conditions, states, structs, and guard blocks | Not run | Manual acceptance remains. |
| Verify bracket matching | Not run | Manual acceptance remains. |
| Inspect the invalid fixture in Zed's syntax tree | Not run | Tree-sitter errors are structural nodes, not LSP diagnostics. |

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
