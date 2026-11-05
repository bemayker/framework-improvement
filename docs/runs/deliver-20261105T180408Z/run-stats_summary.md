# Run statistics, run

Generated 2026-11-05 18:56 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 49 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 52m04s | 569 | 1066 | 2.16 | 14 | 438.8K |  | 452.5K |  | 0.956 | claude-opus-5-5 | 87/80/277 (exec 72% of wall) | 4.01/2.09/1.68 |  |

Wall is this run's last step end minus its first step start; steps sum to 52m04s.

Exec turns took 37m32s of round trip (command plus model time, ADR 0006 section 2): 72% of wall.

CI wait: 9m07s in `ci-poll.sh` calls; framework wall (wall less CI wait) 42m56s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a059a1b732b310f72 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 1/0/2 | 2.00/n/a/2.00 | 1.2K | 51.0K | 63.3K | 0.753 | claude-sonnet-5-5 |  |
| agent-a09c4e54d8a4384ac | mayker-dev:orchestrator | deliver | 5 | 10 | 22 | 2.44 | 1/2/5 | 4.00/2.00/2.20 | 11.9K | 86.2K | 107.0K | 0.89 | claude-fable-5-1 |  |
| agent-a0cfa060d7bd4be80 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 3/1/2 | 3.00/2.00/2.50 | 5.8K | 51.0K | 61.1K | 0.829 | claude-fable-5-1 |  |
| agent-a1077f138f75848a8 | mayker-dev:builder | deliver | 5 | 7 | 26 | 4.33 | 2/1/3 | 6.00/11.00/1.00 | 7.8K | 62.5K | 71.8K | 0.866 | claude-sonnet-5-5 |  |
| agent-a1a065902cb5ff42c | mayker-dev:orchestrator | deliver | 5 | 8 | 11 | 1.83 | 1/1/4 | 4.00/1.00/1.50 | 6.1K | 56.7K | 64.7K | 0.885 | claude-fable-5-1 |  |
| agent-a1b7ff3424eba0973 | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 3.00/3.00/1.00 | 3.2K | 48.1K | 52.6K | 0.835 | claude-sonnet-5-5 |  |
| agent-a1e15de4a2a5986d2 | mayker-dev:builder | deliver | 5 | 14 | 24 | 1.85 | 2/1/9 | 3.00/3.00/1.56 | 5.6K | 62.3K | 68.3K | 0.937 | claude-sonnet-5-5 |  |
| agent-a218b371e8a56a7f5 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/1/3 | 3.00/8.00/2.33 | 6.2K | 59.6K | 68.4K | 0.836 | claude-sonnet-5-5 |  |
| agent-a2820d82174dccabb | mayker-dev:reviewer | deliver | 5 | 6 | 29 | 5.8 | 5/0/0 | 5.80/n/a/n/a | 9.7K | 77.4K | 101.0K | 0.802 | claude-opus-5-5 |  |
| agent-a2affaf9a1d969733 | mayker-dev:planner | deliver | 5 | 14 | 39 | 3.0 | 1/2/9 | 1.00/2.00/3.11 | 13.5K | 82.3K | 103.0K | 0.922 | claude-opus-5-5 |  |
| agent-a2b25b6fae39c33cc | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 0/1/5 | n/a/1.00/2.00 | 3.1K | 41.1K | 44.5K | 0.891 | claude-sonnet-5-5 |  |
| agent-a37df3a05319d9335 | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 7.00/1.00/1.67 | 4.6K | 53.0K | 59.1K | 0.854 | claude-fable-5-1 |  |
| agent-a382e7b2a6c901824 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 1/1/4 | 9.00/1.00/2.00 | 10.9K | 63.1K | 72.6K | 0.864 | claude-fable-5-1 |  |
| agent-a40ce5f603001dfb2 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/2.00/1.25 | 5.3K | 55.4K | 61.6K | 0.89 | claude-sonnet-5-5 |  |
| agent-a419cb405e079eebd | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 5.50/1.00/1.00 | 2.9K | 58.5K | 64.6K | 0.874 | claude-sonnet-5-5 |  |
| agent-a427237bda20da1c1 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 5.9K | 53.2K | 58.8K | 0.855 | claude-fable-5-1 |  |
| agent-a43690b7b4f559332 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/3.00/1.00 | 5.3K | 51.9K | 57.5K | 0.893 | claude-sonnet-5-5 |  |
| agent-a45bff93e43e04144 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 2.7K | 51.2K | 56.6K | 0.858 | claude-sonnet-5-5 |  |
| agent-a569d1581793ebf1b | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 1/2/1 | 5.00/3.50/1.00 | 4.4K | 53.6K | 61.1K | 0.772 | claude-sonnet-5-5 |  |
| agent-a5f0b507d16dd29d8 | mayker-dev:planner | deliver | 5 | 12 | 30 | 2.73 | 1/1/8 | 5.00/2.00/2.12 | 16.4K | 85.6K | 112.4K | 0.891 | claude-opus-5-5 |  |
| agent-a6538f5d4659be15c | mayker-dev:orchestrator | deliver | 5 | 7 | 10 | 1.67 | 2/1/3 | 3.00/1.00/1.00 | 4.3K | 49.7K | 56.4K | 0.837 | claude-fable-5-1 |  |
| agent-a665950dba320f614 | mayker-dev:builder | deliver | 5 | 11 | 19 | 1.9 | 1/1/7 | 4.00/2.00/1.71 | 4.4K | 59.5K | 65.4K | 0.92 | claude-sonnet-5-5 |  |
| agent-a715e4c43bb065e84 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 4.50/4.50/1.00 | 7.5K | 62.1K | 70.5K | 0.868 | claude-sonnet-5-5 |  |
| agent-a7a160709f16708f5 | mayker-dev:builder | deliver | 5 | 10 | 18 | 2.0 | 1/2/6 | 4.00/2.00/1.67 | 4.1K | 59.0K | 64.2K | 0.913 | claude-sonnet-5-5 |  |
| agent-a7b155a46489541d3 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 3.00/1.00/1.67 | 3.8K | 46.3K | 52.2K | 0.857 | claude-fable-5-1 |  |
| agent-a917052ecff5dedc2 | mayker-dev:orchestrator | deliver | 8 | 6 | 7 | 1.75 | 3/0/1 | 1.67/n/a/2.00 | 15.5K | 58.4K | 69.4K | 0.802 | claude-fable-5-1 |  |
| agent-a9c494e715a93d219 | mayker-dev:planner | deliver | 5 | 12 | 29 | 2.64 | 2/2/5 | 3.50/1.50/3.00 | 12.1K | 75.0K | 88.4K | 0.902 | claude-opus-5-5 |  |
| agent-a9ce0beb213b1e516 | mayker-dev:reviewer | deliver | 5 | 6 | 20 | 4.0 | 5/0/0 | 4.00/n/a/n/a | 5.1K | 56.5K | 66.9K | 0.803 | claude-opus-5-5 |  |
| agent-aa071cf367057f340 | mayker-dev:builder | deliver | 5 | 10 | 15 | 1.67 | 2/2/5 | 2.50/1.50/1.40 | 7.5K | 56.5K | 64.1K | 0.909 | claude-sonnet-5-5 |  |
| agent-aa73058b1e26f65b1 | mayker-dev:orchestrator | deliver | 3 | 11 | 29 | 3.22 | 1/2/6 | 4.00/2.00/3.50 | 20.6K | 90.8K | 116.7K | 0.883 | claude-fable-5-1 |  |
| agent-ab31b9729ac6b52f1 | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 4.8K | 47.2K | 65.0K | 0.606 | claude-opus-5-5 |  |
| agent-abc1ab03f5f4ccd66 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.4K | 44.7K | 59.3K | 0.558 | claude-opus-5-5 |  |
| agent-abce3bf034d071302 | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 0/1/2 | n/a/1.00/1.50 | 1.4K | 37.7K | 39.2K | 0.826 | claude-sonnet-5-5 |  |
| agent-abe06eaeb117aa63d | mayker-dev:reviewer | deliver | 5 | 5 | 23 | 5.75 | 4/0/0 | 5.75/n/a/n/a | 5.6K | 58.0K | 72.6K | 0.749 | claude-opus-5-5 |  |
| agent-ac1f972f40ad02f4f | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 2/0/1 | 1.50/n/a/1.00 | 873 | 45.0K | 54.6K | 0.769 | claude-sonnet-5-5 |  |
| agent-ac23e0f068c7040e3 | mayker-dev:planner | deliver | 5 | 11 | 34 | 3.4 | 1/2/7 | 8.00/1.00/3.43 | 16.0K | 91.1K | 116.2K | 0.884 | claude-opus-5-5 |  |
| agent-ac422d739ee79a575 | mayker-dev:planner | deliver | 5 | 13 | 37 | 3.08 | 0/2/10 | n/a/1.00/3.50 | 20.3K | 84.9K | 106.9K | 0.915 | claude-opus-5-5 |  |
| agent-ac6f1d601c5be9798 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 5.7K | 53.4K | 59.0K | 0.855 | claude-fable-5-1 |  |
| agent-ac991923e4db8d2dd | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/2/3 | 4.50/1.50/1.00 | 3.8K | 55.7K | 61.6K | 0.891 | claude-sonnet-5-5 |  |
| agent-ac9c06512953d0d62 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 6.00/2.00/1.00 | 4.2K | 53.7K | 59.0K | 0.78 | claude-fable-5-1 |  |
| agent-aca4630cdf0e7f7d4 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/2/2 | 4.50/5.50/1.00 | 9.0K | 62.1K | 72.0K | 0.864 | claude-sonnet-5-5 |  |
| agent-aeabe35828175c483 | mayker-dev:builder | deliver | 5 | 12 | 20 | 1.82 | 2/1/7 | 2.50/3.00/1.57 | 5.8K | 62.0K | 68.1K | 0.926 | claude-sonnet-5-5 |  |
| agent-aebb8da080d897382 | mayker-dev:builder | deliver | 5 | 10 | 12 | 1.33 | 1/2/6 | 4.00/1.00/1.00 | 3.3K | 48.0K | 51.2K | 0.92 | claude-sonnet-5-5 |  |
| agent-af264e835bff86d78 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 3/2/4 | 2.33/1.50/1.00 | 6.2K | 55.6K | 61.6K | 0.913 | claude-sonnet-5-5 |  |
| agent-af76ad043a1a537e1 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 1/1/2 | 4.00/1.00/1.00 | 1.7K | 56.7K | 63.1K | 0.823 | claude-sonnet-5-5 |  |
| agent-afc425bc11582281e | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 4.1K | 46.9K | 51.7K | 0.816 | claude-fable-5-1 |  |
| agent-aff15cd1a277fc95b | mayker-dev:orchestrator | deliver | 5 | 9 | 15 | 2.14 | 1/2/3 | 4.00/2.00/2.00 | 10.9K | 71.9K | 90.7K | 0.859 | claude-fable-5-1 |  |
| agent-aff6eb6cccb983d17 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 0/0/3 | n/a/n/a/1.67 | 929 | 38.7K | 42.0K | 0.813 | claude-sonnet-5-5 |  |
| agent-affbf2440e2315751 | mayker-dev:reviewer | deliver | 5 | 4 | 9 | 3.0 | 3/0/0 | 3.00/n/a/n/a | 2.2K | 56.0K | 66.9K | 0.742 | claude-opus-5-5 |  |

