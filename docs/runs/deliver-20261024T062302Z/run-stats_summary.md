# Run statistics, run

Generated 2026-10-24 07:43 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 67 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Ingest the backlog | 5m10s | 11 | 22 | 2.2 | 6 | 21.5K | 87.4K | 110.5K | 0 | 0.879 | claude-fable-5-1 | 1/3/5 | 4.00/1.00/2.80 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 5m10s | 11 | 22 | 2.2 | 6 | 21.5K | 87.4K | 110.5K | 0 | 0.879 | claude-fable-5-1 | 1/3/5 | 4.00/1.00/2.80 |  |
| 5 | Scheduler loop | 1h05m | 744 | 1435 | 2.19 | 13 | 630.8K | 162.4K | 589.2K | 0 | 0.965 | claude-opus-5-5 | 122/135/359 | 4.09/2.35/1.59 |  |
| 3 #2 | Ingest the backlog (Section W step 2 re-ingest) | 3m02s | 9 | 16 | 2.0 | 4 | 10.9K | 179.4K | 592.7K | 0 | 0.958 | claude-fable-5-1 | 1/2/3 | 4.00/2.50/1.67 |  |
| 3.orchestrator #2 (in 3 #2) | Re-ingestion dispatch | 3m02s | 9 | 16 | 2.0 | 4 | 10.9K | 179.4K | 592.7K | 0 | 0.958 | claude-fable-5-1 | 1/2/3 | 4.00/2.50/1.67 |  |
| 8 | Final report | 5m52s | 12 | 15 | 1.5 | 3 | 28.8K | 291.0K | 621.1K | 0 | 0.977 | claude-fable-5-1 | 4/2/3 | 1.75/2.00/1.00 |  |
| **run total** |  | 1h19m | 776 | 1488 | 2.18 | 13 | 692.1K |  | 621.1K |  | 0.964 | claude-opus-5-5 | 128/142/370 (exec 80% of wall) | 4.02/2.32/1.60 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h19m.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 3 #2)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 1h03m of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

