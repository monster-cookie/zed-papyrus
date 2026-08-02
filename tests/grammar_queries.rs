use std::collections::BTreeSet;

use tree_sitter::{Node, Parser, Query, QueryCursor, StreamingIterator, Tree};

const CORPUS_ONLY_NODE_TYPES: &[&str] = &["else_try_lock_guard_clause", "native_event_declaration"];

struct ParsedFixture {
    name: &'static str,
    source: &'static str,
    tree: Tree,
}

struct FixtureSuite {
    dialect: &'static str,
    valid: &'static [(&'static str, &'static str)],
    invalid: (&'static str, &'static str, ExpectedIssue),
    required_node_types: &'static [&'static str],
}

#[derive(Clone, Copy)]
enum ExpectedIssue {
    Error(&'static str),
    Missing(&'static str),
}

const STARFIELD_VALID: &[(&str, &str)] = &[
    (
        "test-data/starfield/BasicStarfield.psc",
        include_str!("../test-data/starfield/BasicStarfield.psc"),
    ),
    (
        "test-data/starfield/AdvancedStarfield.psc",
        include_str!("../test-data/starfield/AdvancedStarfield.psc"),
    ),
];

const SKYRIM_VALID: &[(&str, &str)] = &[
    (
        "test-data/skyrim/BasicSkyrim.psc",
        include_str!("../test-data/skyrim/BasicSkyrim.psc"),
    ),
    (
        "test-data/skyrim/AdvancedSkyrim.psc",
        include_str!("../test-data/skyrim/AdvancedSkyrim.psc"),
    ),
];

const FALLOUT4_VALID: &[(&str, &str)] = &[
    (
        "test-data/fallout4/BasicFallout4.psc",
        include_str!("../test-data/fallout4/BasicFallout4.psc"),
    ),
    (
        "test-data/fallout4/AdvancedFallout4.psc",
        include_str!("../test-data/fallout4/AdvancedFallout4.psc"),
    ),
];

const FIXTURE_SUITES: &[FixtureSuite] = &[
    FixtureSuite {
        dialect: "Starfield",
        valid: STARFIELD_VALID,
        invalid: (
            "test-data/invalid/InvalidSyntax.psc",
            include_str!("../test-data/invalid/InvalidSyntax.psc"),
            ExpectedIssue::Error("ERROR"),
        ),
        required_node_types: &[
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
        ],
    },
    FixtureSuite {
        dialect: "Skyrim",
        valid: SKYRIM_VALID,
        invalid: (
            "test-data/invalid/InvalidSkyrim.psc",
            include_str!("../test-data/invalid/InvalidSkyrim.psc"),
            ExpectedIssue::Missing("endstate"),
        ),
        required_node_types: &[
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
        ],
    },
    FixtureSuite {
        dialect: "Fallout 4",
        valid: FALLOUT4_VALID,
        invalid: (
            "test-data/invalid/InvalidFallout4.psc",
            include_str!("../test-data/invalid/InvalidFallout4.psc"),
            ExpectedIssue::Missing("endstruct"),
        ),
        required_node_types: &[
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
        ],
    },
];

const QUERY_FILES: &[(&str, &str)] = &[
    (
        "languages/papyrus/brackets.scm",
        include_str!("../languages/papyrus/brackets.scm"),
    ),
    (
        "languages/papyrus/highlights.scm",
        include_str!("../languages/papyrus/highlights.scm"),
    ),
    (
        "languages/papyrus/indents.scm",
        include_str!("../languages/papyrus/indents.scm"),
    ),
    (
        "languages/papyrus/outline.scm",
        include_str!("../languages/papyrus/outline.scm"),
    ),
    (
        "languages/papyrus/overrides.scm",
        include_str!("../languages/papyrus/overrides.scm"),
    ),
    (
        "languages/papyrus/textobjects.scm",
        include_str!("../languages/papyrus/textobjects.scm"),
    ),
];

fn parser() -> Parser {
    let mut parser = Parser::new();
    parser
        .set_language(&tree_sitter_papyrus::LANGUAGE.into())
        .expect("Papyrus grammar should load");
    parser
}

fn collect_named_node_types(node: Node<'_>, node_types: &mut BTreeSet<String>) {
    if node.is_named() {
        node_types.insert(node.kind().to_owned());
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_named_node_types(child, node_types);
    }
}

fn contains_expected_issue(node: Node<'_>, expected: ExpectedIssue) -> bool {
    let matches = match expected {
        ExpectedIssue::Error(kind) => node.is_error() && node.kind() == kind,
        ExpectedIssue::Missing(kind) => node.is_missing() && node.kind() == kind,
    };
    if matches {
        return true;
    }

    let mut cursor = node.walk();
    node.children(&mut cursor)
        .any(|child| contains_expected_issue(child, expected))
}

#[test]
fn parses_cross_dialect_fixtures_and_covers_named_nodes() {
    let mut parser = parser();
    let mut observed_node_types = BTreeSet::new();

    for suite in FIXTURE_SUITES {
        let mut dialect_node_types = BTreeSet::new();
        for (name, source) in suite.valid {
            let tree = parser
                .parse(source, None)
                .expect("parser should return a tree");
            assert!(
                !tree.root_node().has_error(),
                "{name} unexpectedly contains an ERROR or MISSING node:\n{}",
                tree.root_node().to_sexp()
            );
            collect_named_node_types(tree.root_node(), &mut observed_node_types);
            collect_named_node_types(tree.root_node(), &mut dialect_node_types);
        }

        let (name, source, expected) = suite.invalid;
        let tree = parser
            .parse(source, None)
            .expect("parser should return a tree");
        assert!(tree.root_node().has_error(), "{name} should be invalid");
        assert!(
            contains_expected_issue(tree.root_node(), expected),
            "{name} did not contain its expected issue:\n{}",
            tree.root_node().to_sexp()
        );

        for required_node_type in suite.required_node_types {
            assert!(
                dialect_node_types.contains(*required_node_type),
                "{} fixtures did not exercise {required_node_type}",
                suite.dialect
            );
        }
    }

    for (name, source, should_be_valid) in [
        (
            "modern syntax without a final newline",
            "ScriptName InlineRegression\nGuard DataGuard\nInt Property GuardedValue RequiresGuard (DataGuard) Auto Conditional\nFunction Run()\n    LockGuard(DataGuard)\n        Debug.Trace(\"Guard value: \" + GuardedValue + \"; running work\")\n    EndLockGuard\nEndFunction",
            true,
        ),
        (
            "same-line declarations",
            "ScriptName First ScriptName Second",
            false,
        ),
    ] {
        let tree = parser
            .parse(source, None)
            .expect("parser should return a tree");
        assert_eq!(
            !tree.root_node().has_error(),
            should_be_valid,
            "unexpected result for {name}:\n{}",
            tree.root_node().to_sexp()
        );
        if should_be_valid {
            collect_named_node_types(tree.root_node(), &mut observed_node_types);
        }
    }

    let node_types: Vec<zed_extension_api::serde_json::Value> =
        zed_extension_api::serde_json::from_str(tree_sitter_papyrus::NODE_TYPES)
            .expect("node-types.json should be valid JSON");
    let concrete_named_node_types: BTreeSet<&str> = node_types
        .iter()
        .filter(|node_type| {
            node_type.get("named").and_then(|value| value.as_bool()) == Some(true)
                && node_type.get("subtypes").is_none()
        })
        .filter_map(|node_type| node_type.get("type").and_then(|value| value.as_str()))
        .collect();

    for node_type in &concrete_named_node_types {
        assert!(
            observed_node_types.contains(*node_type) || CORPUS_ONLY_NODE_TYPES.contains(node_type),
            "valid fixtures did not exercise concrete named node {node_type}"
        );
    }
    for node_type in CORPUS_ONLY_NODE_TYPES {
        assert!(
            concrete_named_node_types.contains(node_type),
            "corpus-only exemption references unknown node {node_type}"
        );
    }
}

#[test]
fn compiles_queries_and_exercises_every_capture() {
    let language = tree_sitter_papyrus::LANGUAGE.into();
    let mut parser = parser();
    let fixtures: Vec<ParsedFixture> = FIXTURE_SUITES
        .iter()
        .flat_map(|suite| suite.valid.iter().copied())
        .map(|(name, source)| ParsedFixture {
            name,
            source,
            tree: parser
                .parse(source, None)
                .expect("parser should return a tree"),
        })
        .collect();

    for (query_name, query_source) in QUERY_FILES {
        let query = Query::new(&language, query_source)
            .unwrap_or_else(|error| panic!("{query_name} should compile: {error}"));
        let mut observed_capture_names = BTreeSet::new();

        for fixture in &fixtures {
            assert!(
                !fixture.tree.root_node().has_error(),
                "{} should be valid before query execution",
                fixture.name
            );
            let mut query_cursor = QueryCursor::new();
            let mut captures =
                query_cursor.captures(&query, fixture.tree.root_node(), fixture.source.as_bytes());
            while let Some((query_match, capture_index)) = captures.next() {
                let capture = query_match.captures[*capture_index];
                observed_capture_names
                    .insert(query.capture_names()[capture.index as usize].to_owned());
            }
        }

        for capture_name in query.capture_names() {
            assert!(
                observed_capture_names.contains(*capture_name),
                "{query_name} declared an unexercised capture: {capture_name}"
            );
        }
    }
}
