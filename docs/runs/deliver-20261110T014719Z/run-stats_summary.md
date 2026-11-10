# Run statistics, run

Generated 2026-11-10 02:31 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 45 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 44m23s | 506 | 1022 | 2.35 | 15 | 400.4K |  | 477.8K |  | 0.954 | claude-opus-5-5 | 82/66/253 (exec 83% of wall) | 4.26/2.42/1.80 |  |

Wall is this run's last step end minus its first step start; steps sum to 44m23s.

Exec turns took 36m39s of round trip (command plus model time, ADR 0006 section 2): 83% of wall.

CI wait: 8m58s in `ci-poll.sh` calls; framework wall (wall less CI wait) 35m24s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0110f0c3e12132c3 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 4.9K | 49.3K | 70.9K | 0.584 | claude-opus-5-5 |  |
| agent-a01880ce8eb7b5f54 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 5.00/2.00/1.50 | 5.5K | 65.3K | 74.4K | 0.843 | claude-fable-5-2 |  |
| agent-a0627369dcaf00dbb | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 1/2/3 | 6.00/3.00/1.00 | 4.3K | 52.1K | 56.5K | 0.881 | claude-sonnet-5-5 |  |
| agent-a0877907237935c98 | mayker-dev:builder | deliver | 5 | 13 | 27 | 2.25 | 1/1/9 | 3.00/5.00/2.00 | 5.8K | 64.0K | 72.1K | 0.929 | claude-sonnet-5-5 |  |
| agent-a0e5b10cdf62c1541 | mayker-dev:orchestrator | deliver | 5 | 7 | 10 | 2.0 | 2/1/2 | 3.00/2.00/1.00 | 3.9K | 50.0K | 55.5K | 0.841 | claude-fable-5-2 |  |
| agent-a1b4225b525d6d330 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 8.00/2.00/1.67 | 5.2K | 53.6K | 59.6K | 0.854 | claude-fable-5-2 |  |
| agent-a1ee029c4f81fa106 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 1/3/2 | 5.00/2.33/1.00 | 4.0K | 53.3K | 58.5K | 0.878 | claude-sonnet-5-5 |  |
| agent-a258df83e9a6808ee | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 3.6K | 45.7K | 61.6K | 0.551 | claude-opus-5-5 |  |
| agent-a265db9691ea45eca | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 2/1/3 | 2.50/2.00/1.33 | 4.8K | 55.5K | 64.0K | 0.869 | claude-sonnet-5-5 |  |
| agent-a2919aea590adc834 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 2/1/1 | 5.50/2.00/1.00 | 2.8K | 55.7K | 63.4K | 0.819 | claude-sonnet-5-5 |  |
| agent-a2c2101c4d4c13656 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.6K | 50.7K | 55.3K | 0.86 | claude-fable-5-2 |  |
| agent-a2cee14644cf70019 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.00/3.00/1.25 | 5.4K | 53.4K | 60.4K | 0.889 | claude-sonnet-5-5 |  |
| agent-a49e180ecadbd4619 | mayker-dev:builder | deliver | 5 | 11 | 32 | 3.2 | 3/2/5 | 4.67/6.50/1.00 | 9.6K | 66.9K | 75.0K | 0.916 | claude-sonnet-5-5 |  |
| agent-a4beea163690a26cc | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 1/3/4 | 7.00/1.67/1.00 | 4.4K | 55.3K | 60.4K | 0.905 | claude-sonnet-5-5 |  |
| agent-a55c11300218b9e03 | mayker-dev:planner | deliver | 5 | 13 | 43 | 3.58 | 3/2/7 | 5.33/1.00/3.57 | 23.9K | 102.6K | 132.4K | 0.911 | claude-opus-5-5 |  |
| agent-a57375c17929beebe | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.00/2.00/1.25 | 5.1K | 53.7K | 60.7K | 0.889 | claude-sonnet-5-5 |  |
| agent-a5ebdc67028658b3b | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.00/2.00/1.50 | 3.0K | 49.6K | 55.6K | 0.813 | claude-fable-5-2 |  |
| agent-a63ec358440194d51 | mayker-dev:builder | deliver | 5 | 7 | 24 | 4.0 | 2/2/2 | 3.50/6.00/2.50 | 7.1K | 61.4K | 72.7K | 0.831 | claude-sonnet-5-5 |  |
| agent-a69eba3205c077a34 | mayker-dev:planner | deliver | 5 | 15 | 40 | 2.86 | 0/3/11 | n/a/2.00/3.09 | 18.3K | 83.5K | 104.4K | 0.917 | claude-opus-5-5 |  |
| agent-a6db15fc3972002a8 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 4.2K | 51.7K | 57.9K | 0.855 | claude-fable-5-2 |  |
| agent-a719c9bf7c9a24c2d | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 5.6K | 52.3K | 67.4K | 0.678 | claude-opus-5-5 |  |
| agent-a772faaeeb5feb2b3 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 46.3K | 56.4K | 0.766 | claude-sonnet-5-5 |  |
| agent-a79b0ff76108f2683 | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/2/2 | 3.00/3.50/1.00 | 5.1K | 58.7K | 66.4K | 0.838 | claude-sonnet-5-5 |  |
| agent-a7fef6165550a929c | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 1/0/2 | 1.00/n/a/2.00 | 956 | 46.4K | 57.0K | 0.763 | claude-sonnet-5-5 |  |
| agent-a809e06fd768afc9d | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/2/2 | 4.00/2.00/4.00 | 7.7K | 79.9K | 100.8K | 0.82 | claude-fable-5-2 |  |
| agent-a820e0bb16437a64f | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 823 | 44.2K | 60.3K | 0.644 | claude-sonnet-5-5 |  |
| agent-a8513fc3316c40046 | mayker-dev:reviewer | deliver | 5 | 5 | 18 | 4.5 | 4/0/0 | 4.50/n/a/n/a | 5.7K | 54.2K | 67.5K | 0.785 | claude-opus-5-5 |  |
| agent-a943b27277b30ba89 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 8.00/2.00/1.33 | 4.5K | 54.5K | 60.4K | 0.854 | claude-fable-5-2 |  |
| agent-a98431e1954740e89 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/2/3 | 2.50/3.00/1.00 | 6.6K | 55.7K | 63.2K | 0.887 | claude-sonnet-5-5 |  |
| agent-aa238094d4c642511 | mayker-dev:planner | deliver | 5 | 14 | 34 | 2.62 | 1/2/9 | 6.00/2.00/1.89 | 14.7K | 84.3K | 104.5K | 0.911 | claude-opus-5-5 |  |
| agent-aa3bf24160ad84ef7 | mayker-dev:builder | deliver | 5 | 9 | 21 | 2.62 | 2/3/3 | 4.00/3.33/1.00 | 7.4K | 63.1K | 71.1K | 0.898 | claude-sonnet-5-5 |  |
| agent-aa416fb493a6768ce | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.50/3.00/1.25 | 6.0K | 54.4K | 61.8K | 0.888 | claude-sonnet-5-5 |  |
| agent-aae00035d90ded41c | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 8.00/2.00/2.00 | 5.2K | 55.0K | 61.9K | 0.812 | claude-fable-5-2 |  |
| agent-ab1228818f8de90dc | mayker-dev:builder | deliver | 5 | 6 | 17 | 3.4 | 2/1/2 | 4.50/6.00/1.00 | 7.5K | 59.7K | 70.4K | 0.84 | claude-sonnet-5-5 |  |
| agent-ab62097bb7c902793 | mayker-dev:orchestrator | deliver | 8 | 2 | 6 | 6.0 | 1/0/0 | 6.00/n/a/n/a | 7.7K | 50.3K | 61.1K | 0.536 | claude-fable-5-2 |  |
| agent-ac86c8e33e90bd95e | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 47.2K | 61.1K | 0.746 | claude-sonnet-5-5 |  |
| agent-ace3ea9ebccf62379 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 6.00/2.00/1.00 | 3.0K | 50.6K | 55.4K | 0.781 | claude-fable-5-2 |  |
| agent-ad7559be9becda23d | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 858 | 44.6K | 61.4K | 0.639 | claude-sonnet-5-5 |  |
| agent-adf4a753881bfcce5 | mayker-dev:reviewer | deliver | 5 | 5 | 25 | 8.33 | 3/0/0 | 8.33/n/a/n/a | 10.8K | 59.3K | 75.9K | 0.776 | claude-opus-5-5 |  |
| agent-aead9c1d066909504 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 8.00/2.00/2.00 | 6.2K | 57.9K | 66.3K | 0.846 | claude-fable-5-2 |  |
| agent-aeba8918c5b035a31 | mayker-dev:planner | deliver | 5 | 13 | 36 | 3.0 | 1/2/8 | 8.00/2.00/2.38 | 18.0K | 81.6K | 103.2K | 0.915 | claude-opus-5-5 |  |
| agent-af3b1079de6c79282 | mayker-dev:planner | deliver | 5 | 12 | 32 | 2.91 | 1/2/7 | 1.00/1.50/3.00 | 12.5K | 76.3K | 90.5K | 0.915 | claude-opus-5-5 |  |
| agent-af8e9840fa222774e | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 4.00/2.00/2.75 | 3.4K | 60.1K | 67.3K | 0.871 | claude-sonnet-5-5 |  |
| agent-afcd420772f2c21f0 | mayker-dev:orchestrator | deliver | 3 | 11 | 19 | 1.9 | 1/3/6 | 4.00/1.00/2.00 | 9.3K | 77.4K | 90.8K | 0.893 | claude-fable-5-2 |  |
| agent-aff50af0306ec3f5a | mayker-dev:builder | deliver | 5 | 17 | 34 | 2.12 | 2/1/12 | 3.50/2.00/2.00 | 8.1K | 66.6K | 75.5K | 0.945 | claude-sonnet-5-5 |  |