CI wait: 10m17s in `ci-poll.sh` calls; framework wall (wall less CI wait) 1h09m.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a022f0faacc8509dd | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 4.00/1.00/1.00 | 2.3K | 50.8K | 55.2K | 0.862 | claude-sonnet-5-5 |  |
| agent-a03f47cca15f347d6 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/3.00/1.00 | 4.3K | 53.9K | 59.8K | 0.892 | claude-sonnet-5-5 |  |
| agent-a0d7fa0503fdb3363 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 5.9K | 54.5K | 70.4K | 0.677 | claude-opus-5-5 |  |
| agent-a0fdfce99d6d012a4 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.50/3.00/1.25 | 6.2K | 62.0K | 71.4K | 0.883 | claude-sonnet-5-5 |  |
| agent-a13b4e7e004372327 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 7.00/1.00/2.00 | 7.9K | 56.1K | 63.2K | 0.839 | claude-fable-5-1 |  |
| agent-a172930579d821ac4 | mayker-dev:reviewer | deliver | 5 | 3 | 12 | 6.0 | 2/0/0 | 6.00/n/a/n/a | 5.4K | 43.3K | 55.9K | 0.641 | claude-opus-5-5 |  |
| agent-a1e72a618543ece63 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 1/1/4 | 6.00/1.00/1.00 | 4.5K | 46.3K | 49.6K | 0.885 | claude-fable-5-1 |  |
| agent-a28ee09da404fac9f | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.50/2.00/1.00 | 4.4K | 50.3K | 55.2K | 0.895 | claude-sonnet-5-5 |  |
| agent-a2f6dbe9adc420342 | mayker-dev:builder | deliver | 5 | 8 | 25 | 3.57 | 2/3/2 | 5.00/4.33/1.00 | 7.5K | 71.3K | 81.7K | 0.88 | claude-sonnet-5-5 |  |
| agent-a30527683983f8fd1 | mayker-dev:planner | deliver | 5 | 12 | 23 | 2.09 | 2/2/7 | 5.00/1.50/1.43 | 13.8K | 89.2K | 104.7K | 0.914 | claude-opus-5-5 |  |
| agent-a348f4ed87032e187 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 1/1/4 | 5.00/1.00/1.25 | 4.2K | 49.0K | 56.0K | 0.836 | claude-fable-5-1 |  |
| agent-a369353e2d5a83544 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 3.50/1.00/2.33 | 5.7K | 54.0K | 63.0K | 0.866 | claude-fable-5-1 |  |
| agent-a36e70b99fe73d71b | mayker-dev:planner | deliver | 5 | 10 | 19 | 2.11 | 2/2/5 | 1.50/1.50/2.60 | 21.6K | 70.6K | 87.3K | 0.876 | claude-opus-5-5 |  |
| agent-a375431222b206d36 | mayker-dev:builder | deliver | 5 | 11 | 26 | 2.6 | 2/2/6 | 3.00/4.50/1.83 | 6.8K | 71.8K | 79.5K | 0.899 | claude-sonnet-5-5 |  |
| agent-a3a9be329131b6b7a | mayker-dev:builder | deliver | 5 | 9 | 10 | 1.25 | 3/1/4 | 1.33/1.00/1.25 | 2.4K | 40.3K | 44.6K | 0.913 | claude-sonnet-5-5 |  |
| agent-a3d834870b5f0dfd1 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 4.6K | 53.0K | 67.4K | 0.682 | claude-opus-5-5 |  |
| agent-a3dc0698bf9c2ccef | mayker-dev:orchestrator | deliver | 3 | 9 | 20 | 2.5 | 1/2/5 | 4.00/1.00/2.80 | 19.1K | 89.7K | 110.5K | 0.863 | claude-fable-5-1 |  |
| agent-a45273afec169449c | mayker-dev:planner | deliver | 5 | 13 | 23 | 1.92 | 2/2/7 | 4.00/1.50/1.57 | 27.3K | 79.4K | 102.7K | 0.9 | claude-opus-5-5 |  |
| agent-a47e03391f15b1e6d | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/2/3 | 5.00/2.00/1.00 | 3.8K | 55.5K | 60.6K | 0.893 | claude-sonnet-5-5 |  |
| agent-a48e92d22088f450b | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 1/0/2 | 1.00/n/a/1.50 | 878 | 40.5K | 51.0K | 0.766 | claude-sonnet-5-5 |  |
| agent-a5c89cd662e211182 | mayker-dev:planner | deliver | 5 | 14 | 28 | 2.15 | 2/2/9 | 5.50/1.50/1.56 | 21.7K | 103.7K | 125.1K | 0.923 | claude-opus-5-5 |  |
| agent-a5d7f1a0f88d1718c | mayker-dev:planner | deliver | 5 | 14 | 31 | 2.38 | 3/2/8 | 3.67/1.50/2.12 | 13.7K | 96.1K | 115.0K | 0.924 | claude-opus-5-5 |  |
| agent-a5e66ccece163eb0d | mayker-dev:orchestrator | deliver | 5 | 8 | 11 | 1.83 | 1/1/4 | 3.00/1.00/1.75 | 6.0K | 51.1K | 59.0K | 0.855 | claude-fable-5-1 |  |
| agent-a6705024ce66cfbb4 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.5K | 48.3K | 67.8K | 0.596 | claude-opus-5-5 |  |
| agent-a6748aa31836b625d | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 5.1K | 57.3K | 76.1K | 0.668 | claude-opus-5-5 |  |
| agent-a68c712920789b40d | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/2.00/1.25 | 6.1K | 63.3K | 72.8K | 0.882 | claude-sonnet-5-5 |  |
| agent-a693dd738037e0555 | mayker-dev:orchestrator | deliver | 5 | 8 | 16 | 2.67 | 1/1/4 | 6.00/1.00/2.25 | 7.3K | 56.5K | 64.5K | 0.885 | claude-fable-5-1 |  |
| agent-a6a5f97332be04fcd | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 3.7K | 46.1K | 55.2K | 0.701 | claude-opus-5-5 |  |
| agent-a6b7c46e7403d9447 | mayker-dev:builder | deliver | 5 | 11 | 27 | 2.7 | 4/3/3 | 2.75/3.67/1.67 | 8.6K | 72.4K | 82.8K | 0.912 | claude-sonnet-5-5 |  |
| agent-a6e1b840cd7d0f57e | mayker-dev:orchestrator | deliver | 5 | 9 | 17 | 2.12 | 1/2/5 | 7.00/1.50/1.40 | 10.4K | 60.7K | 70.4K | 0.894 | claude-fable-5-1 |  |
| agent-a6ffe55fdef10eb21 | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 4.7K | 48.5K | 66.3K | 0.544 | claude-opus-5-5 |  |
| agent-a735e6ec9f3589bc9 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 4.00/2.00/1.00 | 2.8K | 50.8K | 55.9K | 0.86 | claude-sonnet-5-5 |  |
| agent-a779eee570c255679 | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 1/2/3 | 3.00/1.50/2.00 | 4.5K | 50.5K | 56.9K | 0.838 | claude-fable-5-1 |  |
| agent-a7b7a05024a026063 | mayker-dev:orchestrator | deliver | 8 | 7 | 8 | 1.6 | 3/0/2 | 2.00/n/a/1.00 | 18.8K | 61.8K | 74.5K | 0.86 | claude-fable-5-1 |  |
| agent-a7c68dc3d78634072 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 6.00/1.00/1.00 | 3.2K | 54.5K | 59.9K | 0.877 | claude-sonnet-5-5 |  |
| agent-a7decfe5b5599584f | mayker-dev:planner | deliver | 5 | 13 | 24 | 2.0 | 2/2/8 | 3.00/1.50/1.88 | 31.8K | 110.7K | 145.7K | 0.899 | claude-opus-5-5 |  |
| agent-a7fb98e482ed0da02 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 8.00/1.00/2.00 | 7.9K | 57.7K | 65.7K | 0.868 | claude-fable-5-1 |  |
| agent-a871114dde6de0aa7 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 3/2/3 | 2.00/1.50/1.00 | 6.2K | 56.0K | 61.7K | 0.904 | claude-sonnet-5-5 |  |
| agent-a8dd83fe2e1c2093c | mayker-dev:planner | deliver | 5 | 13 | 38 | 3.17 | 1/2/9 | 2.00/1.50/3.67 | 25.9K | 109.7K | 139.5K | 0.911 | claude-opus-5-5 |  |
| agent-a8f2be02506d2a184 | mayker-dev:builder | deliver | 5 | 13 | 40 | 3.33 | 2/3/7 | 6.50/5.00/1.71 | 10.4K | 75.0K | 83.7K | 0.928 | claude-sonnet-5-5 |  |
| agent-a93177cb46442405e | mayker-dev:builder | deliver | 5 | 9 | 11 | 1.38 | 2/1/5 | 1.50/2.00/1.20 | 5.3K | 51.4K | 58.4K | 0.902 | claude-sonnet-5-5 |  |
| agent-a9c4b0eec3222685b | mayker-dev:builder | deliver | 5 | 6 | 7 | 1.4 | 1/0/4 | 2.00/n/a/1.25 | 1.5K | 49.5K | 59.0K | 0.846 | claude-sonnet-5-5 |  |
| agent-aa17a0ed1af70f535 | mayker-dev:orchestrator | deliver | 5 | 9 | 25 | 3.12 | 1/1/6 | 7.00/1.00/2.83 | 9.1K | 60.5K | 69.8K | 0.895 | claude-fable-5-1 |  |
| agent-aa9486867abab3391 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/2/3 | 4.00/1.50/1.00 | 3.3K | 54.4K | 59.7K | 0.893 | claude-sonnet-5-5 |  |
| agent-aab2e1a9f8ee77210 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 4.50/1.00/1.00 | 2.4K | 51.1K | 56.0K | 0.86 | claude-sonnet-5-5 |  |
| agent-ab2d750754a60ad62 | mayker-dev:reviewer | deliver | 5 | 6 | 21 | 4.2 | 5/0/0 | 4.20/n/a/n/a | 5.7K | 56.1K | 67.4K | 0.8 | claude-opus-5-5 |  |
| agent-ab8dd832a6e45c833 | mayker-dev:builder | deliver | 5 | 10 | 27 | 3.0 | 1/2/6 | 4.00/6.50/1.67 | 8.9K | 74.9K | 84.2K | 0.888 | claude-sonnet-5-5 |  |
| agent-ab9f9ec69f4aaf278 | mayker-dev:builder | deliver | 5 | 15 | 27 | 1.93 | 3/1/9 | 2.33/4.00/1.67 | 6.2K | 71.4K | 79.4K | 0.938 | claude-sonnet-5-5 |  |
| agent-abbe311818f5a77f2 | mayker-dev:orchestrator | deliver | 5 | 7 | 10 | 1.67 | 2/2/2 | 3.00/1.00/1.00 | 4.0K | 45.4K | 48.8K | 0.886 | claude-fable-5-1 |  |
| agent-abefac44a9de1937a | mayker-dev:builder | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 3.00/3.00/1.00 | 4.5K | 48.4K | 52.5K | 0.864 | claude-sonnet-5-5 |  |
| agent-ac05b393fc84790aa | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 4.50/2.00/1.00 | 3.2K | 51.5K | 57.1K | 0.858 | claude-sonnet-5-5 |  |
| agent-ac34c1c4bbb4e10c1 | mayker-dev:builder | deliver | 5 | 10 | 25 | 2.78 | 2/2/5 | 3.00/4.50/2.00 | 7.7K | 69.4K | 78.3K | 0.887 | claude-sonnet-5-5 |  |
| agent-ace3d216ca87cf04f | mayker-dev:builder | deliver | 5 | 4 | 3 | 1.0 | 1/0/2 | 1.00/n/a/1.00 | 697 | 37.1K | 39.8K | 0.821 | claude-sonnet-5-5 |  |
| agent-ace6e9265397caf4c | mayker-dev:builder | deliver | 5 | 10 | 21 | 2.33 | 2/3/4 | 3.50/3.00/1.25 | 6.0K | 64.0K | 73.7K | 0.905 | claude-sonnet-5-5 |  |
| agent-ad43784bf875e4d67 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 8.00/1.00/1.75 | 4.8K | 51.4K | 56.4K | 0.878 | claude-fable-5-1 |  |
| agent-ad61db2fff83725e0 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 4.50/1.00/1.33 | 9.1K | 57.8K | 66.6K | 0.866 | claude-fable-5-1 |  |
| agent-ada9c47fc210211ab | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 4.50/1.00/2.33 | 7.1K | 55.9K | 62.9K | 0.871 | claude-fable-5-1 |  |
| agent-addfc40b62524e03d | mayker-dev:builder | deliver | 5 | 5 | 5 | 1.25 | 1/0/3 | 1.00/n/a/1.33 | 1.0K | 39.6K | 43.1K | 0.849 | claude-sonnet-5-5 |  |
| agent-adfa2d250029a0914 | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 2/1/4 | 5.50/1.00/1.25 | 9.8K | 72.9K | 83.0K | 0.879 | claude-fable-5-1 |  |
| agent-ae0e61dfef80f5db3 | mayker-dev:builder | deliver | 5 | 5 | 5 | 1.25 | 0/1/3 | n/a/1.00/1.33 | 1.7K | 38.5K | 40.5K | 0.858 | claude-sonnet-5-5 |  |
| agent-ae42ef8d2666bb1d1 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 3.50/4.00/1.00 | 3.0K | 58.8K | 65.6K | 0.851 | claude-sonnet-5-5 |  |
| agent-ae4f03c1a944ef70e | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 1/0/2 | 1.00/n/a/1.50 | 892 | 38.7K | 42.1K | 0.813 | claude-sonnet-5-5 |  |
| agent-ae8ebb8f24c058849 | mayker-dev:orchestrator | deliver | 3 #2 | 7 | 12 | 2.0 | 1/1/3 | 4.00/2.00/1.67 | 8.6K | 61.8K | 78.5K | 0.85 | claude-fable-5-1 |  |
| agent-aeadf7bd0cf50ad00 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 2.50/3.00/1.00 | 4.7K | 50.9K | 58.0K | 0.853 | claude-sonnet-5-5 |  |
| agent-af3f6bbd966053126 | mayker-dev:builder | deliver | 5 | 7 | 8 | 1.33 | 1/0/5 | 2.00/n/a/1.20 | 1.7K | 45.7K | 50.9K | 0.882 | claude-sonnet-5-5 |  |
| agent-afc58b2af7f56b527 | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.0 | 1/2/4 | 4.00/1.00/2.00 | 4.3K | 50.8K | 56.2K | 0.892 | claude-fable-5-1 |  |
| agent-afe28f06fa206228c | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.4K | 51.2K | 58.0K | 0.825 | claude-sonnet-5-5 |  |

