# Run statistics, run

Generated 2026-11-04 20:33 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 45 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 53m57s | 539 | 1068 | 2.28 | 14 | 428.3K |  | 458.8K |  | 0.958 | claude-opus-5-5 | 91/82/258 (exec 67% of wall) | 3.88/2.46/1.75 |  |

Wall is this run's last step end minus its first step start; steps sum to 53m57s.

Exec turns took 36m22s of round trip (command plus model time, ADR 0006 section 2): 67% of wall.

CI wait: 6m06s in `ci-poll.sh` calls; framework wall (wall less CI wait) 47m51s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a09350e924d821b06 | mayker-dev:orchestrator | deliver | 5 | 10 | 30 | 3.33 | 1/2/6 | 4.00/2.00/3.67 | 16.0K | 86.1K | 112.4K | 0.885 | claude-fable-5-1 |  |
| agent-a17fc9fc2a7789898 | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 2/1/1 | 5.00/2.00/1.00 | 2.7K | 52.3K | 59.6K | 0.822 | claude-sonnet-5-5 |  |
| agent-a1aed39b9528a7441 | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 2/1/3 | 2.50/2.00/1.00 | 4.7K | 53.2K | 59.4K | 0.875 | claude-sonnet-5-5 |  |
| agent-a21699ba010907a14 | mayker-dev:orchestrator | deliver | 8 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 11.2K | 56.7K | 70.7K | 0.749 | claude-fable-5-1 |  |
| agent-a2e5f670c7fc10695 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 743 | 39.8K | 45.5K | 0.592 | claude-sonnet-5-5 |  |
| agent-a2ec05be7efb572bb | mayker-dev:planner | deliver | 5 | 10 | 27 | 3.0 | 2/2/5 | 6.00/1.50/2.40 | 11.2K | 68.8K | 83.8K | 0.878 | claude-opus-5-5 |  |
| agent-a3c21240a79684843 | mayker-dev:planner | deliver | 5 | 14 | 40 | 3.08 | 2/3/8 | 4.00/1.33/3.50 | 18.6K | 88.6K | 105.9K | 0.925 | claude-opus-5-5 |  |
| agent-a3c305a227ddbb816 | mayker-dev:planner | deliver | 5 | 17 | 36 | 2.25 | 2/2/12 | 5.00/2.00/1.83 | 17.9K | 84.7K | 105.7K | 0.927 | claude-opus-5-5 |  |
| agent-a3e2f460654f2d83c | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 782 | 43.8K | 59.3K | 0.647 | claude-sonnet-5-5 |  |
| agent-a3f955cdc6a1b5efe | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 1.2K | 37.8K | 40.6K | 0.757 | claude-sonnet-5-5 |  |
| agent-a4234f0124cc507b0 | mayker-dev:reviewer | deliver | 5 | 5 | 24 | 6.0 | 4/0/0 | 6.00/n/a/n/a | 7.4K | 61.5K | 81.2K | 0.736 | claude-opus-5-5 |  |
| agent-a43fefe773f7e80ca | mayker-dev:planner | deliver | 5 | 11 | 28 | 2.8 | 1/2/6 | 6.00/1.50/2.17 | 10.0K | 72.5K | 86.8K | 0.907 | claude-opus-5-5 |  |
| agent-a452487d543479a79 | mayker-dev:builder | deliver | 5 | 12 | 15 | 1.36 | 3/2/6 | 1.67/1.50/1.17 | 7.5K | 56.1K | 63.3K | 0.925 | claude-sonnet-5-5 |  |
| agent-a4564d6debee62632 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 2.2 | 2/1/2 | 2.00/3.00/2.00 | 7.7K | 47.1K | 53.0K | 0.839 | claude-fable-5-1 |  |
| agent-a4a1e14a7f83d0061 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 1/2/2 | 5.00/3.50/1.00 | 4.5K | 52.7K | 58.3K | 0.816 | claude-sonnet-5-5 |  |
| agent-a55fef4751d8778f6 | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 1/1/2 | 5.00/4.00/1.50 | 3.4K | 52.4K | 58.3K | 0.827 | claude-sonnet-5-5 |  |
| agent-a566931009057a694 | mayker-dev:builder | deliver | 5 | 16 | 31 | 2.07 | 2/1/12 | 2.00/2.00/2.08 | 6.4K | 62.1K | 69.7K | 0.943 | claude-sonnet-5-5 |  |
| agent-a5c163ddf6c96bd77 | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 4.50/1.00/1.00 | 8.1K | 59.5K | 67.1K | 0.885 | claude-fable-5-1 |  |
| agent-a658547e75ea7a5a9 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 47.2K | 61.2K | 0.744 | claude-sonnet-5-5 |  |
| agent-a687bab9ea6c10636 | mayker-dev:builder | deliver | 5 | 7 | 18 | 3.0 | 2/2/2 | 5.50/2.50/1.00 | 4.3K | 58.3K | 65.3K | 0.872 | claude-sonnet-5-5 |  |
| agent-a6b4f5633d13a99cf | mayker-dev:builder | deliver | 5 | 6 | 31 | 6.2 | 2/2/1 | 6.50/8.50/1.00 | 8.6K | 63.1K | 74.3K | 0.804 | claude-sonnet-5-5 |  |
| agent-a6e47fc908be21340 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.3K | 44.6K | 59.3K | 0.557 | claude-opus-5-5 |  |
| agent-a7db99a81af0d135d | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.4K | 54.1K | 72.0K | 0.71 | claude-opus-5-5 |  |
| agent-a868cfcf87449bf5f | mayker-dev:orchestrator | deliver | 5 | 5 | 7 | 1.75 | 1/1/2 | 4.00/1.00/1.00 | 3.0K | 43.3K | 46.2K | 0.786 | claude-fable-5-1 |  |
| agent-a8beabecc8bd296bf | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.8K | 52.9K | 68.1K | 0.722 | claude-opus-5-5 |  |
| agent-a965c6ac96cb08ff2 | mayker-dev:builder | deliver | 5 | 12 | 14 | 1.27 | 2/1/8 | 1.50/2.00/1.12 | 6.6K | 50.2K | 56.4K | 0.928 | claude-sonnet-5-5 |  |
| agent-a9b0ccad245544dc5 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.00/2.00/1.50 | 4.8K | 51.9K | 58.2K | 0.891 | claude-sonnet-5-5 |  |
| agent-a9ded20ccc28ea321 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 1/1/4 | 7.00/1.00/1.25 | 8.2K | 57.5K | 65.6K | 0.868 | claude-fable-5-1 |  |
| agent-aa01edbd3528a905c | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.00/2.00/1.00 | 3.0K | 53.8K | 59.9K | 0.855 | claude-sonnet-5-5 |  |
| agent-aa25785e4da4c8110 | mayker-dev:builder | deliver | 5 | 12 | 19 | 1.73 | 3/1/6 | 2.33/3.00/1.33 | 4.6K | 60.1K | 65.8K | 0.927 | claude-sonnet-5-5 |  |
| agent-aa44869ce71de0db3 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 1/1/4 | 3.00/9.00/2.25 | 7.7K | 58.5K | 68.8K | 0.864 | claude-sonnet-5-5 |  |
| agent-aa53d6b863fbacddc | mayker-dev:builder | deliver | 5 | 8 | 21 | 3.0 | 2/2/3 | 1.50/4.00/3.33 | 9.0K | 59.0K | 68.9K | 0.882 | claude-sonnet-5-5 |  |
| agent-ab6ed181f55db7934 | mayker-dev:planner | deliver | 5 | 16 | 38 | 2.53 | 3/2/9 | 2.33/1.50/2.67 | 17.3K | 90.7K | 106.9K | 0.935 | claude-opus-5-5 |  |
| agent-aba255feb97af4f2c | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 5.3K | 51.7K | 56.3K | 0.859 | claude-fable-5-1 |  |
| agent-abb10ba9f2afa99b3 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/1/3 | 4.00/9.00/1.33 | 5.9K | 56.0K | 64.8K | 0.868 | claude-sonnet-5-5 |  |
| agent-abd3337fb72ec4271 | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 1/2/3 | 4.00/2.50/2.67 | 8.9K | 75.5K | 94.8K | 0.843 | claude-fable-5-1 |  |
| agent-abda2161d46998791 | mayker-dev:orchestrator | deliver | 3 | 10 | 25 | 2.78 | 2/2/5 | 4.50/2.00/2.40 | 17.7K | 80.4K | 99.6K | 0.876 | claude-fable-5-1 |  |
| agent-ac7554369f2fc67d9 | mayker-dev:builder | deliver | 5 | 11 | 26 | 2.6 | 1/1/7 | 3.00/5.00/2.43 | 5.8K | 62.5K | 70.2K | 0.917 | claude-sonnet-5-5 |  |
| agent-acb21bc5c2920e2c3 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.00/3.00/1.50 | 5.7K | 53.1K | 60.1K | 0.889 | claude-sonnet-5-5 |  |
| agent-ada0092ee0ab7f5ac | mayker-dev:builder | deliver | 5 | 9 | 19 | 2.38 | 1/4/3 | 6.00/2.50/1.00 | 4.9K | 54.3K | 59.3K | 0.905 | claude-sonnet-5-5 |  |
| agent-addce00762bdbc5c5 | mayker-dev:reviewer | deliver | 5 | 4 | 23 | 7.67 | 3/0/0 | 7.67/n/a/n/a | 6.2K | 52.4K | 67.8K | 0.721 | claude-opus-5-5 |  |
| agent-ae9ab491ddd5fe86c | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 2/1/4 | 5.00/2.00/2.00 | 7.8K | 57.4K | 67.2K | 0.853 | claude-fable-5-1 |  |
| agent-aea314cd4153ce1db | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 4.50/1.00/2.00 | 5.9K | 53.1K | 58.9K | 0.841 | claude-fable-5-1 |  |
| agent-af91db729035b057c | mayker-dev:orchestrator | deliver | 5 | 6 | 7 | 1.4 | 2/1/2 | 2.00/1.00/1.00 | 3.0K | 42.6K | 46.2K | 0.868 | claude-fable-5-1 |  |
| agent-afb1b8cb31b62c43c | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 1/0/3 | 2.00/n/a/1.67 | 1.5K | 54.6K | 65.0K | 0.809 | claude-sonnet-5-5 |  |

**45 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 65.3K, peak 112.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 40.6K, 45.5K, 46.2K, 46.2K, 53.0K, 56.3K, 56.4K, 58.2K, 58.3K, 58.3K, 58.9K, 59.3K, 59.3K, 59.3K, 59.4K, 59.6K, 59.9K, 60.1K, 61.2K, 63.3K, 64.8K, 65.0K, 65.3K, 65.6K, 65.8K, 67.1K, 67.2K, 67.8K, 68.1K, 68.8K, 68.9K, 69.7K, 70.2K, 70.7K, 72.0K, 74.3K, 81.2K, 83.8K, 86.8K, 94.8K, 99.6K, 105.7K, 105.9K, 106.9K, 112.4K.

**All runs:** 1 run(s), wall 53m57s (sum of per-run walls, idle time between runs excluded), 539 turns, 1068 tool calls, 428.3K output tokens, cache hit 0.958.

Turn classes across every bucket, read / edit / exec: 91/82/258 turns, 3.88/2.46/1.75 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 36m22s of round trip (command plus model time, ADR 0006 section 2): 67% of wall.

All runs: CI wait: 6m06s in `ci-poll.sh` calls; framework wall (wall less CI wait) 47m51s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