**45 dispatch(es)** in `deliver` (mayker-dev:builder 22, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 63.4K, peak 132.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 55.3K, 55.4K, 55.5K, 55.6K, 56.4K, 56.5K, 57.0K, 57.9K, 58.5K, 59.6K, 60.3K, 60.4K, 60.4K, 60.4K, 60.7K, 61.1K, 61.1K, 61.4K, 61.6K, 61.8K, 61.9K, 63.2K, 63.4K, 64.0K, 66.3K, 66.4K, 67.3K, 67.4K, 67.5K, 70.4K, 70.9K, 71.1K, 72.1K, 72.7K, 74.4K, 75.0K, 75.5K, 75.9K, 90.5K, 90.8K, 100.8K, 103.2K, 104.4K, 104.5K, 132.4K.

**All runs:** 1 run(s), wall 44m23s (sum of per-run walls, idle time between runs excluded), 506 turns, 1022 tool calls, 400.4K output tokens, cache hit 0.954.

Turn classes across every bucket, read / edit / exec: 82/66/253 turns, 4.26/2.42/1.80 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 36m39s of round trip (command plus model time, ADR 0006 section 2): 83% of wall.

All runs: CI wait: 8m58s in `ci-poll.sh` calls; framework wall (wall less CI wait) 35m24s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
