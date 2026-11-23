# Run statistics, run

Generated 2026-11-23 15:46 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 42m08s | 580 | 1191 | 2.32 | 16 | 424.2K |  | 513.0K |  | 0.964 | claude-opus-5-5 | 87/92/284 (exec 74% of wall) | 3.74/2.28/1.92 |  |

Wall is this run's last step end minus its first step start; steps sum to 42m08s.

Exec turns took 31m19s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

CI wait: 6m17s in `ci-poll.sh` calls; framework wall (wall less CI wait) 35m50s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a016e06865566def8 | mayker-dev:builder | deliver | 5 | 13 | 18 | 1.5 | 2/5/5 | 3.00/1.40/1.00 | 5.4K | 56.9K | 62.7K | 0.934 | claude-sonnet-5-5 |  |
| agent-a02d83b77ab64b890 | mayker-dev:reviewer | deliver | 5 | 4 | 24 | 8.0 | 3/0/0 | 8.00/n/a/n/a | 7.6K | 50.9K | 69.3K | 0.709 | claude-opus-5-5 |  |
| agent-a074ce1699ad9b281 | mayker-dev:orchestrator | deliver | 3 | 13 | 33 | 2.75 | 1/3/7 | 4.00/1.33/2.86 | 12.2K | 98.1K | 118.2K | 0.907 | claude-fable-5-2 |  |
| agent-a07afce9cfdaaa57f | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 1/1/5 | 3.00/2.00/1.60 | 5.3K | 55.9K | 62.8K | 0.89 | claude-sonnet-5-5 |  |
| agent-a09ed3b643f4e0d33 | mayker-dev:builder | deliver | 5 | 14 | 30 | 2.31 | 1/1/11 | 4.00/3.00/2.09 | 7.2K | 68.3K | 76.7K | 0.934 | claude-sonnet-5-5 |  |
| agent-a20f8d77b0413f46a | mayker-dev:builder | deliver | 5 | 10 | 21 | 2.33 | 1/2/6 | 3.00/4.00/1.67 | 6.6K | 67.0K | 76.7K | 0.885 | claude-sonnet-5-5 |  |
| agent-a295f7eebadcc1448 | general-purpose | deliver | 5 | 5 | 15 | 3.75 | 0/0/0 | n/a/n/a/n/a | 4.6K | 70.4K | 114.1K | 0.676 | claude-opus-5-5 |  |
| agent-a2da0ea7737d95daa | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 787 | 39.2K | 46.4K | 0.724 | claude-sonnet-5-5 |  |
| agent-a34b9d57e3b854cda | mayker-dev:builder | deliver | 5 | 12 | 20 | 1.82 | 2/1/7 | 2.50/3.00/1.57 | 5.1K | 58.7K | 65.1K | 0.927 | claude-sonnet-5-5 |  |
| agent-a358078e8da162bad | mayker-dev:orchestrator | deliver | 5 | 10 | 26 | 2.89 | 0/3/5 | n/a/1.33/3.20 | 7.7K | 81.5K | 95.6K | 0.883 | claude-fable-5-2 |  |
| agent-a3c951aefb3968b4b | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 5.00/1.00/2.00 | 5.5K | 59.9K | 66.0K | 0.874 | claude-fable-5-2 |  |
| agent-a4222c4dd5fed69a5 | mayker-dev:planner | deliver | 5 | 11 | 33 | 3.3 | 1/1/7 | 3.00/2.00/3.29 | 11.9K | 80.0K | 101.6K | 0.9 | claude-opus-5-5 |  |
| agent-a48b4c8be8211e24a | mayker-dev:planner | deliver | 5 | 13 | 41 | 3.42 | 2/2/7 | 4.00/1.50/3.71 | 19.2K | 91.4K | 119.7K | 0.911 | claude-opus-5-5 |  |
| agent-a49e219793ed9685b | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 7.2K | 47.9K | 60.9K | 0.682 | claude-opus-5-5 |  |
| agent-a4bbe0df016ae0cf8 | mayker-dev:builder | deliver | 5 | 13 | 23 | 1.92 | 2/5/5 | 5.50/1.40/1.00 | 6.0K | 63.7K | 70.5K | 0.932 | claude-sonnet-5-5 |  |
| agent-a6211f053ab114bf0 | mayker-dev:builder | deliver | 5 | 8 | 35 | 5.0 | 2/2/3 | 6.50/9.50/1.00 | 10.4K | 65.8K | 75.3K | 0.883 | claude-sonnet-5-5 |  |
| agent-a6c1c537ea91622e2 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.50/2.00/1.50 | 5.1K | 57.6K | 65.3K | 0.888 | claude-sonnet-5-5 |  |
| agent-a6dbec45926255fda | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 0/1/3 | n/a/2.00/4.33 | 5.5K | 55.7K | 64.5K | 0.817 | claude-fable-5-2 |  |
| agent-a6ec11a8eef3a212d | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 8.00/2.00/1.33 | 6.4K | 58.4K | 66.0K | 0.812 | claude-fable-5-2 |  |
| agent-a6f69ec8b9133588f | mayker-dev:orchestrator | deliver | 5 | 8 | 19 | 2.71 | 2/1/3 | 4.00/1.00/2.67 | 5.1K | 55.5K | 63.0K | 0.858 | claude-fable-5-2 |  |
| agent-a6f9f8a014c93254c | mayker-dev:planner | deliver | 5 | 15 | 37 | 2.64 | 2/1/10 | 3.00/2.00/2.50 | 16.9K | 91.7K | 118.1K | 0.924 | claude-opus-5-5 |  |
| agent-a74b6ba7effc92a19 | mayker-dev:planner | deliver | 5 | 14 | 43 | 3.31 | 1/1/10 | 3.00/2.00/3.40 | 17.6K | 87.6K | 111.4K | 0.909 | claude-opus-5-5 |  |
| agent-a7e65e705ff90514a | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 2/1/3 | 2.50/2.00/1.33 | 4.5K | 52.0K | 59.4K | 0.875 | claude-sonnet-5-5 |  |
| agent-a7e72d5784ad40f80 | mayker-dev:builder | deliver | 5 | 11 | 31 | 3.1 | 2/2/6 | 5.00/5.00/1.83 | 8.5K | 72.0K | 81.9K | 0.897 | claude-sonnet-5-5 |  |
| agent-a8bacb1a947be0f5a | mayker-dev:orchestrator | deliver | 5 | 5 | 18 | 4.5 | 0/1/3 | n/a/2.00/5.33 | 5.0K | 55.2K | 64.3K | 0.816 | claude-fable-5-2 |  |
| agent-a93c2d419e81adca1 | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 2/2/2 | 3.00/1.50/1.00 | 2.8K | 50.9K | 55.7K | 0.883 | claude-sonnet-5-5 |  |
| agent-aaa4812abfe13feb0 | mayker-dev:builder | deliver | 5 | 6 | 20 | 4.0 | 2/1/2 | 5.00/8.00/1.00 | 8.3K | 62.9K | 74.6K | 0.839 | claude-sonnet-5-5 |  |
| agent-ab21d9df3271dbc44 | mayker-dev:orchestrator | deliver | 8 | 3 | 6 | 3.0 | 1/0/1 | 5.00/n/a/1.00 | 7.6K | 51.7K | 58.7K | 0.721 | claude-fable-5-2 |  |
| agent-ab3666b206aad8a46 | mayker-dev:planner | deliver | 5 | 12 | 31 | 2.82 | 1/2/7 | 2.00/1.50/3.00 | 13.5K | 84.8K | 105.3K | 0.896 | claude-opus-5-5 |  |
| agent-ab4508f05a7708511 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 770 | 39.2K | 46.3K | 0.724 | claude-sonnet-5-5 |  |
| agent-abd83b25032ee2ad3 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 6.00/2.00/1.33 | 3.7K | 49.8K | 55.3K | 0.86 | claude-fable-5-2 |  |
| agent-ac75ae5b810e7f63c | mayker-dev:reviewer | deliver | 5 | 4 | 16 | 5.33 | 3/0/0 | 5.33/n/a/n/a | 6.6K | 49.9K | 65.7K | 0.671 | claude-opus-5-5 |  |
| agent-ac98b61b098526af2 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 1/3/1 | 5.00/2.00/1.00 | 3.8K | 51.9K | 57.4K | 0.86 | claude-sonnet-5-5 |  |
| agent-acafd833287b78236 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 1/0/1 | 2.00/n/a/3.00 | 1.1K | 44.6K | 54.8K | 0.694 | claude-sonnet-5-5 |  |
| agent-acb3199b2faea30a9 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 0/1/3 | n/a/1.00/2.33 | 5.8K | 68.2K | 79.0K | 0.863 | claude-fable-5-2 |  |
| agent-acd95be3cca7c786b | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 1.1K | 39.6K | 47.0K | 0.72 | claude-sonnet-5-5 |  |
| agent-ad2456c224c22f558 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 2.50/1.50/1.50 | 6.2K | 59.6K | 67.2K | 0.9 | claude-sonnet-5-5 |  |
| agent-ad29b322e4ffefc6e | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 3.50/6.00/1.00 | 7.0K | 56.0K | 64.1K | 0.872 | claude-sonnet-5-5 |  |
| agent-ad43cf3634056e5fd | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 660 | 39.3K | 46.4K | 0.723 | claude-sonnet-5-5 |  |
| agent-ad59f10986dbc81f2 | mayker-dev:orchestrator | deliver | 5 | 5 | 12 | 3.0 | 1/1/2 | 6.00/2.00/2.00 | 3.8K | 48.8K | 54.5K | 0.777 | claude-fable-5-2 |  |
| agent-ad8359c073d53992d | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 6.00/2.00/2.00 | 4.6K | 51.1K | 56.5K | 0.859 | claude-fable-5-2 |  |
| agent-adca67e3776224ac4 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/2/2 | 5.00/5.00/1.00 | 8.1K | 66.2K | 76.0K | 0.866 | claude-sonnet-5-5 |  |
| agent-ae73aa7ad7e449b36 | mayker-dev:builder | deliver | 5 | 17 | 34 | 2.12 | 3/1/11 | 2.67/4.00/1.91 | 7.3K | 72.8K | 81.6K | 0.945 | claude-sonnet-5-5 |  |
| agent-ae83fe77ad20ab365 | mayker-dev:builder | deliver | 5 | 6 | 17 | 3.4 | 1/2/2 | 6.00/4.50/1.00 | 4.2K | 58.2K | 65.1K | 0.853 | claude-sonnet-5-5 |  |
| agent-aee58cf0f1981c8ac | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 6.3K | 46.9K | 66.4K | 0.599 | claude-opus-5-5 |  |
| agent-af39bda2256874d69 | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 6.1K | 50.2K | 64.9K | 0.726 | claude-opus-5-5 |  |

**46 dispatch(es)** in `deliver` (general-purpose 1, mayker-dev:builder 23, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 65.5K, peak 119.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 46.3K, 46.4K, 46.4K, 47.0K, 54.5K, 54.8K, 55.3K, 55.7K, 56.5K, 57.4K, 58.7K, 59.4K, 60.9K, 62.7K, 62.8K, 63.0K, 64.1K, 64.3K, 64.5K, 64.9K, 65.1K, 65.1K, 65.3K, 65.7K, 66.0K, 66.0K, 66.4K, 67.2K, 69.3K, 70.5K, 74.6K, 75.3K, 76.0K, 76.7K, 76.7K, 79.0K, 81.6K, 81.9K, 95.6K, 101.6K, 105.3K, 111.4K, 114.1K, 118.1K, 118.2K, 119.7K.

**All runs:** 1 run(s), wall 42m08s (sum of per-run walls, idle time between runs excluded), 580 turns, 1191 tool calls, 424.2K output tokens, cache hit 0.964.

Turn classes across every bucket, read / edit / exec: 87/92/284 turns, 3.74/2.28/1.92 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 31m19s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

All runs: CI wait: 6m17s in `ci-poll.sh` calls; framework wall (wall less CI wait) 35m50s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
