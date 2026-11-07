# Run statistics, run

Generated 2026-11-07 22:09 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 45 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 51m03s | 557 | 1063 | 2.17 | 15 | 431.6K |  | 480.7K |  | 0.961 | claude-opus-5-5 | 84/88/279 (exec 79% of wall) | 3.90/2.19/1.71 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m04s.

Exec turns took 40m20s of round trip (command plus model time, ADR 0006 section 2): 79% of wall.

CI wait: 6m49s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m14s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0134343bf5958869 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 3.00/2.00/1.00 | 5.5K | 56.4K | 62.3K | 0.903 | claude-sonnet-5-5 |  |
| agent-a0dc4a728fd229b8b | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 2.50/1.50/1.20 | 5.5K | 54.1K | 59.5K | 0.914 | claude-sonnet-5-5 |  |
| agent-a18a5facd2d980428 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/2/1 | 3.00/3.00/1.00 | 3.9K | 53.6K | 60.4K | 0.852 | claude-sonnet-5-5 |  |
| agent-a1c21c369d67d5b7f | mayker-dev:builder | deliver | 5 | 9 | 20 | 2.5 | 1/2/5 | 2.00/3.00/2.40 | 4.2K | 54.5K | 59.8K | 0.905 | claude-sonnet-5-5 |  |
| agent-a266eaee521dfef1d | mayker-dev:planner | deliver | 5 | 12 | 29 | 2.64 | 2/2/6 | 3.50/1.50/2.17 | 15.7K | 85.8K | 108.5K | 0.907 | claude-opus-5-5 |  |
| agent-a27ba6b53cb2c0c90 | mayker-dev:builder | deliver | 5 | 6 | 20 | 4.0 | 1/1/3 | 4.00/9.00/2.33 | 5.8K | 59.1K | 68.1K | 0.808 | claude-sonnet-5-5 |  |
| agent-a2897994762277145 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 2.3K | 51.1K | 56.4K | 0.858 | claude-sonnet-5-5 |  |
| agent-a3a13b3c3878d6c46 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 7.00/2.00/2.00 | 8.1K | 56.5K | 65.3K | 0.845 | claude-fable-5-1 |  |
| agent-a3ffbb017903e67cb | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 4.00/2.00/2.50 | 6.9K | 61.2K | 71.2K | 0.833 | claude-fable-5-1 |  |
| agent-a4548f795e0727b77 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.50/2.00/1.00 | 5.4K | 47.8K | 53.4K | 0.894 | claude-sonnet-5-5 |  |
| agent-a541bf1ce2f070fd2 | mayker-dev:builder | deliver | 5 | 18 | 28 | 1.65 | 3/1/12 | 2.33/2.00/1.50 | 7.3K | 63.8K | 70.7K | 0.95 | claude-sonnet-5-5 |  |
| agent-a556fe4c8adc754e9 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 914 | 45.5K | 55.6K | 0.766 | claude-sonnet-5-5 |  |
| agent-a557db1d6136a0408 | mayker-dev:planner | deliver | 5 | 11 | 28 | 2.8 | 1/1/8 | 4.00/2.00/2.75 | 13.2K | 72.3K | 92.6K | 0.884 | claude-opus-5-5 |  |
| agent-a55ffba687a6b38d7 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 5.5K | 52.7K | 71.4K | 0.705 | claude-opus-5-5 |  |
| agent-a5a3697f1d07befb0 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.0K | 54.6K | 70.7K | 0.719 | claude-opus-5-5 |  |
| agent-a5b6c759ba75d01bb | mayker-dev:orchestrator | deliver | 5 | 6 | 8 | 1.6 | 2/1/2 | 2.50/1.00/1.00 | 3.9K | 45.6K | 50.2K | 0.816 | claude-fable-5-1 |  |
| agent-a5c8e8ccd3fd806b5 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 3.00/2.00/1.25 | 3.7K | 56.2K | 62.1K | 0.891 | claude-sonnet-5-5 |  |
| agent-a6695ec188728503e | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/1/4 | 5.50/1.00/1.00 | 3.1K | 57.4K | 62.6K | 0.892 | claude-sonnet-5-5 |  |
| agent-a6c273e7bd52e6523 | mayker-dev:builder | deliver | 5 | 6 | 30 | 6.0 | 2/1/2 | 6.50/15.00/1.00 | 8.7K | 62.5K | 73.7K | 0.838 | claude-sonnet-5-5 |  |
| agent-a7089b1839492820e | mayker-dev:orchestrator | deliver | 5 | 8 | 10 | 1.67 | 2/1/3 | 2.50/1.00/1.33 | 4.9K | 49.1K | 55.1K | 0.896 | claude-fable-5-1 |  |
| agent-a76d747afd8ba0af8 | mayker-dev:planner | deliver | 5 | 14 | 38 | 2.92 | 0/2/10 | n/a/1.50/2.90 | 17.2K | 87.8K | 107.9K | 0.912 | claude-opus-5-5 |  |
| agent-a77ef2f01c5e4df3b | mayker-dev:planner | deliver | 5 | 14 | 39 | 3.0 | 0/3/9 | n/a/1.33/2.78 | 19.9K | 100.2K | 123.0K | 0.921 | claude-opus-5-5 |  |
| agent-a85effb5d5135be0a | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 50.6K | 62.0K | 0.758 | claude-sonnet-5-5 |  |
| agent-a8ae5ea57a4083807 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/1/5 | 2.50/2.00/1.20 | 4.8K | 57.6K | 64.6K | 0.901 | claude-sonnet-5-5 |  |
| agent-a8bcabdff2d2e62ec | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 5.3K | 48.7K | 61.1K | 0.686 | claude-opus-5-5 |  |
| agent-a9605775cd88f8eda | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 2/0/1 | 1.50/n/a/1.00 | 941 | 45.1K | 54.8K | 0.768 | claude-sonnet-5-5 |  |
| agent-aa2fe29774be1561d | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 4.50/10.00/1.00 | 7.5K | 61.9K | 71.9K | 0.841 | claude-sonnet-5-5 |  |
| agent-aa5574aa582da7530 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 5.5K | 49.7K | 62.9K | 0.684 | claude-opus-5-5 |  |
| agent-aa93ffc0e5438e66c | mayker-dev:orchestrator | deliver | 5 | 9 | 17 | 2.12 | 1/2/4 | 4.00/2.00/2.00 | 10.6K | 82.5K | 102.9K | 0.881 | claude-fable-5-1 |  |
| agent-aad3cfb07e3f21265 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 46.7K | 60.5K | 0.746 | claude-sonnet-5-5 |  |
| agent-ab7b10de26d8ba31e | mayker-dev:orchestrator | deliver | 8 | 8 | 8 | 1.33 | 4/0/2 | 1.50/n/a/1.00 | 15.0K | 61.0K | 74.9K | 0.876 | claude-fable-5-1 |  |
| agent-ab963e142350bdd36 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 3/1/2 | 3.33/1.00/1.00 | 3.6K | 53.2K | 59.4K | 0.84 | claude-fable-5-1 |  |
| agent-ab99ad4279d2b3779 | mayker-dev:planner | deliver | 5 | 12 | 25 | 2.27 | 2/1/8 | 3.00/2.00/2.12 | 12.0K | 78.8K | 98.3K | 0.91 | claude-opus-5-5 |  |
| agent-ac234124e4819c2f7 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 50.8K | 62.2K | 0.758 | claude-sonnet-5-5 |  |
| agent-ac39463d318119372 | mayker-dev:builder | deliver | 5 | 6 | 23 | 4.6 | 0/1/4 | n/a/9.00/3.50 | 8.3K | 66.5K | 78.2K | 0.836 | claude-sonnet-5-5 |  |
| agent-ac803907b4e4123bc | mayker-dev:builder | deliver | 5 | 10 | 23 | 2.56 | 1/1/7 | 4.00/4.00/2.14 | 5.6K | 62.3K | 69.1K | 0.91 | claude-sonnet-5-5 |  |
| agent-ad24da466c406fd6a | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 3/1/2 | 5.33/1.00/1.50 | 8.7K | 65.2K | 76.9K | 0.859 | claude-fable-5-1 |  |
| agent-ad600714c1515387d | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 6.7K | 53.1K | 69.4K | 0.717 | claude-opus-5-5 |  |
| agent-adc0ef98ce9ec00be | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 8.00/2.00/1.67 | 6.9K | 54.6K | 62.3K | 0.809 | claude-fable-5-1 |  |
| agent-adc71b780f92b3a5a | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 8.00/1.00/1.25 | 6.8K | 55.5K | 64.1K | 0.834 | claude-fable-5-1 |  |
| agent-ae1296d2ae1f3c66e | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 2/1/3 | 4.50/1.00/2.67 | 6.7K | 56.6K | 62.6K | 0.874 | claude-fable-5-1 |  |
| agent-ae48f3a899040bca2 | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 1/2/3 | 4.00/1.50/1.00 | 2.9K | 50.1K | 54.1K | 0.883 | claude-sonnet-5-5 |  |
| agent-aefba8fcb795b4b46 | mayker-dev:builder | deliver | 5 | 6 | 18 | 3.6 | 1/2/2 | 7.00/4.50/1.00 | 5.1K | 60.8K | 68.7K | 0.812 | claude-sonnet-5-5 |  |
| agent-af38f30bbe907448d | mayker-dev:orchestrator | deliver | 3 | 10 | 28 | 3.11 | 1/3/5 | 4.00/2.00/3.60 | 21.3K | 103.3K | 132.4K | 0.872 | claude-fable-5-1 |  |
| agent-af3f8269d0e5c98f2 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 1/1/5 | 3.00/6.00/1.60 | 7.1K | 57.8K | 64.6K | 0.888 | claude-sonnet-5-5 |  |

**45 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 64.6K, peak 132.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.2K, 53.4K, 54.1K, 54.8K, 55.1K, 55.6K, 56.4K, 59.4K, 59.5K, 59.8K, 60.4K, 60.5K, 61.1K, 62.0K, 62.1K, 62.2K, 62.3K, 62.3K, 62.6K, 62.6K, 62.9K, 64.1K, 64.6K, 64.6K, 65.3K, 68.1K, 68.7K, 69.1K, 69.4K, 70.7K, 70.7K, 71.2K, 71.4K, 71.9K, 73.7K, 74.9K, 76.9K, 78.2K, 92.6K, 98.3K, 102.9K, 107.9K, 108.5K, 123.0K, 132.4K.

**All runs:** 1 run(s), wall 51m03s (sum of per-run walls, idle time between runs excluded), 557 turns, 1063 tool calls, 431.6K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 84/88/279 turns, 3.90/2.19/1.71 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 40m20s of round trip (command plus model time, ADR 0006 section 2): 79% of wall.

All runs: CI wait: 6m49s in `ci-poll.sh` calls; framework wall (wall less CI wait) 44m14s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
