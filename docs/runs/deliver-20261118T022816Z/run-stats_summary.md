# Run statistics, run

Generated 2026-11-18 03:21 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 44 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 52m54s | 537 | 1059 | 2.28 | 13 | 388.6K |  | 496.9K |  | 0.965 | claude-opus-5-5 | 76/70/261 (exec 70% of wall) | 4.12/2.27/1.76 |  |

Wall is this run's last step end minus its first step start; steps sum to 52m54s.

Exec turns took 37m07s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

CI wait: 8m59s in `ci-poll.sh` calls; framework wall (wall less CI wait) 43m55s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0cc353e0dc62834c | mayker-dev:orchestrator | deliver | 5 | 8 | 23 | 3.29 | 2/1/4 | 5.00/2.00/2.75 | 7.1K | 63.0K | 75.7K | 0.875 | claude-fable-5-2 |  |
| agent-a123408adb1c4dceb | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 5.50/2.00/1.50 | 4.3K | 52.7K | 59.2K | 0.854 | claude-sonnet-5-5 |  |
| agent-a227fb1119fd2f5ba | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/2/2 | 5.50/1.50/1.00 | 3.3K | 54.8K | 61.1K | 0.875 | claude-sonnet-5-5 |  |
| agent-a31487f16ed5f7355 | mayker-dev:orchestrator | deliver | 8 | 5 | 9 | 2.25 | 1/0/3 | 5.00/n/a/1.33 | 7.8K | 54.0K | 59.9K | 0.83 | claude-fable-5-2 |  |
| agent-a4679c6bb07cdee77 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 869 | 40.5K | 46.4K | 0.795 | claude-sonnet-5-5 |  |
| agent-a4ba96e2678f1e41a | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 1/2/2 | 5.00/1.50/1.00 | 2.8K | 50.0K | 54.6K | 0.862 | claude-sonnet-5-5 |  |
| agent-a4bc5477bfe254635 | mayker-dev:orchestrator | deliver | 3 | 13 | 39 | 3.25 | 1/3/7 | 4.00/2.00/3.29 | 13.2K | 98.0K | 119.7K | 0.906 | claude-fable-5-2 |  |
| agent-a4cdb871693089fff | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 7.00/2.00/2.33 | 4.5K | 51.2K | 58.2K | 0.81 | claude-fable-5-2 |  |
| agent-a5ae1b1eb962285e1 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 729 | 38.4K | 45.7K | 0.717 | claude-sonnet-5-5 |  |
| agent-a5ca7f1213c5dba89 | mayker-dev:orchestrator | deliver | 5 | 10 | 22 | 2.44 | 0/2/6 | n/a/2.00/1.83 | 8.7K | 75.5K | 86.2K | 0.886 | claude-fable-5-2 |  |
| agent-a5cd1fe6697940f08 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.5 | 0/1/3 | n/a/2.00/2.67 | 5.1K | 44.5K | 48.5K | 0.818 | claude-fable-5-2 |  |
| agent-a61d89c80afac296d | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 691 | 38.6K | 46.3K | 0.714 | claude-sonnet-5-5 |  |
| agent-a657fc49bcad6fbc5 | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 4.00/2.00/1.00 | 2.2K | 48.1K | 52.8K | 0.835 | claude-sonnet-5-5 |  |
| agent-a683363dca2937f8c | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 2.4K | 51.4K | 58.4K | 0.824 | claude-sonnet-5-5 |  |
| agent-a690e86d0f4d828a8 | mayker-dev:planner | deliver | 5 | 10 | 30 | 3.33 | 1/2/6 | 6.00/1.50/3.50 | 11.4K | 75.7K | 92.8K | 0.895 | claude-opus-5-5 |  |
| agent-a7557bec876ebb369 | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 5.3K | 43.2K | 58.1K | 0.624 | claude-opus-5-5 |  |
| agent-a7d2ede017c836392 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.50/1.50/1.00 | 5.7K | 53.2K | 59.5K | 0.903 | claude-sonnet-5-5 |  |
| agent-a7e4014a06df90573 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 0/1/5 | n/a/2.00/3.20 | 5.3K | 54.0K | 60.1K | 0.875 | claude-fable-5-2 |  |
| agent-a8b00b17493438f6e | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 8.00/2.00/2.00 | 6.1K | 52.6K | 58.7K | 0.855 | claude-fable-5-2 |  |
| agent-a91a0082d74d13213 | mayker-dev:builder | deliver | 5 | 6 | 23 | 4.6 | 2/1/2 | 4.50/12.00/1.00 | 7.0K | 59.8K | 69.5K | 0.843 | claude-sonnet-5-5 |  |
| agent-a9967dd25cb0f8387 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 4.50/10.00/1.00 | 6.7K | 59.5K | 70.1K | 0.84 | claude-sonnet-5-5 |  |
| agent-a9c1859ecf97b55a8 | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 3/2/4 | 2.00/1.50/1.00 | 5.5K | 53.7K | 59.3K | 0.914 | claude-sonnet-5-5 |  |
| agent-aa4a3419eea8f6864 | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 2.00/1.50/1.20 | 6.4K | 53.3K | 60.0K | 0.912 | claude-sonnet-5-5 |  |
| agent-aa6eeff59932e665c | mayker-dev:builder | deliver | 5 | 10 | 16 | 1.78 | 1/1/6 | 4.00/3.00/1.33 | 3.8K | 58.2K | 63.7K | 0.913 | claude-sonnet-5-5 |  |
| agent-aa78238d5533f00d4 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.5K | 45.9K | 64.9K | 0.528 | claude-opus-5-5 |  |
| agent-aab0cb2da1d6c746b | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.2K | 52.1K | 70.7K | 0.706 | claude-opus-5-5 |  |
| agent-ab59079964635c859 | mayker-dev:planner | deliver | 5 | 11 | 35 | 3.5 | 2/2/4 | 7.50/1.50/3.75 | 14.9K | 79.1K | 98.9K | 0.886 | claude-opus-5-5 |  |
| agent-ad2884ae076054da7 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/2/2 | 3.50/3.50/1.00 | 5.0K | 57.6K | 66.9K | 0.834 | claude-sonnet-5-5 |  |
| agent-ad376e8d4d2e106ff | mayker-dev:orchestrator | deliver | 5 | 10 | 21 | 2.33 | 0/4/4 | n/a/1.50/2.25 | 6.0K | 66.7K | 75.3K | 0.908 | claude-fable-5-2 |  |
| agent-ad58a710891660802 | mayker-dev:builder | deliver | 5 | 14 | 24 | 1.85 | 2/1/9 | 3.50/1.00/1.67 | 6.9K | 63.3K | 70.9K | 0.935 | claude-sonnet-5-5 |  |
| agent-ad5c41b0b5e09d3df | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 734 | 39.8K | 49.9K | 0.692 | claude-sonnet-5-5 |  |
| agent-ada970b760840f633 | mayker-dev:planner | deliver | 5 | 15 | 37 | 2.64 | 3/3/6 | 2.67/1.67/2.50 | 14.4K | 85.9K | 107.3K | 0.917 | claude-opus-5-5 |  |
| agent-adb66b59e3d300840 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 3.0 | 1/1/3 | 1.00/2.00/4.00 | 5.0K | 48.9K | 54.6K | 0.878 | claude-fable-5-2 |  |
| agent-adc6e69be6612808d | mayker-dev:orchestrator | deliver | 5 | 8 | 15 | 2.14 | 1/1/5 | 3.00/3.00/1.80 | 7.1K | 54.8K | 66.3K | 0.849 | claude-fable-5-2 |  |
| agent-ae925aeb833a56fe2 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 4.1K | 43.7K | 59.9K | 0.543 | claude-opus-5-5 |  |
| agent-aece3abb0926ba24e | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 6.7K | 50.6K | 66.9K | 0.716 | claude-opus-5-5 |  |
| agent-aed7dc2cd941f3f6a | mayker-dev:planner | deliver | 5 | 13 | 36 | 3.0 | 0/2/8 | n/a/1.00/2.62 | 16.6K | 89.6K | 109.8K | 0.917 | claude-opus-5-5 |  |
| agent-af036f0e610353e89 | mayker-dev:builder | deliver | 5 | 7 | 30 | 5.0 | 2/1/3 | 7.50/11.00/1.33 | 9.3K | 65.8K | 76.9K | 0.833 | claude-sonnet-5-5 |  |
| agent-af08114a084dfce2f | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 961 | 36.6K | 39.0K | 0.765 | claude-sonnet-5-5 |  |
| agent-af13e98214ab09af3 | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 2/2/4 | 3.00/5.00/2.00 | 6.9K | 61.1K | 68.9K | 0.899 | claude-sonnet-5-5 |  |
| agent-afaf497f188549b1a | mayker-dev:planner | deliver | 5 | 10 | 34 | 3.78 | 1/2/5 | 6.00/2.50/2.60 | 18.6K | 82.2K | 104.9K | 0.888 | claude-opus-5-5 |  |
| agent-afc5952106f41f35a | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/3.00/1.00 | 6.6K | 54.2K | 61.0K | 0.889 | claude-sonnet-5-5 |  |
| agent-afd21ed4dd5b4ac8e | mayker-dev:builder | deliver | 5 | 13 | 22 | 1.83 | 2/1/8 | 2.50/3.00/1.62 | 5.3K | 61.8K | 68.2K | 0.931 | claude-sonnet-5-5 |  |
| agent-afef7f0a863e6a238 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.00/2.00/1.25 | 4.4K | 52.4K | 59.1K | 0.89 | claude-sonnet-5-5 |  |

**44 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 11, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 61.1K, peak 119.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.0K, 45.7K, 46.3K, 46.4K, 48.5K, 49.9K, 52.8K, 54.6K, 54.6K, 58.1K, 58.2K, 58.4K, 58.7K, 59.1K, 59.2K, 59.3K, 59.5K, 59.9K, 59.9K, 60.0K, 60.1K, 61.0K, 61.1K, 63.7K, 64.9K, 66.3K, 66.9K, 66.9K, 68.2K, 68.9K, 69.5K, 70.1K, 70.7K, 70.9K, 75.3K, 75.7K, 76.9K, 86.2K, 92.8K, 98.9K, 104.9K, 107.3K, 109.8K, 119.7K.

**All runs:** 1 run(s), wall 52m54s (sum of per-run walls, idle time between runs excluded), 537 turns, 1059 tool calls, 388.6K output tokens, cache hit 0.965.

Turn classes across every bucket, read / edit / exec: 76/70/261 turns, 4.12/2.27/1.76 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 37m07s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

All runs: CI wait: 8m59s in `ci-poll.sh` calls; framework wall (wall less CI wait) 43m55s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
