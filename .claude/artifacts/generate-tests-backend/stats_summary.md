# Run statistics, generate-tests-backend

Generated 2026-07-31 12:54 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: generate-tests

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Load Context | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 2 | Resolve Scope | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Pre-Flight | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 4 | Create Branch | 0m24s | 1 | 1 | 1.0 | 1 | 1.5K | 479.2K | 479.2K | 0 | 0.996 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Inventory and Analyze | 0m23s | 2 | 2 | 1.0 | 1 | 1.6K | 481.6K | 482.2K | 0 | 0.997 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 | ctx>threshold |
| 6 | Generate Tests | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 7 | Run Tests | 1m09s | 4 | 4 | 1.0 | 1 | 3.9K | 485.0K | 487.1K | 0 | 0.997 | claude-opus-5 | 0/1/3 | n/a/1.00/1.00 | ctx>threshold |
| 8 | Commit | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 12 | Summary | 0m02s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 2m01s | 7 | 7 | 1.0 | 1 | 7.0K |  | 487.1K |  | 0.997 | claude-opus-5 | 0/2/5 | n/a/1.00/1.00 |  |

Wall is this run's last step end minus its first step start; steps sum to 2m01s.

7 turn(s) exceeded the 200,000-token context threshold.

**All runs:** 1 run(s), wall 2m01s (sum of per-run walls, idle time between runs excluded), 207 turns, 232 tool calls, 237.0K output tokens, cache hit 0.992.

Turn classes across every bucket, read / edit / exec: 10/8/143 turns, 1.10/1.12/1.20 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

200 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 10/6/138).
