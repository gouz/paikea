# Conventional Commits + Gitmoji + OpenSpec

## Required format

```
:gitmoji: type(scope): short description

[optional body]

[footer: BREAKING CHANGE / Closes #issue]
```

## Complete Gitmoji → Type mapping

| Gitmoji | Code | Type | Use case |
|---------|------|------|----------|
| ✨ | `:sparkles:` | `feat` | Introduce new features |
| 💥 | `:boom:` | `feat` | Introduce breaking changes (→ MAJOR semver) |
| 🎉 | `:tada:` | `feat` | Begin a project |
| 🚀 | `:rocket:` | `ci` | Deploy stuff |
| 🐛 | `:bug:` | `fix` | Fix a bug |
| 🚑️ | `:ambulance:` | `fix` | Critical hotfix |
| 🔒️ | `:lock:` | `fix` | Fix security or privacy issues |
| ✏️ | `:pencil2:` | `fix` | Fix typos |
| 🩹 | `:adhesive_bandage:` | `fix` | Simple fix for a non-critical issue |
| 🥅 | `:goal_net:` | `fix` | Catch errors |
| 📝 | `:memo:` | `docs` | Add or update documentation |
| 📄 | `:page_facing_up:` | `docs` | Add or update license |
| 💡 | `:bulb:` | `docs` | Add or update comments in source code |
| ♻️ | `:recycle:` | `refactor` | Refactor code |
| 🎨 | `:art:` | `refactor` | Improve structure / format of the code |
| 🏗️ | `:building_construction:` | `refactor` | Make architectural changes |
| 🚚 | `:truck:` | `refactor` | Move or rename resources |
| 💄 | `:lipstick:` | `refactor` | Add or update the UI and style files |
| ♿️ | `:wheelchair:` | `refactor` | Improve accessibility |
| 🚸 | `:children_crossing:` | `refactor` | Improve user experience / usability |
| 📱 | `:iphone:` | `refactor` | Work on responsive design |
| 🌐 | `:globe_with_meridians:` | `refactor` | Internationalization and localization |
| 🧵 | `:thread:` | `refactor` | Multithreading or concurrency |
| 🦺 | `:safety_vest:` | `refactor` | Add or update validation |
| 🦖 | `:t-rex:` | `refactor` | Add backwards compatibility |
| ✅ | `:white_check_mark:` | `test` | Add, update, or pass tests |
| 🧪 | `:test_tube:` | `test` | Add a failing test |
| 📸 | `:camera_flash:` | `test` | Add or update snapshots |
| ⚗️ | `:alembic:` | `test` | Perform experiments |
| 🔧 | `:wrench:` | `chore` | Add or update configuration files |
| 🔨 | `:hammer:` | `chore` | Add or update development scripts |
| 📦️ | `:package:` | `chore` | Add or update compiled files or packages |
| ⬆️ | `:arrow_up:` | `chore` | Upgrade dependencies |
| ⬇️ | `:arrow_down:` | `chore` | Downgrade dependencies |
| ➕ | `:heavy_plus_sign:` | `chore` | Add a dependency |
| ➖ | `:heavy_minus_sign:` | `chore` | Remove a dependency |
| 📌 | `:pushpin:` | `chore` | Pin dependencies to specific versions |
| 🔖 | `:bookmark:` | `chore` | Release / Version tags |
| 🏷️ | `:label:` | `chore` | Add or update types |
| 🙈 | `:see_no_evil:` | `chore` | Add or update a .gitignore file |
| 🌱 | `:seedling:` | `chore` | Add or update seed files |
| 🍱 | `:bento:` | `chore` | Add or update assets |
| 🗑️ | `:wastebasket:` | `chore` | Deprecate code that needs to be cleaned up |
| ⚰️ | `:coffin:` | `chore` | Remove dead code |
| 💸 | `:money_with_wings:` | `chore` | Sponsorships or money related infrastructure |
| 🔥 | `:fire:` | `chore` | Remove code or files |
| 💩 | `:poop:` | `chore` | Write bad code that needs to be improved |
| 🤡 | `:clown_face:` | `chore` | Mock things |
| 🥚 | `:egg:` | `chore` | Add or update an easter egg |
| 💬 | `:speech_balloon:` | `chore` | Add or update text and literals |
| 👥 | `:busts_in_silhouette:` | `chore` | Add or update contributor(s) |
| ⚡️ | `:zap:` | `perf` | Improve performance |
| 📈 | `:chart_with_upwards_trend:` | `perf` | Add or update analytics or track code |
| 👷 | `:construction_worker:` | `ci` | Add or update CI build system |
| 💚 | `:green_heart:` | `ci` | Fix CI Build |
| 🚨 | `:rotating_light:` | `ci` | Fix compiler / linter warnings |
| 🧱 | `:bricks:` | `ci` | Infrastructure related changes |
| 🩺 | `:stethoscope:` | `ci` | Add or update healthcheck |
| 🛂 | `:passport_control:` | `ci` | Authorization, roles and permissions |
| ⏪️ | `:rewind:` | `chore` | Revert changes |
| 🔀 | `:twisted_rightwards_arrows:` | `chore` | Merge branches |
| 👽️ | `:alien:` | `chore` | Update code due to external API changes |
| 🔊 | `:loud_sound:` | `chore` | Add or update logs |
| 🔇 | `:mute:` | `chore` | Remove logs |
| 🚩 | `:triangular_flag_on_post:` | `feat` | Add, update, or remove feature flags |
| 💫 | `:dizzy:` | `feat` | Add or update animations and transitions |
| 🧐 | `:monocle_face:` | `chore` | Data exploration/inspection |
| 👔 | `:necktie:` | `feat` | Add or update business logic |
| 🧑‍💻 | `:technologist:` | `chore` | Improve developer experience |
| ✈️ | `:airplane:` | `feat` | Improve offline support |
| 🔐 | `:closed_lock_with_key:` | `chore` | Add or update secrets |
| 🔍️ | `:mag:` | `chore` | Improve SEO |
| 🗃️ | `:card_file_box:` | `chore` | Perform database related changes |
| 🚧 | `:construction:` | `chore` | Work in progress |
| 🍻 | `:beers:` | `chore` | Write code drunkenly |
| 📋 | `:clipboard:` | `spec` | OpenSpec specification changes only |

