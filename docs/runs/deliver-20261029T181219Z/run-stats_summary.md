# Run statistics, run

Generated 2026-10-29 19:26 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 54 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 4m51s | 12 | 35 | 3.18 | 8 | 25.2K | 96.3K | 132.8K | 0 | 0.869 | claude-fable-5-1 | 1/2/7 | 4.00/2.50/3.57 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 4m51s | 12 | 35 | 3.18 | 8 | 25.2K | 96.3K | 132.8K | 0 | 0.869 | claude-fable-5-1 | 1/2/7 | 4.00/2.50/3.57 |  |
| 5 | Scheduler loop | 1h04m | 643 | 1286 | 2.32 | 15 | 499.2K | 157.3K | 517.1K | 0 | 0.963 | claude-opus-5-5 | 90/99/330 | 4.08/2.53/1.83 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at wave 2 boundary | 26m32s | 252 | 465 | 2.16 | 9 | 193.2K | 170.0K | 459.7K | 1 | 0.967 | claude-opus-5-5 | 34/38/128 | 4.06/2.39/1.73 |  |
| 8 | Final report | 4m29s | 9 | 13 | 1.86 | 4 | 29.5K | 166.8K | 534.6K | 0 | 0.937 | claude-fable-5-1 | 1/1/4 | 1.00/2.00/2.25 |  |
| **run total** |  | 1h14m | 664 | 1334 | 2.33 | 15 | 553.9K |  | 534.6K |  | 0.961 | claude-opus-5-5 | 92/102/341 (exec 65% of wall) | 4.04/2.52/1.87 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h14m.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 47m52s of round trip (command plus model time, ADR 0006 section 2): 65% of wall.