**67 dispatch(es)** in `deliver` (mayker-dev:builder 33, mayker-dev:orchestrator 19, mayker-dev:planner 7, mayker-dev:reviewer 8): median ctx max 63.2K, peak 145.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.8K, 40.5K, 42.1K, 43.1K, 44.6K, 48.8K, 49.6K, 50.9K, 51.0K, 52.5K, 55.2K, 55.2K, 55.2K, 55.9K, 55.9K, 56.0K, 56.0K, 56.2K, 56.4K, 56.9K, 57.1K, 58.0K, 58.0K, 58.4K, 59.0K, 59.0K, 59.7K, 59.8K, 59.9K, 60.6K, 61.7K, 62.9K, 63.0K, 63.2K, 64.5K, 65.6K, 65.7K, 66.3K, 66.6K, 67.4K, 67.4K, 67.8K, 69.8K, 70.4K, 70.4K, 71.4K, 72.8K, 73.7K, 74.5K, 76.1K, 78.3K, 78.5K, 79.4K, 79.5K, 81.7K, 82.8K, 83.0K, 83.7K, 84.2K, 87.3K, 102.7K, 104.7K, 110.5K, 115.0K, 125.1K, 139.5K, 145.7K.

**All runs:** 1 run(s), wall 1h19m (sum of per-run walls, idle time between runs excluded), 777 turns, 1489 tool calls, 693.2K output tokens, cache hit 0.964.

Turn classes across every bucket, read / edit / exec: 128/142/371 turns, 4.02/2.32/1.60 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 1h03m of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

All runs: CI wait: 10m17s in `ci-poll.sh` calls; framework wall (wall less CI wait) 1h09m.

1 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 0/0/1).

12 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 3/0/8).
