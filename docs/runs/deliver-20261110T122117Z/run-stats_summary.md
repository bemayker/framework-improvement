# Run statistics, run

Generated 2026-11-10 13:05 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 47 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 43m59s | 542 | 1081 | 2.3 | 14 | 411.5K |  | 493.3K |  | 0.959 | claude-opus-5-5 | 74/84/265 (exec 76% of wall) | 4.04/2.33/1.79 |  |

Wall is this run's last step end minus its first step start; steps sum to 44m00s.

Exec turns took 33m16s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

CI wait: 7m00s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m58s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0086afb14ffd6d3b | mayker-dev:builder | deliver | 5 | 15 | 26 | 1.86 | 3/1/9 | 3.33/2.00/1.44 | 6.4K | 65.1K | 73.0K | 0.939 | claude-sonnet-5-5 |  |
| agent-a0b5d015eefea5d5f | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.5 | 1/2/1 | 4.00/2.50/1.00 | 2.8K | 50.6K | 56.0K | 0.831 | claude-sonnet-5-5 |  |
| agent-a0bfcb732ac97d657 | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 0/1/9 | n/a/2.00/2.56 | 16.6K | 81.1K | 102.1K | 0.895 | claude-opus-5-5 |  |
| agent-a1126ec56c6e137e0 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/2/3 | 3.00/1.50/1.00 | 3.4K | 55.7K | 60.7K | 0.894 | claude-sonnet-5-5 |  |
| agent-a189ae4d3e24cd62d | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 2.9K | 47.4K | 52.8K | 0.777 | claude-fable-5-2 |  |
| agent-a2003106106c564d9 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 3.0K | 47.6K | 53.0K | 0.777 | claude-fable-5-2 |  |
| agent-a216ec490f5b23dfd | mayker-dev:builder | deliver | 5 | 9 | 23 | 2.88 | 3/2/3 | 3.00/5.50/1.00 | 7.9K | 63.8K | 72.9K | 0.896 | claude-sonnet-5-5 |  |
| agent-a218889090ecda5f1 | mayker-dev:orchestrator | deliver | 8 | 4 | 7 | 2.33 | 1/0/2 | 5.00/n/a/1.00 | 7.8K | 55.0K | 61.0K | 0.787 | claude-fable-5-2 |  |
| agent-a21e615d28dee37f1 | mayker-dev:builder | deliver | 5 | 7 | 27 | 4.5 | 2/1/3 | 6.50/11.00/1.00 | 7.7K | 62.2K | 73.2K | 0.832 | claude-sonnet-5-5 |  |
| agent-a290453ee28a939cd | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 0/1/3 | n/a/2.00/2.00 | 5.1K | 61.6K | 71.1K | 0.843 | claude-fable-5-2 |  |
| agent-a2ca01a00741a9ae6 | mayker-dev:orchestrator | deliver | 5 | 6 | 22 | 4.4 | 0/1/3 | n/a/2.00/4.00 | 6.6K | 68.9K | 90.6K | 0.781 | claude-fable-5-2 |  |
| agent-a2f328889beec9f96 | mayker-dev:planner | deliver | 5 | 12 | 32 | 2.91 | 1/1/9 | 6.00/2.00/2.67 | 13.3K | 84.7K | 106.4K | 0.908 | claude-opus-5-5 |  |
| agent-a37da87549578da50 | mayker-dev:orchestrator | deliver | 5 | 9 | 19 | 2.38 | 0/3/4 | n/a/1.33/2.25 | 7.5K | 79.2K | 91.6K | 0.871 | claude-fable-5-2 |  |
| agent-a382b8b9e7801cdd8 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 1/1/7 | 2.00/2.00/1.43 | 6.3K | 59.4K | 68.1K | 0.908 | claude-sonnet-5-5 |  |
| agent-a3f656ea69ff114f7 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 1/0/2 | 3.00/n/a/1.50 | 1.0K | 48.0K | 61.9K | 0.746 | claude-sonnet-5-5 |  |
| agent-a44629b6f611efcc9 | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 1/2/1 | 5.00/3.50/1.00 | 2.9K | 55.3K | 62.2K | 0.823 | claude-sonnet-5-5 |  |
| agent-a4cb2ae678a7bcd47 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 3/2/4 | 1.67/1.50/1.50 | 6.2K | 55.6K | 62.3K | 0.912 | claude-sonnet-5-5 |  |
| agent-a54ce85b704e47e62 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.1K | 49.3K | 53.5K | 0.835 | claude-fable-5-2 |  |
| agent-a58edc72731702f40 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 4.8K | 45.1K | 60.1K | 0.556 | claude-opus-5-5 |  |
| agent-a5a22ce11111650cf | mayker-dev:reviewer | deliver | 5 | 6 | 28 | 5.6 | 5/0/0 | 5.60/n/a/n/a | 7.8K | 74.2K | 98.3K | 0.8 | claude-opus-5-5 |  |
| agent-a5d7b1ab399295613 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.00/5.00/1.00 | 6.0K | 55.6K | 63.5K | 0.871 | claude-sonnet-5-5 |  |
| agent-a6bca26a73f566289 | mayker-dev:orchestrator | deliver | 3 | 12 | 29 | 2.64 | 0/3/7 | n/a/1.33/2.86 | 13.2K | 103.7K | 123.7K | 0.901 | claude-fable-5-2 |  |
| agent-a700d045e503e9798 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 939 | 40.2K | 45.9K | 0.73 | claude-sonnet-5-5 |  |
| agent-a71bdc444b800a2dc | mayker-dev:reviewer | deliver | 5 | 6 | 26 | 5.2 | 5/0/0 | 5.20/n/a/n/a | 9.2K | 59.6K | 75.7K | 0.814 | claude-opus-5-5 |  |
| agent-a75c33334990646e3 | mayker-dev:orchestrator | deliver | 5 | 8 | 21 | 3.0 | 1/1/3 | 8.00/2.00/2.00 | 6.5K | 80.3K | 100.1K | 0.864 | claude-fable-5-2 |  |
| agent-a7bff024d73152132 | mayker-dev:planner | deliver | 5 | 11 | 30 | 3.0 | 0/2/7 | n/a/1.50/3.00 | 15.2K | 83.7K | 102.5K | 0.903 | claude-opus-5-5 |  |
| agent-a7caaa2dd177d0757 | mayker-dev:builder | deliver | 5 | 6 | 25 | 5.0 | 2/1/2 | 5.00/12.00/1.50 | 6.5K | 55.8K | 65.7K | 0.843 | claude-sonnet-5-5 |  |
| agent-a814139acf89f33e2 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.00/1.50/1.25 | 6.2K | 54.4K | 61.5K | 0.902 | claude-sonnet-5-5 |  |
| agent-a81c48b5d764f923c | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 4.00/3.00/1.00 | 2.7K | 46.3K | 49.8K | 0.888 | claude-sonnet-5-5 |  |
| agent-a880ca3e751d79b91 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 2.50/1.50/1.25 | 6.4K | 54.5K | 61.6K | 0.901 | claude-sonnet-5-5 |  |
| agent-a8baa6480dd440c2c | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 1/2/5 | 2.00/3.00/1.20 | 3.2K | 45.9K | 49.0K | 0.913 | claude-sonnet-5-5 |  |
| agent-a92dcfd8c29018819 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 1/1/4 | 8.00/1.00/2.75 | 8.3K | 62.6K | 71.9K | 0.866 | claude-fable-5-2 |  |
| agent-a9faae70e43b82884 | mayker-dev:reviewer | deliver | 5 | 2 | 6 | 6.0 | 1/0/0 | 6.00/n/a/n/a | 2.0K | 37.6K | 49.1K | 0.472 | claude-opus-5-5 |  |
| agent-aa4312aa555fb5145 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 5.00/2.00/2.33 | 4.8K | 55.5K | 65.2K | 0.843 | claude-fable-5-2 |  |
| agent-aa800b67e6e67d219 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 1/2/2 | 4.00/3.00/1.00 | 3.9K | 50.9K | 56.4K | 0.815 | claude-sonnet-5-5 |  |
| agent-aacbc8996432e1b55 | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.33 | 1/2/3 | 6.00/2.00/1.33 | 6.1K | 54.7K | 61.8K | 0.888 | claude-fable-5-2 |  |
| agent-ab151a1efa7893788 | mayker-dev:orchestrator | deliver | 5 | 7 | 21 | 3.5 | 1/1/4 | 7.00/2.00/3.00 | 7.5K | 63.9K | 77.0K | 0.857 | claude-fable-5-2 |  |
| agent-ab3e3650583a3c17d | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 727 | 42.7K | 55.3K | 0.672 | claude-sonnet-5-5 |  |
| agent-ab6bbe37220ea6adc | mayker-dev:builder | deliver | 5 | 14 | 25 | 1.92 | 2/1/9 | 2.00/3.00/1.89 | 7.1K | 65.6K | 75.6K | 0.932 | claude-sonnet-5-5 |  |
| agent-abe9a7fd71f81c47c | mayker-dev:planner | deliver | 5 | 15 | 41 | 2.93 | 1/2/10 | 1.00/1.50/2.40 | 20.5K | 89.3K | 109.2K | 0.928 | claude-opus-5-5 |  |
| agent-ac4787ba205129913 | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 1/1/4 | 1.00/1.00/2.00 | 2.8K | 54.6K | 65.1K | 0.864 | claude-sonnet-5-5 |  |
| agent-aca51c5431ae9d93b | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 4.9K | 45.5K | 61.2K | 0.552 | claude-opus-5-5 |  |
| agent-acdf94ce386a11221 | mayker-dev:builder | deliver | 5 | 5 | 5 | 1.25 | 3/0/1 | 1.33/n/a/1.00 | 1.1K | 48.2K | 56.7K | 0.82 | claude-sonnet-5-5 |  |
| agent-ad20366e80ea6d8c2 | mayker-dev:builder | deliver | 5 | 6 | 8 | 1.6 | 1/1/3 | 3.00/2.00/1.00 | 2.0K | 46.9K | 50.2K | 0.869 | claude-sonnet-5-5 |  |
| agent-adaad1c6efd82dad1 | mayker-dev:planner | deliver | 5 | 8 | 26 | 3.71 | 1/1/5 | 8.00/2.00/3.20 | 12.0K | 79.5K | 101.7K | 0.84 | claude-opus-5-5 |  |
| agent-adb89e738513a825b | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/1/3 | 2.50/9.00/2.67 | 6.3K | 60.1K | 71.5K | 0.862 | claude-sonnet-5-5 |  |
| agent-addfeb28cbc7aba2d | mayker-dev:reviewer | deliver | 5 | 3 | 16 | 8.0 | 2/0/0 | 8.00/n/a/n/a | 4.9K | 47.3K | 66.4K | 0.598 | claude-opus-5-5 |  |

**47 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 6): median ctx max 65.1K, peak 123.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 45.9K, 49.0K, 49.1K, 49.8K, 50.2K, 52.8K, 53.0K, 53.5K, 55.3K, 56.0K, 56.4K, 56.7K, 60.1K, 60.7K, 61.0K, 61.2K, 61.5K, 61.6K, 61.8K, 61.9K, 62.2K, 62.3K, 63.5K, 65.1K, 65.2K, 65.7K, 66.4K, 68.1K, 71.1K, 71.5K, 71.9K, 72.9K, 73.0K, 73.2K, 75.6K, 75.7K, 77.0K, 90.6K, 91.6K, 98.3K, 100.1K, 101.7K, 102.1K, 102.5K, 106.4K, 109.2K, 123.7K.

**All runs:** 1 run(s), wall 43m59s (sum of per-run walls, idle time between runs excluded), 542 turns, 1081 tool calls, 411.5K output tokens, cache hit 0.959.

Turn classes across every bucket, read / edit / exec: 74/84/265 turns, 4.04/2.33/1.79 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m16s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

All runs: CI wait: 7m00s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m58s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
