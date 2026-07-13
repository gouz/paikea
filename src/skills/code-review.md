---
name: code-review
description: Review code for security, performance, and style issues
triggers:
  - /review
  - when user asks to review code
---

When reviewing code, focus on:
1. Security vulnerabilities (injection, auth bypass, secrets exposure)
2. Performance issues (N+1 queries, unnecessary re-renders, memory leaks)
3. Code style consistency and naming conventions
4. Error handling completeness
5. Type safety and null checks
