# Run statistics, run

Generated 2026-11-24 21:23 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 51 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 51m30s | 616 | 1214 | 2.3 | 16 | 455.6K |  | 534.4K |  | 0.965 | claude-opus-5-5 | 93/90/291 (exec 66% of wall) | 3.71/2.19/1.94 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m30s.

Exec turns took 33m56s of round trip (command plus model time, ADR 0006 section 2): 66% of wall.

CI wait: 7m30s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m00s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a011711ecc3351607 | mayker-dev:orchestrator | deliver | 3 | 12 | 31 | 2.82 | 1/3/6 | 4.00/2.00/2.67 | 12.1K | 86.4K | 104.4K | 0.899 | claude-fable-5-2 |  |
| agent-a016e38b8d92ddf04 | mayker-dev:builder | deliver | 5 | 6 | 29 | 5.8 | 2/1/2 | 7.00/12.00/1.50 | 8.0K | 62.9K | 73.9K | 0.804 | claude-sonnet-5-5 |  |
| agent-a061f2f5af8b4d876 | mayker-dev:planner | deliver | 5 | 17 | 40 | 2.5 | 3/2/10 | 3.33/1.00/1.90 | 18.1K | 88.7K | 112.4K | 0.935 | claude-opus-5-5 |  |
| agent-a082f9a8aaec0f9f8 | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 2/1/5 | 3.00/2.00/1.40 | 5.4K | 55.2K | 62.0K | 0.903 | claude-sonnet-5-5 |  |
| agent-a0bdbe12dcd5860af | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 5.00/1.00/1.00 | 2.9K | 43.0K | 45.9K | 0.786 | claude-fable-5-2 |  |
| agent-a1b248e1b3f9dbcc9 | mayker-dev:planner | deliver | 5 | 11 | 37 | 3.7 | 2/1/6 | 5.00/2.00/3.50 | 16.4K | 83.9K | 112.3K | 0.878 | claude-opus-5-5 |  |
| agent-a247647c5055f44b6 | general-purpose | deliver | 5 | 3 | 2 | 1.0 | 0/0/0 | n/a/n/a/n/a | 674 | 31.1K | 37.3K | 0.6 | claude-opus-5-5 |  |
| agent-a2591cceddab33590 | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 3/1/3 | 3.67/2.00/1.33 | 5.1K | 56.5K | 63.6K | 0.889 | claude-fable-5-2 |  |
| agent-a2a54fcfd11274c10 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 5.6K | 48.7K | 62.6K | 0.679 | claude-opus-5-5 |  |
| agent-a311492e47c8bcea2 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.0K | 53.8K | 74.9K | 0.699 | claude-opus-5-5 |  |
| agent-a319ff4adfce6d3e5 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 3.00/2.00/4.00 | 6.2K | 53.8K | 63.0K | 0.847 | claude-fable-5-2 |  |
| agent-a341ff8a4fe9c3a78 | mayker-dev:orchestrator | deliver | 5 | 9 | 31 | 3.88 | 0/3/4 | n/a/2.67/4.50 | 9.5K | 96.9K | 118.0K | 0.88 | claude-fable-5-2 |  |
| agent-a3a68e6ced4b64c62 | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 1/3/4 | 5.00/2.67/2.75 | 6.2K | 58.4K | 66.4K | 0.9 | claude-sonnet-5-5 |  |
| agent-a3c48c67d5c73008e | general-purpose | deliver | 5 | 3 | 2 | 1.0 | 0/0/0 | n/a/n/a/n/a | 810 | 30.6K | 35.8K | 0.61 | claude-opus-5-5 |  |
| agent-a448aadf828c02574 | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.67 | 1/1/1 | 5.00/2.00/1.00 | 3.8K | 43.0K | 46.7K | 0.783 | claude-fable-5-2 |  |
| agent-a470b8fd47a33f466 | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 4.7K | 44.2K | 58.5K | 0.559 | claude-opus-5-5 |  |
| agent-a490b5896b7be1e84 | mayker-dev:planner | deliver | 5 | 13 | 34 | 2.83 | 1/2/9 | 6.00/1.50/2.78 | 15.0K | 86.4K | 107.4K | 0.917 | claude-opus-5-5 |  |
| agent-a4bca8bb906491a49 | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 455 | 36.2K | 39.0K | 0.652 | claude-sonnet-5-5 |  |
| agent-a5947e7b9739bdf5e | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 0/1/4 | n/a/2.00/3.75 | 4.8K | 47.4K | 51.9K | 0.865 | claude-fable-5-2 |  |
| agent-a59b85e3a73a279df | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 715 | 39.8K | 47.0K | 0.722 | claude-sonnet-5-5 |  |
| agent-a5c98654fbeceb34c | mayker-dev:builder | deliver | 5 | 3 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 1.1K | 37.4K | 40.0K | 0.767 | claude-sonnet-5-5 |  |
| agent-a609fa296d9edaaa6 | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 385 | 36.4K | 39.3K | 0.65 | claude-sonnet-5-5 |  |
| agent-a6436c4752ef58611 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 0/1/4 | n/a/2.00/3.00 | 4.6K | 47.7K | 53.9K | 0.858 | claude-fable-5-2 |  |
| agent-a824e9cd33be3105b | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 4.50/10.00/1.00 | 7.7K | 62.1K | 72.3K | 0.843 | claude-sonnet-5-5 |  |
| agent-a8278c0502a8d7da0 | mayker-dev:builder | deliver | 5 | 12 | 20 | 1.82 | 3/2/6 | 2.00/1.50/1.83 | 8.8K | 62.2K | 72.5K | 0.921 | claude-sonnet-5-5 |  |
| agent-a8640fb9b9b033bb8 | mayker-dev:planner | deliver | 5 | 15 | 42 | 3.0 | 3/2/7 | 2.33/1.50/2.57 | 22.0K | 94.2K | 126.4K | 0.92 | claude-opus-5-5 |  |
| agent-a89d8a1bfc1366ac9 | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 464 | 36.2K | 39.0K | 0.652 | claude-sonnet-5-5 |  |
| agent-a8d93a4260d2d8a40 | mayker-dev:reviewer | deliver | 5 | 3 | 23 | 11.5 | 2/0/0 | 11.50/n/a/n/a | 8.7K | 49.1K | 70.7K | 0.588 | claude-opus-5-5 |  |
| agent-a928f3c44c7cbfa1e | mayker-dev:builder | deliver | 5 | 8 | 22 | 3.14 | 2/2/3 | 4.00/5.00/1.33 | 7.0K | 60.9K | 69.6K | 0.886 | claude-sonnet-5-5 |  |
| agent-a981603b4a1df7c2b | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.6 | 3/2/5 | 2.00/1.50/1.40 | 6.8K | 56.2K | 63.2K | 0.92 | claude-sonnet-5-5 |  |
| agent-a9a8ebf6228883f2f | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 1.00/2.00/3.67 | 5.0K | 50.3K | 56.2K | 0.84 | claude-fable-5-2 |  |
| agent-a9f522b11a0a1a27d | mayker-dev:builder | deliver | 5 | 11 | 22 | 2.2 | 2/2/6 | 3.00/3.00/1.67 | 7.6K | 52.9K | 59.6K | 0.921 | claude-sonnet-5-5 |  |
| agent-aa03414283e419385 | mayker-dev:orchestrator | deliver | 5,8 | 15 | 29 | 2.07 | 0/4/9 | n/a/1.50/2.00 | 10.3K | 85.6K | 96.8K | 0.935 | claude-fable-5-2 |  |
| agent-aa98148299a65b009 | mayker-dev:builder | deliver | 5 | 12 | 16 | 1.45 | 3/2/6 | 2.00/1.50/1.17 | 7.3K | 49.4K | 55.1K | 0.93 | claude-sonnet-5-5 |  |
| agent-aae04700ed06af1c9 | mayker-dev:builder | deliver | 5 | 10 | 18 | 2.0 | 1/4/4 | 5.00/2.00/1.25 | 5.8K | 57.8K | 65.3K | 0.911 | claude-sonnet-5-5 |  |
| agent-aba50564c826ca873 | mayker-dev:orchestrator | deliver | 5 | 4 | 8 | 2.67 | 1/1/1 | 5.00/2.00/1.00 | 3.1K | 42.3K | 45.9K | 0.808 | claude-fable-5-2 |  |
| agent-abd9fbd718437d336 | mayker-dev:planner | deliver | 5 | 10 | 30 | 3.33 | 2/2/4 | 5.50/1.50/2.75 | 11.6K | 81.9K | 105.9K | 0.879 | claude-opus-5-5 |  |
| agent-ac5c8e593b7b16afb | mayker-dev:builder | deliver | 5 | 7 | 19 | 3.17 | 2/2/2 | 6.00/2.00/1.50 | 6.9K | 59.4K | 68.3K | 0.869 | claude-sonnet-5-5 |  |
| agent-ac9f2451485a57add | general-purpose | deliver | 5 | 5 | 7 | 1.75 | 0/0/0 | n/a/n/a/n/a | 1.4K | 43.9K | 60.1K | 0.726 | claude-opus-5-5 |  |
| agent-aca31b7cc41645aed | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 5.50/2.00/1.00 | 3.5K | 57.9K | 64.6K | 0.875 | claude-sonnet-5-5 |  |
| agent-ad0d657699049cfe2 | mayker-dev:orchestrator | deliver | 5 | 12 | 34 | 3.09 | 1/4/6 | 4.00/1.50/4.00 | 13.2K | 100.4K | 122.4K | 0.91 | claude-fable-5-2 |  |
| agent-ad1948b3d9b4e3a91 | mayker-dev:builder | deliver | 5 | 17 | 31 | 1.94 | 4/1/10 | 2.00/2.00/2.00 | 7.9K | 67.3K | 75.6K | 0.946 | claude-sonnet-5-5 |  |
| agent-ad34896af9689b2d3 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 0/1/4 | n/a/1.00/2.50 | 3.5K | 45.5K | 49.5K | 0.819 | claude-fable-5-2 |  |
| agent-ad3ddeaf39fa666aa | mayker-dev:builder | deliver | 5 | 10 | 16 | 1.78 | 2/4/3 | 3.50/1.50/1.00 | 4.7K | 58.4K | 64.6K | 0.913 | claude-sonnet-5-5 |  |
| agent-adc44e659e272aaac | mayker-dev:orchestrator | deliver | 8 | 3 | 10 | 5.0 | 0/0/2 | n/a/n/a/5.00 | 10.2K | 54.0K | 65.2K | 0.68 | claude-fable-5-2 |  |
| agent-aed3f9b33cac33d5c | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 1/2/2 | 6.00/3.00/1.00 | 5.2K | 57.6K | 65.3K | 0.811 | claude-sonnet-5-5 |  |
| agent-aed6ad61b9ad356a4 | mayker-dev:builder | deliver | 5 | 12 | 19 | 1.73 | 1/1/8 | 4.00/2.00/1.50 | 4.1K | 59.4K | 65.7K | 0.927 | claude-sonnet-5-5 |  |
| agent-af0cdfea777aeac5a | mayker-dev:orchestrator | deliver | 5 | 7 | 21 | 3.5 | 2/1/3 | 4.50/2.00/3.33 | 7.2K | 58.8K | 70.8K | 0.861 | claude-fable-5-2 |  |
| agent-af7044c12212e12f6 | mayker-dev:builder | deliver | 5 | 24 | 44 | 1.91 | 5/1/16 | 2.20/4.00/1.75 | 9.3K | 72.7K | 83.7K | 0.96 | claude-sonnet-5-5 |  |
| agent-af879cee82b8e7fd5 | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 6.3K | 45.5K | 63.1K | 0.538 | claude-opus-5-5 |  |
| agent-afc8e16ef49e4749d | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/2/2 | 4.50/6.00/1.00 | 7.2K | 61.3K | 70.2K | 0.836 | claude-sonnet-5-5 |  |

