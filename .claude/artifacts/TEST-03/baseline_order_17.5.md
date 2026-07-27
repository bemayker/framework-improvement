# After-order-17.5 baseline, TEST-03 (corrected attribution)

Recorded 2026-07-27 on mayker-dev **v0.3.28**, sandbox `framework-improvement`, work item **TEST-03**.
Gates 19 and 20 must re-run **the same item and the same plan** and compare against this file.

Source transcript (frozen copy, because the shipped collector overwrites this item's
`stats_summary.*` on every later session in the project):

```
~/mayker-baselines/order-17.5-TEST-03/transcript.jsonl   (+ subagents/agent-*.jsonl)
original: ~/.claude/projects/-Users-florianserneels-Documents-ai-development-framework-improvement/3cb56cd4-18a8-418e-9633-eed14207ab48.jsonl
```

`stats_summary.md` as the shipped collector wrote it is committed next to this file, but its
main-session step rows all read 0 turns: the collector drops main-session turns whenever a second
.claude/artifacts/<item>/ directory exists. The tables below are the corrected attribution,
produced by `baseline.py` (frozen alongside the transcript). Numbers here are authoritative.


### Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Cache hit | Observed model |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m12s | 1 | 1 | 1.0 | 1 | 630 | 168.0K | 168.0K | 0.991 | claude-opus-5 |
| 1 | MCP Verification | 0m27s | 3 | 3 | 1.0 | 1 | 1.4K | 169.6K | 170.2K | 0.996 | claude-opus-5 |
| 2 | Dependency Check | 0m18s | 1 | 1 | 1.0 | 1 | 969 | 170.8K | 170.8K | 0.996 | claude-opus-5 |
| 3 | Fetch Feature Details | 0m09s | 1 | 1 | 1.0 | 1 | 313 | 172.3K | 172.3K | 0.991 | claude-opus-5 |
| 4 | Update Status Planning | 0m07s | 1 | 1 | 1.0 | 1 | 336 | 172.6K | 172.6K | 0.998 | claude-opus-5 |
| 5 | Create Branch | 0m18s | 2 | 2 | 1.0 | 1 | 938 | 173.2K | 173.3K | 0.998 | claude-opus-5 |
| 6 | Read References | 3m04s | 4 | 8 | 2.0 | 3 | 14 | 70.8K | 83.3K | 0.907 | claude-opus-5 |
| 7 | Detect Scaffold Requirement | 0m08s | 1 | 1 | 1.0 | 1 | 3 | 93.9K | 93.9K | 0.887 | claude-opus-5 |
| 8 | Generate Architect Plan | 1m53s | 2 | 2 | 1.0 | 1 | 252 | 98.8K | 103.3K | 0.952 | claude-opus-5 |
| 9 | Generate Shared Risk Analysis | 0m36s | 2 | 2 | 1.0 | 1 | 2.6K | 104.8K | 106.1K | 0.987 | claude-opus-5 |
| 10 | Commit and Push | 0m36s | 4 | 4 | 1.0 | 1 | 1.7K | 180.6K | 181.7K | 0.996 | claude-opus-5 |
| 11 | Create Draft PR | 0m33s | 2 | 2 | 1.0 | 1 | 2.2K | 183.7K | 184.6K | 0.992 | claude-opus-5 |
| 12 | Update Status Plan Review | 0m09s | 1 | 1 | 1.0 | 1 | 458 | 185.0K | 185.0K | 0.998 | claude-opus-5 |
| 13 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | 0 | n/a | n/a |
| **total** |  | 9m37s | 25 | 29 | 1.16 | 3 | 11.8K | 143.9K | 185.0K | 0.983 |  |

Wall 9m37s; steps sum 8m30s; idle inside the run 1m07s = 11.6%

### Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Cache hit | Observed model |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m27s | 1 | 1 | 1.0 | 1 | 1.7K | 216.5K | 216.5K | 0.996 | claude-opus-5 |
| 1 | MCP Verification | 0m08s | 1 | 1 | 1.0 | 1 | 529 | 218.3K | 218.3K | 0.992 | claude-opus-5 |
| 2 | Dependency Check | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | 0 | n/a | n/a |
| 3 | Status and Plan Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | 0 | n/a | n/a |
| 4 | Branch Setup | 0m11s | 1 | 1 | 1.0 | 1 | 575 | 219.0K | 219.0K | 0.997 | claude-opus-5 |
| 5 | Update Status In Progress | 0m09s | 1 | 1 | 1.0 | 1 | 456 | 219.6K | 219.6K | 0.997 | claude-opus-5 |
| 6 | Read the Plan | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | 0 | n/a | n/a |
| 8 | Phase A, Frontend Implementation | 2m43s | 14 | 22 | 1.57 | 3 | 339 | 107.3K | 116.7K | 0.986 | claude-sonnet-5 |
| 9 | Phase B, Backend Implementation | 4m39s | 31 | 38 | 1.23 | 5 | 1.7K | 133.3K | 145.1K | 0.993 | claude-sonnet-5 |
| 10 | Phase C, Integration | 0m24s | 2 | 2 | 1.0 | 1 | 8 | 145.9K | 146.5K | 0.995 | claude-sonnet-5 |
| 11 | Phase D, E2E Test Generation | 3m29s | 19 | 19 | 1.0 | 1 | 529 | 154.3K | 161.4K | 0.995 | claude-sonnet-5 |
| 12 | Phase E, Self-Review | 10m10s | 43 | 77 | 1.88 | 10 | 6.6K | 82.5K | 235.1K | 0.948 | claude-sonnet-5 |
| 13 | Phase F, Refactor Gate | 4m20s | 21 | 24 | 1.14 | 2 | 587 | 114.4K | 125.6K | 0.989 | claude-sonnet-5 |
| 14 | Phase G, UAT Generation | 1m06s | 8 | 9 | 1.12 | 2 | 333 | 130.3K | 133.6K | 0.992 | claude-sonnet-5 |
| 15 | Documentation Check | 0m38s | 6 | 7 | 1.17 | 2 | 463 | 136.5K | 138.0K | 0.995 | claude-sonnet-5 |
| 16 | Phase H, Artifact Re-check | 3m07s | 14 | 24 | 1.85 | 5 | 2.6K | 103.8K | 245.2K | 0.93 | claude-sonnet-5 |
| 17 | Push | 1m59s | 10 | 10 | 1.0 | 1 | 5.9K | 250.7K | 253.3K | 0.997 | claude-opus-5 |
| 18 | CI Watch | 11m07s | 38 | 39 | 1.05 | 2 | 24.0K | 162.0K | 291.1K | 0.981 | claude-sonnet-5 |
| 19 | Handover | 0m20s | 2 | 2 | 1.0 | 1 | 736 | 294.8K | 295.0K | 0.993 | claude-opus-5 |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | 0 | n/a | n/a |
| **total** |  | 49m58s | 212 | 277 | 1.33 | 10 | 47.1K | 133.3K | 295.0K | 0.981 |  |

Wall 49m58s; steps sum 44m57s; idle inside the run 5m01s = 10.0%

### Overlap check (order-19 gate)
overlapping step windows: none

### Subagent attribution
  agent-a380c7958d36806e4.jsonl: TEST-03
  agent-a942d6c8be0388e49.jsonl: TEST-03
  agent-aafa63767876a89c9.jsonl: TEST-03
  agent-ac57e5bfa081aa758.jsonl: TEST-03
  agent-ae019d9d7d7016c2c.jsonl: TEST-03
  agent-af01079c88abd1ba6.jsonl: TEST-03
  agent-afe215d7a8788dc02.jsonl: TEST-03

turns outside every step window: 70

## Per-dispatch context (what MDF-004 is graded on)

| Dispatch | Turns | Tool calls | Tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Observed model |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| planner (plan Sections 6-9) | 12 | 18 | 1.64 | 4.5K | 82.7K | 107.3K | 0.892 | claude-opus-5 |
| builder #1 (Phases A-D) | 75 | 105 | 1.42 | 4.7K | 132.2K | 163.3K | 0.984 | claude-sonnet-5 |
| reviewer (Phase E) | 7 | 37 | 6.17 | 0.0K | 63.7K | 87.7K | 0.803 | claude-sonnet-5 |
| builder #2 (Phase E fix round) | 33 | 37 | 1.16 | 1.6K | 73.0K | 87.3K | 0.964 | claude-sonnet-5 |
| builder #3 (Phases F, G, docs) | 51 | 66 | 1.32 | 1.5K | 115.0K | 141.3K | 0.977 | claude-sonnet-5 |
| reviewer (Phase H) | 12 | 22 | 2.0 | 0.4K | 80.5K | 95.7K | 0.901 | claude-sonnet-5 |
| builder #4 (CI fix) | 21 | 20 | 1.0 | 1.5K | 71.6K | 81.8K | 0.946 | claude-sonnet-5 |
| **main session** (whole gate session) | 93 | 113 | 1.22 | 73.5K | 197.4K | 296.9K | 0.984 | claude-opus-5 |

per-dispatch ctx_max (K): 81.8, 87.3, 87.7, 95.7, 107.3, 141.3, 163.3
median 95.7K | max 163.3K | dispatches at or above 200K: **0 of 7**

## Correctness invariants (for the order-19 gate)

- `review_scope.md` sha256: `24e3c2ccc242b0dd9c4336cdcf05f26026d3817d5efab753ceb028b691d40fe5`
- overlapping step windows in `stats.jsonl`: **none**
- subagent attribution: 7 of 7 attributed to TEST-03, 0 unattributed
- one commit per executed phase (Phase C executed as a verified no-op and correctly made none):

```
plan(TEST-03): architect plan for simple note form
chore(TEST-03): approve architect plan, ready for build
feat(TEST-03): implement frontend components
feat(TEST-03): implement backend
test(TEST-03): add E2E test specs
fix(TEST-03): address self-review findings
refactor(TEST-03): code quality cleanup
test(TEST-03): add UAT scenarios and manual script
chore(TEST-03): update documentation
chore(TEST-03): record refactor gate, UAT generation, and documentation check statistics
chore(TEST-03): record review scope manifests and run statistics
fix(TEST-03): stop the client fixture depending on ambient DATABASE_URL
```
