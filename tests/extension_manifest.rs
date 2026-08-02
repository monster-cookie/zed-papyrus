use std::fs;
use std::path::{Path, PathBuf};

const GRAMMAR_REPOSITORY: &str = "https://github.com/monster-cookie/papyrus-language-server";
const GRAMMAR_REVISION: &str = "f4baf7da54ed6fca79ff81ae211b3364282630b6";
const REQUIRED_LANGUAGE_FILES: &[&str] = &[
    "brackets.scm",
    "config.toml",
    "highlights.scm",
    "indents.scm",
    "outline.scm",
    "overrides.scm",
    "textobjects.scm",
];

fn repository_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn read_toml(path: &Path) -> toml::Value {
    let source = fs::read_to_string(path)
        .unwrap_or_else(|error| panic!("could not read {}: {error}", path.display()));
    toml::from_str(&source)
        .unwrap_or_else(|error| panic!("{} should be valid TOML: {error}", path.display()))
}

#[test]
fn manifest_registers_pinned_grammar_and_language_server() {
    let root = repository_root();
    let manifest = read_toml(&root.join("extension.toml"));
    let package = read_toml(&root.join("Cargo.toml"));

    assert_eq!(manifest["id"].as_str(), Some("papyrus"));
    assert_eq!(manifest["name"].as_str(), Some("Papyrus"));
    assert_eq!(manifest["version"].as_str(), Some("0.1.0"));
    assert_eq!(manifest["schema_version"].as_integer(), Some(1));
    assert_eq!(
        manifest["repository"].as_str(),
        Some("https://github.com/monster-cookie/zed-papyrus")
    );
    assert_eq!(
        package["package"]["version"].as_str(),
        manifest["version"].as_str(),
        "Cargo and extension versions should remain synchronized"
    );

    let grammar = &manifest["grammars"]["papyrus"];
    assert_eq!(grammar["repository"].as_str(), Some(GRAMMAR_REPOSITORY));
    assert_eq!(grammar["rev"].as_str(), Some(GRAMMAR_REVISION));
    assert_eq!(grammar["path"].as_str(), Some("grammar"));
    assert_eq!(GRAMMAR_REVISION.len(), 40);
    assert!(
        GRAMMAR_REVISION
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
    );

    let language_server = &manifest["language_servers"]["papyrus-language-server"];
    assert_eq!(
        language_server["name"].as_str(),
        Some("Papyrus Language Server")
    );
    assert_eq!(
        language_server["languages"].as_array(),
        Some(&vec![toml::Value::String("Papyrus".to_owned())])
    );
}

#[test]
fn repository_contains_only_zed_specific_language_assets() {
    let root = repository_root();
    let language_directory = root.join("languages").join("papyrus");

    assert!(root.join("LICENSE").is_file());
    for file_name in REQUIRED_LANGUAGE_FILES {
        assert!(
            language_directory.join(file_name).is_file(),
            "missing languages/papyrus/{file_name}"
        );
    }

    let language_config = read_toml(&language_directory.join("config.toml"));
    assert_eq!(language_config["name"].as_str(), Some("Papyrus"));
    assert_eq!(language_config["grammar"].as_str(), Some("papyrus"));
    assert!(
        language_config["path_suffixes"]
            .as_array()
            .is_some_and(|suffixes| suffixes.contains(&toml::Value::String("psc".to_owned())))
    );

    for removed_path in [
        "grammar/grammar.js",
        "grammar/papyrus.wasm",
        "grammar/src/parser.c",
        "tree-sitter.json",
        "package.json",
        "package-lock.json",
        "scripts/test-extension.mjs",
        "scripts/test-grammar.mjs",
    ] {
        assert!(
            !root.join(removed_path).exists(),
            "duplicate or retired toolchain path should be removed: {removed_path}"
        );
    }
}
