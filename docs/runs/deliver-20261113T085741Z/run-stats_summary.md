# Run statistics, run

Generated 2026-11-13 09:42 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 45 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 44m24s | 549 | 1053 | 2.19 | 13 | 398.9K |  | 490.3K |  | 0.962 | claude-opus-5-5 | 69/78/290 (exec 77% of wall) | 4.36/2.09/1.72 |  |

Wall is this run's last step end minus its first step start; steps sum to 44m23s.

Exec turns took 34m11s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

CI wait: 7m00s in `ci-poll.sh` calls; framework wall (wall less CI wait) 37m24s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a058a963573e54d23 | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 6.6K | 47.4K | 64.6K | 0.611 | claude-opus-5-5 |  |
| agent-a0974e58735f5999f | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 725 | 42.1K | 54.4K | 0.673 | claude-sonnet-5-5 |  |
| agent-a0d908ed2000d7601 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 6.3K | 47.7K | 66.2K | 0.603 | claude-opus-5-5 |  |
| agent-a128a4b0387bd7914 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 4.50/4.50/1.00 | 6.7K | 60.5K | 70.1K | 0.866 | claude-sonnet-5-5 |  |
| agent-a128cbe8f06e09a80 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 8.00/2.00/1.67 | 5.2K | 53.9K | 60.1K | 0.854 | claude-fable-5-2 |  |
| agent-a1bd5960ea8130040 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 3/2/4 | 1.67/1.50/1.50 | 6.6K | 55.2K | 62.5K | 0.911 | claude-sonnet-5-5 |  |
| agent-a26cac2413e5eaf0a | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 2.00/1.50/1.20 | 6.9K | 55.1K | 62.2K | 0.911 | claude-sonnet-5-5 |  |
| agent-a278b35053dfa2229 | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 4.9K | 45.4K | 60.9K | 0.553 | claude-opus-5-5 |  |
| agent-a2c4fc9d516c7a43e | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 2.8K | 51.4K | 56.4K | 0.86 | claude-sonnet-5-5 |  |
| agent-a333b61c888a6554c | mayker-dev:builder | deliver | 5 | 13 | 26 | 2.17 | 2/1/8 | 2.50/5.00/1.88 | 5.0K | 61.7K | 67.7K | 0.932 | claude-sonnet-5-5 |  |
| agent-a345eea646e1a5142 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 4.7K | 45.1K | 60.6K | 0.553 | claude-opus-5-5 |  |
| agent-a3533e6d51052050a | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 1/2/2 | 6.00/3.00/1.00 | 3.3K | 46.6K | 50.4K | 0.866 | claude-sonnet-5-5 |  |
| agent-a3c95c338ce72f1b3 | mayker-dev:orchestrator | deliver | 5 | 9 | 18 | 2.25 | 0/3/4 | n/a/1.33/2.25 | 6.2K | 78.4K | 92.4K | 0.889 | claude-fable-5-2 |  |
| agent-a403bc665b4f31b80 | mayker-dev:builder | deliver | 5 | 14 | 20 | 1.54 | 1/3/9 | 4.00/2.00/1.11 | 6.5K | 55.0K | 60.5K | 0.938 | claude-sonnet-5-5 |  |
| agent-a41fa37666f286176 | mayker-dev:planner | deliver | 5 | 13 | 37 | 3.08 | 0/2/9 | n/a/2.00/2.44 | 18.8K | 81.5K | 104.2K | 0.902 | claude-opus-5-5 |  |
| agent-a436c224de5d8f164 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 50.9K | 62.3K | 0.759 | claude-sonnet-5-5 |  |
| agent-a44176c13e060673c | mayker-dev:orchestrator | deliver | 5 | 5 | 16 | 4.0 | 0/1/3 | n/a/2.00/4.67 | 5.4K | 59.8K | 70.2K | 0.808 | claude-fable-5-2 |  |
| agent-a4d7396b255c86b44 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 4.00/2.00/2.00 | 3.0K | 43.0K | 47.5K | 0.779 | claude-fable-5-2 |  |
| agent-a5524bf822c77ebb5 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.00/1.50/1.25 | 5.4K | 53.3K | 59.7K | 0.903 | claude-sonnet-5-5 |  |
| agent-a5d3ef9c13e05f402 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 0/2/3 | n/a/2.00/2.67 | 9.2K | 86.2K | 108.7K | 0.82 | claude-fable-5-2 |  |
| agent-a6124fdf3291b3fec | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/1/3 | 4.50/8.00/1.67 | 6.7K | 59.2K | 70.1K | 0.831 | claude-sonnet-5-5 |  |
| agent-a6465f4dbb94c4bfc | mayker-dev:builder | deliver | 5 | 19 | 31 | 1.72 | 3/1/13 | 2.00/2.00/1.69 | 5.8K | 62.2K | 68.8K | 0.953 | claude-sonnet-5-5 |  |
| agent-a771ad5461ce78705 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 924 | 45.8K | 55.6K | 0.768 | claude-sonnet-5-5 |  |
| agent-a81a8f2428780a034 | mayker-dev:orchestrator | deliver | 5 | 5 | 18 | 4.5 | 0/1/3 | n/a/2.00/5.33 | 5.3K | 60.9K | 71.7K | 0.806 | claude-fable-5-2 |  |
| agent-a8ae84364d70331dd | mayker-dev:builder | deliver | 5 | 7 | 30 | 5.0 | 2/2/2 | 7.50/6.50/1.00 | 8.9K | 64.2K | 75.3K | 0.862 | claude-sonnet-5-5 |  |
| agent-a8d7f3184f5e61d2c | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 1.2K | 51.4K | 63.7K | 0.754 | claude-sonnet-5-5 |  |
| agent-a91294dd9408212fa | mayker-dev:builder | deliver | 5 | 8 | 19 | 2.71 | 2/2/3 | 4.00/4.00/1.00 | 7.0K | 59.6K | 68.1K | 0.885 | claude-sonnet-5-5 |  |
| agent-a92449545a243cf72 | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 1/1/4 | 4.00/3.00/1.25 | 5.6K | 53.7K | 60.7K | 0.838 | claude-fable-5-2 |  |
| agent-a944d9295ed94645b | mayker-dev:planner | deliver | 5 | 13 | 37 | 3.08 | 3/2/7 | 6.00/2.00/2.14 | 20.6K | 92.8K | 112.3K | 0.918 | claude-opus-5-5 |  |
| agent-aa26c2a56bbdac37a | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 1.1K | 52.4K | 68.0K | 0.738 | claude-sonnet-5-5 |  |
| agent-abedb625fbd5ac246 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 8.00/1.00/2.67 | 5.4K | 58.7K | 67.6K | 0.844 | claude-fable-5-2 |  |
| agent-ac8c4a95f7db8c41a | mayker-dev:planner | deliver | 5 | 9 | 28 | 3.5 | 1/1/6 | 6.00/2.00/3.33 | 11.5K | 72.6K | 88.6K | 0.884 | claude-opus-5-5 |  |
| agent-acb6ede7d63f7716c | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 2/1/1 | 5.50/1.00/1.00 | 2.7K | 52.9K | 60.3K | 0.822 | claude-sonnet-5-5 |  |
| agent-acd13fb8f4b50b1b5 | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.6 | 2/2/6 | 2.50/1.50/1.33 | 6.6K | 55.0K | 61.5K | 0.92 | claude-sonnet-5-5 |  |
| agent-ad14dd93ae6ee48f1 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/3/3 | 3.50/1.33/1.00 | 4.0K | 56.6K | 62.0K | 0.904 | claude-sonnet-5-5 |  |
| agent-ad1847fdf6bf6d137 | mayker-dev:planner | deliver | 5 | 14 | 34 | 2.62 | 1/2/9 | 6.00/1.50/2.11 | 18.7K | 86.0K | 107.5K | 0.922 | claude-opus-5-5 |  |
| agent-ae53d4d2a45371e05 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 6.6K | 51.5K | 65.1K | 0.73 | claude-opus-5-5 |  |
| agent-ae5e1605d41f87f6a | mayker-dev:planner | deliver | 5 | 11 | 26 | 2.6 | 1/3/5 | 8.00/1.33/2.20 | 12.1K | 71.7K | 83.8K | 0.894 | claude-opus-5-5 |  |
| agent-aed9a53a0d5fe8b2d | mayker-dev:orchestrator | deliver | 8 | 3 | 7 | 3.5 | 0/0/2 | n/a/n/a/3.50 | 7.0K | 53.4K | 62.2K | 0.699 | claude-fable-5-2 |  |
| agent-aefa0432562eb6977 | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.0 | 2/1/1 | 2.50/2.00/1.00 | 2.5K | 43.4K | 47.5K | 0.781 | claude-fable-5-2 |  |
| agent-af5e5e7d0240b09b9 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 1/2/2 | 5.00/3.50/1.00 | 4.7K | 53.6K | 61.0K | 0.81 | claude-sonnet-5-5 |  |
| agent-af95fe5f6eceb9804 | mayker-dev:builder | deliver | 5 | 14 | 31 | 2.38 | 1/1/11 | 1.00/3.00/2.45 | 7.4K | 63.7K | 71.8K | 0.934 | claude-sonnet-5-5 |  |
| agent-afe1bfd70f9d541fc | mayker-dev:orchestrator | deliver | 3 | 9 | 19 | 2.38 | 1/2/5 | 4.00/1.50/2.40 | 10.5K | 89.9K | 113.6K | 0.86 | claude-fable-5-2 |  |
| agent-aff44319d0d2c4ddc | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.00/2.00/1.25 | 4.3K | 52.2K | 58.4K | 0.892 | claude-sonnet-5-5 |  |
| agent-aff526dfeea42994d | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 0/1/3 | n/a/2.00/1.33 | 5.1K | 52.6K | 59.0K | 0.813 | claude-fable-5-2 |  |

**45 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 63.7K, peak 113.6K, 0 above the auto threshold (80% of the serving model's window). Distribution: 47.5K, 47.5K, 50.4K, 54.4K, 55.6K, 56.4K, 58.4K, 59.0K, 59.7K, 60.1K, 60.3K, 60.5K, 60.6K, 60.7K, 60.9K, 61.0K, 61.5K, 62.0K, 62.2K, 62.2K, 62.3K, 62.5K, 63.7K, 64.6K, 65.1K, 66.2K, 67.6K, 67.7K, 68.0K, 68.1K, 68.8K, 70.1K, 70.1K, 70.2K, 71.7K, 71.8K, 75.3K, 83.8K, 88.6K, 92.4K, 104.2K, 107.5K, 108.7K, 112.3K, 113.6K.

**All runs:** 1 run(s), wall 44m24s (sum of per-run walls, idle time between runs excluded), 549 turns, 1053 tool calls, 398.9K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 69/78/290 turns, 4.36/2.09/1.72 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 34m11s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

All runs: CI wait: 7m00s in `ci-poll.sh` calls; framework wall (wall less CI wait) 37m24s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