**51 dispatch(es)** in `deliver` (general-purpose 3, mayker-dev:builder 23, mayker-dev:orchestrator 15, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 64.6K, peak 126.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 35.8K, 37.3K, 39.0K, 39.0K, 39.3K, 40.0K, 45.9K, 45.9K, 46.7K, 47.0K, 49.5K, 51.9K, 53.9K, 55.1K, 56.2K, 58.5K, 59.6K, 60.1K, 62.0K, 62.6K, 63.0K, 63.1K, 63.2K, 63.6K, 64.6K, 64.6K, 65.2K, 65.3K, 65.3K, 65.7K, 66.4K, 68.3K, 69.6K, 70.2K, 70.7K, 70.8K, 72.3K, 72.5K, 73.9K, 74.9K, 75.6K, 83.7K, 96.8K, 104.4K, 105.9K, 107.4K, 112.3K, 112.4K, 118.0K, 122.4K, 126.4K.

**All runs:** 1 run(s), wall 51m30s (sum of per-run walls, idle time between runs excluded), 616 turns, 1214 tool calls, 455.6K output tokens, cache hit 0.965.

Turn classes across every bucket, read / edit / exec: 93/90/291 turns, 3.71/2.19/1.94 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m56s of round trip (command plus model time, ADR 0006 section 2): 66% of wall.

All runs: CI wait: 7m30s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m00s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
