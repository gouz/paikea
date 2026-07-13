# Development Best Practices

## Core principles

- **DRY** – Don't Repeat Yourself: abstract any duplicated logic
- **KISS** – Keep It Simple, Stupid: the simplest solution that works
- **YAGNI** – You Aren't Gonna Need It: don't anticipate hypothetical needs
- **SOLID** – follow object-oriented design principles

## Code style

- Short functions with a single responsibility (< 30 lines, otherwise split)
- Explicit variable and function names — no cryptic abbreviations
- No magic numbers: use named constants
- Strict typing everywhere: no `any`, no implicit types
- All imports at the top of the file, grouped by type (stdlib → external → internal)

## Error handling

- Always raise explicit errors with a clear, actionable message
- No silent catches (`catch (e) {}`)
- Use specific error types rather than the generic `Error`
- Log errors with enough context to debug

## Security

- Never hardcode secrets, tokens, or passwords — use environment variables
- Validate and sanitize all user input
- No `eval()`, no direct SQL concatenation
- `.env` files and secrets must never be committed

## Performance

- Don't optimize prematurely — profile first
- Avoid nested loops over large datasets
- Lazy-load anything not critical at startup

## Code review checklist (when Claude generates code)

Before proposing an implementation, verify:
1. Does the logic already exist elsewhere in the project?
2. Is the code testable as-is?
3. Are error cases covered?
4. Are names understandable without a comment?

## Documentation

- Complex public functions must have a JSDoc/docstring
- Non-obvious architecture decisions must be commented with `// WHY:`
- `README.md` must stay up to date with new commands and dependencies

## Workflow

1. Understand the requirement before coding
2. Write the test first if possible
3. Implement the minimal solution
4. Refactor if needed
5. Run lint + tests
6. Commit with a conventional message