CI wait: 8m46s in `ci-poll.sh` calls; framework wall (wall less CI wait) 1h05m.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a05d1142e400d2f0f | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 1/1/4 | 1.00/2.00/2.00 | 4.2K | 52.9K | 61.0K | 0.871 | claude-sonnet-5-5 |  |
| agent-a06106215ae13a59a | mayker-dev:reviewer | deliver | 5 | 3 | 11 | 5.5 | 2/0/0 | 5.50/n/a/n/a | 3.3K | 42.0K | 52.3K | 0.584 | claude-opus-5-5 |  |
| agent-a09171d5e1b0ca323 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 1.0K | 41.5K | 45.7K | 0.74 | claude-sonnet-5-5 |  |
| agent-a0ecddc9bd85272df | mayker-dev:planner | deliver | 5 | 8 | 22 | 3.14 | 1/1/5 | 8.00/2.00/2.40 | 10.1K | 88.1K | 105.8K | 0.85 | claude-opus-5-5 |  |
| agent-a0fdeacb3c213df0d | mayker-dev:builder | deliver | 5 | 6 | 28 | 5.6 | 2/1/2 | 6.50/12.00/1.50 | 7.9K | 66.9K | 78.3K | 0.805 | claude-sonnet-5-5 |  |
| agent-a18fae3514668852f | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 4.50/2.00/2.00 | 7.0K | 65.4K | 76.2K | 0.838 | claude-fable-5-1 |  |
| agent-a1a6fbfd6771b7de1 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 5.9K | 52.0K | 66.6K | 0.725 | claude-opus-5-5 |  |
| agent-a1ff3759d7a67eac0 | mayker-dev:builder | deliver | 5 | 6 | 24 | 4.8 | 1/1/3 | 7.00/10.00/2.33 | 8.6K | 68.0K | 81.1K | 0.834 | claude-sonnet-5-5 |  |
| agent-a284e3340e339e9a5 | mayker-dev:planner | deliver | 5 | 15 | 40 | 2.86 | 2/3/8 | 3.50/1.00/2.50 | 27.9K | 120.7K | 151.2K | 0.924 | claude-opus-5-5 |  |
| agent-a2e67c85a6fd1249e | mayker-dev:orchestrator | deliver | 5 | 14 | 25 | 2.08 | 1/3/8 | 4.00/1.67/2.00 | 16.0K | 91.2K | 111.0K | 0.923 | claude-fable-5-1 |  |
| agent-a2f36c3f3ce914eee | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.33 | 2/1/3 | 4.50/1.00/1.33 | 6.4K | 69.7K | 79.4K | 0.857 | claude-fable-5-1 |  |
| agent-a3833092853601837 | mayker-dev:reviewer | deliver | 5 | 6 | 31 | 6.2 | 5/0/0 | 6.20/n/a/n/a | 9.2K | 61.7K | 76.9K | 0.817 | claude-opus-5-5 |  |
| agent-a3b7e27cbf55f43bb | mayker-dev:builder | deliver | 5 | 17 | 33 | 2.06 | 2/2/12 | 2.00/3.50/1.83 | 6.0K | 66.0K | 72.7K | 0.935 | claude-sonnet-5-5 |  |
| agent-a3f4a94208195ac43 | mayker-dev:planner | deliver | 5 | 13 | 31 | 2.58 | 2/2/8 | 5.50/1.50/2.12 | 16.8K | 93.8K | 112.9K | 0.918 | claude-opus-5-5 |  |
| agent-a40af41f0c25f4434 | mayker-dev:planner | deliver | 5 | 12 | 31 | 2.82 | 0/2/9 | n/a/1.00/3.22 | 12.5K | 110.0K | 130.6K | 0.911 | claude-opus-5-5 |  |
| agent-a45b3ec4e4cd0ac0a | mayker-dev:builder | deliver | 5 | 8 | 21 | 3.0 | 2/1/4 | 3.50/8.00/1.50 | 7.0K | 65.9K | 76.1K | 0.881 | claude-sonnet-5-5 |  |
| agent-a475929523ddfa8f3 | mayker-dev:builder | deliver | 5 | 16 | 29 | 1.93 | 2/1/11 | 3.00/3.00/1.73 | 7.8K | 71.5K | 80.6K | 0.941 | claude-sonnet-5-5 |  |
| agent-a4b7d4f29bc04a07f | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 0/1/6 | n/a/1.00/3.17 | 6.8K | 60.2K | 69.8K | 0.855 | claude-fable-5-1 |  |
| agent-a4dd202eeff15a11b | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 6.00/2.00/2.33 | 4.6K | 67.5K | 78.5K | 0.837 | claude-fable-5-1 |  |
| agent-a4ee35445833655de | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 9.00/2.00/2.00 | 6.5K | 63.1K | 72.0K | 0.843 | claude-fable-5-1 |  |
| agent-a53b638bfd90725c5 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 1/1/5 | 2.00/2.00/1.60 | 5.2K | 49.1K | 57.6K | 0.887 | claude-sonnet-5-5 |  |
| agent-a566b1bd4e9f8596e | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 1.00/n/a/3.00 | 756 | 40.0K | 47.7K | 0.714 | claude-sonnet-5-5 |  |
| agent-a6597e2207a52ff3e | mayker-dev:builder | deliver | 5 | 5 | 5 | 1.25 | 1/0/3 | 1.00/n/a/1.33 | 1.3K | 39.1K | 41.8K | 0.854 | claude-sonnet-5-5 |  |
| agent-a6b9edd7638c1d62e | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.2K | 53.3K | 61.2K | 0.82 | claude-sonnet-5-5 |  |
| agent-a77abe8aad157a0da | mayker-dev:builder | deliver | 5 | 9 | 18 | 2.25 | 2/2/4 | 3.50/3.50/1.00 | 6.8K | 59.1K | 66.3K | 0.875 | claude-sonnet-5-5 |  |
| agent-a789752dd4ab82bce | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 7.00/1.00/1.67 | 4.5K | 63.9K | 72.9K | 0.809 | claude-fable-5-1 |  |
| agent-a7f97b434cf79b71c | mayker-dev:reviewer | deliver | 5 | 5 | 20 | 5.0 | 4/0/0 | 5.00/n/a/n/a | 4.5K | 50.7K | 60.3K | 0.762 | claude-opus-5-5 |  |
| agent-a803239b5913fd1a9 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.00/2.00/1.50 | 5.0K | 53.3K | 60.6K | 0.889 | claude-sonnet-5-5 |  |
| agent-a82909956522999c6 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 5.00/1.00/1.67 | 6.2K | 65.3K | 73.9K | 0.838 | claude-fable-5-1 |  |
| agent-a83811e04b9b5caa6 | mayker-dev:orchestrator | deliver | 5 | 6 | 18 | 3.6 | 1/1/3 | 8.00/1.00/3.00 | 5.4K | 62.1K | 69.9K | 0.846 | claude-fable-5-1 |  |
| agent-a844729f50e8968bf | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 4.00/2.00/1.00 | 2.5K | 45.9K | 50.1K | 0.866 | claude-sonnet-5-5 |  |
| agent-a8a24d519a2b15ee8 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 1/0/2 | 1.00/n/a/2.00 | 1.1K | 41.7K | 47.7K | 0.794 | claude-sonnet-5-5 |  |
| agent-a8e7f48b627b4c9ec | mayker-dev:planner | deliver | 5 | 13 | 37 | 3.08 | 2/2/7 | 5.00/1.50/2.00 | 15.0K | 107.2K | 130.1K | 0.907 | claude-opus-5-5 |  |
| agent-a96387591468596bb | mayker-dev:builder | deliver | 5 | 13 | 26 | 2.17 | 1/1/9 | 3.00/3.00/2.11 | 5.2K | 67.3K | 75.6K | 0.929 | claude-sonnet-5-5 |  |
| agent-a9877ef72a75496c8 | mayker-dev:builder | deliver | 5 | 35 | 47 | 1.42 | 5/2/26 | 1.40/1.00/1.46 | 9.6K | 51.2K | 61.1K | 0.973 | claude-sonnet-5-5 |  |
| agent-a994d0141ed78dc78 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 4.00/5.00/1.00 | 6.0K | 60.2K | 69.6K | 0.844 | claude-sonnet-5-5 |  |
| agent-a9e82769b33e61c25 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.2K | 45.3K | 61.2K | 0.618 | claude-opus-5-5 |  |
| agent-aad7c0797aa8cb397 | mayker-dev:reviewer | deliver | 5 | 5 | 19 | 4.75 | 4/0/0 | 4.75/n/a/n/a | 6.2K | 55.3K | 70.8K | 0.744 | claude-opus-5-5 |  |
| agent-ab52a18603e1417a4 | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 1/1/5 | 3.00/2.00/2.00 | 4.9K | 54.2K | 62.4K | 0.887 | claude-sonnet-5-5 |  |
| agent-ab7312fd69ba4bc10 | mayker-dev:planner | deliver | 5 | 10 | 24 | 2.67 | 0/1/7 | n/a/2.00/2.29 | 9.6K | 91.0K | 107.9K | 0.881 | claude-opus-5-5 |  |
| agent-ab7f3262fee415cfe | mayker-dev:orchestrator | deliver | 8 | 7 | 10 | 2.0 | 1/0/4 | 1.00/n/a/2.25 | 19.3K | 63.3K | 77.0K | 0.826 | claude-fable-5-1 |  |
| agent-aba10a02c0a74dcc2 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 0/0/2 | n/a/n/a/2.50 | 853 | 37.5K | 39.6K | 0.767 | claude-sonnet-5-5 |  |
| agent-aba44a6f5bc5c2539 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 7.00/1.00/1.50 | 6.0K | 65.6K | 74.8K | 0.865 | claude-fable-5-1 |  |
| agent-ac54bc44033f0de05 | mayker-dev:builder | deliver | 5 | 8 | 19 | 2.71 | 1/2/4 | 3.00/5.00/1.50 | 6.9K | 60.6K | 70.2K | 0.883 | claude-sonnet-5-5 |  |
| agent-ac68b80f19d0e0a00 | mayker-dev:builder | deliver | 5 | 6 | 8 | 1.6 | 1/1/3 | 3.00/1.00/1.33 | 1.9K | 48.4K | 52.2K | 0.866 | claude-sonnet-5-5 |  |
| agent-ac7a4a60ad6d4b170 | mayker-dev:orchestrator | deliver | 5 | 10 | 29 | 3.22 | 1/3/5 | 4.00/2.00/3.80 | 18.0K | 98.6K | 132.2K | 0.879 | claude-fable-5-1 |  |
| agent-ad129f452101e7a13 | mayker-dev:builder | deliver | 5 | 7 | 19 | 3.17 | 2/2/2 | 5.00/3.50/1.00 | 8.2K | 67.4K | 79.4K | 0.86 | claude-sonnet-5-5 |  |
| agent-adbb3074b4aaab38a | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 8.00/1.00/2.33 | 5.7K | 62.3K | 72.8K | 0.839 | claude-fable-5-1 |  |
| agent-add4978af6f7f33d5 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 0/0/5 | n/a/n/a/2.00 | 2.0K | 42.7K | 47.3K | 0.867 | claude-sonnet-5-5 |  |
| agent-ae595d91b75e3ee35 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.00/2.00/1.75 | 5.0K | 56.7K | 66.4K | 0.883 | claude-sonnet-5-5 |  |
| agent-ae7fdbd5c55b580f8 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 4.00/1.00/3.00 | 5.9K | 68.2K | 80.8K | 0.857 | claude-fable-5-1 |  |
| agent-af15e2b76a3a46d30 | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 2/3/3 | 2.50/2.67/1.00 | 5.5K | 54.7K | 60.3K | 0.904 | claude-sonnet-5-5 |  |
| agent-af9e64783d2193151 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 4.50/1.00/1.67 | 5.1K | 49.3K | 54.5K | 0.879 | claude-fable-5-1 |  |
| agent-afd051e34e7446de5 | mayker-dev:orchestrator | deliver | 3 | 9 | 31 | 3.88 | 1/1/6 | 4.00/3.00/4.00 | 23.1K | 100.7K | 132.8K | 0.853 | claude-fable-5-1 |  |

