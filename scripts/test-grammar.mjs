import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Language, Parser, Query } from "web-tree-sitter";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const grammarPath = path.join(repositoryRoot, "grammar", "papyrus.wasm");
const nodeTypesPath = path.join(repositoryRoot, "grammar", "src", "node-types.json");
const queryPath = path.join(repositoryRoot, "languages", "papyrus");

const fixtureSuites = new Map([
  [
    "Starfield",
    {
      validDirectory: path.join(repositoryRoot, "test-data", "starfield"),
      invalidFiles: [path.join(repositoryRoot, "test-data", "invalid", "InvalidSyntax.psc")],
      requiredNodeTypes: new Set([
        "array_type_suffix",
        "cast_expression",
        "custom_event_declaration",
        "event_definition",
        "function_definition",
        "group_declaration",
        "guard_declaration",
        "guard_requirement",
        "line_continuation",
        "lock_guard_statement",
        "new_expression",
        "qualified_identifier",
        "state_declaration",
        "struct_declaration",
        "try_lock_guard_statement",
      ]),
    },
  ],
  [
    "Skyrim",
    {
      validDirectory: path.join(repositoryRoot, "test-data", "skyrim"),
      invalidFiles: [path.join(repositoryRoot, "test-data", "invalid", "InvalidSkyrim.psc")],
      requiredNodeTypes: new Set([
        "array_type_suffix",
        "auto_property_definition",
        "block_comment",
        "cast_expression",
        "documentation_comment",
        "event_definition",
        "function_definition",
        "line_continuation",
        "new_expression",
        "property_definition",
        "state_declaration",
        "while_statement",
      ]),
    },
  ],
  [
    "Fallout 4",
    {
      validDirectory: path.join(repositoryRoot, "test-data", "fallout4"),
      invalidFiles: [path.join(repositoryRoot, "test-data", "invalid", "InvalidFallout4.psc")],
      requiredNodeTypes: new Set([
        "array_type_suffix",
        "block_comment",
        "cast_expression",
        "custom_event_declaration",
        "event_definition",
        "function_definition",
        "group_declaration",
        "new_expression",
        "qualified_identifier",
        "state_declaration",
        "struct_declaration",
        "struct_member",
        "type_test_expression",
      ]),
    },
  ],
]);

const expectedInvalidIssues = new Map([
  ["InvalidSyntax.psc", { kind: "ERROR", type: "ERROR" }],
  ["InvalidSkyrim.psc", { kind: "MISSING", type: "endstate" }],
  ["InvalidFallout4.psc", { kind: "MISSING", type: "endstruct" }],
]);

const corpusOnlyNodeTypes = new Set([
  "else_try_lock_guard_clause",
  "native_event_declaration",
]);

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
  if (node.isNamed) {
    nodeTypes.add(node.type);
  }

  for (const child of node.children) {
    collectNodeTypes(child, nodeTypes);
  }
}

function collectSyntaxIssues(node, issues) {
  if (node.isError) {
    issues.push({ kind: "ERROR", type: node.type });
  } else if (node.isMissing) {
    issues.push({ kind: "MISSING", type: node.type });
  }

  for (const child of node.children) {
    collectSyntaxIssues(child, issues);
  }
}

await Parser.init();
const language = await Language.load(grammarPath);
const parser = new Parser();
parser.setLanguage(language);

const failures = [];
const observedNodeTypes = new Set();
const parsedValidFixtures = [];
const suiteResults = [];

