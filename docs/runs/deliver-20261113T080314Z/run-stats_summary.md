# Run statistics, run

Generated 2026-11-13 08:47 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 43m50s | 531 | 1119 | 2.42 | 15 | 466.2K |  | 533.6K |  | 0.959 | claude-opus-5-5 | 79/77/270 (exec 80% of wall) | 4.68/2.36/1.87 |  |

Wall is this run's last step end minus its first step start; steps sum to 43m49s.

Exec turns took 35m06s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

CI wait: 6m15s in `ci-poll.sh` calls; framework wall (wall less CI wait) 37m35s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a00c39842ea80aa21 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 5.50/2.00/1.50 | 6.2K | 68.6K | 80.9K | 0.836 | claude-fable-5-2 |  |
| agent-a062fd00572b8e123 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 7.00/2.00/2.67 | 4.8K | 51.5K | 58.7K | 0.81 | claude-fable-5-2 |  |
| agent-a07293dc99a09b9d6 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 1.4K | 55.1K | 72.2K | 0.735 | claude-sonnet-5-5 |  |
| agent-a07f3a5c81c2e025a | mayker-dev:planner | deliver | 5 | 14 | 43 | 3.31 | 1/3/8 | 1.00/1.67/3.62 | 23.4K | 92.4K | 117.2K | 0.92 | claude-opus-5-5 |  |
| agent-a0d446f3afee82dfa | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.8K | 47.5K | 63.4K | 0.556 | claude-opus-5-5 |  |
| agent-a0ef9342c0f535389 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 5.00/2.00/2.00 | 5.0K | 50.1K | 56.3K | 0.857 | claude-fable-5-2 |  |
| agent-a173b9158e8fd174f | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/1/3 | 3.50/8.00/2.67 | 6.0K | 62.8K | 72.1K | 0.836 | claude-sonnet-5-5 |  |
| agent-a1cb75c6ebed14ed0 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 1/2/2 | 7.00/5.50/1.50 | 7.0K | 58.7K | 66.2K | 0.851 | claude-sonnet-5-5 |  |
| agent-a25165f4f8e275f01 | mayker-dev:reviewer | deliver | 5 | 3 | 23 | 11.5 | 2/0/0 | 11.50/n/a/n/a | 9.3K | 51.7K | 72.7K | 0.596 | claude-opus-5-5 |  |
| agent-a2674d870e21b2b58 | mayker-dev:builder | deliver | 5 | 7 | 31 | 5.17 | 2/3/1 | 7.00/5.33/1.00 | 9.4K | 64.6K | 75.1K | 0.864 | claude-sonnet-5-5 |  |
| agent-a35c6c4bf47b2fa0c | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 1/3/4 | 6.00/1.67/1.00 | 4.6K | 58.9K | 64.5K | 0.904 | claude-sonnet-5-5 |  |
| agent-a36fdce7d193059e8 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/2/3 | 2.50/1.50/1.67 | 7.5K | 60.8K | 69.9K | 0.884 | claude-sonnet-5-5 |  |
| agent-a3fb02666d868da79 | mayker-dev:planner | deliver | 5 | 14 | 33 | 2.54 | 3/2/7 | 3.67/2.00/2.29 | 15.8K | 87.8K | 104.4K | 0.915 | claude-opus-5-5 |  |
| agent-a4d0b72d59f42c12e | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 3.2K | 53.2K | 60.0K | 0.825 | claude-fable-5-2 |  |
| agent-a51184ab30b600589 | mayker-dev:builder | deliver | 5 | 6 | 7 | 1.4 | 2/1/2 | 2.00/1.00/1.00 | 1.5K | 50.1K | 57.2K | 0.855 | claude-sonnet-5-5 |  |
| agent-a55cf2ccb6f694e1a | mayker-dev:builder | deliver | 5 | 6 | 19 | 3.8 | 2/2/1 | 7.00/2.00/1.00 | 4.3K | 56.2K | 63.7K | 0.852 | claude-sonnet-5-5 |  |
| agent-a55f4a15f9d7cb235 | mayker-dev:orchestrator | deliver | 5 | 6 | 18 | 3.6 | 1/1/3 | 8.00/2.00/2.67 | 6.5K | 59.4K | 68.8K | 0.844 | claude-fable-5-2 |  |
| agent-a5e590c26853096ee | mayker-dev:planner | deliver | 5 | 14 | 38 | 2.92 | 2/3/7 | 7.50/1.33/2.57 | 18.5K | 94.8K | 118.8K | 0.91 | claude-opus-5-5 |  |
| agent-a5e942953d5febebc | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 3.33 | 1/1/1 | 7.00/2.00/1.00 | 3.2K | 54.0K | 60.9K | 0.78 | claude-fable-5-2 |  |
| agent-a5ff703670a5addf2 | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 4.00/6.00/1.00 | 8.5K | 59.9K | 67.8K | 0.871 | claude-sonnet-5-5 |  |
| agent-a6c51208e8811fa14 | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.6 | 3/3/4 | 2.00/1.67/1.25 | 7.8K | 58.0K | 65.2K | 0.919 | claude-sonnet-5-5 |  |
| agent-a73ee424318e00b5c | mayker-dev:orchestrator | deliver | 5 | 10 | 20 | 2.22 | 1/3/5 | 4.00/1.00/2.60 | 7.8K | 94.1K | 112.6K | 0.88 | claude-fable-5-2 |  |
| agent-a7d5bfc5792c738f4 | mayker-dev:builder | deliver | 5 | 13 | 27 | 2.25 | 1/1/9 | 5.00/3.00/2.00 | 6.5K | 68.4K | 76.6K | 0.929 | claude-sonnet-5-5 |  |
| agent-a83685c94d706fdaf | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 1/3/3 | 7.00/2.33/1.00 | 4.8K | 61.1K | 66.8K | 0.891 | claude-sonnet-5-5 |  |
| agent-a8e4c7c4b2a10254a | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 7.00/1.00/1.00 | 3.7K | 56.8K | 62.8K | 0.826 | claude-fable-5-2 |  |
| agent-a8f3abb3f99e278fa | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 1.2K | 52.9K | 68.3K | 0.742 | claude-sonnet-5-5 |  |
| agent-a91f833e9bf851a9d | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 5.9K | 52.4K | 66.0K | 0.685 | claude-opus-5-5 |  |
| agent-a9220a15dfb398e0e | mayker-dev:builder | deliver | 5 | 6 | 20 | 4.0 | 0/1/4 | n/a/7.00/3.25 | 9.3K | 62.6K | 73.1K | 0.842 | claude-sonnet-5-5 |  |
| agent-a9da54acf872bc62a | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 3.33 | 1/1/1 | 7.00/2.00/1.00 | 3.3K | 52.3K | 58.6K | 0.72 | claude-fable-5-2 |  |
| agent-a9e0c8496918167e3 | mayker-dev:builder | deliver | 5 | 5 | 16 | 4.0 | 2/1/1 | 7.00/1.00/1.00 | 2.9K | 58.5K | 67.6K | 0.816 | claude-sonnet-5-5 |  |
| agent-aa5a1980fc5424f75 | mayker-dev:orchestrator | deliver | 3 | 8 | 18 | 2.57 | 1/2/4 | 4.00/2.00/2.50 | 9.9K | 89.0K | 109.8K | 0.846 | claude-fable-5-2 |  |
| agent-aab6f044e425bf8bd | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 2/2/4 | 3.00/5.00/2.00 | 8.3K | 65.8K | 74.1K | 0.898 | claude-sonnet-5-5 |  |
| agent-abd2fae5af971a5f3 | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 2/0/1 | 1.50/n/a/1.00 | 988 | 46.0K | 55.7K | 0.772 | claude-sonnet-5-5 |  |
| agent-abdfe6f9c94d92b56 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 1/2/2 | 5.00/4.00/1.00 | 5.1K | 57.1K | 65.0K | 0.81 | claude-sonnet-5-5 |  |
| agent-ac012749694fef4d7 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 7.2K | 55.4K | 72.5K | 0.718 | claude-opus-5-5 |  |
| agent-ac2a024fccc91637f | mayker-dev:builder | deliver | 5 | 14 | 23 | 1.77 | 1/1/11 | 5.00/2.00/1.45 | 6.3K | 63.2K | 69.5K | 0.937 | claude-sonnet-5-5 |  |
| agent-ac2c7bc196b31dc2f | mayker-dev:planner | deliver | 5 | 13 | 38 | 3.17 | 1/2/8 | 5.00/1.50/3.00 | 14.7K | 101.4K | 128.6K | 0.913 | claude-opus-5-5 |  |
| agent-ac66683cce646deff | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 7.00/1.00/1.00 | 3.3K | 53.5K | 58.6K | 0.781 | claude-fable-5-2 |  |
| agent-ac770582526ace573 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 3.00/2.00/1.25 | 4.8K | 54.8K | 60.8K | 0.893 | claude-sonnet-5-5 |  |
| agent-acdd6d8398d40a0ee | mayker-dev:orchestrator | deliver | 8 | 3 | 9 | 4.5 | 1/0/1 | 3.00/n/a/6.00 | 9.0K | 54.6K | 64.0K | 0.701 | claude-fable-5-2 |  |
| agent-ad8dcbcaa7718a7d9 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 3.00/2.00/1.25 | 4.5K | 56.0K | 63.3K | 0.889 | claude-sonnet-5-5 |  |
| agent-adf99232b44bb2b08 | mayker-dev:planner | deliver | 5 | 10 | 37 | 4.11 | 0/1/7 | n/a/2.00/4.86 | 17.0K | 93.0K | 118.3K | 0.888 | claude-opus-5-5 |  |
| agent-ae40c6bba460f0d62 | mayker-dev:orchestrator | deliver | 5 | 6 | 18 | 3.6 | 1/1/3 | 7.00/2.00/3.00 | 5.5K | 58.3K | 67.9K | 0.844 | claude-fable-5-2 |  |
| agent-aeb74d862b24bd819 | mayker-dev:reviewer | deliver | 5 | 3 | 21 | 10.5 | 2/0/0 | 10.50/n/a/n/a | 7.6K | 49.6K | 69.0K | 0.603 | claude-opus-5-5 |  |
| agent-aef6663c26a11bb1c | mayker-dev:builder | deliver | 5 | 4 | 7 | 2.33 | 2/0/1 | 2.50/n/a/2.00 | 1.4K | 51.9K | 63.7K | 0.759 | claude-sonnet-5-5 |  |
| agent-af63b99c9f1ebdce7 | mayker-dev:builder | deliver | 5 | 18 | 27 | 1.59 | 1/1/14 | 1.00/2.00/1.64 | 10.4K | 73.4K | 84.8K | 0.946 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 67.9K, peak 128.6K, 0 above the auto threshold (80% of the serving model's window). Distribution: 55.7K, 56.3K, 57.2K, 58.6K, 58.6K, 58.7K, 60.0K, 60.8K, 60.9K, 62.8K, 63.3K, 63.4K, 63.7K, 63.7K, 64.0K, 64.5K, 65.0K, 65.2K, 66.0K, 66.2K, 66.8K, 67.6K, 67.8K, 67.9K, 68.3K, 68.8K, 69.0K, 69.5K, 69.9K, 72.1K, 72.2K, 72.5K, 72.7K, 73.1K, 74.1K, 75.1K, 76.6K, 80.9K, 84.8K, 104.4K, 109.8K, 112.6K, 117.2K, 118.3K, 118.8K, 128.6K.

**All runs:** 1 run(s), wall 43m50s (sum of per-run walls, idle time between runs excluded), 531 turns, 1119 tool calls, 466.2K output tokens, cache hit 0.959.

Turn classes across every bucket, read / edit / exec: 79/77/270 turns, 4.68/2.36/1.87 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 35m06s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

All runs: CI wait: 6m15s in `ci-poll.sh` calls; framework wall (wall less CI wait) 37m35s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
