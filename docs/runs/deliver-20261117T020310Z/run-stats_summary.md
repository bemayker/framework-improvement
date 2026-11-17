# Run statistics, run

Generated 2026-11-17 02:48 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 49 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 45m41s | 569 | 1150 | 2.29 | 17 | 428.9K |  | 528.9K |  | 0.962 | claude-opus-5-5 | 87/86/283 (exec 77% of wall) | 4.03/2.12/1.86 |  |

Wall is this run's last step end minus its first step start; steps sum to 45m41s.

Exec turns took 35m13s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

CI wait: 7m28s in `ci-poll.sh` calls; framework wall (wall less CI wait) 38m12s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a01f3006c3ebaf52b | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.1K | 45.4K | 50.4K | 0.793 | claude-fable-5-2 |  |
| agent-a0627f540a75c10c4 | mayker-dev:planner | deliver | 5 | 13 | 44 | 3.67 | 1/2/8 | 5.00/2.00/3.12 | 23.3K | 85.4K | 110.8K | 0.912 | claude-opus-5-5 |  |
| agent-a145a17384659aed1 | mayker-dev:builder | deliver | 5 | 14 | 23 | 1.77 | 1/1/11 | 3.00/2.00/1.64 | 5.4K | 59.2K | 66.3K | 0.936 | claude-sonnet-5-5 |  |
| agent-a18e5a502f8af7b46 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 852 | 43.6K | 53.6K | 0.691 | claude-sonnet-5-5 |  |
| agent-a1da0d6af2715d29b | mayker-dev:orchestrator | deliver | 8 | 4 | 9 | 3.0 | 2/0/1 | 3.50/n/a/2.00 | 9.3K | 58.2K | 73.8K | 0.743 | claude-fable-5-2 |  |
| agent-a1fbe4d782f898e21 | mayker-dev:planner | deliver | 5 | 15 | 37 | 2.64 | 3/2/8 | 2.67/1.50/2.75 | 14.8K | 83.3K | 103.2K | 0.928 | claude-opus-5-5 |  |
| agent-a25ca80c9aac1f4d1 | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 3.33 | 1/1/1 | 7.00/2.00/1.00 | 3.4K | 53.2K | 60.8K | 0.774 | claude-fable-5-2 |  |
| agent-a2cb24da54218cf72 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 3.00/2.00/1.50 | 4.8K | 52.4K | 59.3K | 0.89 | claude-sonnet-5-5 |  |
| agent-a34b2ec67f245d84c | mayker-dev:reviewer | deliver | 5 | 5 | 31 | 7.75 | 4/0/0 | 7.75/n/a/n/a | 10.5K | 61.9K | 79.8K | 0.773 | claude-opus-5-5 |  |
| agent-a3b12d329cbc032a1 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/2/3 | 2.50/2.00/1.33 | 6.5K | 55.0K | 63.4K | 0.886 | claude-sonnet-5-5 |  |
| agent-a3b46b93fdd27df7e | mayker-dev:orchestrator | deliver | 5 | 12 | 24 | 2.18 | 1/2/8 | 5.00/2.00/1.88 | 8.3K | 64.0K | 72.1K | 0.924 | claude-fable-5-2 |  |
| agent-a517893c65848fc36 | mayker-dev:planner | deliver | 5 | 12 | 34 | 3.09 | 2/1/7 | 3.50/2.00/2.43 | 14.3K | 81.0K | 99.7K | 0.911 | claude-opus-5-5 |  |
| agent-a5319594694da9f55 | mayker-dev:planner | deliver | 5 | 11 | 29 | 2.9 | 1/2/6 | 6.00/1.50/2.67 | 11.8K | 75.1K | 95.7K | 0.884 | claude-opus-5-5 |  |
| agent-a53f1eadbd5b15331 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 2.50/2.00/1.00 | 6.4K | 53.7K | 60.3K | 0.902 | claude-sonnet-5-5 |  |
| agent-a5471d1e3cba6f3f3 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.9K | 45.3K | 63.5K | 0.602 | claude-opus-5-5 |  |
| agent-a56867466642b95ea | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 2/1/4 | 4.50/2.00/2.25 | 6.4K | 61.4K | 70.2K | 0.883 | claude-fable-5-2 |  |
| agent-a57583e6e533bf8c9 | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 1/1/2 | 5.00/4.00/1.50 | 2.7K | 50.7K | 56.2K | 0.83 | claude-sonnet-5-5 |  |
| agent-a5a1b6e45619fcc2c | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 1/0/1 | 2.00/n/a/3.00 | 906 | 43.5K | 53.1K | 0.694 | claude-sonnet-5-5 |  |
| agent-a615c6ffecb82170d | mayker-dev:orchestrator | deliver | 5 | 7 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 3.8K | 51.7K | 57.3K | 0.842 | claude-fable-5-2 |  |
| agent-a64ee42aad185cfd0 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/2/1 | 3.50/3.50/1.00 | 5.1K | 59.3K | 70.7K | 0.801 | claude-sonnet-5-5 |  |
| agent-a6d65be67b0b1d7a6 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 2.3K | 51.5K | 57.4K | 0.857 | claude-sonnet-5-5 |  |
| agent-a6f7dc84a3453af63 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/2/3 | 5.00/2.00/1.00 | 3.7K | 55.2K | 61.5K | 0.89 | claude-sonnet-5-5 |  |
| agent-a6fbd4bf492d9a4a1 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.8K | 49.8K | 55.9K | 0.775 | claude-fable-5-2 |  |
| agent-a769c6584ff99431e | mayker-dev:planner | deliver | 5 | 14 | 39 | 3.0 | 2/2/8 | 3.50/1.50/2.62 | 16.8K | 86.3K | 106.8K | 0.912 | claude-opus-5-5 |  |
| agent-a83de545dacde9de8 | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.75 | 2/1/1 | 4.50/1.00/1.00 | 2.2K | 49.4K | 55.4K | 0.829 | claude-sonnet-5-5 |  |
| agent-a8abdeae18df0bc44 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 3.0K | 47.9K | 53.9K | 0.828 | claude-fable-5-2 |  |
| agent-a8d82a1595756f189 | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 0/1/3 | n/a/2.00/3.67 | 4.7K | 51.5K | 57.3K | 0.827 | claude-fable-5-2 |  |
| agent-a8e33c7b92ce755f9 | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 0/1/3 | n/a/2.00/4.33 | 4.4K | 54.3K | 63.3K | 0.814 | claude-fable-5-2 |  |
| agent-a938472b0ce1972a3 | mayker-dev:orchestrator | deliver | 5 | 14 | 22 | 1.69 | 1/2/10 | 5.00/2.00/1.30 | 11.8K | 67.1K | 77.6K | 0.931 | claude-fable-5-2 |  |
| agent-aa848a2bbeeca9a97 | mayker-dev:builder | deliver | 5 | 8 | 30 | 4.29 | 2/3/2 | 7.00/4.67/1.00 | 9.3K | 63.5K | 73.9K | 0.855 | claude-sonnet-5-5 |  |
| agent-ab0954b808e3fd109 | mayker-dev:builder | deliver | 5 | 17 | 34 | 2.12 | 2/1/12 | 2.50/2.00/2.17 | 9.0K | 65.8K | 74.3K | 0.945 | claude-sonnet-5-5 |  |
| agent-ab0aec04f85cb2f51 | mayker-dev:reviewer | deliver | 5 | 4 | 16 | 5.33 | 3/0/0 | 5.33/n/a/n/a | 5.9K | 49.8K | 65.0K | 0.674 | claude-opus-5-5 |  |
| agent-ab4c0d17d07a490cb | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 2.00/1.50/1.40 | 6.2K | 54.0K | 60.8K | 0.912 | claude-sonnet-5-5 |  |
| agent-ab5139d8f234adc29 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 2/1/1 | 2.50/1.00/1.00 | 1.7K | 49.9K | 56.4K | 0.827 | claude-sonnet-5-5 |  |
| agent-aba5ba794b2d599f9 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 913 | 43.7K | 53.6K | 0.691 | claude-sonnet-5-5 |  |
| agent-abb5dec6f7e939749 | mayker-dev:builder | deliver | 5 | 10 | 21 | 2.33 | 2/3/4 | 4.00/3.00/1.00 | 7.7K | 60.9K | 67.9K | 0.91 | claude-sonnet-5-5 |  |
| agent-abc0e5ae1966a779a | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 600 | 38.5K | 45.6K | 0.719 | claude-sonnet-5-5 |  |
| agent-abf6424f1a4ce16e5 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 4.00/5.00/1.00 | 7.4K | 60.8K | 70.7K | 0.865 | claude-sonnet-5-5 |  |
| agent-ac1883bd18cb61c49 | mayker-dev:builder | deliver | 5 | 9 | 26 | 3.25 | 2/2/4 | 4.00/5.00/2.00 | 7.8K | 64.6K | 74.8K | 0.894 | claude-sonnet-5-5 |  |
| agent-ac6cdefe02d6812af | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 0/1/4 | n/a/1.00/4.00 | 7.0K | 64.1K | 73.0K | 0.843 | claude-fable-5-2 |  |
| agent-ac823ff03a743e621 | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 1/1/5 | 3.00/5.00/1.40 | 6.3K | 57.2K | 63.4K | 0.89 | claude-sonnet-5-5 |  |
| agent-acdd57277367a34d7 | mayker-dev:orchestrator | deliver | 5 | 9 | 21 | 2.62 | 0/1/7 | n/a/2.00/2.71 | 6.0K | 54.1K | 61.1K | 0.875 | claude-fable-5-2 |  |
| agent-acfb12d874663a62e | mayker-dev:builder | deliver | 5 | 7 | 7 | 1.17 | 2/1/3 | 1.50/1.00/1.00 | 1.6K | 44.0K | 48.4K | 0.885 | claude-sonnet-5-5 |  |
| agent-addcd941738099f27 | mayker-dev:builder | deliver | 5 | 12 | 29 | 2.64 | 2/1/7 | 2.50/3.00/2.86 | 6.6K | 67.3K | 77.2K | 0.921 | claude-sonnet-5-5 |  |
| agent-ade5d4830d81b47a4 | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 5.6K | 44.7K | 62.4K | 0.604 | claude-opus-5-5 |  |
| agent-ae3196068bc917720 | mayker-dev:reviewer | deliver | 5 | 2 | 6 | 6.0 | 1/0/0 | 6.00/n/a/n/a | 1.8K | 37.4K | 50.6K | 0.448 | claude-opus-5-5 |  |
| agent-aecf87b905cd957f0 | mayker-dev:orchestrator | deliver | 3 | 10 | 29 | 3.22 | 1/3/5 | 4.00/1.67/4.00 | 11.6K | 90.6K | 109.6K | 0.879 | claude-fable-5-2 |  |
| agent-af7ff50352bab5c32 | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 0/0/3 | n/a/n/a/1.33 | 1.1K | 37.4K | 39.4K | 0.824 | claude-sonnet-5-5 |  |
| agent-affce60877d181665 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 5.8K | 50.0K | 63.4K | 0.683 | claude-opus-5-5 |  |

**49 dispatch(es)** in `deliver` (mayker-dev:builder 24, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 6): median ctx max 63.4K, peak 110.8K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.4K, 45.6K, 48.4K, 50.4K, 50.6K, 53.1K, 53.6K, 53.6K, 53.9K, 55.4K, 55.9K, 56.2K, 56.4K, 57.3K, 57.3K, 57.4K, 59.3K, 60.3K, 60.8K, 60.8K, 61.1K, 61.5K, 62.4K, 63.3K, 63.4K, 63.4K, 63.4K, 63.5K, 65.0K, 66.3K, 67.9K, 70.2K, 70.7K, 70.7K, 72.1K, 73.0K, 73.8K, 73.9K, 74.3K, 74.8K, 77.2K, 77.6K, 79.8K, 95.7K, 99.7K, 103.2K, 106.8K, 109.6K, 110.8K.

**All runs:** 1 run(s), wall 45m41s (sum of per-run walls, idle time between runs excluded), 569 turns, 1150 tool calls, 428.9K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 87/86/283 turns, 4.03/2.12/1.86 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 35m13s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

All runs: CI wait: 7m28s in `ci-poll.sh` calls; framework wall (wall less CI wait) 38m12s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
