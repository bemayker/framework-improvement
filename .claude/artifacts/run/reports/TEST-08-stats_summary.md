# Run statistics, TEST-08

Generated 2026-09-03 15:41 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-09-02; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `<synthetic>`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to `MODEL_WINDOWS` in hooks/stats-collect.sh once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6.2 | Plan self-approval | 3m28s | 4 | 14 | 4.67 | 8 | 1.9K | 140.2K | 166.5K | 0 | 0.689 | claude-fable-5-1 | 0/0/3 | n/a/n/a/4.67 |  |
| 6.3 | Branch and worktree | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.4 | Build | 14m11s | 37 | 68 | 2.0 | 8 | 4.8K | 174.0K | 199.3K | 2 | 0.921 | claude-opus-5 | 4/3/27 | 6.25/3.33/1.22 |  |
| 6.5 | Self-review and refactor gate | 1h52m | 25 | 70 | 3.68 | 8 | 816 | 129.7K | 180.8K | 5 | 0.855 | claude-opus-5 | 6/2/11 | 6.67/3.00/2.18 |  |
| 6.6 | Push and open the PR as a draft | 16m10s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.7 | CI monitoring, failure fixing, and the handover | 3m54s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.8 | Review-comment loop | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.9 | Merge decision | 2m53s | 7 | 13 | 2.17 | 5 | 1.8K | 134.4K | 147.9K | 0 | 0.829 | claude-fable-5-1 | 0/0/3 | n/a/n/a/2.00 |  |
| 6.10 | Post-merge | 1m10s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 2h34m | 73 | 165 | 2.66 | 8 | 9.4K |  | 199.3K |  | 0.882 | claude-opus-5 | 10/5/44 | 6.50/3.20/1.75 |  |

Wall is this run's last step end minus its first step start; steps sum to 2h34m.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a22023fb26b2a789c | mayker-dev:builder | deliver | 6.4 | 14 | 29 | 2.23 | 2/3/8 | 5.50/3.33/1.00 | 2.1K | 172.2K | 184.9K | 0.923 | claude-opus-5 |  |
| agent-a33a9781692091ae1 | unresolved | deliver | 6.5 | 1 | 0 | n/a | 0/0/0 | n/a/n/a/n/a | 0 | 0 | 0 | n/a | <synthetic> |  |
| agent-a3e9b5b4dcd6e8ef2 | mayker-dev:builder | deliver | 6.5 | 6 | 13 | 2.6 | 0/0/5 | n/a/n/a/2.60 | 15 | 157.8K | 180.8K | 0.838 | claude-opus-5 |  |
| agent-a5d870b1fb974c02a | unresolved | deliver | 6.5 | 1 | 0 | n/a | 0/0/0 | n/a/n/a/n/a | 0 | 0 | 0 | n/a | <synthetic> |  |
| agent-a788014a8a305274a | mayker-dev:reviewer | deliver | 6.5 | 5 | 26 | 6.5 | 4/0/0 | 6.50/n/a/n/a | 765 | 133.8K | 168.0K | 0.755 | claude-opus-5 |  |
| agent-a8962f9962a19758e | mayker-dev:builder | deliver | 6.4 | 15 | 22 | 1.57 | 1/0/13 | 6.00/n/a/1.23 | 1.5K | 180.0K | 199.3K | 0.938 | claude-opus-5 |  |
| agent-a9453ad9376c0bbcd | unresolved | deliver | 6.5 | 1 | 0 | n/a | 0/0/0 | n/a/n/a/n/a | 0 | 0 | 0 | n/a | <synthetic> |  |
| agent-a9ebe69a031616c16 | mayker-dev:builder | deliver | 6.4 | 8 | 17 | 2.43 | 1/0/6 | 8.00/n/a/1.50 | 1.3K | 165.8K | 183.6K | 0.882 | claude-opus-5 |  |
| agent-ac8b6a1b718270b46 | mayker-dev:builder | deliver | 6.5 | 11 | 31 | 3.1 | 2/2/6 | 7.00/3.00/1.83 | 36 | 147.9K | 180.0K | 0.906 | claude-opus-5 |  |
| agent-adbc699d8a8b1a3ed | mayker-dev:orchestrator | deliver | 6.9 | 7 | 13 | 2.17 | 0/0/3 | n/a/n/a/2.00 | 1.8K | 134.4K | 147.9K | 0.829 | claude-fable-5-1 |  |
| agent-af11785d384c6ac19 | mayker-dev:orchestrator | deliver | 6.2 | 4 | 14 | 4.67 | 0/0/3 | n/a/n/a/4.67 | 1.9K | 140.2K | 166.5K | 0.689 | claude-fable-5-1 |  |

**11 dispatch(es)** (mayker-dev:builder 5, mayker-dev:orchestrator 2, mayker-dev:reviewer 1, unresolved 3): median ctx max 168.0K, peak 199.3K, 0 above the auto threshold (80% of the serving model's window). Distribution: 0, 0, 0, 147.9K, 166.5K, 168.0K, 180.0K, 180.8K, 183.6K, 184.9K, 199.3K.

**All runs:** 1 run(s), wall 2h34m (sum of per-run walls, idle time between runs excluded), 73 turns, 165 tool calls, 9.4K output tokens, cache hit 0.882.

Turn classes across every bucket, read / edit / exec: 10/5/44 turns, 6.50/3.20/1.75 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.
