# Run statistics, run

Generated 2026-10-05 17:00 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 63 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `<synthetic>`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | MCP verification | 0m22s | 6 | 7 | 1.17 | 2 | 1.3K | 94.2K | 110.7K | 0 | 0.949 | claude-opus-5-5 | 0/0/4 | n/a/n/a/1.25 |  |
| 3 | Ingest the backlog | 3m25s | 18 | 28 | 1.65 | 5 | 6.3K | 130.3K | 162.4K | 0 | 0.934 | claude-opus-5-5 | 3/3/9 | 2.00/1.33/1.78 |  |
| 5 | Scheduler loop | 1h38m | 633 | 1097 | 1.83 | 14 | 203.7K | 211.1K | 613.2K | 0 | 0.967 | claude-opus-5-5 | 70/26/400 | 4.53/2.62/1.49 |  |
| 8 | Final report | 2m31s | 11 | 15 | 1.5 | 6 | 4.8K | 276.5K | 626.9K | 0 | 0.973 | claude-fable-5-1 | 1/0/7 | 6.00/n/a/1.00 |  |
| **run total** |  | 1h44m | 668 | 1147 | 1.81 | 14 | 216.0K |  | 626.9K |  | 0.966 | claude-opus-5-5 | 74/29/420 | 4.45/2.48/1.48 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h44m.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a007aa1c4937c7ef5 | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.0 | 1/0/3 | 4.00/n/a/1.67 | 62 | 65.9K | 73.5K | 0.846 | claude-sonnet-5-5 |  |
| agent-a0b8274ccc22f32d0 | mayker-dev:builder | deliver | 5 | 6 | 11 | 1.83 | 1/0/4 | 6.00/n/a/1.00 | 89 | 80.2K | 89.6K | 0.861 | claude-sonnet-5-5 |  |
| agent-a16f2396bb654de7e | mayker-dev:builder | deliver | 5 | 3 | 4 | 1.33 | 2/0/0 | 1.50/n/a/n/a | 47 | 58.7K | 65.9K | 0.755 | claude-sonnet-5-5 |  |
| agent-a1d3e65d3b632de45 | mayker-dev:builder | deliver | 5 | 10 | 15 | 1.5 | 2/0/7 | 3.50/n/a/1.00 | 117 | 69.4K | 75.8K | 0.925 | claude-sonnet-5-5 |  |
| agent-a1dfd82fa0b6983e0 | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.0 | 1/1/2 | 5.00/2.00/1.00 | 79 | 75.1K | 82.2K | 0.842 | claude-sonnet-5-5 |  |
| agent-a1f4e459b22dc1e87 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 4.33 | 2/0/0 | 6.00/n/a/n/a | 27 | 41.8K | 53.1K | 0.576 | claude-opus-5-5 |  |
| agent-a2ae99496441901b9 | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.0 | 1/1/2 | 5.00/2.00/1.00 | 78 | 68.0K | 73.5K | 0.851 | claude-sonnet-5-5 |  |
| agent-a37553e3a8afbd3bf | mayker-dev:builder | deliver | 5 | 5 | 13 | 2.6 | 1/1/2 | 5.00/5.00/1.00 | 77 | 66.1K | 71.3K | 0.784 | claude-sonnet-5-5 |  |
| agent-a4317fcba66edc7d3 | mayker-dev:builder | deliver | 5 | 17 | 23 | 1.35 | 1/2/13 | 2.00/1.50/1.31 | 179 | 84.6K | 94.3K | 0.95 | claude-sonnet-5-5 |  |
| agent-a444f1454da225a19 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.0 | 1/1/3 | 2.00/3.00/2.00 | 84 | 69.4K | 76.0K | 0.872 | claude-sonnet-5-5 |  |
| agent-a46b8528c06202b5c | mayker-dev:orchestrator | deliver | 5 | 3 | 8 | 2.67 | 1/0/1 | 6.00/n/a/1.00 | 13 | 59.8K | 66.4K | 0.749 | claude-fable-5-1 |  |
| agent-a47686af735d6ae2d | mayker-dev:orchestrator | deliver | 8 | 7 | 12 | 1.71 | 1/0/5 | 6.00/n/a/1.00 | 146 | 79.8K | 89.8K | 0.878 | claude-fable-5-1 |  |
| agent-a4d9d1f5ec7a5824e | mayker-dev:builder | deliver | 5 | 2 | 3 | 1.5 | 1/0/0 | 2.00/n/a/n/a | 19 | 54.9K | 59.9K | 0.662 | claude-sonnet-5-5 |  |
| agent-a4da9a36e8ac4d16e | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 2.5 | 0/0/3 | n/a/n/a/3.00 | 101 | 60.9K | 68.4K | 0.719 | claude-fable-5-1 |  |
| agent-a52ab8666bc71128a | mayker-dev:builder | deliver | 5 | 7 | 13 | 1.86 | 1/1/4 | 5.00/2.00/1.25 | 68 | 73.4K | 81.5K | 0.886 | claude-sonnet-5-5 |  |
| agent-a56e7a9627751baa5 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 2/0/3 | 3.50/n/a/1.00 | 34 | 58.2K | 78.8K | 0.86 | claude-fable-5-1 |  |
| agent-a57ce2b8fbdb7fb38 | mayker-dev:builder | deliver | 5 | 10 | 16 | 1.6 | 2/1/6 | 4.00/1.00/1.00 | 160 | 86.0K | 93.4K | 0.918 | claude-sonnet-5-5 |  |
| agent-a5f19f30792b3321a | mayker-dev:orchestrator | deliver | 5 | 4 | 7 | 1.75 | 1/0/2 | 4.00/n/a/1.00 | 123 | 70.3K | 80.9K | 0.788 | claude-fable-5-1 |  |
| agent-a6200129f9eec2f9c | mayker-dev:builder | deliver | 5 | 9 | 22 | 2.44 | 2/0/6 | 7.50/n/a/1.00 | 119 | 91.1K | 101.2K | 0.904 | claude-sonnet-5-5 |  |
| agent-a629d2ab0d7079422 | mayker-dev:planner | deliver | 5 | 14 | 20 | 1.43 | 0/0/13 | n/a/n/a/1.46 | 143 | 109.4K | 133.9K | 0.913 | claude-opus-5-5 |  |
| agent-a6a033a8f532949ac | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.2 | 1/1/2 | 4.00/4.00/1.00 | 83 | 59.9K | 63.5K | 0.864 | claude-sonnet-5-5 |  |
| agent-a6b47a8cbec224d0c | mayker-dev:orchestrator | deliver | 5 | 3 | 8 | 2.67 | 0/0/2 | n/a/n/a/3.50 | 54 | 60.1K | 70.7K | 0.607 | claude-fable-5-1 |  |
| agent-a6b6776a531556688 | mayker-dev:orchestrator | deliver | 5 | 2 | 8 | 4.0 | 0/0/1 | n/a/n/a/7.00 | 15 | 61.9K | 75.2K | 0.393 | claude-fable-5-1 |  |
| agent-a80c05e767de085c4 | mayker-dev:builder | deliver | 5 | 11 | 20 | 1.82 | 1/1/7 | 5.00/4.00/1.14 | 112 | 81.6K | 89.3K | 0.926 | claude-sonnet-5-5 |  |
| agent-a80cfc34ee9dc8edc | mayker-dev:planner | deliver | 5 | 12 | 17 | 1.42 | 0/0/11 | n/a/n/a/1.45 | 136 | 104.6K | 126.2K | 0.899 | claude-opus-5-5 |  |
| agent-a82bfb4d58ac3463c | mayker-dev:reviewer | deliver | 5 | 5 | 17 | 3.4 | 4/0/0 | 4.00/n/a/n/a | 38 | 50.1K | 60.3K | 0.76 | claude-opus-5-5 |  |
| agent-a86f98d8f06ece86b | mayker-dev:builder | deliver | 5 | 8 | 15 | 1.88 | 2/0/5 | 4.50/n/a/1.00 | 122 | 75.7K | 81.6K | 0.865 | claude-sonnet-5-5 |  |
| agent-a88b11242e55f60b6 | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 2.25 | 1/0/2 | 6.00/n/a/1.00 | 74 | 63.4K | 71.4K | 0.802 | claude-fable-5-1 |  |
| agent-a89debea2b1cb4630 | mayker-dev:reviewer | deliver | 5 | 5 | 16 | 3.2 | 4/0/0 | 3.75/n/a/n/a | 123 | 51.3K | 61.8K | 0.794 | claude-opus-5-5 |  |
| agent-a8c090b9841593cd9 | mayker-dev:builder | deliver | 5 | 2 | 4 | 2.0 | 1/0/0 | 3.00/n/a/n/a | 19 | 57.9K | 65.7K | 0.63 | claude-sonnet-5-5 |  |
| agent-a92b3f80af9ed1aa2 | mayker-dev:builder | deliver | 5 | 9 | 27 | 3.0 | 1/2/5 | 5.00/6.00/1.80 | 175 | 86.6K | 94.9K | 0.878 | claude-sonnet-5-5 |  |
| agent-a9cb6bc37b081001d | mayker-dev:planner | deliver | 5 | 9 | 14 | 1.56 | 0/0/8 | n/a/n/a/1.62 | 94 | 93.8K | 113.3K | 0.866 | claude-opus-5-5 |  |
| agent-a9df71ad26a6eef73 | mayker-dev:orchestrator | deliver | 3 | 4 | 11 | 2.75 | 0/0/3 | n/a/n/a/3.33 | 19 | 80.9K | 103.3K | 0.681 | claude-fable-5-1 |  |
| agent-a9ed4490ff66fa241 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.4 | 1/1/2 | 1.00/1.00/2.00 | 210 | 59.3K | 62.1K | 0.868 | claude-sonnet-5-5 |  |
| agent-a9f42f8a08bd6df2b | mayker-dev:builder | deliver | 5 | 17 | 27 | 1.59 | 1/0/13 | 6.00/n/a/1.31 | 220 | 87.2K | 95.7K | 0.951 | claude-sonnet-5-5 |  |
| agent-ab402d4d592d6c870 | mayker-dev:orchestrator | deliver | 5 | 3 | 6 | 2.0 | 1/0/1 | 4.00/n/a/1.00 | 50 | 65.8K | 76.9K | 0.719 | claude-fable-5-1 |  |
| agent-abd1ec5cf188e7326 | mayker-dev:builder | deliver | 5 | 2 | 3 | 1.5 | 1/0/0 | 2.00/n/a/n/a | 21 | 55.2K | 60.3K | 0.661 | claude-sonnet-5-5 |  |
| agent-abd4e71f541f48a86 | mayker-dev:builder | deliver | 5 | 5 | 16 | 3.2 | 1/1/2 | 6.00/6.00/1.50 | 69 | 69.8K | 77.0K | 0.845 | claude-sonnet-5-5 |  |
| agent-ac0f64d33837afbca | mayker-dev:orchestrator | deliver | 5 | 3 | 10 | 3.33 | 1/0/1 | 8.00/n/a/1.00 | 15 | 67.2K | 78.8K | 0.715 | claude-fable-5-1 |  |
| agent-ac63644763483abf5 | mayker-dev:orchestrator | deliver | 5 | 3 | 8 | 2.67 | 0/0/2 | n/a/n/a/3.50 | 31 | 57.7K | 64.9K | 0.624 | claude-fable-5-1 |  |
| agent-ac82ab4d5e25eb95f | mayker-dev:builder | deliver | 5 | 2 | 3 | 1.5 | 1/0/0 | 2.00/n/a/n/a | 21 | 55.0K | 60.2K | 0.66 | claude-sonnet-5-5 |  |
| agent-acbcd5bc02b785937 | mayker-dev:planner | deliver | 5 | 11 | 15 | 1.36 | 1/0/9 | 1.00/n/a/1.44 | 238 | 92.3K | 115.9K | 0.886 | claude-opus-5-5 |  |
| agent-acccf07ccec8c4fb8 | mayker-dev:planner | deliver | 5 | 9 | 15 | 1.67 | 0/0/8 | n/a/n/a/1.75 | 126 | 78.2K | 87.6K | 0.906 | claude-opus-5-5 |  |
| agent-ad2df26cc5fd11053 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 5.5 | 3/0/0 | 7.00/n/a/n/a | 26 | 56.5K | 79.6K | 0.687 | claude-opus-5-5 |  |
| agent-ad2ef48595e56fb38 | mayker-dev:reviewer | deliver | 5 | 6 | 24 | 4.0 | 5/0/0 | 4.60/n/a/n/a | 49 | 57.7K | 70.8K | 0.796 | claude-opus-5-5 |  |
| agent-ad60bb4c37f79d17f | mayker-dev:builder | deliver | 5 | 6 | 11 | 1.83 | 1/2/2 | 5.00/1.50/1.00 | 87 | 81.6K | 89.7K | 0.864 | claude-sonnet-5-5 |  |
| agent-ad70c92ec25c9c94b | mayker-dev:builder | deliver | 5 | 4 | 7 | 1.75 | 0/0/3 | n/a/n/a/2.00 | 72 | 59.1K | 62.8K | 0.831 | claude-sonnet-5-5 |  |
| agent-ad7559dc86cb1c3a0 | mayker-dev:reviewer | deliver | 5 | 3 | 21 | 7.0 | 2/0/0 | 10.00/n/a/n/a | 47 | 47.4K | 65.5K | 0.602 | claude-opus-5-5 |  |
| agent-ada45a0f410560562 | mayker-dev:orchestrator | deliver | 5 | 3 | 10 | 3.33 | 1/0/1 | 8.00/n/a/1.00 | 16 | 65.8K | 76.2K | 0.723 | claude-fable-5-1 |  |
| agent-addbac49813eeb629 | mayker-dev:orchestrator | deliver | 5 | 3 | 9 | 3.0 | 1/0/1 | 7.00/n/a/1.00 | 16 | 67.6K | 78.6K | 0.718 | claude-fable-5-1 |  |
| agent-ade181fa935b659e2 | mayker-dev:planner | deliver | 5 | 10 | 17 | 1.7 | 1/0/8 | 3.00/n/a/1.62 | 102 | 92.1K | 108.8K | 0.905 | claude-opus-5-5 |  |
| agent-adfb20eaf10cedd29 | mayker-dev:reviewer | deliver | 5 | 3 | 11 | 3.67 | 2/0/0 | 5.00/n/a/n/a | 31 | 40.6K | 49.3K | 0.595 | claude-opus-5-5 |  |
| agent-ae47cd6762e1be420 | mayker-dev:builder | deliver | 5 | 5 | 12 | 2.4 | 0/0/4 | n/a/n/a/2.75 | 66 | 65.1K | 70.3K | 0.784 | claude-sonnet-5-5 |  |
| agent-ae5c2a28b39ed768e | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.43 | 1/2/3 | 3.00/3.00/2.33 | 128 | 77.7K | 85.8K | 0.884 | claude-sonnet-5-5 |  |
| agent-aea7b5ce4bc71a586 | mayker-dev:builder | deliver | 5 | 2 | 4 | 2.0 | 0/0/1 | n/a/n/a/3.00 | 100 | 59.8K | 69.8K | 0.608 | claude-sonnet-5-5 |  |
| agent-aebea1443afec4ed7 | mayker-dev:planner | deliver | 5 | 8 | 14 | 1.75 | 0/0/7 | n/a/n/a/1.86 | 108 | 100.0K | 117.8K | 0.853 | claude-opus-5-5 |  |
| agent-aec8fffb7c77716e8 | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 2.5 | 1/0/2 | 7.00/n/a/1.00 | 35 | 65.0K | 73.1K | 0.801 | claude-fable-5-1 |  |
| agent-af9a924ee24544c64 | mayker-dev:builder | deliver | 5 | 5 | 9 | 1.8 | 2/0/2 | 3.00/n/a/1.00 | 87 | 64.3K | 69.5K | 0.855 | claude-sonnet-5-5 |  |
| agent-afb254d789402d764 | mayker-dev:builder | deliver | 5 | 6 | 15 | 2.5 | 0/0/5 | n/a/n/a/2.80 | 83 | 71.5K | 78.8K | 0.816 | claude-sonnet-5-5 |  |
| agent-afbc19d027eb33ec1 | mayker-dev:orchestrator | deliver | 5 | 3 | 7 | 2.33 | 0/0/2 | n/a/n/a/3.00 | 13 | 69.3K | 80.1K | 0.718 | claude-fable-5-1 |  |
| agent-afbfc6c4c9bfb412c | mayker-dev:builder | deliver | 5 | 4 | 8 | 2.0 | 1/0/2 | 4.00/n/a/1.50 | 66 | 59.9K | 63.7K | 0.83 | claude-sonnet-5-5 |  |
| agent-afded188ece1bb287 | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.2 | 1/0/3 | 7.00/n/a/1.00 | 35 | 74.6K | 86.7K | 0.825 | claude-fable-5-1 |  |
| agent-afe9b508171114705 | mayker-dev:planner | deliver | 5 | 11 | 17 | 1.55 | 0/0/10 | n/a/n/a/1.60 | 97 | 95.1K | 116.0K | 0.889 | claude-opus-5-5 |  |

