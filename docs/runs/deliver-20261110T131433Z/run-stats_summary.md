# Run statistics, run

Generated 2026-11-10 14:00 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 47 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 45m34s | 553 | 1088 | 2.24 | 12 | 413.5K |  | 515.7K |  | 0.963 | claude-opus-5-5 | 77/85/276 (exec 74% of wall) | 4.14/2.24/1.80 |  |

Wall is this run's last step end minus its first step start; steps sum to 45m34s.

Exec turns took 33m40s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

CI wait: 5m28s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m06s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a02313909476f6a93 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 832 | 41.7K | 48.8K | 0.575 | claude-sonnet-5-5 |  |
| agent-a05970acc8d0257e6 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 7.00/1.00/2.33 | 4.7K | 53.1K | 59.2K | 0.855 | claude-fable-5-2 |  |
| agent-a11821412f06870c5 | mayker-dev:builder | deliver | 5 | 15 | 27 | 1.93 | 2/1/10 | 3.00/3.00/1.70 | 5.9K | 64.5K | 71.2K | 0.94 | claude-sonnet-5-5 |  |
| agent-a1f81183227455190 | mayker-dev:orchestrator | deliver | 8 | 4 | 10 | 3.33 | 1/0/2 | 1.00/n/a/4.50 | 9.5K | 60.9K | 72.4K | 0.761 | claude-fable-5-2 |  |
| agent-a217c6c8a0ba5e292 | mayker-dev:builder | deliver | 5 | 9 | 18 | 2.25 | 2/2/4 | 3.50/3.50/1.00 | 5.7K | 58.1K | 65.7K | 0.874 | claude-sonnet-5-5 |  |
| agent-a2396c36a70f025ab | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 802 | 38.0K | 39.8K | 0.767 | claude-sonnet-5-5 |  |
| agent-a29e7fe1c39e5e8bd | mayker-dev:builder | deliver | 5 | 9 | 29 | 3.62 | 1/2/5 | 3.00/6.00/2.80 | 8.9K | 61.9K | 70.1K | 0.898 | claude-sonnet-5-5 |  |
| agent-a2d869a9a58ed8f70 | mayker-dev:planner | deliver | 5 | 13 | 26 | 2.17 | 0/2/10 | n/a/1.50/2.30 | 20.7K | 85.9K | 104.5K | 0.918 | claude-opus-5-5 |  |
| agent-a327994618c41f64b | mayker-dev:reviewer | deliver | 5 | 5 | 22 | 5.5 | 4/0/0 | 5.50/n/a/n/a | 5.2K | 53.8K | 64.9K | 0.793 | claude-opus-5-5 |  |
| agent-a32d2218137c24639 | mayker-dev:planner | deliver | 5 | 13 | 32 | 2.67 | 2/2/7 | 3.50/1.50/2.86 | 16.5K | 84.9K | 105.7K | 0.916 | claude-opus-5-5 |  |
| agent-a3493a7c63b1c804f | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 5.6K | 46.7K | 64.3K | 0.608 | claude-opus-5-5 |  |
| agent-a3f668ea8343186fb | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.5 | 1/2/1 | 4.00/2.50/1.00 | 2.6K | 52.0K | 57.8K | 0.829 | claude-sonnet-5-5 |  |
| agent-a49489dad87224fe5 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 913 | 38.1K | 40.1K | 0.766 | claude-sonnet-5-5 |  |
| agent-a4adb0f4efa25f0dc | mayker-dev:builder | deliver | 5 | 16 | 31 | 2.07 | 3/1/10 | 2.33/3.00/2.00 | 8.3K | 69.0K | 78.4K | 0.941 | claude-sonnet-5-5 |  |
| agent-a5206c8b3318d749c | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 4.9K | 47.3K | 65.2K | 0.54 | claude-opus-5-5 |  |
| agent-a55eb507e14bac459 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 3/2/4 | 2.00/1.50/1.25 | 6.3K | 58.5K | 66.0K | 0.91 | claude-sonnet-5-5 |  |
| agent-a58343bdbf704d51e | mayker-dev:planner | deliver | 5 | 9 | 25 | 3.12 | 1/1/5 | 8.00/2.00/2.00 | 11.1K | 80.2K | 97.5K | 0.865 | claude-opus-5-5 |  |
| agent-a59aad5d9030f231a | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.00/2.00/1.25 | 4.4K | 53.7K | 60.3K | 0.89 | claude-sonnet-5-5 |  |
| agent-a5c854a77789902f1 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 741 | 38.0K | 39.9K | 0.767 | claude-sonnet-5-5 |  |
| agent-a64f5370a7884ebff | mayker-dev:orchestrator | deliver | 3 | 13 | 28 | 2.33 | 1/3/7 | 4.00/1.33/1.86 | 11.9K | 104.2K | 127.0K | 0.906 | claude-fable-5-2 |  |
| agent-a6e6966af7c190d2b | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 1/1/2 | 7.00/2.00/2.00 | 4.1K | 50.8K | 57.8K | 0.823 | claude-fable-5-2 |  |
| agent-a87ddcdc505096e68 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 4.5K | 46.2K | 62.3K | 0.55 | claude-opus-5-5 |  |
| agent-a8dce95837a9fedba | mayker-dev:orchestrator | deliver | 5 | 8 | 19 | 2.71 | 1/1/3 | 7.00/1.00/2.00 | 4.8K | 60.9K | 69.4K | 0.858 | claude-fable-5-2 |  |
| agent-a8ef411c801a4fa82 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/1/3 | 3.50/9.00/2.33 | 6.4K | 57.9K | 68.1K | 0.832 | claude-sonnet-5-5 |  |
| agent-a92512204c0ba457f | mayker-dev:orchestrator | deliver | 5 | 5 | 12 | 3.0 | 1/1/2 | 7.00/2.00/1.50 | 4.0K | 53.1K | 60.4K | 0.822 | claude-fable-5-2 |  |
| agent-a9403ebe981af60af | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 2/1/1 | 5.00/2.00/1.00 | 2.6K | 51.1K | 57.3K | 0.828 | claude-sonnet-5-5 |  |
| agent-a96d68a03ebd6b49b | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 3.1K | 50.6K | 56.7K | 0.776 | claude-fable-5-2 |  |
| agent-a98ac22b57363eef4 | mayker-dev:builder | deliver | 5 | 7 | 18 | 3.0 | 2/1/3 | 4.50/6.00/1.00 | 7.7K | 61.2K | 70.5K | 0.866 | claude-sonnet-5-5 |  |
| agent-a9ed7d8a5b5d76d83 | mayker-dev:reviewer | deliver | 5 | 6 | 26 | 5.2 | 5/0/0 | 5.20/n/a/n/a | 6.4K | 57.1K | 68.7K | 0.827 | claude-opus-5-5 |  |
| agent-aa41637f43c5b2e04 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 788 | 38.3K | 40.3K | 0.765 | claude-sonnet-5-5 |  |
| agent-aad78b9c98d1c2b46 | mayker-dev:builder | deliver | 5 | 12 | 23 | 2.09 | 1/1/8 | 4.00/3.00/1.88 | 5.1K | 57.5K | 63.7K | 0.927 | claude-sonnet-5-5 |  |
| agent-aaec5598dbe2df2d2 | mayker-dev:planner | deliver | 5 | 14 | 39 | 3.0 | 1/2/9 | 1.00/2.00/3.22 | 15.2K | 77.4K | 93.9K | 0.913 | claude-opus-5-5 |  |
| agent-ab88fd4552d5d2abd | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 1/2/4 | 4.00/2.00/3.00 | 8.9K | 87.4K | 110.4K | 0.861 | claude-fable-5-2 |  |
| agent-abd1d1c1703f5c7c2 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 2.50/1.50/1.50 | 6.3K | 56.3K | 63.9K | 0.9 | claude-sonnet-5-5 |  |
| agent-ac600b50d54ba49af | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 3.4K | 52.3K | 59.0K | 0.824 | claude-fable-5-2 |  |
| agent-ac66ed298f90cac90 | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 1/1/4 | 7.00/2.00/1.75 | 4.4K | 56.4K | 64.2K | 0.886 | claude-fable-5-2 |  |
| agent-ac6ac5d7d66389217 | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.75 | 2/1/1 | 4.00/2.00/1.00 | 2.4K | 51.5K | 58.0K | 0.826 | claude-sonnet-5-5 |  |
| agent-ad4f2a9bc4ffb6c52 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 2.8K | 47.4K | 52.7K | 0.832 | claude-fable-5-2 |  |
| agent-ad597a724b7632157 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 5.50/2.00/1.00 | 3.6K | 58.4K | 64.6K | 0.874 | claude-sonnet-5-5 |  |
| agent-ad84c889ac3d42937 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/2/2 | 4.00/5.50/1.00 | 7.1K | 61.0K | 70.7K | 0.866 | claude-sonnet-5-5 |  |
| agent-ad9b668571f96e905 | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 2/1/1 | 3.00/1.00/1.00 | 2.1K | 53.0K | 59.7K | 0.825 | claude-sonnet-5-5 |  |
| agent-adb9cee519d612b95 | mayker-dev:orchestrator | deliver | 5 | 10 | 18 | 2.0 | 1/2/6 | 4.00/1.50/1.83 | 6.7K | 78.5K | 92.8K | 0.882 | claude-fable-5-2 |  |
| agent-adcfd7f5ac8656b7a | mayker-dev:planner | deliver | 5 | 9 | 28 | 3.5 | 0/1/6 | n/a/2.00/3.50 | 12.5K | 78.0K | 98.0K | 0.879 | claude-opus-5-5 |  |
| agent-aea94797437f65507 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/1/5 | 2.00/2.00/1.20 | 4.9K | 53.5K | 59.7K | 0.904 | claude-sonnet-5-5 |  |
| agent-aeb7ddce7104dbb06 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.9K | 51.3K | 57.6K | 0.776 | claude-fable-5-2 |  |
| agent-af67e2472929fda3e | mayker-dev:builder | deliver | 5 | 10 | 15 | 1.67 | 2/3/4 | 2.00/1.67/1.50 | 6.5K | 55.7K | 62.4K | 0.912 | claude-sonnet-5-5 |  |
| agent-afb8b0476d6d51eaa | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 3.6K | 56.3K | 62.0K | 0.855 | claude-fable-5-2 |  |

**47 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 64.2K, peak 127.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.8K, 39.9K, 40.1K, 40.3K, 48.8K, 52.7K, 56.7K, 57.3K, 57.6K, 57.8K, 57.8K, 58.0K, 59.0K, 59.2K, 59.7K, 59.7K, 60.3K, 60.4K, 62.0K, 62.3K, 62.4K, 63.7K, 63.9K, 64.2K, 64.3K, 64.6K, 64.9K, 65.2K, 65.7K, 66.0K, 68.1K, 68.7K, 69.4K, 70.1K, 70.5K, 70.7K, 71.2K, 72.4K, 78.4K, 92.8K, 93.9K, 97.5K, 98.0K, 104.5K, 105.7K, 110.4K, 127.0K.

**All runs:** 1 run(s), wall 45m34s (sum of per-run walls, idle time between runs excluded), 553 turns, 1088 tool calls, 413.5K output tokens, cache hit 0.963.

Turn classes across every bucket, read / edit / exec: 77/85/276 turns, 4.14/2.24/1.80 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m40s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

All runs: CI wait: 5m28s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m06s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
