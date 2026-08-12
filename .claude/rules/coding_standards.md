<!-- materialized-from: mayker-dev v0.3.111; do not edit, regenerate with /upgrade-project -->
<!--
  Universal standard. Imported into CLAUDE.md (always on). Do not edit per project.
  Stack-agnostic: code quality, naming, architecture patterns, component design, test attributes.
-->

# Coding Standards & Best Practices

> **Mode-aware (existing codebase):** When `CLAUDE.md` Project Mode is `existing`, apply `existing_codebase.md` first: match the conventions already present in the code you touch, treat the rules below as the fallback for net-new code, and never restructure existing code to satisfy them. In `new` mode, apply the rules below as written.

## 1. General Principles

- **KISS (Keep It Simple, Stupid):** Avoid over-engineering. Write code that is easy to read and maintain.
- **DRY (Don't Repeat Yourself):** Abstract common logic, but be wary of hasty abstractions.
- **Clean Code:** Variable names must be descriptive. Comments should explain "Why", not "What".
- **No TODO placeholders:** Do not generate code with "TODO: Implement logic" or similar. Write the full implementation.

## 2. Backend Guidelines

> **Reference:** See `CLAUDE.md` for the specific backend language, framework, database, and testing libraries.

### 2.1 Naming Conventions

- **Classes / Models:** `PascalCase` (e.g., `UserService`, `CreateUserRequest`).
- **Functions / Variables:** Use the casing convention of the backend language defined in `CLAUDE.md` (e.g., `snake_case` for Python, `camelCase` for TypeScript/Java).
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`).
- **Modules / Files:** Use the file naming convention of the backend language.
- **Contracts:** Use the language-appropriate mechanism for defining service interfaces (e.g., `Protocol` / `ABC` in Python, `interface` in TypeScript/Java).

### 2.2 Layered Architecture

When the project includes a backend with data persistence, follow the **Router → Service → Repository** pattern:

1. **Router:** Handles HTTP requests, path/query parameter validation via schemas, and dependency injection. **NO business logic here.**
2. **Service:** Contains business logic. **Apply transactional boundaries here** using the framework's transaction mechanism.
3. **Repository:** Interacts with the database via the query layer defined in `CLAUDE.md`.
4. **Schemas (DTOs):** Request/response validation and serialization models. Keep separate from domain models.
5. **Models (Domain):** ORM or query models representing the database structure.

When the project does not include a custom backend (e.g., frontend-only consuming external APIs), skip this pattern. The plan from `/plan-feature` determines which layers exist.

### 2.3 Error Handling & Logging

- **Exceptions:** Define custom exception classes inheriting from a base `AppException`.
- **Global Handling:** Register framework exception handlers to return consistent, machine-readable JSON error responses with standard HTTP status codes.
- **Logging:** Use the logging library defined in `CLAUDE.md`. **NEVER** use `print()` or `console.log()` for application logging. Exceptions and unexpected situations must be logged with context.

### 2.4 Unit Testing

- Use the unit testing framework defined in `CLAUDE.md`.
- Test individual functions/methods in isolation.
- Minimum cases per tested function: happy path, at least 1 edge case, at least 1 error/exception case.
- Coverage: Minimum 80% line coverage on business logic.

### 2.5 Integration Testing

> **Reference:** Toggle controlled by `Integration Tests` in `CLAUDE.md` Feature Toggles.

- **Scope:** Validate multiple components working together against real infrastructure, Repository layer against a real database, Router layer through the full HTTP request/response cycle.
- **Shared Fixtures:** Create a project-level shared test configuration file with: a module-scoped real database instance fixture, a session-scoped application test client fixture, and a migration runner.
- **Isolation:** Each test runs in a transaction that is rolled back after the test, or uses a fresh database state. Tests must not depend on execution order.

## 3. Frontend Guidelines

> **Reference:** See `CLAUDE.md` for the specific frontend framework, CSS library, and component conventions.

### 3.1 CSS Methodology

- **Utility-First:** Use the defined utility CSS framework directly in markup when applicable.
- **No Custom CSS:** Avoid writing raw CSS files unless absolutely necessary for complex animations.
- **Configuration:** Use the framework's config file for defining brand colors, fonts, and spacing.

### 3.2 Structure & Accessibility

- **Semantic HTML:** Use `<header>`, `<main>`, `<article>`, `<footer>` appropriately.
- **Responsiveness:** Mobile-first approach. Use responsive prefixes to build up from small screens.
- **Accessibility (a11y):** All interactive elements must have `aria-labels` if text is not descriptive. Images must have `alt` tags.

### 3.3 Component Design

- **Atomic Design:** Break down UI into small, reusable components (Atoms → Molecules → Organisms).
- **One base set, materialized once:** in a new project the scaffold feature builds the design tokens and the base atoms and molecules from the values the plan recorded (build-feature Section 7 step 6). **Every later feature builds on that set and never regenerates it** — import the existing component, and introduce a new atom only where none of them covers the need. A feature that re-invents its own button is both duplicated code and a second, drifting answer to the same design value.
- **Localization:** Do not hardcode text strings; keep them ready for i18n.
- **Functional/Compositional:** Strictly use functional patterns (no class-based components unless specified in `CLAUDE.md`).
- **Hooks/Composables:** Use framework hooks for local state and side effects. Create custom hooks for reusable logic.
- **State Management:** Use native state APIs first (e.g., Context for React). Reach for complex state libraries only if native APIs are insufficient.
- **File Structure:** One component per file. File name matches component name.

### 3.4 Design Reference Consumption

When a design reference is configured in `CLAUDE.md`:

**What to extract:** Layout structure, spacing/padding values and the relationships between them, color usage, typography, component hierarchy, interaction patterns (drawers, modals, dropdowns, navigation flows), and every state the design defines for an interactive element (default, hover, focus, active, disabled, error, empty, loading).

**What to ignore:** Component structure and file organization from the design tool, state management patterns from design-to-code output, SVG import patterns, naming conventions from the design tool.

**The Fidelity Rule:** Exact spacing, sizes, colors, typography and states come from the design source, are recorded once in the plan's `- Design reference notes:` line, and are implemented from that record: reinterpretation is allowed only where the design is ambiguous or silent, and every deviation is listed explicitly in the PR description. Where the reference is `FIGMA_MCP` those values are the design's own variable and token values, read through the Figma MCP by the planner; where it is `REPO_DIR` they are measured from the committed export. **"Looks close" is not the bar.** An implemented value that contradicts a recorded one is a defect however it reads beside the design, and a component whose states the design defines is not finished until each of those states is implemented. The reviewer checks this by comparing the implemented values against the plan's recorded ones (`review_standards.md` Section 5); nothing here involves screenshots or pixel comparison.

**The Rewrite Rule:** When implementing from a design reference, **reimplement from scratch** using the standards in this file and the tech stack in `CLAUDE.md`. Do not adapt, refactor, or copy-paste design-to-code output. **The Rewrite Rule governs code provenance, not visual outcome**, and neither rule licenses the other: the implementation is written from scratch *and* it carries the recorded values exactly. Reading the Rewrite Rule as permission to approximate the design inverts it, and the Fidelity Rule is not permission to paste design-tool output back in.

When no design reference is configured (`Mode: NONE`), the AI implements a clean, professional UI following the tech stack's conventions and common design patterns.

### 3.5 Icon System

Two tiers:

1. **Generic UI Icons:** Use the icon library defined in `CLAUDE.md` for standard UI affordances (search, chevrons, close, add, edit, trash, check, info, warning, etc.).
2. **Domain-Specific Icons:** For icons unique to the application domain, create icon components in a dedicated `icons/` directory.

**Forbidden:** Inline `<svg>` elements in page or feature component files.

### 3.6 Test Attributes

- **Requirement:** Add `data-testid` attributes to all interactive elements and key content containers. These are consumed by E2E and UAT test generation.
- **Scope:** Buttons, inputs, links, toggles, form controls, tables, lists, cards, modals, drawers, tab panels, and any element representing a distinct interaction.
- **Format:** `data-testid="{component}-{element}"` (e.g., `data-testid="user-table"`, `data-testid="search-input"`).
- **Stability:** Test attributes must remain stable across refactors. They are part of the component's public contract for testing.
- **Uniqueness:** Each value must be unique within a page. For repeated components, use a suffix pattern (e.g., `{component}-{element}-{id}`).

## 4. API Integration Guidelines

When the project consumes external APIs (as defined in `CLAUDE.md` API References):

- **Client Layer:** Create a dedicated API client module for each external service. Do not scatter fetch/HTTP calls across components.
- **Error Handling:** All API calls must handle: network errors, timeout, authentication failures (401/403), rate limiting (429), server errors (5xx), and unexpected response shapes.
- **Type Safety:** Define request/response types for every endpoint consumed. Do not use `any` or untyped responses.
- **Authentication:** Externalize API keys and tokens via environment variables. Never hardcode credentials.
- **Retry Logic:** Implement retry with exponential backoff for transient failures (network errors, 5xx, 429) when appropriate.

## 5. Configuration & Deployment-Dependent Values

A **deployment-dependent value** is one that changes when the same code runs somewhere else: CORS origins and allowed hosts, service base URLs, host ports, database and broker URLs, external hostnames. They are not credentials — Section 2's rule about secrets is a different rule with a different reason — and they are the values that decide whether a scaffold can be deployed twice.

**The invariant.** Within one settings module, deployment-dependent values are configured the same way: if one reads the environment, every value that varies by environment does, with a documented default.

**The worked example is measured, not imagined.** A generated settings class held these two lines:

```python
database_url: str | None = field(default_factory=lambda: os.environ.get("DATABASE_URL"))
cors_origins: tuple[str, ...] = DEFAULT_CORS_ORIGINS   # frozen constant, no env read
```

Two settings, one class, both deployment-dependent. One reads the environment; the other cannot be changed without editing source. Moving the frontend from host port 5173 to 5183 so the stack could coexist with another local project left `DEFAULT_CORS_ORIGINS` naming 5173, and the browser then blocked every call from the frontend origin to the backend.

**Why this rule is worth a section of its own: the failure is invisible to every test you would reach for.** CORS is enforced by the browser and by nothing else. In the measured case `curl` against the backend was fine, 9 backend unit and integration tests passed, 7 frontend unit tests passed, and the E2E specs failed as `page.waitForResponse: Test timeout of 30000ms exceeded` with the word CORS nowhere in the output. Mixed content and cookie-domain mismatches fail the same way. **An unexplained E2E timeout on a call that works under `curl` is an origin question before it is a network question.**

Four rules follow from it:

- **Never widen a default to a list of likely values.** Adding 5173, 5183 and 5273 to the origin list trades a loud failure for a silent one: the next port anyone picks is still wrong, and now nothing says so.
- **One value, one source, across generated files too.** A host port that appears in both a generated CI workflow and the compose file that publishes it has two sources. Derive it from the one that owns it — the workflow resolves the port from the compose file at run time, or declares the service and its port in the same file. **A comment instructing a human to keep the two in step is not a mechanism**, and the one measured instance of that comment went red in CI the day the ports moved.
- **A test that asserts the fallback is not coverage of the wiring.** A frontend API client that hardcodes a fallback backend port, beside a unit test asserting that same constant, stays green while the application is broken in the browser. Assert the resolution, not the literal.
- **Check it rather than eyeballing it.** `bash ${CLAUDE_PLUGIN_ROOT}/hooks/lib/config-consistency.sh settings <file>` reports a module that mixes the two styles, and `... ports <repo-root>` reports a host port a generated workflow names that the compose file does not publish. Both exit 1 on a violation, 0 when consistent or when there is nothing to compare, and **2 when they cannot check, which is never a pass.** The check fails open — it reports only what it can establish from the text — so a clean run is not proof of a deployable module and the review check below is the authority.
