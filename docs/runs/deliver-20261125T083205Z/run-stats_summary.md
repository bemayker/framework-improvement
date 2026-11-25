# Run statistics, run

Generated 2026-11-25 09:18 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 49 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 46m20s | 598 | 1209 | 2.33 | 17 | 484.2K |  | 539.8K |  | 0.964 | claude-opus-5-5 | 85/82/298 (exec 72% of wall) | 4.44/2.26/1.85 |  |

Wall is this run's last step end minus its first step start; steps sum to 46m19s.

Exec turns took 33m36s of round trip (command plus model time, ADR 0006 section 2): 72% of wall.

CI wait: 5m21s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m59s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a010f86b9ff0174e1 | mayker-dev:builder | deliver | 5 | 8 | 22 | 3.14 | 1/2/4 | 3.00/5.00/2.25 | 6.9K | 61.5K | 69.9K | 0.886 | claude-sonnet-5-5 |  |
| agent-a05c7dfdd853f3acd | mayker-dev:builder | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 7.00/4.00/2.00 | 4.2K | 59.8K | 67.1K | 0.851 | claude-sonnet-5-5 |  |
| agent-a0611107f0fccb34a | mayker-dev:orchestrator | deliver | 3 | 11 | 33 | 3.3 | 1/3/6 | 4.00/3.00/3.33 | 11.0K | 101.8K | 124.3K | 0.889 | claude-fable-5-2 |  |
| agent-a086a04bc110be4c9 | mayker-dev:orchestrator | deliver | 5 | 5 | 12 | 3.0 | 1/1/2 | 7.00/2.00/1.50 | 3.5K | 54.8K | 60.8K | 0.827 | claude-fable-5-2 |  |
| agent-a1036fddce15f1c2a | mayker-dev:orchestrator | deliver | 5 | 9 | 20 | 2.5 | 2/1/5 | 4.50/1.00/2.00 | 7.3K | 59.0K | 68.5K | 0.896 | claude-fable-5-2 |  |
| agent-a16b9c9a8a1a69004 | mayker-dev:planner | deliver | 5 | 16 | 41 | 2.73 | 3/2/9 | 3.00/1.00/2.78 | 17.1K | 94.9K | 119.2K | 0.931 | claude-opus-5-5 |  |
| agent-a1cb6289a61cc5a09 | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 2/2/4 | 3.50/1.50/1.50 | 6.7K | 56.7K | 63.9K | 0.902 | claude-sonnet-5-5 |  |
| agent-a2103fe83eac624d8 | mayker-dev:reviewer | deliver | 5 | 4 | 25 | 8.33 | 3/0/0 | 8.33/n/a/n/a | 8.4K | 58.2K | 79.2K | 0.703 | claude-opus-5-5 |  |
| agent-a2422b7aa938875ca | mayker-dev:orchestrator | deliver | 5 | 12 | 20 | 1.82 | 1/4/5 | 4.00/1.00/2.20 | 8.0K | 81.0K | 93.5K | 0.904 | claude-fable-5-2 |  |
| agent-a2b35cec963bb3615 | mayker-dev:orchestrator | deliver | 5 | 7 | 23 | 3.83 | 0/1/4 | n/a/2.00/2.75 | 7.6K | 62.6K | 74.6K | 0.86 | claude-fable-5-2 |  |
| agent-a2dd0ce977afe4221 | mayker-dev:reviewer | deliver | 5 | 6 | 27 | 5.4 | 5/0/0 | 5.40/n/a/n/a | 8.5K | 61.3K | 78.3K | 0.814 | claude-opus-5-5 |  |
| agent-a2f76248f4240d180 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.00/1.50/1.25 | 6.5K | 57.2K | 65.6K | 0.9 | claude-sonnet-5-5 |  |
| agent-a32c14806f4e0363c | mayker-dev:builder | deliver | 5 | 12 | 17 | 1.55 | 1/3/7 | 6.00/1.33/1.00 | 5.9K | 58.7K | 63.8K | 0.929 | claude-sonnet-5-5 |  |
| agent-a342b0f0912f5ffff | mayker-dev:builder | deliver | 5 | 13 | 27 | 2.25 | 2/1/8 | 4.00/2.00/2.00 | 8.6K | 65.9K | 76.5K | 0.927 | claude-sonnet-5-5 |  |
| agent-a355c1643d0d184dc | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 7.00/1.00/1.67 | 4.6K | 57.6K | 64.5K | 0.813 | claude-fable-5-2 |  |
| agent-a3dcde4f517516c3e | mayker-dev:orchestrator | deliver | 5 | 11 | 25 | 2.5 | 1/3/6 | 4.00/1.00/3.00 | 10.4K | 85.2K | 104.1K | 0.903 | claude-fable-5-2 |  |
| agent-a3ecc4c28198d0c1b | mayker-dev:builder | deliver | 5 | 9 | 26 | 3.25 | 2/3/3 | 5.50/3.67/1.33 | 6.3K | 58.7K | 65.7K | 0.902 | claude-sonnet-5-5 |  |
| agent-a4347285d85c649bd | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 1/2/3 | 6.00/2.50/1.33 | 6.8K | 55.0K | 61.3K | 0.877 | claude-sonnet-5-5 |  |
| agent-a4c1fe8be6917fd6c | mayker-dev:builder | deliver | 5 | 21 | 35 | 1.75 | 4/2/14 | 2.50/2.50/1.43 | 9.0K | 69.1K | 77.7K | 0.956 | claude-sonnet-5-5 |  |
| agent-a50140412a2ffa63b | mayker-dev:builder | deliver | 5 | 8 | 22 | 3.14 | 2/2/3 | 4.50/5.00/1.00 | 7.0K | 57.3K | 64.4K | 0.89 | claude-sonnet-5-5 |  |
| agent-a50341227f07925f3 | mayker-dev:planner | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 4.00/2.00/1.67 | 11.1K | 55.5K | 64.0K | 0.871 | claude-opus-5-5 |  |
| agent-a604cb05c6efa79ed | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/1/4 | 2.50/3.00/1.75 | 7.0K | 60.9K | 70.0K | 0.885 | claude-sonnet-5-5 |  |
| agent-a63f19b62a7c3ac1b | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 6.00/1.00/1.00 | 2.9K | 53.8K | 59.6K | 0.858 | claude-sonnet-5-5 |  |
| agent-a671297537c53c86b | mayker-dev:planner | deliver | 5 | 16 | 42 | 2.8 | 4/2/9 | 4.50/1.50/2.33 | 19.0K | 95.1K | 122.0K | 0.92 | claude-opus-5-5 |  |
| agent-a6f0ec7317a94eb0f | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 548 | 36.2K | 38.9K | 0.653 | claude-sonnet-5-5 |  |
| agent-a73655537411d81d0 | mayker-dev:orchestrator | deliver | 8 | 3 | 9 | 4.5 | 0/0/2 | n/a/n/a/4.50 | 9.2K | 56.1K | 67.2K | 0.693 | claude-fable-5-2 |  |
| agent-a74dce5ef6c534396 | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 2/1/3 | 2.50/2.00/1.33 | 4.9K | 52.2K | 59.9K | 0.874 | claude-sonnet-5-5 |  |
| agent-a92c150994c982079 | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 688 | 36.2K | 39.0K | 0.653 | claude-sonnet-5-5 |  |
| agent-a99bdd8fc97c8cd36 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 0/1/5 | n/a/2.00/3.20 | 5.0K | 49.9K | 54.9K | 0.881 | claude-fable-5-2 |  |
| agent-a9aeb7cea3606e1d0 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 1/2/3 | 5.00/3.00/1.00 | 4.9K | 51.1K | 57.1K | 0.84 | claude-sonnet-5-5 |  |
| agent-a9cb633429298637f | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.5K | 46.4K | 51.3K | 0.796 | claude-fable-5-2 |  |
| agent-aa4ed96c0396e5b17 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 0/1/3 | n/a/2.00/4.00 | 4.8K | 57.7K | 69.1K | 0.801 | claude-fable-5-2 |  |
| agent-aa66a62e2e131e4dc | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.1K | 46.1K | 50.8K | 0.725 | claude-fable-5-2 |  |
| agent-ab589c7b21512a978 | mayker-dev:builder | deliver | 5 | 14 | 24 | 1.85 | 2/1/9 | 2.50/3.00/1.67 | 6.7K | 73.4K | 97.0K | 0.919 | claude-sonnet-5-5 |  |
| agent-ac6afda8d8864e51e | mayker-dev:builder | deliver | 5 | 7 | 31 | 5.17 | 2/2/2 | 7.00/7.50/1.00 | 8.9K | 64.2K | 75.9K | 0.831 | claude-sonnet-5-5 |  |
| agent-ac82475343086abac | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 491 | 36.1K | 38.8K | 0.655 | claude-sonnet-5-5 |  |
| agent-ad0a82be641b740a2 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 7.00/2.00/2.67 | 6.1K | 52.2K | 59.4K | 0.853 | claude-fable-5-2 |  |
| agent-ad22d11ec569ef5ed | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 682 | 36.3K | 39.2K | 0.651 | claude-sonnet-5-5 |  |
| agent-ad38ba56db864f3ed | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 824 | 39.8K | 46.8K | 0.723 | claude-sonnet-5-5 |  |
| agent-ad4f61d36480e9a3c | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 5.00/9.00/1.00 | 6.9K | 60.9K | 70.7K | 0.844 | claude-sonnet-5-5 |  |
| agent-ad632cbfcddee12d6 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 9.9K | 52.5K | 70.2K | 0.713 | claude-opus-5-5 |  |
| agent-ad728804cae0d309b | mayker-dev:planner | deliver | 5 | 13 | 34 | 2.83 | 2/2/8 | 6.00/2.00/2.25 | 14.3K | 84.7K | 107.0K | 0.903 | claude-opus-5-5 |  |
| agent-add47c2566226be18 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/2/3 | 4.00/3.00/1.00 | 8.7K | 64.4K | 73.7K | 0.884 | claude-sonnet-5-5 |  |
| agent-ae28b5286c3e981d8 | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 3.33 | 1/1/1 | 7.00/2.00/1.00 | 3.2K | 52.0K | 58.7K | 0.782 | claude-fable-5-2 |  |
| agent-ae535392486d2a499 | mayker-dev:planner | deliver | 5 | 11 | 34 | 3.4 | 1/1/7 | 5.00/2.00/3.29 | 15.8K | 81.7K | 107.0K | 0.896 | claude-opus-5-5 |  |
| agent-ae57efaefb5442faa | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 6.5K | 51.9K | 67.9K | 0.673 | claude-opus-5-5 |  |
| agent-ae5c0288733cce088 | mayker-dev:planner | deliver | 5 | 11 | 41 | 4.1 | 0/2/7 | n/a/2.00/4.14 | 22.0K | 86.9K | 114.4K | 0.895 | claude-opus-5-5 |  |
| agent-aeb0fda485d463910 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 6.9K | 45.2K | 62.4K | 0.54 | claude-opus-5-5 |  |
| agent-affe55323bbe09a48 | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 3/1/3 | 3.33/2.00/2.67 | 7.4K | 64.0K | 75.4K | 0.879 | claude-fable-5-2 |  |

**49 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 15, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 67.2K, peak 124.3K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.8K, 38.9K, 39.0K, 39.2K, 46.8K, 50.8K, 51.3K, 54.9K, 57.1K, 58.7K, 59.4K, 59.6K, 59.9K, 60.8K, 61.3K, 62.4K, 63.8K, 63.9K, 64.0K, 64.4K, 64.5K, 65.6K, 65.7K, 67.1K, 67.2K, 67.9K, 68.5K, 69.1K, 69.9K, 70.0K, 70.2K, 70.7K, 73.7K, 74.6K, 75.4K, 75.9K, 76.5K, 77.7K, 78.3K, 79.2K, 93.5K, 97.0K, 104.1K, 107.0K, 107.0K, 114.4K, 119.2K, 122.0K, 124.3K.

**All runs:** 1 run(s), wall 46m20s (sum of per-run walls, idle time between runs excluded), 598 turns, 1209 tool calls, 484.2K output tokens, cache hit 0.964.

Turn classes across every bucket, read / edit / exec: 85/82/298 turns, 4.44/2.26/1.85 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m36s of round trip (command plus model time, ADR 0006 section 2): 72% of wall.

All runs: CI wait: 5m21s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m59s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
