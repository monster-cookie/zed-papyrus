import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Language, Parser, Query } from "web-tree-sitter";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const grammarPath = path.join(repositoryRoot, "grammar", "papyrus.wasm");
const validFixturePath = path.join(repositoryRoot, "test-data", "starfield");
const invalidFixturePath = path.join(repositoryRoot, "test-data", "invalid");
const queryPath = path.join(repositoryRoot, "languages", "papyrus");

const requiredNodeTypes = new Set([
  "array_type_suffix",
  "cast_expression",
  "custom_event_declaration",
  "documentation_comment",
  "event_definition",
  "function_definition",
  "group_declaration",
  "guard_declaration",
  "line_continuation",
  "lock_guard_statement",
  "new_expression",
  "auto_property_definition",
  "qualified_identifier",
  "script_declaration",
  "state_declaration",
  "struct_declaration",
  "try_lock_guard_statement",
]);

async function papyrusFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await papyrusFiles(entryPath));
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".psc") {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function collectNodeTypes(node, nodeTypes) {
  nodeTypes.add(node.type);
  for (const child of node.children) {
    collectNodeTypes(child, nodeTypes);
  }
}

await Parser.init();
const language = await Language.load(grammarPath);
const parser = new Parser();
parser.setLanguage(language);

const failures = [];
const observedNodeTypes = new Set();
const validFiles = await papyrusFiles(validFixturePath);
const invalidFiles = await papyrusFiles(invalidFixturePath);
const queryFiles = (await readdir(queryPath, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && path.extname(entry.name) === ".scm")
  .map((entry) => path.join(queryPath, entry.name))
  .sort();
const inlineValidSources = new Map([
  [
    "modern syntax without a final newline",
    [
      "ScriptName InlineRegression",
      "Guard DataGuard",
      "Int Property GuardedValue RequiresGuard (DataGuard) Auto Conditional",
      "Function Run()",
      "    LockGuard(DataGuard)",
      "        Debug.Trace(\"Guard value: \" + GuardedValue + \"; running work\")",
      "    EndLockGuard",
      "EndFunction",
    ].join("\n"),
  ],
]);
const inlineInvalidSources = new Map([
  ["same-line declarations", "ScriptName First ScriptName Second"],
]);

for (const filePath of validFiles) {
  const source = await readFile(filePath, "utf8");
  const tree = parser.parse(source);
  collectNodeTypes(tree.rootNode, observedNodeTypes);

  if (tree.rootNode.hasError) {
    failures.push(`${path.relative(repositoryRoot, filePath)} unexpectedly contains an ERROR or MISSING node:\n${tree.rootNode}`);
  }

  tree.delete();
}

for (const filePath of invalidFiles) {
  const source = await readFile(filePath, "utf8");
  const tree = parser.parse(source);

  if (!tree.rootNode.hasError) {
    failures.push(`${path.relative(repositoryRoot, filePath)} was expected to contain a syntax error.`);
  }

  tree.delete();
}

for (const [name, source] of inlineValidSources) {
  const tree = parser.parse(source);

  if (tree.rootNode.hasError) {
    failures.push(`The ${name} regression case unexpectedly contains an ERROR or MISSING node:\n${tree.rootNode}`);
  }

  tree.delete();
}

for (const [name, source] of inlineInvalidSources) {
  const tree = parser.parse(source);

  if (!tree.rootNode.hasError) {
    failures.push(`The ${name} regression case was expected to contain a syntax error.`);
  }

  tree.delete();
}

for (const nodeType of requiredNodeTypes) {
  if (!observedNodeTypes.has(nodeType)) {
    failures.push(`The valid fixtures did not exercise the ${nodeType} node.`);
  }
}

for (const filePath of queryFiles) {
  const source = await readFile(filePath, "utf8");
  try {
    const query = new Query(language, source);
    query.delete();
  } catch (error) {
    failures.push(`${path.relative(repositoryRoot, filePath)} is not a valid query: ${error}`);
  }
}

parser.delete();

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log(`Parsed ${validFiles.length} valid and ${invalidFiles.length} invalid Papyrus fixtures successfully.`);
  console.log(`Validated ${inlineValidSources.size} valid and ${inlineInvalidSources.size} invalid inline regression cases.`);
  console.log(`Verified ${requiredNodeTypes.size} required Starfield grammar node types.`);
  console.log(`Compiled ${queryFiles.length} Zed Tree-sitter queries successfully.`);
}
