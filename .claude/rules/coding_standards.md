<!-- materialized-from: mayker-dev v0.3.298; do not edit, regenerate with /upgrade-project -->
<!--
  Universal standard. Loaded at launch from .claude/rules/ (always on). Do not edit per project.
  Stack-agnostic: code quality, naming, architecture patterns, component design, test attributes.
-->

# Coding Standards & Best Practices

> **Not loaded at launch:** Sections 2 and 3 in `${CLAUDE_PLUGIN_ROOT}/rules/coding_standards/backend_frontend.md` (the mayker-dev plugin). Read the named file before you apply or cite one of those sections.
> **Rules here, reasons there:** the full text of Section 5, with its measured example, is in `${CLAUDE_PLUGIN_ROOT}/rules/coding_standards/backend_frontend.md` → "Section 5, in full". Read it before you cite or change a Section 5 rule.

> **Mode-aware (existing codebase):** When `CLAUDE.md` Project Mode is `existing`, apply `existing_codebase.md` first: match the conventions already present in the code you touch, treat the rules below as the fallback for net-new code, and never restructure existing code to satisfy them. In `new` mode, apply the rules below as written.

## 1. General Principles

- **KISS (Keep It Simple, Stupid):** Avoid over-engineering. Write code that is easy to read and maintain.
- **DRY (Don't Repeat Yourself):** Abstract common logic, but be wary of hasty abstractions.
- **Clean Code:** Variable names must be descriptive. Comments should explain "Why", not "What".
- **No TODO placeholders:** Do not generate code with "TODO: Implement logic" or similar. Write the full implementation.

## 4. API Integration Guidelines

When the project consumes external APIs (as defined in `CLAUDE.md` API References):

- **Client Layer:** Create a dedicated API client module for each external service. Do not scatter fetch/HTTP calls across components.
- **Error Handling:** All API calls must handle: network errors, timeout, authentication failures (401/403), rate limiting (429), server errors (5xx), and unexpected response shapes.
- **Type Safety:** Define request/response types for every endpoint consumed. Do not use `any` or untyped responses.
- **Authentication:** Externalize API keys and tokens via environment variables. Never hardcode credentials.
- **Retry Logic:** Implement retry with exponential backoff for transient failures (network errors, 5xx, 429) when appropriate.

## 5. Configuration & Deployment-Dependent Values

A **deployment-dependent value** changes when the same code runs somewhere else: CORS origins and allowed hosts, service base URLs, host ports, database and broker URLs, external hostnames. It is not a credential, which is Section 2's rule.

**The invariant.** Within one settings module, deployment-dependent values are configured the same way: if one reads the environment, every value that varies by environment does, with a documented default.

An unexplained E2E timeout on a call that works under `curl` is an origin question before it is a network question: CORS, mixed content and cookie domains fail only in the browser.

- **Never widen a default to a list of likely values.** The next value anyone picks is still wrong, and now nothing says so.
- **One value, one source, across generated files too.** A port a CI workflow and a compose file both name is derived from the file that owns it. A comment telling a human to keep them in step is not a mechanism.
- **A test that asserts the fallback is not coverage of the wiring.** Assert the resolution, not the literal.
- **Check it:** `bash ~/.mayker/mayker-dev/hooks/lib/config-consistency.sh settings <file>` and `... ports <repo-root> <ci-path>` (the first path the git mapping file's `ci-config-path` row names) exit 1 on a violation, 0 when consistent, and 2 when they cannot check, which is never a pass. A clean run is not proof; the review check is the authority.
