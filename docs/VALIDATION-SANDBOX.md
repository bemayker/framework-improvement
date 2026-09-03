# What this repository is

This is the **validation sandbox** for the `mayker-dev` Claude Code plugin. It is not a product and it has no users. Its only purpose is to give the framework's lifecycle commands a real repository to run against, so that measured runs exercise `/init-project`, `/sync-project`, `/upgrade-project`, `/plan-feature`, `/build-feature`, `/fix` and `/deliver` end to end against real CI, a real tracker and real branch protection.

## What that means for anything you find here

The application is a small notes service (FastAPI backend, React frontend, PostgreSQL). Its features exist to be planned, built, reviewed and merged by the framework, not because anyone needs them. `TEST-01` through `TEST-08` are deliberately small and deliberately shaped to exercise particular paths: some are backend-only, some frontend-only, and some share a file on purpose so that the dependency graph has a serialisation edge to enforce.

So a defect in this application is usually uninteresting. A defect in how the framework *produced* the application is the reason this repository exists. Findings of the second kind belong in the `Mayker AI Development Framework` tracker as `MDF-` items, not here.

## Work items live in the tracker

Work Item Source is `hybrid`. Items `TEST-06` and later are tracker-resident in the ClickUp `Validation sandbox` list and carry no `docs/issues/` shadow file; earlier items have both. That mix is itself deliberate, because the two routes through the auto-Done pipeline differ and both need exercising.

## Branch protection is part of the experiment

`main` carries a ruleset applied by `/sync-project` Section P: a pull request is required, approving reviews are optional (0 required), `pr-tests` must report green, and force-push and deletion are blocked. The zero-review clause is not laxness. It is what keeps an unattended `/deliver` run able to merge, which is one of the things measured runs are here to measure.

## Measured runs

Run records, freezes and findings live in the `mayker-claude-framework` workspace, not in this repository: `docs/run-log.md` for the runs, `docs/implementation-playbook.md` for the governing procedure, and `~/mayker-baselines/` for the frozen artefacts. If you are reading this file while trying to work out why the repository is in an odd state, the run log is where the answer will be.