for (const [dialect, suite] of fixtureSuites) {
  const validFiles = await papyrusFiles(suite.validDirectory);
  const dialectNodeTypes = new Set();

  for (const filePath of validFiles) {
    const source = await readFile(filePath, "utf8");
    const tree = parser.parse(source);
    collectNodeTypes(tree.rootNode, observedNodeTypes);
    collectNodeTypes(tree.rootNode, dialectNodeTypes);

    if (tree.rootNode.hasError) {
      failures.push(`${path.relative(repositoryRoot, filePath)} unexpectedly contains an ERROR or MISSING node:\n${tree.rootNode}`);
    }

    parsedValidFixtures.push({ dialect, filePath, tree });
  }

  for (const filePath of suite.invalidFiles) {
    const source = await readFile(filePath, "utf8");
    const tree = parser.parse(source);
    const issues = [];
    collectSyntaxIssues(tree.rootNode, issues);
    const expectedIssue = expectedInvalidIssues.get(path.basename(filePath));

    if (!tree.rootNode.hasError) {
      failures.push(`${path.relative(repositoryRoot, filePath)} was expected to contain a syntax error.`);
    } else if (!expectedIssue || !issues.some(issue => issue.kind === expectedIssue.kind && issue.type === expectedIssue.type)) {
      failures.push(`${path.relative(repositoryRoot, filePath)} did not contain its expected ${expectedIssue?.kind ?? "syntax"} ${expectedIssue?.type ?? "issue"}:\n${tree.rootNode}`);
    }

    tree.delete();
  }

  for (const nodeType of suite.requiredNodeTypes) {
    if (!dialectNodeTypes.has(nodeType)) {
      failures.push(`The ${dialect} valid fixtures did not exercise the ${nodeType} node.`);
    }
  }

  suiteResults.push({ dialect, valid: validFiles.length, invalid: suite.invalidFiles.length });
}

for (const [name, source] of inlineValidSources) {
  const tree = parser.parse(source);
  collectNodeTypes(tree.rootNode, observedNodeTypes);

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

const nodeTypeDefinitions = JSON.parse(await readFile(nodeTypesPath, "utf8"));
const concreteNamedNodeTypes = nodeTypeDefinitions
  .filter(nodeType => nodeType.named && !nodeType.subtypes)
  .map(nodeType => nodeType.type)
  .sort();
const uncoveredNodeTypes = concreteNamedNodeTypes
  .filter(nodeType => !observedNodeTypes.has(nodeType) && !corpusOnlyNodeTypes.has(nodeType));

if (uncoveredNodeTypes.length > 0) {
  failures.push(`The valid fixture suites did not exercise these concrete named nodes: ${uncoveredNodeTypes.join(", ")}.`);
}

for (const nodeType of corpusOnlyNodeTypes) {
  if (!concreteNamedNodeTypes.includes(nodeType)) {
    failures.push(`The corpus-only coverage exemption references unknown node type ${nodeType}.`);
  }
}

const queryFiles = (await readdir(queryPath, { withFileTypes: true }))
  .filter(entry => entry.isFile() && path.extname(entry.name) === ".scm")
  .map(entry => path.join(queryPath, entry.name))
  .sort();
let exercisedQueryCaptureCount = 0;

for (const filePath of queryFiles) {
  const source = await readFile(filePath, "utf8");

  try {
    const query = new Query(language, source);
    const observedCaptures = new Set();

    for (const fixture of parsedValidFixtures) {
      for (const capture of query.captures(fixture.tree.rootNode)) {
        observedCaptures.add(capture.name);
      }
    }

    const missingCaptures = query.captureNames.filter(captureName => !observedCaptures.has(captureName));
    if (missingCaptures.length > 0) {
      failures.push(`${path.relative(repositoryRoot, filePath)} declared captures not exercised by the valid fixtures: ${missingCaptures.join(", ")}.`);
    }

    exercisedQueryCaptureCount += observedCaptures.size;
    query.delete();
  } catch (error) {
    failures.push(`${path.relative(repositoryRoot, filePath)} is not a valid query: ${error}`);
  }
}

for (const fixture of parsedValidFixtures) {
  fixture.tree.delete();
}
parser.delete();

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  for (const result of suiteResults) {
    console.log(`Parsed ${result.valid} valid and ${result.invalid} invalid ${result.dialect} fixtures successfully.`);
  }
  console.log(`Validated ${inlineValidSources.size} valid and ${inlineInvalidSources.size} invalid inline regression cases.`);
  console.log(`Covered ${concreteNamedNodeTypes.length - corpusOnlyNodeTypes.size} concrete named grammar nodes in whole-file fixtures; ${corpusOnlyNodeTypes.size} remain native-corpus-only.`);
  console.log(`Compiled ${queryFiles.length} Zed Tree-sitter queries and exercised ${exercisedQueryCaptureCount} declared capture names successfully.`);
}
