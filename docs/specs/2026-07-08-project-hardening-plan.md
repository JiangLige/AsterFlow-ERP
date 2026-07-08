# Implementation Plan: AsterFlow ERP 工程卫生与面试展示完善

## Review Status

IMPLEMENT completed on 2026-07-08. All phases are implemented and final frontend/backend verification passed.

## Overview

This plan turns the accepted spec into an ordered implementation path. The work should leave the project buildable after each major checkpoint while improving package structure, API security confidence, user-facing text quality, and documentation accuracy.

The safest order is:

1. Protect the current dirty worktree and establish a baseline.
2. Do the high-risk Java package cleanup early.
3. Add controller/API security tests once package imports compile.
4. Fix source/documentation text and align Spring AI / Redis descriptions.
5. Run full verification and clean build artifacts from the intended change set.

## Current Context

- Branch: `codex/project-hardening`.
- Worktree already has unrelated or pre-existing modifications. Implementation must not revert user changes.
- Frontend build has recently passed with `npm run build:client`.
- Backend `.\mvnw.cmd -B clean verify` has recently passed with 45 tests.
- Existing backend API integration style uses `@SpringBootTest(webEnvironment = RANDOM_PORT)` plus Java `HttpClient`, as seen in `AuthSessionIntegrationTest`.
- Entity classes currently live in top-level `server/src/main/java/entity`.
- A duplicate `MybatisPlusConfig` exists under both `entity` and `com.asterflow.erp.config`.

## Dependency Graph

```text
Current worktree inventory
  -> Baseline build/test confidence
    -> Java package migration
      -> Import updates across mapper/service/controller/test code
        -> Backend compile/test checkpoint
          -> Controller/API security integration tests
            -> Backend verification checkpoint
              -> Source text cleanup
              -> .env.example and docs cleanup
              -> Spring AI / Redis behavior documentation alignment
                -> Full frontend + backend verification
```

The package migration is the central dependency because it can break compilation across almost every backend layer. It should happen before new API tests, so tests target the final package structure.

## Architecture Decisions

- **Do the entity package migration in this spec.** The spec's success criteria explicitly require `com.asterflow.erp.entity`, so deferring it would leave the spec incomplete.
- **Use existing integration-test style for API security tests.** Add or extend tests using `@SpringBootTest(webEnvironment = RANDOM_PORT)` and Java `HttpClient` instead of introducing a new controller-test framework.
- **Avoid database schema changes.** Entity package movement must not rename tables, columns, or MyBatis mappings.
- **Keep Redis tests lightweight.** Do not require a real Redis instance in this spec; test fallback or conditional behavior only where it can run in local/CI without external services.
- **Keep Spring AI safe by default.** AI features should keep fallback behavior and must not require a real OpenAI API key for tests or local build verification.
- **Keep documentation mostly Chinese.** Use clear Chinese for interview-facing explanations, with executable commands left exactly as shell commands.

## Implementation Phases

### Phase 1: Baseline and Safety

Purpose: make sure implementation starts from a known state and does not accidentally overwrite existing user changes.

Work:

- Capture `git status --short --branch`.
- Identify existing modified files and separate them from new planned changes.
- Confirm build artifacts such as `server/target` and `client/.next` are ignored or excluded from final review.
- Optionally run targeted baseline checks if the worktree changes since the last verification are suspicious.

Verification checkpoint:

- `git status --short --branch` is understood before edits.
- No destructive git commands are used.
- Planned files are known before implementation begins.

### Phase 2: Java Package and Configuration Cleanup

Purpose: remove the largest structural inconsistency first.

Work:

- Move entity classes from `entity` to `com.asterflow.erp.entity`.
- Update package declarations and imports across mappers, services, DTO mapping helpers, controllers, and tests.
- Delete or neutralize the duplicate `entity.MybatisPlusConfig`, keeping the canonical config under `com.asterflow.erp.config`.
- Preserve table annotations, field names, optimistic-lock fields, and MyBatis mapper behavior.

Verification checkpoint:

- Backend compiles.
- Targeted backend tests covering purchase, sale, stock adjustment, auth session, and application context pass.
- No database schema file changes are required.

Suggested command:

```powershell
cd server
.\mvnw.cmd test
```

### Phase 3: Controller/API Security Tests

Purpose: prove the security boundary is real, not only frontend button hiding.

Work:

- Add a focused API security integration test class using the existing random-port HTTP style.
- Cover at least:
  - missing JWT rejects a protected endpoint,
  - staff user is forbidden from an admin-only action,
  - invalid request input returns `VALIDATION_ERROR`.
- Reuse existing seed users and response parsing patterns from current tests.
- Avoid testing every endpoint; pick representative endpoints with stable semantics.

Verification checkpoint:

- New security tests fail for the right reason before fixes if gaps are discovered.
- New security tests pass after any required fixes.
- Existing auth/session tests still pass.

Suggested command:

```powershell
cd server
.\mvnw.cmd -Dtest=AuthSessionIntegrationTest,*Security* test
```

