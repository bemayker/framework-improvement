# Run statistics, TEST-07

Generated 2026-09-03 15:38 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 3. A non-zero count means turns are missing from the per-step figures below.

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-09-02; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `<synthetic>`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to `MODEL_WINDOWS` in hooks/stats-collect.sh once you have checked it.

**Degraded:** 3 subagent transcript(s) could not be attributed to any work item, so their turns are missing from every per-step figure.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6.1 | Plan | 6m01s | 22 | 56 | 2.8 | 8 | 3.4K | 163.4K | 208.1K | 0 | 0.835 | claude-fable-5-1 | 2/4/14 | 5.50/3.00/2.36 |  |
| 6.2 | Plan self-approval | 2m53s | 10 | 23 | 2.88 | 8 | 3.3K | 154.5K | 184.9K | 0 | 0.786 | claude-opus-5 | 2/0/6 | 7.00/n/a/1.50 | model!=marker |
| 6.3 | Branch and worktree | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.4 | Build | 8m04s | 34 | 74 | 2.39 | 11 | 4.3K | 172.6K | 199.3K | 1 | 0.916 | claude-opus-5 | 3/1/27 | 8.33/5.00/1.63 |  |
| 6.5 | Self-review and refactor gate | 1h54m | 30 | 89 | 4.05 | 10 | 3.6K | 128.5K | 183.6K | 5 | 0.825 | claude-opus-5 | 12/0/10 | 6.17/n/a/1.50 |  |
| 6.6 | Push and open the PR as a draft | 10m35s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.7 | CI monitoring, failure fixing, and the handover | 6m24s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.8 | Review-comment loop | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 6.9 | Merge decision | 3m14s | 7 | 18 | 3.0 | 6 | 1.6K | 126.0K | 149.4K | 0 | 0.724 | claude-fable-5-1 | 0/0/5 | n/a/n/a/2.40 |  |
| 6.10 | Post-merge | 1m21s | 5 | 9 | 1.8 | 5 | 443 | 142.5K | 146.6K | 0 | 0.856 | claude-fable-5-1 | 0/0/2 | n/a/n/a/1.00 |  |
| **run total** |  | 2h32m | 108 | 269 | 2.92 | 11 | 16.6K |  | 208.1K |  | 0.852 | claude-opus-5 | 19/5/64 | 6.53/3.40/1.80 |  |

