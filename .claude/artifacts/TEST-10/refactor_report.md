# Refactor report: TEST-10

Gate result: 1 improvements applied (12 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md and .claude/artifacts/TEST-10/uat_script.md | Step 1 ran `up -d --build`, which rebuilds with compose's default `BUILD_COMMIT=unknown` and discards the build-arg image, so steps 2 and 3 could not match (review RECOMMENDED, mandatory) | Other (review finding) | RECOMMENDED | Dropped `--build` from `up -d`; copies kept byte-identical. Verified: `docker compose build --build-arg BUILD_COMMIT=62be9fd... backend` then `up -d` returned `{"version":"0.1.0","commit":"62be9fd76e4b"}` from /api/version. Stack taken down. |

Not applied (OPTIONAL, known improvement): e2e/tests/TEST-08_footer_app_version.spec.ts line 18 puts the unescaped version into `new RegExp(...)`.

Tests: no code changed (documentation only), so no suite re-run was required.