### Phase 4: Text, Encoding, and Source Polish

Purpose: remove obvious presentation defects that would weaken the interview/demo impression.

Work:

- Fix mojibake and truncated Chinese in source messages, Swagger descriptions, AI prompts, fallback text, and auth errors.
- Fix `.env.example` Chinese comments so local/Redis modes are readable.
- Clean existing roadmap/interview docs only where they currently make inaccurate or garbled claims.
- Keep changes minimal; do not rewrite docs into a new marketing page.

Verification checkpoint:

- Search for obvious mojibake markers in touched files.
- Backend tests still pass after source message changes.
- Frontend build is not required unless client files are touched.

Suggested checks:

```powershell
rg -n "锛|涓|鐨|真\\?|当\\?|重新登" .env.example docs server/src/main/java
cd server
.\mvnw.cmd test
```

### Phase 5: AI and Redis Behavior Alignment

Purpose: make implementation and docs tell the same story.

Work:

- Confirm Spring AI fallback behavior remains safe without a real model response.
- Confirm Redis cache/session/idempotency/rate-limit docs match current conditional modes.
- If a small missing fallback test is straightforward, add it; otherwise document the current verified boundary and leave heavier Redis integration for a later spec.
- Avoid adding Redis containers, Docker Compose, or new dependencies in this spec.

Verification checkpoint:

- AI-related tests pass.
- Redis-free local and CI test path remains green.
- Documentation no longer says features are missing if they now exist, and does not claim advanced features such as Bloom filters if not implemented.

Suggested command:

```powershell
cd server
.\mvnw.cmd -Dtest=InventoryAiToolsTest,AiResponseDtoTest,RateLimitInterceptorTest test
```

### Phase 6: Final Verification and Review Prep

Purpose: prove the project is still cleanly buildable and summarize the change set for review.

Work:

- Run full backend clean verification.
- Run frontend production build.
- Check git status and ensure build artifacts are not staged or included.
- Update spec/plan status only after checks pass.

Verification checkpoint:

```powershell
npm run build:client
cd server
.\mvnw.cmd -B clean verify
git status --short --branch
```

Completion criteria:

- All spec success criteria are met or explicitly marked out of scope with approval.
- The worktree contains only intentional source/doc changes.
- The project is ready for TASKS review, then implementation review.

## Parallelization Opportunities

Safe to parallelize after Phase 2:

- API security test writing and documentation text cleanup can happen independently once package imports compile.
- `.env.example` cleanup and roadmap wording cleanup can run independently.
- AI fallback test inspection and Redis documentation alignment can run independently if they do not touch the same files.

Must remain sequential:

- Package migration before broad backend tests.
- Security tests before claiming backend authorization is proven.
- Final full verification after all code and doc edits.

Needs coordination:

- Any change to shared error response shape affects tests, docs, and frontend error handling.
- Any change to auth/session behavior affects `JwtInterceptor`, `AuthController`, and frontend API proxy assumptions.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Entity package migration breaks many imports | High | Do it first, keep it mechanical, run backend tests immediately |
| Duplicate MyBatis config removal changes runtime behavior | Medium | Keep the canonical `com.asterflow.erp.config.MybatisPlusConfig`; verify application context starts |
| Security tests expose real authorization gaps | High | Treat failing tests as useful findings; fix only scoped backend authorization gaps |
| Text cleanup accidentally rewrites meaning | Medium | Keep edits limited to garbled/truncated text and inaccurate claims |
| Docs and implementation drift again | Medium | Update docs only after confirming code behavior |
| Redis tests become environment-dependent | Medium | Avoid real Redis dependency in this spec unless separately approved |
| Existing dirty worktree contains user edits | High | Inspect before edits and never revert unrelated changes |

## Recommended TASKS Phase Shape

The TASKS phase should break this plan into small tasks, each touching no more than about five files where possible:

- Task 1: baseline inventory and source-map package references.
- Task 2: migrate entity package and remove duplicate MyBatis config.
- Task 3: add API security integration tests.
- Task 4: fix any scoped authorization/validation gaps revealed by tests.
- Task 5: clean source text and Swagger/API messages.
- Task 6: clean `.env.example` and interview-facing docs.
- Task 7: align AI/Redis docs and lightweight tests.
- Task 8: run final verification and prepare review summary.

Detailed acceptance criteria belong in the next TASKS phase.

## Open Questions for Review

1. For admin-only staff rejection, should the representative endpoint be product deletion, supplier status change, or order deletion?
2. Should the documentation cleanup include only garbled sections, or should it also remove outdated statements like "Spring AI 未接入" when code now has Spring AI?
3. Should the final implementation update the spec file's review status after passing verification?
4. If package migration touches more than expected, should it still happen in one mechanical task, or be split by entity/import group?

## PLAN Verification

- The dependency order is explicit.
- High-risk package migration happens early.
- Checkpoints exist after baseline, package migration, security tests, polish, AI/Redis alignment, and final verification.
- No implementation code is changed by this plan.
- Human review is required before TASKS.