**54 dispatch(es)** in `deliver` (mayker-dev:builder 26, mayker-dev:orchestrator 16, mayker-dev:planner 6, mayker-dev:reviewer 6): median ctx max 71.4K, peak 151.2K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.6K, 41.8K, 45.7K, 47.3K, 47.7K, 47.7K, 50.1K, 52.2K, 52.3K, 54.5K, 57.6K, 60.3K, 60.3K, 60.6K, 61.0K, 61.1K, 61.2K, 61.2K, 62.4K, 66.3K, 66.4K, 66.6K, 69.6K, 69.8K, 69.9K, 70.2K, 70.8K, 72.0K, 72.7K, 72.8K, 72.9K, 73.9K, 74.8K, 75.6K, 76.1K, 76.2K, 76.9K, 77.0K, 78.3K, 78.5K, 79.4K, 79.4K, 80.6K, 80.8K, 81.1K, 105.8K, 107.9K, 111.0K, 112.9K, 130.1K, 130.6K, 132.2K, 132.8K, 151.2K.

**All runs:** 1 run(s), wall 1h14m (sum of per-run walls, idle time between runs excluded), 664 turns, 1334 tool calls, 553.9K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 92/102/341 turns, 4.04/2.52/1.87 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 47m52s of round trip (command plus model time, ADR 0006 section 2): 65% of wall.

All runs: CI wait: 8m46s in `ci-poll.sh` calls; framework wall (wall less CI wait) 1h05m.

12 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/9).
