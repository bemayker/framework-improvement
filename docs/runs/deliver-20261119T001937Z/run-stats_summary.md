# Run statistics, run

Generated 2026-11-19 00:59 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 40m24s | 546 | 1076 | 2.24 | 15 | 391.4K |  | 524.4K |  | 0.964 | claude-opus-5-5 | 79/70/297 (exec 84% of wall) | 4.11/2.29/1.75 |  |

Wall is this run's last step end minus its first step start; steps sum to 40m24s.

Exec turns took 33m51s of round trip (command plus model time, ADR 0006 section 2): 84% of wall.

CI wait: 6m50s in `ci-poll.sh` calls; framework wall (wall less CI wait) 33m33s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a024fd17170194431 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 1/1/4 | 5.00/2.00/3.25 | 5.0K | 51.2K | 57.7K | 0.874 | claude-fable-5-2 |  |
| agent-a082c0fd40315722b | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 5.2K | 48.6K | 62.4K | 0.679 | claude-opus-5-5 |  |
| agent-a094770cf11608373 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/1/5 | 2.50/2.00/1.00 | 5.1K | 54.8K | 62.2K | 0.901 | claude-sonnet-5-5 |  |
| agent-a1371b8673cfb1b71 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 2.00/n/a/1.00 | 790 | 40.7K | 45.4K | 0.736 | claude-sonnet-5-5 |  |
| agent-a1a73e6bf674cfd9f | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 1/1/6 | 3.00/2.00/1.67 | 5.0K | 57.8K | 64.5K | 0.901 | claude-sonnet-5-5 |  |
| agent-a21b34e9b44f0d84b | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 2/1/3 | 2.50/2.00/1.33 | 4.3K | 51.6K | 58.2K | 0.875 | claude-sonnet-5-5 |  |
| agent-a220424c8657b56c9 | mayker-dev:planner | deliver | 5 | 12 | 32 | 2.91 | 1/2/8 | 6.00/1.00/3.00 | 15.8K | 90.2K | 110.5K | 0.898 | claude-opus-5-5 |  |
| agent-a2b67667e5ca6b654 | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 0/1/3 | n/a/2.00/3.67 | 4.4K | 47.5K | 53.3K | 0.829 | claude-fable-5-2 |  |
| agent-a2e11e36b884b9ed6 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 2.00/n/a/1.00 | 679 | 40.0K | 44.8K | 0.737 | claude-sonnet-5-5 |  |
| agent-a3179007ee81b91b3 | mayker-dev:orchestrator | deliver | 3 | 13 | 26 | 2.17 | 2/3/7 | 2.50/2.00/2.14 | 11.0K | 79.3K | 94.1K | 0.909 | claude-fable-5-2 |  |
| agent-a325ea7355b799ec3 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 3.6K | 44.9K | 50.0K | 0.814 | claude-fable-5-2 |  |
| agent-a427ab8fe07498ecb | mayker-dev:orchestrator | deliver | 8 | 4 | 8 | 2.67 | 1/0/2 | 5.00/n/a/1.50 | 6.8K | 52.6K | 59.0K | 0.787 | claude-fable-5-2 |  |
| agent-a42fc573d58128da1 | mayker-dev:reviewer | deliver | 5 | 4 | 25 | 8.33 | 3/0/0 | 8.33/n/a/n/a | 7.4K | 53.8K | 72.0K | 0.709 | claude-opus-5-5 |  |
| agent-a4de76ae33d80b207 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 3.6K | 45.6K | 50.8K | 0.814 | claude-fable-5-2 |  |
| agent-a512d93ffd07e2d40 | mayker-dev:builder | deliver | 5 | 8 | 18 | 2.57 | 1/2/4 | 4.00/5.00/1.00 | 6.6K | 58.8K | 66.0K | 0.888 | claude-sonnet-5-5 |  |
| agent-a5914b364cc90ca2b | mayker-dev:planner | deliver | 5 | 11 | 26 | 2.6 | 1/1/7 | 4.00/2.00/2.00 | 11.8K | 79.8K | 99.6K | 0.887 | claude-opus-5-5 |  |
| agent-a6cc76e46e772573d | mayker-dev:builder | deliver | 5 | 24 | 38 | 1.65 | 4/2/16 | 2.75/2.00/1.38 | 7.8K | 63.1K | 74.4K | 0.96 | claude-sonnet-5-5 |  |
| agent-a709daf3c733eb5b9 | mayker-dev:builder | deliver | 5 | 5 | 26 | 6.5 | 1/1/2 | 4.00/15.00/3.50 | 7.9K | 58.9K | 71.5K | 0.757 | claude-sonnet-5-5 |  |
| agent-a71ae701e8c9d95c3 | mayker-dev:planner | deliver | 5 | 14 | 37 | 2.85 | 2/2/9 | 3.50/1.50/3.00 | 14.0K | 88.9K | 106.8K | 0.925 | claude-opus-5-5 |  |
| agent-a73f6992249d7ca11 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 5.6K | 43.5K | 59.8K | 0.543 | claude-opus-5-5 |  |
| agent-a7c2abc3e536adec8 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.00/5.00/1.00 | 6.0K | 56.4K | 63.6K | 0.872 | claude-sonnet-5-5 |  |
| agent-a807d3e8bca522114 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 4.00/2.00/1.00 | 2.7K | 51.3K | 57.2K | 0.857 | claude-sonnet-5-5 |  |
| agent-a89472e2869e27db1 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 2.7K | 44.0K | 48.9K | 0.836 | claude-fable-5-2 |  |
| agent-a9bc9d498eb28b611 | mayker-dev:builder | deliver | 5 | 13 | 24 | 2.0 | 2/1/8 | 3.50/3.00/1.62 | 5.1K | 59.5K | 65.6K | 0.932 | claude-sonnet-5-5 |  |
| agent-aa092424399a1e680 | mayker-dev:builder | deliver | 5 | 7 | 24 | 4.0 | 2/2/2 | 5.50/5.50/1.00 | 7.9K | 63.9K | 73.8K | 0.864 | claude-sonnet-5-5 |  |
| agent-aa832544dc281edf6 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 411 | 37.7K | 43.1K | 0.603 | claude-sonnet-5-5 |  |
| agent-aa84d7953fc117535 | mayker-dev:orchestrator | deliver | 5 | 13 | 26 | 2.17 | 1/3/7 | 4.00/1.00/2.57 | 8.0K | 76.9K | 89.5K | 0.91 | claude-fable-5-2 |  |
| agent-aafb9f79f65f0ca52 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 1/3/3 | 5.00/1.00/1.00 | 3.2K | 51.4K | 55.7K | 0.896 | claude-sonnet-5-5 |  |
| agent-ab5a619ca1084a7a7 | mayker-dev:planner | deliver | 5 | 14 | 36 | 2.77 | 1/2/9 | 5.00/1.50/2.22 | 23.1K | 84.0K | 108.7K | 0.919 | claude-opus-5-5 |  |
| agent-ab93dbe9ae43dc512 | mayker-dev:planner | deliver | 5 | 13 | 30 | 2.5 | 2/3/6 | 3.50/1.33/2.17 | 15.9K | 78.5K | 97.9K | 0.917 | claude-opus-5-5 |  |
| agent-abb75d2673a7f0805 | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 2/1/3 | 2.50/2.00/1.33 | 4.4K | 51.4K | 57.9K | 0.876 | claude-sonnet-5-5 |  |
| agent-abba5a385cedbea13 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 7.00/1.00/1.00 | 2.8K | 49.3K | 54.0K | 0.833 | claude-fable-5-2 |  |
| agent-abc8f6d9d09d83463 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 594 | 39.5K | 46.7K | 0.576 | claude-sonnet-5-5 |  |
| agent-ac17426cbfeaee05f | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 554 | 37.3K | 42.3K | 0.61 | claude-sonnet-5-5 |  |
| agent-ac58904724ec2d3e1 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 3.1K | 45.6K | 50.6K | 0.862 | claude-fable-5-2 |  |
| agent-ac7b4c870844fd781 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 6.3K | 50.2K | 64.9K | 0.677 | claude-opus-5-5 |  |
| agent-ad1e2ba6ffd09ea52 | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 5.3K | 43.2K | 58.4K | 0.622 | claude-opus-5-5 |  |
| agent-ad619e0977c5f2edd | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 6.00/2.00/1.00 | 3.2K | 57.5K | 65.5K | 0.848 | claude-sonnet-5-5 |  |
| agent-adc718732e535068a | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 0/1/6 | n/a/1.00/2.67 | 5.0K | 48.3K | 53.1K | 0.896 | claude-fable-5-2 |  |
| agent-ade66e48f2af0b99a | mayker-dev:builder | deliver | 5 | 6 | 8 | 1.6 | 1/1/3 | 4.00/1.00/1.00 | 2.4K | 54.0K | 59.9K | 0.856 | claude-sonnet-5-5 |  |
| agent-ae22e52a5b3a74b0a | mayker-dev:builder | deliver | 5 | 6 | 23 | 4.6 | 2/2/1 | 5.50/5.50/1.00 | 6.6K | 59.7K | 69.9K | 0.842 | claude-sonnet-5-5 |  |
| agent-ae7a6fb7e818f3609 | mayker-dev:builder | deliver | 5 | 15 | 28 | 2.0 | 1/1/11 | 4.00/2.00/1.91 | 6.5K | 62.3K | 69.3K | 0.94 | claude-sonnet-5-5 |  |
| agent-af94fabdc7cc1682a | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 8.00/2.00/2.00 | 5.1K | 50.0K | 55.8K | 0.857 | claude-fable-5-2 |  |
| agent-afa806951866f3fd0 | mayker-dev:orchestrator | deliver | 5 | 8 | 22 | 3.14 | 1/2/3 | 8.00/2.00/3.00 | 5.9K | 56.9K | 64.9K | 0.857 | claude-fable-5-2 |  |
| agent-afcd1e7e75fa3cbbd | mayker-dev:builder | deliver | 5 | 12 | 21 | 1.91 | 1/1/8 | 4.00/2.00/1.75 | 4.8K | 60.2K | 65.6K | 0.927 | claude-sonnet-5-5 |  |
| agent-afcfab16ba64a8de0 | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/2/3 | 3.00/3.00/1.00 | 4.6K | 56.6K | 63.5K | 0.86 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 62.3K, peak 110.5K, 0 above the auto threshold (80% of the serving model's window). Distribution: 42.3K, 43.1K, 44.8K, 45.4K, 46.7K, 48.9K, 50.0K, 50.6K, 50.8K, 53.1K, 53.3K, 54.0K, 55.7K, 55.8K, 57.2K, 57.7K, 57.9K, 58.2K, 58.4K, 59.0K, 59.8K, 59.9K, 62.2K, 62.4K, 63.5K, 63.6K, 64.5K, 64.9K, 64.9K, 65.5K, 65.6K, 65.6K, 66.0K, 69.3K, 69.9K, 71.5K, 72.0K, 73.8K, 74.4K, 89.5K, 94.1K, 97.9K, 99.6K, 106.8K, 108.7K, 110.5K.

**All runs:** 1 run(s), wall 40m24s (sum of per-run walls, idle time between runs excluded), 546 turns, 1076 tool calls, 391.4K output tokens, cache hit 0.964.

Turn classes across every bucket, read / edit / exec: 79/70/297 turns, 4.11/2.29/1.75 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m51s of round trip (command plus model time, ADR 0006 section 2): 84% of wall.

All runs: CI wait: 6m50s in `ci-poll.sh` calls; framework wall (wall less CI wait) 33m33s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