**49 dispatch(es)** in `deliver` (mayker-dev:builder 24, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 6): median ctx max 64.2K, peak 116.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.2K, 42.0K, 44.5K, 51.2K, 51.7K, 52.2K, 52.6K, 54.6K, 56.4K, 56.6K, 57.5K, 58.8K, 59.0K, 59.0K, 59.1K, 59.3K, 61.1K, 61.1K, 61.6K, 61.6K, 61.6K, 63.1K, 63.3K, 64.1K, 64.2K, 64.6K, 64.7K, 65.0K, 65.4K, 66.9K, 66.9K, 68.1K, 68.3K, 68.4K, 69.4K, 70.5K, 71.8K, 72.0K, 72.6K, 72.6K, 88.4K, 90.7K, 101.0K, 103.0K, 106.9K, 107.0K, 112.4K, 116.2K, 116.7K.

**All runs:** 1 run(s), wall 52m04s (sum of per-run walls, idle time between runs excluded), 569 turns, 1066 tool calls, 438.8K output tokens, cache hit 0.956.

Turn classes across every bucket, read / edit / exec: 87/80/277 turns, 4.01/2.09/1.68 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 37m32s of round trip (command plus model time, ADR 0006 section 2): 72% of wall.

All runs: CI wait: 9m07s in `ci-poll.sh` calls; framework wall (wall less CI wait) 42m56s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
