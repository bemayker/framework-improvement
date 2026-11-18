# Run statistics, run

Generated 2026-11-18 02:21 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 44 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 53m44s | 551 | 1121 | 2.29 | 15 | 427.6K |  | 537.6K |  | 0.966 | claude-opus-5-5 | 66/85/284 (exec 70% of wall) | 4.65/2.16/1.84 |  |

Wall is this run's last step end minus its first step start; steps sum to 53m44s.

Exec turns took 37m38s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

CI wait: 5m40s in `ci-poll.sh` calls; framework wall (wall less CI wait) 48m04s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a01aa454fc77a6276 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 3.00/1.50/1.00 | 6.6K | 56.4K | 63.5K | 0.901 | claude-sonnet-5-5 |  |
| agent-a0b3364a280e9ac53 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 3.0K | 49.1K | 55.4K | 0.774 | claude-fable-5-2 |  |
| agent-a118952baf502b84e | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 7.00/3.00/2.33 | 5.6K | 49.9K | 55.6K | 0.814 | claude-fable-5-2 |  |
| agent-a2352401e9cbc4436 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.9K | 49.9K | 64.7K | 0.723 | claude-opus-5-5 |  |
| agent-a23a9a8ed99600f3a | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.0K | 43.5K | 53.3K | 0.692 | claude-sonnet-5-5 |  |
| agent-a2588fff2f9b6d113 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 1.00/2.00/4.00 | 5.2K | 49.2K | 54.5K | 0.859 | claude-fable-5-2 |  |
| agent-a30332e6799ffe8c3 | mayker-dev:builder | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 2.2K | 50.6K | 57.3K | 0.782 | claude-sonnet-5-5 |  |
| agent-a30939a3f21bec9d5 | mayker-dev:reviewer | deliver | 5 | 5 | 18 | 4.5 | 4/0/0 | 4.50/n/a/n/a | 5.6K | 54.1K | 66.6K | 0.754 | claude-opus-5-5 |  |
| agent-a3119ce769efdddfb | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 2.7K | 58.0K | 65.3K | 0.85 | claude-sonnet-5-5 |  |
| agent-a389698bbd4dfdaed | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 490 | 35.3K | 38.2K | 0.646 | claude-sonnet-5-5 |  |
| agent-a398238fe2af91180 | mayker-dev:builder | deliver | 5 | 7 | 18 | 3.0 | 1/2/3 | 6.00/4.50/1.00 | 5.5K | 58.9K | 66.5K | 0.839 | claude-sonnet-5-5 |  |
| agent-a3b07be924ae78eca | mayker-dev:planner | deliver | 5 | 10 | 36 | 4.0 | 1/2/5 | 10.00/1.50/3.40 | 19.5K | 81.2K | 104.1K | 0.888 | claude-opus-5-5 |  |
| agent-a3d7594c0d52b6083 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/1/3 | 8.00/1.00/1.00 | 3.7K | 61.8K | 69.3K | 0.87 | claude-sonnet-5-5 |  |
| agent-a46cf13651615b7ea | mayker-dev:planner | deliver | 5 | 13 | 38 | 3.17 | 2/1/8 | 4.50/2.00/2.62 | 17.2K | 82.2K | 102.3K | 0.917 | claude-opus-5-5 |  |
| agent-a533e8500323dc6d8 | mayker-dev:planner | deliver | 5 | 12 | 34 | 3.09 | 0/2/7 | n/a/1.00/3.29 | 13.8K | 81.2K | 100.8K | 0.91 | claude-opus-5-5 |  |
| agent-a54e695d2853f42aa | mayker-dev:orchestrator | deliver | 5 | 4 | 12 | 4.0 | 0/1/2 | n/a/2.00/5.00 | 4.2K | 48.6K | 54.8K | 0.784 | claude-fable-5-2 |  |
| agent-a596280b66903d501 | mayker-dev:reviewer | deliver | 5 | 4 | 24 | 8.0 | 3/0/0 | 8.00/n/a/n/a | 8.3K | 56.6K | 77.8K | 0.698 | claude-opus-5-5 |  |
| agent-a6b6885f21a5ccf49 | mayker-dev:reviewer | deliver | 5 | 3 | 22 | 11.0 | 2/0/0 | 11.00/n/a/n/a | 6.7K | 46.9K | 67.2K | 0.523 | claude-opus-5-5 |  |
| agent-a6c63e3da44ca9945 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 4.0 | 1/1/3 | 10.00/3.00/2.33 | 9.2K | 66.4K | 75.5K | 0.838 | claude-fable-5-2 |  |
| agent-a701d7fe74c3fc0fa | mayker-dev:builder | deliver | 5 | 2 | 4 | 4.0 | 1/0/0 | 4.00/n/a/n/a | 951 | 41.3K | 50.1K | 0.552 | claude-sonnet-5-5 |  |
| agent-a7287c57010a09cb2 | mayker-dev:planner | deliver | 5 | 8 | 25 | 3.57 | 0/1/5 | n/a/2.00/3.20 | 11.8K | 73.1K | 90.4K | 0.845 | claude-opus-5-5 |  |
| agent-a735f75ca8e21dfb8 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 3.00/1.50/1.25 | 5.9K | 56.1K | 62.9K | 0.902 | claude-sonnet-5-5 |  |
| agent-a7660a17080958a20 | mayker-dev:builder | deliver | 5 | 16 | 29 | 1.93 | 3/1/10 | 2.33/3.00/1.80 | 5.5K | 63.2K | 68.9K | 0.945 | claude-sonnet-5-5 |  |
| agent-a7e666ff077b0de64 | mayker-dev:builder | deliver | 5 | 20 | 32 | 1.68 | 2/1/15 | 2.50/2.00/1.60 | 6.8K | 65.6K | 76.3K | 0.952 | claude-sonnet-5-5 |  |
| agent-a81535dfd38483b08 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 1/1/4 | 5.00/2.00/1.25 | 3.0K | 51.6K | 55.8K | 0.882 | claude-sonnet-5-5 |  |
| agent-a8302698504175969 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 2/1/3 | 3.50/2.00/1.00 | 3.2K | 56.0K | 61.5K | 0.877 | claude-sonnet-5-5 |  |
| agent-a85ad44e965042efc | mayker-dev:builder | deliver | 5 | 7 | 28 | 4.67 | 1/1/4 | 4.00/13.00/2.75 | 9.6K | 64.4K | 75.1K | 0.833 | claude-sonnet-5-5 |  |
| agent-a9e7677b6ede5d35f | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.0K | 43.8K | 53.6K | 0.692 | claude-sonnet-5-5 |  |
| agent-aa7530db147269867 | mayker-dev:planner | deliver | 5 | 12 | 39 | 3.55 | 1/2/7 | 2.00/1.50/4.00 | 18.4K | 85.4K | 107.4K | 0.895 | claude-opus-5-5 |  |
| agent-ab295e23dd00f704a | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 0/1/3 | n/a/2.00/4.33 | 4.6K | 45.9K | 52.9K | 0.825 | claude-fable-5-2 |  |
| agent-ab82db64f2126e38d | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.1K | 48.2K | 52.4K | 0.783 | claude-fable-5-2 |  |
| agent-ab956d2fc17f7d439 | mayker-dev:orchestrator | deliver | 3 | 10 | 33 | 3.67 | 0/3/6 | n/a/3.00/4.00 | 10.7K | 87.3K | 106.3K | 0.878 | claude-fable-5-2 |  |
| agent-abb2b75c55df8ca8e | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 6.6K | 46.1K | 64.3K | 0.603 | claude-opus-5-5 |  |
| agent-ade22284827d4198a | mayker-dev:builder | deliver | 5 | 6 | 20 | 4.0 | 2/1/2 | 4.00/10.00/1.00 | 7.5K | 59.7K | 69.1K | 0.844 | claude-sonnet-5-5 |  |
| agent-ae2249598ac38d1b4 | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 2/2/4 | 4.50/5.50/1.00 | 7.6K | 60.6K | 68.3K | 0.899 | claude-sonnet-5-5 |  |
| agent-ae27ffacf0b6fb19f | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 3.00/2.00/1.00 | 5.3K | 59.3K | 66.5K | 0.888 | claude-sonnet-5-5 |  |
| agent-ae604b673b510bfd6 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 2/1/3 | 3.00/2.00/1.33 | 4.4K | 52.4K | 60.1K | 0.872 | claude-sonnet-5-5 |  |
| agent-af01e81e97fee302a | mayker-dev:orchestrator | deliver | 5 | 11 | 23 | 2.3 | 0/4/5 | n/a/1.25/2.60 | 6.9K | 71.6K | 81.7K | 0.914 | claude-fable-5-2 |  |
| agent-af255206c550ba946 | mayker-dev:builder | deliver | 5 | 10 | 24 | 2.67 | 2/2/5 | 3.00/5.00/1.60 | 7.7K | 63.8K | 72.0K | 0.908 | claude-sonnet-5-5 |  |
| agent-af37972a4a4914838 | mayker-dev:orchestrator | deliver | 5 | 7 | 22 | 3.67 | 1/1/4 | 9.00/2.00/2.75 | 6.9K | 65.9K | 76.2K | 0.863 | claude-fable-5-2 |  |
| agent-af4c4d5c08fb4cddc | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 3/2/4 | 2.00/1.50/1.00 | 6.1K | 54.0K | 60.2K | 0.913 | claude-sonnet-5-5 |  |
| agent-af6e634ef52dcacce | mayker-dev:builder | deliver | 5 | 2 | 4 | 4.0 | 1/0/0 | 4.00/n/a/n/a | 1.1K | 42.0K | 51.5K | 0.543 | claude-sonnet-5-5 |  |
| agent-afc74137323ee55ab | mayker-dev:orchestrator | deliver | 5 | 12 | 25 | 2.27 | 0/3/7 | n/a/1.00/2.14 | 10.1K | 81.6K | 95.0K | 0.903 | claude-fable-5-2 |  |
| agent-afc9250e5fd6906ce | mayker-dev:orchestrator | deliver | 8 | 6 | 11 | 2.2 | 0/0/5 | n/a/n/a/2.20 | 9.9K | 60.0K | 69.4K | 0.846 | claude-fable-5-2 |  |

**44 dispatch(es)** in `deliver` (mayker-dev:builder 22, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 66.5K, peak 107.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.2K, 50.1K, 51.5K, 52.4K, 52.9K, 53.3K, 53.6K, 54.5K, 54.8K, 55.4K, 55.6K, 55.8K, 57.3K, 60.1K, 60.2K, 61.5K, 62.9K, 63.5K, 64.3K, 64.7K, 65.3K, 66.5K, 66.5K, 66.6K, 67.2K, 68.3K, 68.9K, 69.1K, 69.3K, 69.4K, 72.0K, 75.1K, 75.5K, 76.2K, 76.3K, 77.8K, 81.7K, 90.4K, 95.0K, 100.8K, 102.3K, 104.1K, 106.3K, 107.4K.

**All runs:** 1 run(s), wall 53m44s (sum of per-run walls, idle time between runs excluded), 551 turns, 1121 tool calls, 427.6K output tokens, cache hit 0.966.

Turn classes across every bucket, read / edit / exec: 66/85/284 turns, 4.65/2.16/1.84 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 37m38s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

All runs: CI wait: 5m40s in `ci-poll.sh` calls; framework wall (wall less CI wait) 48m04s.

4 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/2).
