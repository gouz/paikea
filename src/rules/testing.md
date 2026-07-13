# Automated Testing

## Philosophy

All shipped code must be tested. If it's not testable, that's a design signal worth addressing.

## Mandatory rules

- Write tests **before or alongside** the code (TDD encouraged)
- Every new public function must have at least one unit test
- Every bug fix must include a non-regression test
- Never commit code that breaks existing tests

## Minimum coverage

- Utility functions and business logic: **90%+**
- UI components: **70%+**
- No magic threshold: aim for relevance, not maximum coverage

## What to test

- Nominal cases (happy path)
- Edge cases (null, empty, extreme values)
- Error cases (exceptions, failed API responses)
- Side effects (function calls, emitted events)

## What NOT to test

- Internal implementation details (test behavior, not "how")
- Third-party libraries
- Trivial getters / setters with no logic
