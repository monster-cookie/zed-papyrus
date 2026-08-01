/**
 * @file Starfield-first grammar for Bethesda Papyrus
 * @author monster-cookie
 * @license GPL-3.0-or-later
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  ASSIGNMENT: 1,
  OR: 2,
  AND: 3,
  EQUALITY: 4,
  RELATIONAL: 5,
  ADDITIVE: 6,
  MULTIPLICATIVE: 7,
  CAST: 8,
  UNARY: 9,
  POSTFIX: 10,
};

/**
 * Create a case-insensitive Papyrus keyword with a stable anonymous node name.
 *
 * @param {string} word
 */
function keyword(word) {
  return alias(token(prec(2, new RustRegex(`(?i)${word}`))), word.toLowerCase());
}

/**
 * Create an optional comma-separated list.
 *
 * @param {RuleOrLiteral} rule
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Create a non-empty comma-separated list.
 *
 * @param {RuleOrLiteral} rule
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

export default grammar({
  name: 'papyrus',

  extras: $ => [
    /[ \t\f]/,
    $.line_continuation,
    $.line_comment,
    $.block_comment,
    $.documentation_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$._expression, $._type_identifier],
  ],

  rules: {
    source_file: $ => repeat(choice($._top_level_declaration, $.newline)),

    _top_level_declaration: $ => choice(
      $.script_declaration,
      $.import_declaration,
      $.variable_declaration,
      $.guard_declaration,
      $.struct_declaration,
      $.custom_event_declaration,
      $.property_definition,
      $.auto_property_definition,
      $.group_declaration,
      $.state_declaration,
      $.function_definition,
      $.native_function_declaration,
      $.event_definition,
      $.native_event_declaration,
    ),

    script_declaration: $ => seq(
      keyword('ScriptName'),
      field('name', $._type_identifier),
      optional(seq(keyword('Extends'), field('parent', $._type_identifier))),
      repeat($._declaration_modifier),
      $.newline,
    ),

    import_declaration: $ => seq(
      keyword('Import'),
      field('module', $._type_identifier),
      $.newline,
    ),

    struct_declaration: $ => seq(
      keyword('Struct'),
      field('name', $.identifier),
      $.newline,
      repeat(choice($.struct_member, $.newline)),
      keyword('EndStruct'),
      $.newline,
    ),

    struct_member: $ => seq(
      field('type', $.type),
      field('name', $.identifier),
      optional(seq('=', field('value', $._expression))),
      repeat($._declaration_modifier),
      repeat($.guard_requirement),
      $.newline,
    ),

    custom_event_declaration: $ => seq(
      keyword('CustomEvent'),
      field('name', $.identifier),
      $.newline,
    ),

    group_declaration: $ => seq(
      keyword('Group'),
      field('name', $.identifier),
      repeat($._group_modifier),
      $.newline,
      repeat(choice($.property_definition, $.auto_property_definition, $.newline)),
      keyword('EndGroup'),
      $.newline,
    ),

    property_definition: $ => seq(
      field('type', $.type),
      keyword('Property'),
      field('name', $.identifier),
      repeat($._property_modifier),
      repeat($.guard_requirement),
      $.newline,
      repeat(choice($.function_definition, $.native_function_declaration, $.newline)),
      keyword('EndProperty'),
      $.newline,
    ),

    auto_property_definition: $ => seq(
      field('type', $.type),
      keyword('Property'),
      field('name', $.identifier),
      optional(seq('=', field('value', $._expression))),
      repeat($._property_modifier),
      field('kind', choice(keyword('Auto'), keyword('AutoReadOnly'))),
      repeat($._property_modifier),
      repeat($.guard_requirement),
      $.newline,
    ),

    state_declaration: $ => seq(
      optional(keyword('Auto')),
      keyword('State'),
      field('name', $.identifier),
      $.newline,
      repeat(choice(
        $.function_definition,
        $.native_function_declaration,
        $.event_definition,
        $.native_event_declaration,
        $.newline,
      )),
      keyword('EndState'),
      $.newline,
    ),

    function_definition: $ => seq(
      $._function_header,
      repeat($._function_modifier_without_native),
      repeat($.guard_requirement),
      $.newline,
      repeat(choice($._statement, $.newline)),
      keyword('EndFunction'),
      $.newline,
    ),

    native_function_declaration: $ => seq(
      $._function_header,
      repeat($._function_modifier_without_native),
      keyword('Native'),
      repeat($._function_modifier_without_native),
      repeat($.guard_requirement),
      $.newline,
    ),

    _function_header: $ => seq(
      optional(field('return_type', $.type)),
      keyword('Function'),
      field('name', $.identifier),
      field('parameters', $.parameters),
    ),

    event_definition: $ => seq(
      $._event_header,
      repeat($._function_modifier_without_native),
      repeat($.guard_requirement),
      $.newline,
      repeat(choice($._statement, $.newline)),
      keyword('EndEvent'),
      $.newline,
    ),

    native_event_declaration: $ => seq(
      $._event_header,
      repeat($._function_modifier_without_native),
      keyword('Native'),
      repeat($._function_modifier_without_native),
      $.newline,
    ),

    _event_header: $ => seq(
      keyword('Event'),
      optional(seq(field('owner', $._type_identifier), '.')),
      field('name', $.identifier),
      field('parameters', $.parameters),
    ),

    parameters: $ => seq('(', commaSep($.parameter), ')'),

    parameter: $ => seq(
      field('type', $.type),
      field('name', $.identifier),
      optional(seq('=', field('default', $._expression))),
    ),

    guard_declaration: $ => seq(
      keyword('Guard'),
      field('name', $.identifier),
      optional(keyword('ProtectsFunctionLogic')),
      $.newline,
    ),

    guard_requirement: $ => seq(
      keyword('RequiresGuard'),
      '(',
      field('guards', $.guard_list),
      ')',
    ),

    guard_list: $ => commaSep1($.identifier),

    _statement: $ => choice(
      $.if_statement,
      $.while_statement,
      $.lock_guard_statement,
      $.try_lock_guard_statement,
      $.return_statement,
      $.variable_declaration,
      $.assignment_statement,
      $.expression_statement,
    ),

    if_statement: $ => seq(
      keyword('If'),
      field('condition', $._expression),
      $.newline,
      repeat(choice($._statement, $.newline)),
      repeat($.elseif_clause),
      optional($.else_clause),
      keyword('EndIf'),
      $.newline,
    ),

    elseif_clause: $ => seq(
      keyword('ElseIf'),
      field('condition', $._expression),
      $.newline,
      repeat(choice($._statement, $.newline)),
    ),

    else_clause: $ => seq(
      keyword('Else'),
      $.newline,
      repeat(choice($._statement, $.newline)),
    ),

    while_statement: $ => seq(
      keyword('While'),
      field('condition', $._expression),
      $.newline,
      repeat(choice($._statement, $.newline)),
      keyword('EndWhile'),
      $.newline,
    ),

    lock_guard_statement: $ => seq(
      keyword('LockGuard'),
      field('guards', $.guard_list),
      $.newline,
      repeat(choice($._statement, $.newline)),
      keyword('EndLockGuard'),
      $.newline,
    ),

    try_lock_guard_statement: $ => seq(
      keyword('TryLockGuard'),
      field('guards', $.guard_list),
      $.newline,
      repeat(choice($._statement, $.newline)),
      repeat($.else_try_lock_guard_clause),
      optional($.else_clause),
      keyword('EndTryLockGuard'),
      $.newline,
    ),

    else_try_lock_guard_clause: $ => seq(
      choice(keyword('ElseTryLockGuard'), keyword('ElseLockGuard')),
      field('guards', $.guard_list),
      $.newline,
      repeat(choice($._statement, $.newline)),
    ),

    variable_declaration: $ => seq(
      field('type', $.type),
      field('name', $.identifier),
      optional(seq('=', field('value', $._expression))),
      repeat($._variable_modifier),
      repeat($.guard_requirement),
      $.newline,
    ),

    assignment_statement: $ => prec.right(PREC.ASSIGNMENT, seq(
      field('left', $._assignable_expression),
      field('operator', choice('=', '+=', '-=', '*=', '/=', '%=')),
      field('right', $._expression),
      $.newline,
    )),

    return_statement: $ => seq(
      keyword('Return'),
      optional($._expression),
      $.newline,
    ),

    expression_statement: $ => seq($._expression, $.newline),

    _assignable_expression: $ => choice(
      $.identifier,
      $.member_expression,
      $.subscript_expression,
    ),

    _expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.cast_expression,
      $.type_test_expression,
      $.call_expression,
      $.member_expression,
      $.subscript_expression,
      $.new_expression,
      $.parenthesized_expression,
      $.qualified_identifier,
      $.identifier,
      $._literal,
    ),

    binary_expression: $ => choice(
      ...[
        ['||', PREC.OR],
        ['&&', PREC.AND],
        ['==', PREC.EQUALITY],
        ['!=', PREC.EQUALITY],
        ['<', PREC.RELATIONAL],
        ['<=', PREC.RELATIONAL],
        ['>', PREC.RELATIONAL],
        ['>=', PREC.RELATIONAL],
        ['+', PREC.ADDITIVE],
        ['-', PREC.ADDITIVE],
        ['*', PREC.MULTIPLICATIVE],
        ['/', PREC.MULTIPLICATIVE],
        ['%', PREC.MULTIPLICATIVE],
      ].map(([operator, precedence]) => prec.left(precedence, seq(
        field('left', $._expression),
        field('operator', operator),
        field('right', $._expression),
      ))),
    ),

    unary_expression: $ => prec.right(PREC.UNARY, seq(
      field('operator', choice('!', '-')),
      field('argument', $._expression),
    )),

    cast_expression: $ => prec.left(PREC.CAST, seq(
      field('value', $._expression),
      keyword('As'),
      field('type', $.type),
    )),

    type_test_expression: $ => prec.left(PREC.CAST, seq(
      field('value', $._expression),
      keyword('Is'),
      field('type', $.type),
    )),

    call_expression: $ => prec.left(PREC.POSTFIX, seq(
      field('function', choice($.identifier, $.member_expression)),
      field('arguments', $.arguments),
    )),

    member_expression: $ => prec.left(PREC.POSTFIX, seq(
      field('object', $._expression),
      '.',
      field('member', $.identifier),
    )),

    subscript_expression: $ => prec.left(PREC.POSTFIX, seq(
      field('array', $._expression),
      '[',
      field('index', $._expression),
      ']',
    )),

    arguments: $ => seq('(', commaSep($.argument), ')'),

    argument: $ => seq(
      optional(seq(field('name', $.identifier), '=')),
      field('value', $._expression),
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    new_expression: $ => prec.right(PREC.UNARY, seq(
      keyword('New'),
      field('type', choice($.builtin_type, $._type_identifier)),
      optional(seq('[', field('size', $._expression), ']')),
    )),

    type: $ => prec.right(seq(
      field('name', choice($.builtin_type, $._type_identifier)),
      optional(field('array', $.array_type_suffix)),
    )),

    builtin_type: _ => choice(
      keyword('Bool'),
      keyword('Float'),
      keyword('Int'),
      keyword('String'),
      keyword('Var'),
    ),

    array_type_suffix: _ => seq('[', ']'),

    _type_identifier: $ => choice($.qualified_identifier, $.identifier),

    qualified_identifier: $ => seq(
      $.identifier,
      repeat1(seq(':', $.identifier)),
    ),

    _literal: $ => choice(
      $.boolean,
      $.none,
      $.integer,
      $.float,
      $.string,
    ),

    boolean: _ => choice(keyword('True'), keyword('False')),
    none: _ => keyword('None'),
    integer: _ => token(choice(/0[xX][0-9a-fA-F]+/, /[0-9]+/)),
    float: _ => token(choice(/[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?[fF]?/, /[0-9]+[eE][+-]?[0-9]+[fF]?/)),
    string: $ => seq('"', repeat(choice($.escape_sequence, /[^"\\\r\n]/)), '"'),
    escape_sequence: _ => token.immediate(/\\[nrt"\\]/),

    _declaration_modifier: _ => choice(
      keyword('BetaOnly'),
      keyword('Conditional'),
      keyword('Const'),
      keyword('DebugOnly'),
      keyword('Default'),
      keyword('Global'),
      keyword('Hidden'),
      keyword('Native'),
    ),

    _property_modifier: _ => choice(
      keyword('BetaOnly'),
      keyword('Conditional'),
      keyword('Const'),
      keyword('DebugOnly'),
      keyword('Hidden'),
      keyword('Internal'),
      keyword('Mandatory'),
      keyword('Private'),
      keyword('Protected'),
      keyword('Public'),
      keyword('SelfOnly'),
    ),

    _variable_modifier: _ => choice(
      keyword('Conditional'),
      keyword('Const'),
      keyword('Hidden'),
      keyword('Internal'),
      keyword('Private'),
      keyword('Protected'),
      keyword('Public'),
      keyword('SelfOnly'),
    ),

    _function_modifier_without_native: _ => choice(
      keyword('BetaOnly'),
      keyword('DebugOnly'),
      keyword('Global'),
      keyword('Internal'),
      keyword('Private'),
      keyword('Protected'),
      keyword('Public'),
      keyword('SelfOnly'),
    ),

    _group_modifier: _ => choice(
      keyword('CollapseOnBase'),
      keyword('CollapseOnRef'),
      keyword('Collapsed'),
      keyword('CollapsedOnBase'),
      keyword('CollapsedOnRef'),
    ),

    line_comment: _ => token(seq(';', /[^\r\n]*/)),
    block_comment: _ => token(seq(';/', repeat(choice(/[^/]/, /\/[^;]/)), '/;')),
    documentation_comment: _ => token(seq('{', repeat(/[^}]/), '}')),
    line_continuation: _ => token(seq('\\', /[ \t]*/, /\r?\n/)),
    newline: _ => /\r?\n/,
    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,
  },
});
