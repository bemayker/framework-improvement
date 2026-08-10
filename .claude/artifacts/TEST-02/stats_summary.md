# Run statistics, TEST-02

Generated 2026-08-10 15:44 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m24s | 1 | 4 | 4.0 | 4 | 1.4K | 97.6K | 97.6K | 0 | 0.911 | claude-fable-5 | 0/0/1 | n/a/n/a/4.00 |  |
| 1 | MCP Verification | 0m58s | 4 | 5 | 1.25 | 2 | 3.3K | 105.7K | 106.8K | 0 | 0.978 | claude-fable-5 | 0/1/0 | n/a/2.00/n/a |  |
| **run total** |  | 1m22s | 5 | 9 | 1.8 | 4 | 4.8K |  | 106.8K |  | 0.966 | claude-fable-5 | 0/1/1 | n/a/2.00/4.00 |  |

Wall is this run's last step end minus its first step start; steps sum to 1m22s.

**All runs:** 1 run(s), wall 1m22s (sum of per-run walls, idle time between runs excluded), 9 turns, 17 tool calls, 8.6K output tokens, cache hit 0.876.

Turn classes across every bucket, read / edit / exec: 1/1/3 turns, 1.00/2.00/3.67 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

4 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 1/0/2).