Wall is this run's last step end minus its first step start; steps sum to 2h32m.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a1a329d5ce7995a7f | mayker-dev:planner | deliver | 6.1 | 7 | 15 | 2.5 | 0/1/5 | n/a/2.00/2.60 | 1.1K | 167.8K | 208.1K | 0.8 | claude-fable-5-1 |  |
| agent-a22023fb26b2a789c | mayker-dev:builder | deliver | 6.1,6.2 | 14 | 29 | 2.23 | 2/3/8 | 5.50/3.33/1.00 | 2.1K | 172.2K | 184.9K | 0.923 | claude-opus-5 |  |
| agent-a22decb594b76e7c4 | mayker-dev:reviewer | deliver | 6.5 | 6 | 28 | 5.6 | 5/0/0 | 5.60/n/a/n/a | 17 | 140.3K | 174.0K | 0.793 | claude-opus-5 |  |
| agent-a40929839425cdd77 | mayker-dev:orchestrator | deliver | 6.2 | 4 | 12 | 4.0 | 1/0/2 | 8.00/n/a/2.00 | 1.6K | 143.5K | 171.7K | 0.678 | claude-fable-5-1 |  |
| agent-a4adaaa6aaeb539c8 | mayker-dev:builder | deliver | 6.5 | 4 | 18 | 6.0 | 2/0/1 | 7.00/n/a/4.00 | 7 | 99.6K | 164.7K | 0.587 | claude-opus-5 |  |
| agent-a4d3a42f6f933bf65 | unresolved | deliver | 6.5 | 1 | 0 | n/a | 0/0/0 | n/a/n/a/n/a | 0 | 0 | 0 | n/a | <synthetic> |  |
| agent-a59f8506068eb7d90 | mayker-dev:orchestrator | deliver | 6.9 | 6 | 14 | 2.8 | 0/0/4 | n/a/n/a/2.00 | 1.5K | 133.6K | 149.4K | 0.768 | claude-fable-5-1 |  |
| agent-a788014a8a305274a | mayker-dev:reviewer | deliver | 6.5 | 5 | 26 | 6.5 | 4/0/0 | 6.50/n/a/n/a | 765 | 133.8K | 168.0K | 0.755 | claude-opus-5 |  |
| agent-a7b869d9189ce70d1 | unresolved | deliver | 6.5 | 1 | 0 | n/a | 0/0/0 | n/a/n/a/n/a | 0 | 0 | 0 | n/a | <synthetic> |  |
| agent-a8962f9962a19758e | mayker-dev:builder | deliver | 6.2,6.4 | 15 | 22 | 1.57 | 1/0/13 | 6.00/n/a/1.23 | 1.5K | 180.0K | 199.3K | 0.938 | claude-opus-5 |  |
| agent-a9ebe69a031616c16 | mayker-dev:builder | deliver | 6.4,6.5 | 8 | 17 | 2.43 | 1/0/6 | 8.00/n/a/1.50 | 1.3K | 165.8K | 183.6K | 0.882 | claude-opus-5 |  |
| agent-ac226e81c2f9f96e4 | mayker-dev:builder | deliver | 6.5 | 11 | 17 | 1.7 | 1/0/9 | 6.00/n/a/1.22 | 1.6K | 160.2K | 174.2K | 0.902 | claude-opus-5 |  |
| agent-adbc699d8a8b1a3ed | mayker-dev:orchestrator | deliver | 6.9,6.10 | 6 | 13 | 2.17 | 0/0/3 | n/a/n/a/2.00 | 446 | 132.2K | 146.6K | 0.798 | claude-fable-5-1 |  |
| agent-adc8fe4aa5d66a4c5 | mayker-dev:builder | deliver | 6.4 | 8 | 26 | 3.71 | 1/1/5 | 6.00/5.00/3.00 | 1.5K | 167.0K | 189.6K | 0.877 | claude-opus-5 |  |
| agent-ae1eb57a760f95746 | unresolved | deliver | 6.5 | 1 | 0 | n/a | 0/0/0 | n/a/n/a/n/a | 0 | 0 | 0 | n/a | <synthetic> |  |
| agent-aeea9d591601de667 | mayker-dev:builder | deliver | 6.4 | 7 | 18 | 3.0 | 1/0/5 | 11.00/n/a/1.40 | 1.3K | 158.1K | 174.7K | 0.866 | claude-opus-5 |  |
| agent-af11785d384c6ac19 | mayker-dev:orchestrator | deliver | 6.1 | 4 | 14 | 4.67 | 0/0/3 | n/a/n/a/4.67 | 1.9K | 140.2K | 166.5K | 0.689 | claude-fable-5-1 |  |

**17 dispatch(es)** (mayker-dev:builder 7, mayker-dev:orchestrator 4, mayker-dev:planner 1, mayker-dev:reviewer 2, unresolved 3): median ctx max 171.7K, peak 208.1K, 0 above the auto threshold (80% of the serving model's window). Distribution: 0, 0, 0, 146.6K, 149.4K, 164.7K, 166.5K, 168.0K, 171.7K, 174.0K, 174.2K, 174.7K, 183.6K, 184.9K, 189.6K, 199.3K, 208.1K.

**All runs:** 1 run(s), wall 2h32m (sum of per-run walls, idle time between runs excluded), 108 turns, 269 tool calls, 16.6K output tokens, cache hit 0.852.

Turn classes across every bucket, read / edit / exec: 19/5/64 turns, 6.53/3.40/1.80 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.
