# Run statistics, run

Generated 2026-11-13 00:36 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 41m36s | 527 | 1029 | 2.25 | 13 | 387.8K |  | 499.3K |  | 0.96 | claude-opus-5-5 | 81/88/251 (exec 76% of wall) | 4.01/2.19/1.76 |  |

Wall is this run's last step end minus its first step start; steps sum to 41m36s.

Exec turns took 31m42s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

CI wait: 6m52s in `ci-poll.sh` calls; framework wall (wall less CI wait) 34m44s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0700f3f8e9dc42ef | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 1/1/2 | 7.00/2.00/2.50 | 3.7K | 49.6K | 56.3K | 0.824 | claude-fable-5-2 |  |
| agent-a084665d7e66fdc3b | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/3 | 7.00/2.00/2.33 | 5.9K | 58.4K | 67.6K | 0.866 | claude-fable-5-2 |  |
| agent-a0e4889138603a6ce | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.7K | 51.5K | 57.8K | 0.775 | claude-fable-5-2 |  |
| agent-a14c1dd26a54a496f | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 1/0/2 | 1.00/n/a/2.00 | 1.3K | 46.2K | 56.3K | 0.766 | claude-sonnet-5-5 |  |
| agent-a164d5d36ee0c7e70 | mayker-dev:builder | deliver | 5 | 8 | 34 | 4.86 | 2/2/3 | 7.50/7.50/1.33 | 10.2K | 66.0K | 77.8K | 0.853 | claude-sonnet-5-5 |  |
| agent-a175b315ab601b2db | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.50/1.00/1.00 | 2.9K | 56.6K | 63.0K | 0.853 | claude-sonnet-5-5 |  |
| agent-a260feb46b489be68 | mayker-dev:builder | deliver | 5 | 11 | 19 | 1.9 | 1/4/5 | 5.00/2.25/1.00 | 5.1K | 56.0K | 60.8K | 0.923 | claude-sonnet-5-5 |  |
| agent-a2f36f8556e0c4d8a | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/2/3 | 2.00/2.50/1.33 | 6.3K | 53.8K | 61.3K | 0.888 | claude-sonnet-5-5 |  |
| agent-a34e82c578f193d8c | mayker-dev:builder | deliver | 5 | 10 | 18 | 2.0 | 2/1/6 | 3.50/2.00/1.50 | 5.1K | 60.7K | 68.1K | 0.909 | claude-sonnet-5-5 |  |
| agent-a44e1c7ff5506085e | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 5.00/2.00/1.50 | 4.4K | 52.8K | 61.5K | 0.846 | claude-fable-5-2 |  |
| agent-a46ca119c9ca9f9d2 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 1/0/2 | 1.00/n/a/2.00 | 1.0K | 48.2K | 60.2K | 0.756 | claude-sonnet-5-5 |  |
| agent-a4b4e80ae6b82f553 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.4K | 47.1K | 64.7K | 0.608 | claude-opus-5-5 |  |
| agent-a4b784600c0cd9e97 | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 4.3K | 49.0K | 60.3K | 0.692 | claude-opus-5-5 |  |
| agent-a5d15d903c59ad579 | mayker-dev:planner | deliver | 5 | 13 | 31 | 2.58 | 2/2/7 | 3.50/1.00/1.86 | 15.5K | 86.2K | 104.4K | 0.918 | claude-opus-5-5 |  |
| agent-a61c8fb793123e9f3 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 4.50/2.00/1.00 | 3.0K | 57.3K | 64.2K | 0.851 | claude-sonnet-5-5 |  |
| agent-a62e2ea44233b330d | mayker-dev:planner | deliver | 5 | 10 | 25 | 2.78 | 0/1/7 | n/a/2.00/2.86 | 11.5K | 72.1K | 85.6K | 0.881 | claude-opus-5-5 |  |
| agent-a65520db00691e8b3 | mayker-dev:orchestrator | deliver | 8 | 3 | 7 | 3.5 | 2/0/0 | 3.50/n/a/n/a | 7.9K | 55.7K | 63.5K | 0.703 | claude-fable-5-2 |  |
| agent-a685ddefc52813cc8 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/1/3 | 4.00/9.00/1.67 | 6.0K | 60.6K | 70.7K | 0.864 | claude-sonnet-5-5 |  |
| agent-a68fe044a58f6a032 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 1.00/1.00/3.25 | 4.2K | 54.7K | 60.4K | 0.842 | claude-fable-5-2 |  |
| agent-a739371e19ed060a4 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.7K | 48.5K | 53.3K | 0.833 | claude-fable-5-2 |  |
| agent-a785c11156b4ff490 | mayker-dev:orchestrator | deliver | 3 | 12 | 21 | 1.91 | 1/3/7 | 4.00/1.33/1.86 | 9.9K | 82.9K | 99.3K | 0.9 | claude-fable-5-2 |  |
| agent-a7f7ad6b88f7ae76d | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 3.5K | 50.8K | 56.6K | 0.814 | claude-fable-5-2 |  |
| agent-a82f65bfc858b0925 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 678 | 42.5K | 55.0K | 0.671 | claude-sonnet-5-5 |  |
| agent-a83093a839d0a5a75 | mayker-dev:planner | deliver | 5 | 14 | 35 | 2.69 | 2/2/8 | 4.00/1.50/2.25 | 15.7K | 84.4K | 104.9K | 0.911 | claude-opus-5-5 |  |
| agent-a88fb64504ecdb8f4 | mayker-dev:builder | deliver | 5 | 11 | 18 | 1.8 | 1/1/8 | 3.00/3.00/1.50 | 4.8K | 60.0K | 66.4K | 0.919 | claude-sonnet-5-5 |  |
| agent-a8903d4df097e0abd | mayker-dev:planner | deliver | 5 | 11 | 31 | 3.1 | 0/2/7 | n/a/1.00/3.43 | 14.1K | 77.4K | 96.4K | 0.902 | claude-opus-5-5 |  |
| agent-a8f352cdaefe08835 | mayker-dev:planner | deliver | 5 | 13 | 32 | 2.67 | 1/3/8 | 2.00/1.00/3.38 | 18.5K | 81.7K | 99.0K | 0.919 | claude-opus-5-5 |  |
| agent-a8fe53462a5d0ed96 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 8.1K | 52.0K | 66.9K | 0.723 | claude-opus-5-5 |  |
| agent-a9371a36e3f05415a | mayker-dev:builder | deliver | 5 | 12 | 22 | 2.0 | 2/2/7 | 3.50/1.50/1.71 | 5.6K | 62.4K | 69.5K | 0.925 | claude-sonnet-5-5 |  |
| agent-a98a90248a68d3c59 | mayker-dev:orchestrator | deliver | 5 | 9 | 21 | 2.62 | 1/3/4 | 4.00/2.33/2.50 | 8.1K | 71.2K | 85.4K | 0.867 | claude-fable-5-2 |  |
| agent-a98ca87d1a4cedb15 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 3/1/2 | 3.33/10.00/1.00 | 6.8K | 60.4K | 70.5K | 0.864 | claude-sonnet-5-5 |  |
| agent-a9f647a35a205ffb1 | mayker-dev:reviewer | deliver | 5 | 3 | 16 | 8.0 | 2/0/0 | 8.00/n/a/n/a | 4.6K | 46.0K | 62.1K | 0.618 | claude-opus-5-5 |  |
| agent-a9f93ac38005cbcb7 | mayker-dev:reviewer | deliver | 5 | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 5.2K | 48.4K | 60.2K | 0.689 | claude-opus-5-5 |  |
| agent-aa7a94f76af49e514 | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 2.00/1.50/1.20 | 5.7K | 55.1K | 61.4K | 0.912 | claude-sonnet-5-5 |  |
| agent-aa93509e978e62fac | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.6K | 53.0K | 59.6K | 0.823 | claude-fable-5-2 |  |
| agent-aae891663f76ce313 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 3.8K | 52.7K | 58.9K | 0.854 | claude-fable-5-2 |  |
| agent-ac15e515fe857a0f7 | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.50/1.00/1.00 | 2.2K | 52.3K | 59.3K | 0.823 | claude-sonnet-5-5 |  |
| agent-ac2acc5cb97ea5f70 | mayker-dev:builder | deliver | 5 | 6 | 19 | 3.8 | 2/1/2 | 5.00/7.00/1.00 | 6.6K | 59.5K | 69.5K | 0.842 | claude-sonnet-5-5 |  |
| agent-ac332f52ea80748cb | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 1.50/3.00/1.25 | 5.1K | 52.2K | 58.4K | 0.891 | claude-sonnet-5-5 |  |
| agent-ad567663f992557fd | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 0/1/3 | n/a/2.00/4.33 | 4.5K | 51.1K | 57.9K | 0.823 | claude-fable-5-2 |  |
| agent-ada4c74f6f67ec780 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 1.00/n/a/2.00 | 816 | 40.7K | 49.3K | 0.703 | claude-sonnet-5-5 |  |
| agent-ae9127f6412b22aac | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 2.50/1.50/1.25 | 6.2K | 54.3K | 61.5K | 0.901 | claude-sonnet-5-5 |  |
| agent-aeb119c50938b8ceb | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 1/2/2 | 5.00/3.50/1.00 | 4.9K | 54.8K | 61.5K | 0.813 | claude-sonnet-5-5 |  |
| agent-af1d7ac93194f3517 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 47.4K | 61.1K | 0.747 | claude-sonnet-5-5 |  |
| agent-afae827b4baaf6ad1 | mayker-dev:builder | deliver | 5 | 5 | 15 | 3.75 | 2/1/1 | 6.50/1.00/1.00 | 3.2K | 58.3K | 67.6K | 0.813 | claude-sonnet-5-5 |  |
| agent-afdc45bf621a64acb | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 2.00/1.50/1.40 | 6.3K | 54.8K | 61.4K | 0.912 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 61.5K, peak 104.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 49.3K, 53.3K, 55.0K, 56.3K, 56.3K, 56.6K, 57.8K, 57.9K, 58.4K, 58.9K, 59.3K, 59.6K, 60.2K, 60.2K, 60.3K, 60.4K, 60.8K, 61.1K, 61.3K, 61.4K, 61.4K, 61.5K, 61.5K, 61.5K, 62.1K, 63.0K, 63.5K, 64.2K, 64.7K, 66.4K, 66.9K, 67.6K, 67.6K, 68.1K, 69.5K, 69.5K, 70.5K, 70.7K, 77.8K, 85.4K, 85.6K, 96.4K, 99.0K, 99.3K, 104.4K, 104.9K.

**All runs:** 1 run(s), wall 41m36s (sum of per-run walls, idle time between runs excluded), 527 turns, 1029 tool calls, 387.8K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 81/88/251 turns, 4.01/2.19/1.76 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 31m42s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

All runs: CI wait: 6m52s in `ci-poll.sh` calls; framework wall (wall less CI wait) 34m44s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
