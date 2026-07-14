---
name: openspec-git
description: Git branching and commit conventions tied to the OpenSpec workflow — branch when a proposal is created, commit when a task is done.
triggers:
  - proposal created
  - new openspec change
  - task finished
  - task checked off
  - commit the change
---

# OpenSpec Git Workflow

Keep git in lockstep with the OpenSpec lifecycle. Two moments matter.

## 1. Proposal created → new branch

As soon as a new change exists under `openspec/changes/<name>/` (proposal step),
create a dedicated branch **before** any design, spec, task, or implementation work.

- Use the `git_propose` tool. It reads the latest change name and creates/switches
  to `feat/<change-name>`.
- One change = one branch. Never author a proposal directly on `main`.

## 2. Task finished → commit

During the apply step, commit **after each task is completed and checked off**
(`- [x]`) in `tasks.md`. One task = one commit.

- Use the `git_commit` tool with a message that follows the conventional-commits
  + gitmoji convention (see the `conventional-commits` reference):
  `:gitmoji: type(scope): short description`
- Commit the task's implementation and its checked-off `tasks.md` together.
- Do not batch several tasks into one commit; do not commit unfinished work.

## 3. Change complete → archive and merge into main

At the archive step, use the `git_archive` tool. It:

- runs `openspec archive` (merging the change's spec deltas into `openspec/specs/`
  and moving the change under `archive/`),
- commits that result on the feature branch, then
- merges the feature branch into `main` (`--no-ff`), pushing to origin when one exists.

Archive from the change's `feat/<name>` branch, never from `main`.

## Rules

- Never commit on `main` for an in-progress change — always the `feat/<name>` branch.
- Do not create the branch before the change exists (`git_propose` needs it).
- `main` only receives a change through the archive merge, never a direct commit.
