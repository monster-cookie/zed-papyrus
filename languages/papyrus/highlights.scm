[
  "scriptname"
  "extends"
  "import"
  "struct"
  "endstruct"
  "customevent"
  "group"
  "endgroup"
  "property"
  "endproperty"
  "state"
  "endstate"
  "function"
  "endfunction"
  "event"
  "endevent"
  "if"
  "elseif"
  "else"
  "endif"
  "while"
  "endwhile"
  "return"
  "new"
  "as"
  "is"
  "guard"
  "protectsfunctionlogic"
  "requiresguard"
  "lockguard"
  "endlockguard"
  "trylockguard"
  "elsetrylockguard"
  "elselockguard"
  "endtrylockguard"
] @keyword

[
  "auto"
  "autoreadonly"
  "betaonly"
  "conditional"
  "const"
  "debugonly"
  "default"
  "global"
  "hidden"
  "mandatory"
  "native"
  "protected"
] @attribute

(builtin_type) @type.builtin
(type name: (identifier) @type)
(type name: (qualified_identifier) @type)

(script_declaration name: (_) @type)
(script_declaration parent: (_) @type)
(import_declaration module: (_) @module)
(struct_declaration name: (identifier) @type)
(guard_declaration name: (identifier) @type)

(function_definition name: (identifier) @function)
(native_function_declaration name: (identifier) @function)
(event_definition name: (identifier) @function)
(native_event_declaration name: (identifier) @function)
(custom_event_declaration name: (identifier) @function)

(call_expression function: (identifier) @function)
(call_expression
  function: (member_expression member: (identifier) @function.method))

(property_definition name: (identifier) @property)
(auto_property_definition name: (identifier) @property)
(struct_member name: (identifier) @property)
(member_expression member: (identifier) @property)

(parameter name: (identifier) @variable.parameter)
(variable_declaration name: (identifier) @variable)
(argument name: (identifier) @variable.parameter)

(boolean) @boolean
(none) @constant.builtin
(integer) @number
(float) @number
(string) @string
(escape_sequence) @string.escape

[
  (line_comment)
  (block_comment)
  (documentation_comment)
] @comment

[
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "||"
  "&&"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "+"
  "-"
  "*"
  "/"
  "%"
  "!"
] @operator

["(" ")" "[" "]"] @punctuation.bracket
["," "." ":"] @punctuation.delimiter
