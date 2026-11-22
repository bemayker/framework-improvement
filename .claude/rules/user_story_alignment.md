<!-- materialized-from: mayker-dev v0.3.519; do not edit, regenerate with /upgrade-project -->
<!--
  Universal standard. Loaded at launch from .claude/rules/ (always on). Do not edit per project.
  Feature alignment and anti-hallucination: scope containment, no gold plating,
  clarify ambiguity.
-->

# Feature Alignment & Anti-Hallucination Rules

> **Advice:** no check covers this standard; the reviewer grades it.

## 1. The Prime Directive

You are an execution engine, not a creative director. Your implementation must be strictly bounded by the work item's acceptance criteria, read from the issue tracker via MCP or, for `local`/`hybrid` source, from the item's `docs/issues/` file. **Do not invent features.**

## 2. Acceptance Criteria Analysis

Before generating a single line of code, the AI must parse the acceptance criteria:

1. List every criterion as a checkbox.
2. Verify if the current context provides enough information to satisfy each criterion.
3. If information is missing and cannot be inferred from the plan or `CLAUDE.md`, make a reasonable assumption, record it as a scope change (Section 4), and do not block the workflow.

## 3. Scope Containment (The "No Gold Plating" Rule)

- If the feature asks for a "Login Button", create a Login Button. Do NOT create a "Forgot Password" link unless explicitly requested.
- If the feature asks for an "API endpoint to list users", create the endpoint. Do NOT add pagination or sorting unless specified in the criteria or coding standards.
- Extra features introduce potential bugs and technical debt that were not asked for.

## 4. Handling Ambiguity

Assisted and autonomous runs decide the same way: make a reasonable assumption from `CLAUDE.md` and proceed. A scope change lands in the plan and an architecture change in an ADR, both through `hooks/lib/decision-record.sh`; the PR body's `## Decisions` block links them.

## 5. Definition of Done

A feature is considered implementation-complete when:

1. All acceptance criteria from the work item (tracker via MCP, or the local `docs/issues/` file) are met.
2. The code follows `coding_standards.md`.
3. Tests cover the happy path and relevant edge cases (per test toggles in `CLAUDE.md`).
4. The UI matches the design reference (if applicable, per `CLAUDE.md` Design Reference mode). **"Matches" means the exact values**, defined once in `coding_standards.md` Section 3.4 (the Fidelity Rule) and checked against the values the plan recorded, at review time, by `review_standards.md` Section 5 — never a visual impression of the design, and never a screenshot comparison.
5. No hardcoded credentials or secrets are present in the code.
6. The self-review checklist from `review_standards.md` passes.

## 6. Context Awareness

- Always check existing files before creating new ones to avoid duplicates.
- Read `CLAUDE.md` Architecture Notes to ensure the new feature fits the defined architecture.
- A conflict between the feature requirements and the architecture is an architecture change (Section 4).
