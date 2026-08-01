import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(repositoryRoot, "extension.toml");
const packagePath = path.join(repositoryRoot, "package.json");
const languagePath = path.join(repositoryRoot, "languages", "papyrus");
const requiredLanguageFiles = [
  "brackets.scm",
  "config.toml",
  "highlights.scm",
  "indents.scm",
  "outline.scm",
  "overrides.scm",
  "textobjects.scm",
];
const requiredPackageScripts = [
  "extension:test",
  "grammar:build",
  "grammar:generate",
  "grammar:test",
  "grammar:test:native",
];

function parseTomlSections(source) {
  const sections = new Map([["", new Map()]]);
  let currentSection = sections.get("");

  for (const sourceLine of source.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const sectionMatch = line.match(/^\[([^\]]+)]$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1];
      currentSection = new Map();
      sections.set(sectionName, currentSection);
      continue;
    }

    const assignmentMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      currentSection.set(assignmentMatch[1], assignmentMatch[2]);
    }
  }

  return sections;
}

function quotedString(rawValue) {
  return rawValue?.match(/^"([^"]+)"$/)?.[1];
}

function addRequiredString(section, key, description, failures) {
  const value = quotedString(section?.get(key));
  if (!value) {
    failures.push(`${description} must be a non-empty quoted string.`);
  }
  return value;
}

function isHttpsGitHubUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.toLowerCase() === "github.com";
  } catch {
    return false;
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const failures = [];
const manifestSource = await readFile(manifestPath, "utf8");
const manifestSections = parseTomlSections(manifestSource);
const manifest = manifestSections.get("");
const grammar = manifestSections.get("grammars.papyrus");

addRequiredString(manifest, "id", "Extension id", failures);
addRequiredString(manifest, "name", "Extension name", failures);
addRequiredString(manifest, "description", "Extension description", failures);
const version = addRequiredString(manifest, "version", "Extension version", failures);
const repository = addRequiredString(manifest, "repository", "Extension repository", failures);

if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
  failures.push("Extension version must use numeric major.minor.patch syntax.");
}

if (manifest?.get("schema_version") !== "1") {
  failures.push("Extension schema_version must be 1.");
}

if (!/^\[\s*"[^"]+"(?:\s*,\s*"[^"]+")*\s*]$/.test(manifest?.get("authors") ?? "")) {
  failures.push("Extension authors must contain at least one quoted author name.");
}

if (repository && !isHttpsGitHubUrl(repository)) {
  failures.push("Extension repository must be an HTTPS GitHub URL.");
}

if (!grammar) {
  failures.push("The grammars.papyrus manifest section is required.");
}

const grammarRepository = addRequiredString(grammar, "repository", "Papyrus grammar repository", failures);
const grammarRevision = addRequiredString(grammar, "rev", "Papyrus grammar revision", failures);
const grammarRelativePath = addRequiredString(grammar, "path", "Papyrus grammar path", failures);

if (grammarRepository && !isHttpsGitHubUrl(grammarRepository)) {
  failures.push("Papyrus grammar repository must be an HTTPS GitHub URL.");
}

if (repository && grammarRepository && repository !== grammarRepository) {
  failures.push("The extension and Papyrus grammar repositories must match.");
}

if (grammarRevision && !/^[0-9a-f]{40}$/.test(grammarRevision)) {
  failures.push("Papyrus grammar revision must be a full lowercase 40-character hexadecimal commit SHA.");
}

if (grammarRelativePath) {
  const grammarPath = path.resolve(repositoryRoot, grammarRelativePath);
  const relativeGrammarPath = path.relative(repositoryRoot, grammarPath);
  if (relativeGrammarPath.startsWith("..") || path.isAbsolute(relativeGrammarPath)) {
    failures.push("Papyrus grammar path must remain inside the repository.");
  } else if (!await exists(path.join(grammarPath, "grammar.js"))) {
    failures.push("Papyrus grammar path must contain grammar.js.");
  }
}

const rootEntries = await readdir(repositoryRoot, { withFileTypes: true });
if (!rootEntries.some((entry) => entry.isFile() && /^licen[cs]e/i.test(entry.name))) {
  failures.push("The extension repository must contain a root license file.");
}

for (const fileName of requiredLanguageFiles) {
  if (!await exists(path.join(languagePath, fileName))) {
    failures.push(`Missing Papyrus language file: languages/papyrus/${fileName}`);
  }
}

const languageConfig = await readFile(path.join(languagePath, "config.toml"), "utf8");
if (!/^name\s*=\s*"Papyrus"$/m.test(languageConfig)) {
  failures.push("Papyrus language config must declare name = \"Papyrus\".");
}
if (!/^grammar\s*=\s*"papyrus"$/m.test(languageConfig)) {
  failures.push("Papyrus language config must select grammar = \"papyrus\".");
}
if (!/^path_suffixes\s*=\s*\[[^\]]*"psc"[^\]]*]$/m.test(languageConfig)) {
  failures.push("Papyrus language config must associate the psc path suffix.");
}

const packageDefinition = JSON.parse(await readFile(packagePath, "utf8"));
for (const scriptName of requiredPackageScripts) {
  if (typeof packageDefinition.scripts?.[scriptName] !== "string") {
    failures.push(`Missing package script: ${scriptName}`);
  }
}

if (/^\[language_servers(?:\.|])/m.test(manifestSource)) {
  failures.push("The grammar-only release must not declare a language server.");
}
if (await exists(path.join(repositoryRoot, "extension.wasm"))) {
  failures.push("The grammar-only release must not contain a root extension.wasm artifact.");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validated the extension manifest, grammar pin, license, language assets, and CI package scripts successfully.");
}