## Strict rules

- Gitmoji code comes **first**, before the type
- Subject in English, imperative mood, lowercase, no trailing period
- Subject length: max 72 characters (including the gitmoji code)
- Never commit without explicit user confirmation
- Always check `git diff --staged` before suggesting a commit message
- One commit = one responsibility (no catch-all commits)
- Always use `:code:` format — never Unicode emoji directly
- Pick the most semantically accurate gitmoji for the change

## OpenSpec integration

### Mandatory full cycle

Before any significant implementation commit (`feat`, `fix`, `refactor`):

1. An OpenSpec change must exist in `openspec/changes/<n>/`
2. Validate the spec with `openspec validate <n>`
3. Implement the tasks listed in `openspec/changes/<n>/tasks.md`
4. Archive the change with `openspec archive <n> --yes`
5. Commit the implementation and the archived specs in two separate commits

### OpenSpec commit pattern

```bash
# 1. Code implementation
:sparkles: feat(auth): add two-factor authentication via TOTP

# 2. Spec archive (separate commit, immediately after)
:clipboard: spec(auth): archive add-2fa openspec change
```

### Type ↔ OpenSpec phase mapping

| OpenSpec phase   | Gitmoji + Commit type                            |
|------------------|--------------------------------------------------|
| Proposal created | `:clipboard: spec(scope): propose <feature>`     |
| Implementation   | `:sparkles:/:bug:/:recycle: type(scope): ...`    |
| Spec archive     | `:clipboard: spec(scope): archive <change-name>` |

### Available slash commands (Claude Code)

- `/openspec:proposal` — create a new change proposal
- `/openspec:apply <n>` — implement the tasks of a change
- `/openspec:archive <n>` — archive a completed change

## Forbidden

- Never commit code related to an unarchived `openspec/changes/`
- Never mix implementation code and OpenSpec archive in the same commit
- Never use `git commit -m` without reviewing the full diff first
- Never edit `openspec/specs/` directly — always go through the changes/archive cycle
- Never use Unicode emoji — always use the `:code:` text format

## Valid examples

```
:sparkles: feat(user): add profile search filters by role and team
:bug: fix(api): handle null response on session expiry
:recycle: refactor(db): extract query builder into repository layer
:memo: docs(readme): update openspec workflow setup steps
:white_check_mark: test(auth): add scenarios for TOTP edge cases
:arrow_up: chore(deps): upgrade typescript to 5.7
:clipboard: spec(payments): archive add-stripe-integration openspec change
:construction_worker: ci(github): add openspec validate step to pre-merge workflow
:boom: feat(api)!: remove v1 endpoints
:lock: fix(auth): patch timing attack on password comparison
:label: chore(types): add strict types to user module
:wheelchair: refactor(ui): improve keyboard navigation on modal
:zap: perf(query): add index on users.created_at column
```

## Invalid examples

```
# ❌ no gitmoji
feat(auth): add login

# ❌ unicode emoji instead of :code:
✨ feat(auth): add login

# ❌ gitmoji after the type
feat :sparkles: (auth): add login

# ❌ uppercase + trailing period
:sparkles: Feat(auth): Add login.

# ❌ mixing implementation and archive
:sparkles: feat(auth): add 2fa and archive openspec change

# ❌ too vague
:bug: fix: various fixes

# ❌ subject exceeds 72 characters
:sparkles: feat(user-management): add advanced profile search filters with role, team and location support
```
