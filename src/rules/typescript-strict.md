---
name: typescript-strict
description: Always use strict TypeScript patterns
applies_to: "*.ts"
---

Always use strict TypeScript:
- Never use `any` type
- Always type function parameters and return values
- Use `unknown` instead of `any` when the type is truly unknown
- Prefer interfaces over type aliases for object shapes
- Use `as const` for literal type inference
