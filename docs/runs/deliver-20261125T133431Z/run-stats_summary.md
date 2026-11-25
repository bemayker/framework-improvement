# Run statistics, run

Generated 2026-11-25 14:26 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 49 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 51m50s | 585 | 1242 | 2.43 | 15 | 503.6K |  | 538.2K |  | 0.961 | claude-opus-5-5 | 76/91/295 (exec 78% of wall) | 4.67/2.31/1.93 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m50s.

Exec turns took 40m22s of round trip (command plus model time, ADR 0006 section 2): 78% of wall.

CI wait: 7m27s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m23s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a009008e13d57eb08 | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.75 | 1/1/2 | 5.00/4.00/1.00 | 3.6K | 52.8K | 58.8K | 0.83 | claude-sonnet-5-5 |  |
| agent-a014cb5f6772b766e | mayker-dev:builder | deliver | 5 | 13 | 22 | 1.83 | 1/1/9 | 4.00/2.00/1.67 | 5.6K | 61.7K | 67.8K | 0.933 | claude-sonnet-5-5 |  |
| agent-a025f9b8f06d75c68 | mayker-dev:planner | deliver | 5 | 13 | 37 | 3.08 | 0/2/9 | n/a/1.50/3.33 | 12.8K | 85.8K | 105.1K | 0.918 | claude-opus-5-5 |  |
| agent-a0590e1a31afd119c | mayker-dev:reviewer | deliver | 5 | 5 | 25 | 6.25 | 4/0/0 | 6.25/n/a/n/a | 9.7K | 57.7K | 72.5K | 0.749 | claude-opus-5-5 |  |
| agent-a05acad9a0ab3a37d | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 1/1/2 | 9.00/2.00/2.00 | 7.0K | 59.3K | 69.7K | 0.81 | claude-fable-5-2 |  |
| agent-a09a8da8bd257fd75 | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 0/2/4 | n/a/1.50/2.00 | 8.5K | 80.5K | 95.6K | 0.872 | claude-fable-5-2 |  |
| agent-a0d0c0c2348829128 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 0/1/4 | n/a/1.00/3.50 | 5.0K | 51.0K | 56.9K | 0.858 | claude-fable-5-2 |  |
| agent-a16373a7c2d612293 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/2/2 | 7.00/2.00/1.50 | 4.8K | 59.1K | 66.6K | 0.873 | claude-sonnet-5-5 |  |
| agent-a1903919e3f55a3da | mayker-dev:builder | deliver | 5 | 11 | 31 | 3.1 | 1/2/7 | 5.00/5.50/2.14 | 9.2K | 69.5K | 77.6K | 0.898 | claude-sonnet-5-5 |  |
| agent-a1b358afdd86df995 | mayker-dev:orchestrator | deliver | 5 | 10 | 32 | 3.56 | 1/1/6 | 3.00/2.00/3.50 | 10.6K | 82.6K | 103.0K | 0.891 | claude-fable-5-2 |  |
| agent-a1d3bc93006126a50 | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.3K | 47.1K | 52.2K | 0.723 | claude-fable-5-2 |  |
| agent-a1fa0f6ba7ab7edc6 | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 2/2/4 | 2.50/1.50/1.75 | 9.0K | 58.3K | 66.6K | 0.9 | claude-sonnet-5-5 |  |
| agent-a227edf317b23aecd | mayker-dev:orchestrator | deliver | 5 | 11 | 23 | 2.3 | 0/3/6 | n/a/1.00/2.17 | 8.4K | 87.3K | 99.6K | 0.896 | claude-fable-5-2 |  |
| agent-a2d68779330e659fb | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.75 | 1/1/2 | 6.00/2.00/1.50 | 3.8K | 50.9K | 56.2K | 0.832 | claude-fable-5-2 |  |
| agent-a3328a35b518b17f8 | mayker-dev:planner | deliver | 5 | 7 | 13 | 2.17 | 1/1/4 | 6.00/2.00/1.25 | 10.4K | 54.6K | 62.5K | 0.873 | claude-opus-5-5 |  |
| agent-a3c450673a9bb1e0a | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 2.50/1.50/1.50 | 6.4K | 60.0K | 68.7K | 0.898 | claude-sonnet-5-5 |  |
| agent-a3f22d276eec614fe | mayker-dev:orchestrator | deliver | 8 | 3 | 7 | 3.5 | 1/0/1 | 5.00/n/a/2.00 | 8.5K | 53.9K | 63.5K | 0.703 | claude-fable-5-2 |  |
| agent-a42f3bbac642cc748 | mayker-dev:planner | deliver | 5 | 14 | 35 | 2.69 | 2/2/8 | 4.00/1.50/2.25 | 13.1K | 84.5K | 104.2K | 0.912 | claude-opus-5-5 |  |
| agent-a43f35a804fc39a9e | mayker-dev:orchestrator | deliver | 5 | 10 | 24 | 2.67 | 1/1/7 | 2.00/2.00/2.86 | 8.4K | 55.6K | 65.4K | 0.906 | claude-fable-5-2 |  |
| agent-a4b2b4c2f37be62fd | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 6.00/1.00/1.00 | 3.1K | 58.1K | 64.9K | 0.853 | claude-sonnet-5-5 |  |
| agent-a509f5d0ee510dae3 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 970 | 37.2K | 40.8K | 0.637 | claude-sonnet-5-5 |  |
| agent-a53e845b9905f191c | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 1.00/2.00/3.33 | 4.7K | 53.2K | 63.5K | 0.843 | claude-fable-5-2 |  |
| agent-a565cd4aef8d942b2 | mayker-dev:reviewer | deliver | 5 | 3 | 22 | 11.0 | 2/0/0 | 11.00/n/a/n/a | 8.3K | 49.4K | 73.4K | 0.572 | claude-opus-5-5 |  |
| agent-a5d82b2aa3f10ab01 | mayker-dev:builder | deliver | 5 | 2 | 3 | 3.0 | 1/0/0 | 3.00/n/a/n/a | 1.1K | 40.4K | 47.1K | 0.588 | claude-sonnet-5-5 |  |
| agent-a6c18bc84fa88cf47 | mayker-dev:reviewer | deliver | 5 | 4 | 24 | 8.0 | 3/0/0 | 8.00/n/a/n/a | 6.9K | 50.6K | 66.9K | 0.669 | claude-opus-5-5 |  |
| agent-a717addce0fba4260 | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/2/3 | 3.00/3.50/1.00 | 6.8K | 55.5K | 63.9K | 0.887 | claude-sonnet-5-5 |  |
| agent-a74a00759b0359379 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/1/3 | 5.00/10.00/1.00 | 8.1K | 62.3K | 73.3K | 0.864 | claude-sonnet-5-5 |  |
| agent-a74b5060287a4a0d2 | mayker-dev:reviewer | deliver | 5 | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 4.7K | 48.2K | 61.1K | 0.683 | claude-opus-5-5 |  |
| agent-a86260484639c5f78 | mayker-dev:builder | deliver | 5 | 3 | 3 | 3.0 | 1/0/0 | 3.00/n/a/n/a | 1.6K | 42.7K | 47.8K | 0.735 | claude-sonnet-5-5 |  |
| agent-a8728dcd9f1b7dab5 | mayker-dev:orchestrator | deliver | 3 | 13 | 33 | 2.75 | 1/3/8 | 4.00/2.33/2.75 | 12.0K | 98.6K | 114.6K | 0.911 | claude-fable-5-2 |  |
| agent-a87b5f2d2733f70e4 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 0/1/3 | n/a/1.00/2.00 | 2.6K | 46.2K | 50.6K | 0.841 | claude-sonnet-5-5 |  |
| agent-a8b937297b03a106d | mayker-dev:builder | deliver | 5 | 6 | 19 | 3.8 | 2/1/2 | 6.00/4.00/1.50 | 4.8K | 58.4K | 67.1K | 0.848 | claude-sonnet-5-5 |  |
| agent-a8e685e6ff73a51ce | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/2/3 | 3.50/3.50/1.00 | 4.9K | 59.1K | 66.3K | 0.889 | claude-sonnet-5-5 |  |
| agent-a9ed7873f6fd0f21d | mayker-dev:builder | deliver | 5 | 3 | 7 | 3.5 | 0/0/2 | n/a/n/a/3.50 | 1.7K | 43.3K | 48.5K | 0.733 | claude-sonnet-5-5 |  |
| agent-ab2292e78fbf47495 | mayker-dev:orchestrator | deliver | 5 | 11 | 26 | 2.6 | 2/1/5 | 4.50/1.00/2.20 | 8.7K | 88.0K | 108.9K | 0.901 | claude-fable-5-2 |  |
| agent-ab7392be409ea2038 | mayker-dev:planner | deliver | 5 | 15 | 49 | 3.5 | 2/2/10 | 3.00/1.50/4.00 | 22.8K | 88.9K | 118.5K | 0.921 | claude-opus-5-5 |  |
| agent-ac4aa78aad3f13832 | mayker-dev:builder | deliver | 5 | 8 | 32 | 4.57 | 2/3/2 | 7.50/5.00/1.00 | 10.4K | 66.0K | 77.4K | 0.88 | claude-sonnet-5-5 |  |
| agent-acc5ebfa7b7c2dd13 | mayker-dev:builder | deliver | 5 | 17 | 32 | 2.0 | 1/2/13 | 4.00/2.50/1.77 | 8.7K | 68.1K | 76.9K | 0.946 | claude-sonnet-5-5 |  |
| agent-ad4d289bf0c6887dd | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/2/2 | 5.00/4.00/1.50 | 7.6K | 62.0K | 72.0K | 0.834 | claude-sonnet-5-5 |  |
| agent-ad78c868208f66733 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 4.00/2.00/1.00 | 6.6K | 61.4K | 70.2K | 0.885 | claude-sonnet-5-5 |  |
| agent-ae91369c37ece9184 | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 0/2/8 | n/a/1.00/3.38 | 16.5K | 78.7K | 99.5K | 0.895 | claude-opus-5-5 |  |
| agent-aeb7e3ab61cd134de | mayker-dev:planner | deliver | 5 | 15 | 42 | 3.0 | 3/3/8 | 5.67/1.33/2.62 | 17.8K | 93.1K | 117.2K | 0.916 | claude-opus-5-5 |  |
| agent-aef58fe5679ab05b2 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.50/3.00/1.33 | 6.5K | 53.5K | 62.2K | 0.871 | claude-sonnet-5-5 |  |
| agent-af0609c64566e7855 | mayker-dev:reviewer | deliver | 5 | 4 | 17 | 5.67 | 3/0/0 | 5.67/n/a/n/a | 6.0K | 51.1K | 66.5K | 0.675 | claude-opus-5-5 |  |
| agent-af066f11cc45ae081 | general-purpose | deliver | 5 | 7 | 18 | 3.0 | 0/0/2 | n/a/n/a/1.00 | 5.4K | 88.0K | 125.0K | 0.797 | claude-opus-5-5 |  |
| agent-af791e445784e9300 | mayker-dev:orchestrator | deliver | 5 | 5 | 12 | 3.0 | 0/1/3 | n/a/2.00/3.33 | 4.2K | 49.0K | 54.1K | 0.834 | claude-fable-5-2 |  |
| agent-af979e17408963ef1 | mayker-dev:builder | deliver | 5 | 10 | 26 | 2.89 | 2/4/3 | 5.50/3.00/1.00 | 7.5K | 61.9K | 69.6K | 0.888 | claude-sonnet-5-5 |  |
| agent-af98655f60a1adb90 | mayker-dev:orchestrator | deliver | 5 | 6 | 19 | 3.8 | 1/1/3 | 8.00/2.00/3.00 | 5.4K | 52.7K | 59.5K | 0.812 | claude-fable-5-2 |  |
| agent-affc94024838b474e | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 6.00/1.00/1.33 | 4.8K | 52.4K | 57.6K | 0.817 | claude-fable-5-2 |  |

**49 dispatch(es)** in `deliver` (general-purpose 1, mayker-dev:builder 22, mayker-dev:orchestrator 15, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 66.9K, peak 125.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 40.8K, 47.1K, 47.8K, 48.5K, 50.6K, 52.2K, 54.1K, 56.2K, 56.9K, 57.6K, 58.8K, 59.5K, 61.1K, 62.2K, 62.5K, 63.5K, 63.5K, 63.9K, 64.9K, 65.4K, 66.3K, 66.5K, 66.6K, 66.6K, 66.9K, 67.1K, 67.8K, 68.7K, 69.6K, 69.7K, 70.2K, 72.0K, 72.5K, 73.3K, 73.4K, 76.9K, 77.4K, 77.6K, 95.6K, 99.5K, 99.6K, 103.0K, 104.2K, 105.1K, 108.9K, 114.6K, 117.2K, 118.5K, 125.0K.

**All runs:** 1 run(s), wall 51m50s (sum of per-run walls, idle time between runs excluded), 585 turns, 1242 tool calls, 503.6K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 76/91/295 turns, 4.67/2.31/1.93 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 40m22s of round trip (command plus model time, ADR 0006 section 2): 78% of wall.

All runs: CI wait: 7m27s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m23s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
