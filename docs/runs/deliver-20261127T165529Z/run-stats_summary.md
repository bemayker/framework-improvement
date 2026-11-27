# Run statistics, run

Generated 2026-11-27 17:36 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 44 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 41m12s | 553 | 1082 | 2.24 | 14 | 393.4K |  | 449.6K |  | 0.962 | claude-opus-5-5 | 76/87/262 (exec 69% of wall) | 3.58/2.33/1.86 |  |

Wall is this run's last step end minus its first step start; steps sum to 41m12s.

Exec turns took 28m16s of round trip (command plus model time, ADR 0006 section 2): 69% of wall.

CI wait: 4m48s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m24s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a00d05a2d6a89a8c5 | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 572 | 35.6K | 38.4K | 0.646 | claude-sonnet-5-5 |  |
| agent-a01f1f1c833ffc445 | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 1/2/2 | 4.00/2.50/1.00 | 2.9K | 51.5K | 56.9K | 0.859 | claude-sonnet-5-5 |  |
| agent-a04d12fefd3f115db | mayker-dev:orchestrator | deliver | 3 | 9 | 26 | 3.25 | 1/4/3 | 4.00/2.50/4.00 | 9.2K | 88.1K | 105.9K | 0.866 | claude-fable-5-2 |  |
| agent-a06e1f3644fd8704f | mayker-dev:orchestrator | deliver | 5 | 9 | 21 | 2.62 | 0/2/5 | n/a/1.00/2.40 | 6.3K | 80.8K | 95.4K | 0.889 | claude-fable-5-2 |  |
| agent-a0f6221cee683713c | mayker-dev:planner | deliver | 5 | 12 | 34 | 3.09 | 0/2/7 | n/a/1.50/3.14 | 13.9K | 91.4K | 116.5K | 0.894 | claude-opus-5-5 |  |
| agent-a16e16af9721360a6 | mayker-dev:orchestrator | deliver | 5 | 7 | 21 | 3.5 | 0/1/5 | n/a/2.00/3.80 | 6.4K | 54.9K | 63.5K | 0.868 | claude-fable-5-2 |  |
| agent-a1759961399a41177 | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 2/2/4 | 5.50/4.00/1.25 | 5.4K | 61.5K | 69.0K | 0.899 | claude-sonnet-5-5 |  |
| agent-a2b17d33cae8e4d7e | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 3.00/2.00/1.25 | 4.7K | 48.8K | 54.5K | 0.894 | claude-sonnet-5-5 |  |
| agent-a2b81603e583ba222 | mayker-dev:builder | deliver | 5 | 11 | 18 | 1.8 | 2/1/7 | 2.50/3.00/1.43 | 3.9K | 56.3K | 61.3K | 0.922 | claude-sonnet-5-5 |  |
| agent-a2f80a2307ef72d9d | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 1/2/3 | 4.00/5.50/2.33 | 6.9K | 58.6K | 66.6K | 0.87 | claude-sonnet-5-5 |  |
| agent-a3e28a91460c2d273 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 3.00/5.00/1.00 | 5.9K | 54.7K | 66.5K | 0.838 | claude-sonnet-5-5 |  |
| agent-a4a58c79075ffb7ac | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 1/2/4 | 6.00/3.00/1.00 | 4.9K | 59.9K | 66.6K | 0.861 | claude-sonnet-5-5 |  |
| agent-a501e63820f6f90c5 | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 0/1/3 | n/a/3.00/4.00 | 5.0K | 50.6K | 57.1K | 0.825 | claude-fable-5-2 |  |
| agent-a511b85fef0715023 | mayker-dev:builder | deliver | 5 | 7 | 29 | 4.83 | 2/1/3 | 7.00/11.00/1.33 | 8.9K | 62.3K | 74.1K | 0.83 | claude-sonnet-5-5 |  |
| agent-a5ea164fa43959233 | mayker-dev:orchestrator | deliver | 8 | 3 | 8 | 4.0 | 0/0/2 | n/a/n/a/4.00 | 9.1K | 53.0K | 62.4K | 0.701 | claude-fable-5-2 |  |
| agent-a6c79c55310282951 | mayker-dev:orchestrator | deliver | 5 | 8 | 22 | 3.14 | 0/2/4 | n/a/2.00/3.00 | 9.8K | 96.4K | 119.8K | 0.864 | claude-fable-5-2 |  |
| agent-a728ff8682c0d1b1e | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 4.3K | 47.4K | 59.0K | 0.738 | claude-opus-5-5 |  |
| agent-a74fdcdcb749805b0 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 0/1/3 | n/a/3.00/2.67 | 4.6K | 62.1K | 74.3K | 0.801 | claude-fable-5-2 |  |
| agent-a7a2428454772327d | mayker-dev:builder | deliver | 5 | 12 | 22 | 2.0 | 2/1/8 | 2.00/3.00/1.88 | 5.9K | 62.7K | 71.0K | 0.923 | claude-sonnet-5-5 |  |
| agent-a7c8193618a8f902f | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 7.00/1.00/2.00 | 5.5K | 56.6K | 63.6K | 0.872 | claude-fable-5-2 |  |
| agent-a81491361908d68b0 | mayker-dev:planner | deliver | 5 | 10 | 33 | 3.67 | 0/1/7 | n/a/2.00/3.71 | 13.3K | 93.1K | 125.0K | 0.88 | claude-opus-5-5 |  |
| agent-a81ec3ca07df7c3c1 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 4.0K | 43.6K | 59.3K | 0.547 | claude-opus-5-5 |  |
| agent-a9a54a49753634a19 | mayker-dev:orchestrator | deliver | 5 | 11 | 21 | 2.1 | 2/1/6 | 4.00/1.00/1.67 | 6.2K | 59.2K | 68.5K | 0.895 | claude-fable-5-2 |  |
| agent-a9b610f7897a5415f | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 901 | 39.2K | 46.4K | 0.718 | claude-sonnet-5-5 |  |
| agent-aa043f6eedf27919e | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 1/1/2 | 7.00/2.00/2.00 | 4.2K | 48.5K | 55.5K | 0.771 | claude-fable-5-2 |  |
| agent-aa601b9791baa3e47 | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 4.00/1.00/1.00 | 2.5K | 58.0K | 64.9K | 0.851 | claude-sonnet-5-5 |  |
| agent-aa750ee7bbbec9b26 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 1/1/2 | 1.00/2.00/2.00 | 1.5K | 42.5K | 47.3K | 0.839 | claude-sonnet-5-5 |  |
| agent-aad53ee1c14a6bdcc | mayker-dev:planner | deliver | 5 | 11 | 36 | 3.6 | 1/1/6 | 1.00/2.00/4.50 | 15.5K | 84.8K | 123.2K | 0.882 | claude-opus-5-5 |  |
| agent-ab6b7cf416d94286e | mayker-dev:builder | deliver | 5 | 10 | 15 | 1.67 | 3/2/4 | 2.00/1.50/1.50 | 6.5K | 56.8K | 63.6K | 0.911 | claude-sonnet-5-5 |  |
| agent-ab72d8ad54362ed25 | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/1/4 | 4.50/2.00/1.25 | 3.9K | 56.2K | 61.8K | 0.892 | claude-sonnet-5-5 |  |
| agent-ab7ce3e8b8886eebf | mayker-dev:builder | deliver | 5 | 15 | 25 | 1.79 | 2/1/11 | 2.50/1.00/1.73 | 6.8K | 62.4K | 69.0K | 0.94 | claude-sonnet-5-5 |  |
| agent-ab9b271f865308acb | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 517 | 35.6K | 38.3K | 0.648 | claude-sonnet-5-5 |  |
| agent-ac2b655166b0a9511 | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 2.00/1.50/1.20 | 6.0K | 53.2K | 60.0K | 0.912 | claude-sonnet-5-5 |  |
| agent-acd7bada92cc635cc | mayker-dev:planner | deliver | 5 | 14 | 40 | 3.08 | 0/3/9 | n/a/1.33/2.67 | 20.0K | 97.0K | 122.5K | 0.919 | claude-opus-5-5 |  |
| agent-acf30cdf5e849bf64 | mayker-dev:builder | deliver | 5 | 11 | 28 | 2.8 | 2/5/3 | 5.00/2.60/1.67 | 9.1K | 64.4K | 73.7K | 0.915 | claude-sonnet-5-5 |  |
| agent-ad4b6cf5648729d08 | mayker-dev:reviewer | deliver | 5 | 3 | 21 | 10.5 | 2/0/0 | 10.50/n/a/n/a | 6.6K | 46.2K | 65.5K | 0.527 | claude-opus-5-5 |  |
| agent-adb1f12142d14be20 | mayker-dev:reviewer | deliver | 5 | 5 | 19 | 4.75 | 4/0/0 | 4.75/n/a/n/a | 5.2K | 51.9K | 63.1K | 0.793 | claude-opus-5-5 |  |
| agent-ae0135de85b152fe5 | mayker-dev:builder | deliver | 5 | 10 | 16 | 1.78 | 2/2/5 | 2.50/1.50/1.60 | 5.9K | 52.7K | 59.5K | 0.912 | claude-sonnet-5-5 |  |
| agent-ae61005e685be0679 | mayker-dev:planner | deliver | 5 | 13 | 40 | 3.33 | 0/2/8 | n/a/1.50/3.62 | 16.0K | 87.1K | 113.7K | 0.9 | claude-opus-5-5 |  |
| agent-aea9510b21a887021 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 6.0K | 51.8K | 66.9K | 0.722 | claude-opus-5-5 |  |
| agent-aef78f00934031cba | mayker-dev:builder | deliver | 5 | 13 | 29 | 2.42 | 2/3/7 | 4.00/3.67/1.43 | 8.7K | 68.3K | 76.4K | 0.929 | claude-sonnet-5-5 |  |
| agent-afba7672eb24e116b | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 0/1/3 | n/a/2.00/2.33 | 5.4K | 67.7K | 80.9K | 0.801 | claude-fable-5-2 |  |
| agent-afc02d0c358e46652 | mayker-dev:builder | deliver | 5 | 9 | 25 | 3.12 | 2/3/3 | 4.50/4.33/1.00 | 8.3K | 66.9K | 76.3K | 0.895 | claude-sonnet-5-5 |  |
| agent-afd5647fea2bb3086 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 868 | 39.4K | 46.6K | 0.718 | claude-sonnet-5-5 |  |

**44 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 11, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 66.0K, peak 125.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.3K, 38.4K, 46.4K, 46.6K, 47.3K, 54.5K, 55.5K, 56.9K, 57.1K, 59.0K, 59.3K, 59.5K, 60.0K, 61.3K, 61.8K, 62.4K, 63.1K, 63.5K, 63.6K, 63.6K, 64.9K, 65.5K, 66.5K, 66.6K, 66.6K, 66.9K, 68.5K, 69.0K, 69.0K, 71.0K, 73.7K, 74.1K, 74.3K, 76.3K, 76.4K, 80.9K, 95.4K, 105.9K, 113.7K, 116.5K, 119.8K, 122.5K, 123.2K, 125.0K.

**All runs:** 1 run(s), wall 41m12s (sum of per-run walls, idle time between runs excluded), 553 turns, 1082 tool calls, 393.4K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 76/87/262 turns, 3.58/2.33/1.86 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 28m16s of round trip (command plus model time, ADR 0006 section 2): 69% of wall.

All runs: CI wait: 4m48s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m24s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
