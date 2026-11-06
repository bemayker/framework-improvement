# Run statistics, run

Generated 2026-11-06 17:52 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 48 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 1h07m | 593 | 1123 | 2.16 | 15 | 434.4K |  | 474.7K |  | 0.961 | claude-opus-5-5 | 84/83/306 (exec 79% of wall) | 4.13/2.22/1.63 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h07m.

Exec turns took 53m25s of round trip (command plus model time, ADR 0006 section 2): 79% of wall.

CI wait: 23m48s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m05s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a032e87d7cda2f172 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.50/2.00/1.00 | 5.0K | 53.4K | 59.4K | 0.891 | claude-sonnet-5-5 |  |
| agent-a04b1a6e429b427f4 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 3.7K | 47.9K | 53.8K | 0.812 | claude-fable-5-1 |  |
| agent-a06f701d231114ec9 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.8K | 52.3K | 68.2K | 0.674 | claude-opus-5-5 |  |
| agent-a0d6233e4d1edf4d2 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 4.3K | 49.9K | 58.1K | 0.805 | claude-fable-5-1 |  |
| agent-a0f5c9c2b90009263 | mayker-dev:builder | deliver | 5 | 6 | 27 | 5.4 | 2/1/2 | 6.50/12.00/1.00 | 8.1K | 61.4K | 72.1K | 0.804 | claude-sonnet-5-5 |  |
| agent-a18a67b36b8c32916 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 4.9K | 49.4K | 61.4K | 0.736 | claude-opus-5-5 |  |
| agent-a1a7bdf95e7f0ccca | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 2.50/1.50/1.00 | 6.3K | 53.3K | 59.2K | 0.913 | claude-sonnet-5-5 |  |
| agent-a22dc482bd8f6747b | mayker-dev:builder | deliver | 5 | 15 | 22 | 1.57 | 1/1/11 | 4.00/1.00/1.45 | 6.5K | 62.4K | 69.2K | 0.94 | claude-sonnet-5-5 |  |
| agent-a22f07af0d8338163 | mayker-dev:orchestrator | deliver | 8 | 6 | 10 | 2.0 | 3/0/2 | 2.33/n/a/1.50 | 10.4K | 59.4K | 69.4K | 0.845 | claude-fable-5-1 |  |
| agent-a26c4e93cd6453f38 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.50/1.00/2.00 | 5.1K | 51.0K | 56.1K | 0.878 | claude-fable-5-1 |  |
| agent-a2862457e72d87bcb | mayker-dev:builder | deliver | 5 | 13 | 21 | 1.75 | 1/1/9 | 4.00/3.00/1.44 | 5.3K | 59.0K | 64.5K | 0.933 | claude-sonnet-5-5 |  |
| agent-a2a84c631bb8b1639 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/2/2 | 5.50/1.50/1.00 | 3.2K | 56.8K | 62.6K | 0.875 | claude-sonnet-5-5 |  |
| agent-a2c3e2f1c2708504c | mayker-dev:builder | deliver | 5 | 8 | 10 | 1.43 | 2/1/4 | 1.50/1.00/1.50 | 3.0K | 54.9K | 64.3K | 0.883 | claude-sonnet-5-5 |  |
| agent-a2dce3a30f220bfcd | mayker-dev:builder | deliver | 5 | 7 | 18 | 3.0 | 2/1/3 | 6.50/2.00/1.00 | 4.0K | 60.1K | 67.6K | 0.87 | claude-sonnet-5-5 |  |
| agent-a2df9e0d2526a8bcf | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 7.00/2.00/2.00 | 5.8K | 56.6K | 66.9K | 0.863 | claude-fable-5-1 |  |
| agent-a2e2dc773362ce314 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/1/5 | 3.00/2.00/1.00 | 4.6K | 53.7K | 58.8K | 0.905 | claude-sonnet-5-5 |  |
| agent-a413426f96a1898ea | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 1/1/5 | 7.00/1.00/2.00 | 5.2K | 50.7K | 55.4K | 0.894 | claude-fable-5-1 |  |
| agent-a41f16284dc4bb4a4 | mayker-dev:builder | deliver | 5 | 7 | 25 | 4.17 | 2/1/3 | 4.50/13.00/1.00 | 7.2K | 59.6K | 69.0K | 0.866 | claude-sonnet-5-5 |  |
| agent-a42b9595bf3fbe5e5 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.50/1.50/1.00 | 5.1K | 51.2K | 56.2K | 0.906 | claude-sonnet-5-5 |  |
| agent-a4c191a0088352429 | mayker-dev:planner | deliver | 5 | 14 | 29 | 2.23 | 1/2/8 | 1.00/1.00/2.00 | 16.3K | 73.0K | 93.3K | 0.921 | claude-opus-5-5 |  |
| agent-a54ad2f2352d58394 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 1/0/2 | 1.00/n/a/2.50 | 1.1K | 45.7K | 56.2K | 0.763 | claude-sonnet-5-5 |  |
| agent-a5e354d55f3746df5 | mayker-dev:builder | deliver | 5 | 5 | 5 | 1.25 | 0/1/3 | n/a/1.00/1.33 | 1.4K | 39.3K | 41.6K | 0.854 | claude-sonnet-5-5 |  |
| agent-a68bada4dc70826b0 | mayker-dev:planner | deliver | 5 | 13 | 34 | 2.83 | 0/1/10 | n/a/2.00/2.70 | 15.5K | 89.4K | 112.8K | 0.914 | claude-opus-5-5 |  |
| agent-a6936687d9a09be51 | mayker-dev:builder | deliver | 5 | 15 | 21 | 1.5 | 1/3/10 | 3.00/1.33/1.40 | 5.2K | 46.9K | 51.1K | 0.927 | claude-sonnet-5-5 |  |
| agent-a705d02429d206fb0 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 5.50/1.00/1.50 | 3.1K | 57.1K | 64.1K | 0.851 | claude-sonnet-5-5 |  |
| agent-a713a352f2f1e56e0 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/1/3 | 4.50/9.00/1.00 | 5.9K | 58.0K | 66.3K | 0.869 | claude-sonnet-5-5 |  |
| agent-a7b491c029ea54518 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 2.50/5.00/1.00 | 5.6K | 55.5K | 61.8K | 0.874 | claude-sonnet-5-5 |  |
| agent-a7c7aba62263dcf7d | mayker-dev:orchestrator | deliver | 5 | 11 | 22 | 2.2 | 1/4/5 | 5.00/1.75/2.00 | 15.8K | 86.5K | 107.3K | 0.887 | claude-fable-5-1 |  |
| agent-a8109f878af16bec5 | mayker-dev:orchestrator | deliver | 5 | 5 | 16 | 4.0 | 1/1/2 | 7.00/2.00/3.50 | 5.3K | 49.4K | 55.8K | 0.774 | claude-fable-5-1 |  |
| agent-a82fc41e5d3b7230f | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 5.50/1.00/1.67 | 3.5K | 60.8K | 68.4K | 0.87 | claude-sonnet-5-5 |  |
| agent-a8651a90033cc49da | mayker-dev:reviewer | deliver | 5 | 4 | 24 | 8.0 | 3/0/0 | 8.00/n/a/n/a | 6.8K | 56.3K | 74.6K | 0.669 | claude-opus-5-5 |  |
| agent-a8cd176bda434de7d | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/3/2 | 3.50/1.33/1.00 | 3.5K | 58.8K | 65.0K | 0.889 | claude-sonnet-5-5 |  |
| agent-a8dc4e39ae85aeb69 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 4.5K | 55.7K | 64.0K | 0.808 | claude-fable-5-1 |  |
| agent-a91e9592fd6cbcb86 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 884 | 44.8K | 58.7K | 0.66 | claude-sonnet-5-5 |  |
| agent-a9d89b3d71069d14d | mayker-dev:orchestrator | deliver | 3 | 9 | 26 | 3.25 | 2/2/4 | 3.50/2.50/3.50 | 15.3K | 85.5K | 109.5K | 0.857 | claude-fable-5-1 |  |
| agent-a9e2868ac63a04025 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/1/3 | 4.50/10.00/1.00 | 8.0K | 63.0K | 71.4K | 0.867 | claude-sonnet-5-5 |  |
| agent-aa6525d586d7d344c | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 0/1/2 | n/a/1.00/2.50 | 1.4K | 38.7K | 40.6K | 0.822 | claude-sonnet-5-5 |  |
| agent-aa7978fc0542a0bcc | mayker-dev:orchestrator | deliver | 5,8 | 8 | 19 | 2.71 | 1/2/4 | 4.00/2.00/2.75 | 10.9K | 75.4K | 95.8K | 0.841 | claude-fable-5-1 |  |
| agent-aaaa3f76d429ab194 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 4.00/1.00/2.33 | 6.0K | 56.3K | 62.7K | 0.873 | claude-fable-5-1 |  |
| agent-ab0ca05087702a6c9 | mayker-dev:planner | deliver | 5 | 13 | 37 | 3.08 | 0/2/9 | n/a/1.00/3.33 | 23.4K | 88.0K | 113.9K | 0.912 | claude-opus-5-5 |  |
| agent-ab3a851409c340e35 | mayker-dev:builder | deliver | 5 | 20 | 32 | 1.68 | 3/1/14 | 2.33/3.00/1.50 | 7.0K | 67.7K | 76.1K | 0.953 | claude-sonnet-5-5 |  |
| agent-abb243d99832b3c77 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 4.5K | 48.0K | 52.6K | 0.833 | claude-fable-5-1 |  |
| agent-abee7249c044019e8 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 4.2K | 52.3K | 59.9K | 0.809 | claude-fable-5-1 |  |
| agent-ac9d2b44bd458be9a | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 3.7K | 44.7K | 59.6K | 0.555 | claude-opus-5-5 |  |
| agent-ae985f7ac2ea0c709 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/2/2 | 3.00/3.50/1.50 | 5.1K | 58.4K | 66.6K | 0.837 | claude-sonnet-5-5 |  |
| agent-aec2db59955c5b0f2 | mayker-dev:planner | deliver | 5 | 13 | 29 | 2.42 | 1/3/6 | 2.00/1.33/2.00 | 11.6K | 81.0K | 95.3K | 0.909 | claude-opus-5-5 |  |
| agent-af55418a3b806be63 | mayker-dev:planner | deliver | 5 | 12 | 34 | 3.09 | 0/1/9 | n/a/2.00/3.00 | 16.0K | 77.1K | 96.8K | 0.895 | claude-opus-5-5 |  |
| agent-afba36e9334217496 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 5.2K | 52.6K | 68.1K | 0.72 | claude-opus-5-5 |  |

**48 dispatch(es)** in `deliver` (mayker-dev:builder 24, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 64.4K, peak 113.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 40.6K, 41.6K, 51.1K, 52.6K, 53.8K, 55.4K, 55.8K, 56.1K, 56.2K, 56.2K, 58.1K, 58.7K, 58.8K, 59.2K, 59.4K, 59.6K, 59.9K, 61.4K, 61.8K, 62.6K, 62.7K, 64.0K, 64.1K, 64.3K, 64.5K, 65.0K, 66.3K, 66.6K, 66.9K, 67.6K, 68.1K, 68.2K, 68.4K, 69.0K, 69.2K, 69.4K, 71.4K, 72.1K, 74.6K, 76.1K, 93.3K, 95.3K, 95.8K, 96.8K, 107.3K, 109.5K, 112.8K, 113.9K.

**All runs:** 1 run(s), wall 1h07m (sum of per-run walls, idle time between runs excluded), 593 turns, 1123 tool calls, 434.4K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 84/83/306 turns, 4.13/2.22/1.63 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 53m25s of round trip (command plus model time, ADR 0006 section 2): 79% of wall.

All runs: CI wait: 23m48s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m05s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