**63 dispatch(es)** (mayker-dev:builder 31, mayker-dev:orchestrator 17, mayker-dev:planner 8, mayker-dev:reviewer 7): median ctx max 76.9K, peak 133.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 49.3K, 53.1K, 59.9K, 60.2K, 60.3K, 60.3K, 61.8K, 62.1K, 62.8K, 63.5K, 63.7K, 64.9K, 65.5K, 65.7K, 65.9K, 66.4K, 68.4K, 69.5K, 69.8K, 70.3K, 70.7K, 70.8K, 71.3K, 71.4K, 73.1K, 73.5K, 73.5K, 75.2K, 75.8K, 76.0K, 76.2K, 76.9K, 77.0K, 78.6K, 78.8K, 78.8K, 78.8K, 79.6K, 80.1K, 80.9K, 81.5K, 81.6K, 82.2K, 85.8K, 86.7K, 87.6K, 89.3K, 89.6K, 89.7K, 89.8K, 93.4K, 94.3K, 94.9K, 95.7K, 101.2K, 103.3K, 108.8K, 113.3K, 115.9K, 116.0K, 117.8K, 126.2K, 133.9K.

**All runs:** 1 run(s), wall 1h44m (sum of per-run walls, idle time between runs excluded), 668 turns, 1147 tool calls, 216.0K output tokens, cache hit 0.966.

Turn classes across every bucket, read / edit / exec: 74/29/420 turns, 4.45/2.48/1.48 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

7 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/5).
