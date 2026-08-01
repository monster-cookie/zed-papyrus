# Repository Agent Rules

These rules apply throughout the repository.

## Questions, goals, and approval

- Before planning or editing files, ask the user clarifying questions to confirm the goal, scope, constraints, and definition of done.
- State a concrete goal for the task. Use the available goal-tracking mechanism when one is available; otherwise include a clearly labeled goal in the response.
- Always produce a plan and wait for explicit user approval before editing files.
- Use `AGENT-PLAN-TEMPLATE.md` when present.
- After approval, make only the approved edits.
- Stop and ask before editing additional paths, changing the goal, or expanding the approved scope.
- Stop and ask the user how to proceed when uncertain or before trying an approach that is new to the codebase. Explain the uncertainty or proposed approach and wait for explicit approval before continuing.

## Repo-wide safety rules

- Never run Git commands unless the user explicitly asks for a specific Git action.
- Never modify repository history, create commits, create branches, open pull requests, push, pull, fetch, merge, rebase, tag, stash, or reset unless explicitly requested.
- Never edit `AGENTS.md`, `AGENTS.override.md`, `AGENT-PLAN-TEMPLATE.md`, or other agent-instruction files directly. Propose the changes and wait for explicit approval.
- Keep changes surgical and consistent with existing patterns and naming.
- Avoid unrelated formatting churn, project-wide cleanup, or broad rewrites.
- Do not introduce new third-party dependencies, frameworks, build tools, package managers, or CI actions without explicit approval in the plan.
- Do not claim build, test, packaging, migration, import, or validation success unless the command actually ran successfully.
- If validation cannot run, report the exact command, the failure or blocker, and whether it appears environmental.
- Do not add secrets, credentials, tokens, connection strings, private keys, personal paths, or machine-specific data to source files, documentation, test fixtures, logs, generated output, or workflow files.

## Planning requirements

Before edits, produce a plan containing:

- Scope and intent.
- Exact file paths expected to change.
- A code-level checklist.
- UI or Avalonia impacts, if any.
- Data model, persistence, or schema impacts, if any.
- Configuration, environment variable, path, logging, dependency injection, or workflow impacts, if any.
- Documentation impacts, or the exact statement: `Documentation impacts: None.`
- Risks and rollback notes.
- A validation plan with specific commands or manual checks.
