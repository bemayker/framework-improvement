# Run statistics, run

Generated 2026-11-04 01:39 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 50 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 step window(s) closed under 5s after opening, so their boundaries were written together after the step's work, and that work's time sits in the window before each: deliver step 0 (3s). The wall stands; the per-step split around these steps is NOT a measurement. The marker WRITER is the defect: one boundary per call, written when the step begins.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m03s | 1 | 2 | 2.0 | 2 | 394 | 56.8K | 56.8K | 0 | 0.983 | claude-opus-5-5 | 0/0/1 | n/a/n/a/2.00 |  |
| 1 | MCP verification (hard in autonomous mode) | 0m18s | 6 | 9 | 1.5 | 3 | 1.8K | 70.2K | 78.7K | 0 | 0.948 | claude-opus-5-5 | 1/0/4 | 1.00/n/a/1.75 |  |
| 3 | Ingest the backlog | 5m10s | 15 | 28 | 2.15 | 7 | 21.3K | 86.0K | 108.9K | 0 | 0.901 | claude-fable-5-1 | 2/3/6 | 2.50/2.00/2.50 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 5m10s | 15 | 28 | 2.15 | 7 | 21.3K | 86.0K | 108.9K | 0 | 0.901 | claude-fable-5-1 | 2/3/6 | 2.50/2.00/2.50 |  |
| 5 | The scheduler loop | 56m59s | 532 | 1038 | 2.26 | 13 | 400.5K | 147.9K | 495.3K | 0 | 0.96 | claude-opus-5-5 | 93/62/267 | 3.90/2.15/1.73 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at the wave boundary | 30m43s | 248 | 457 | 2.16 | 12 | 186.7K | 176.8K | 492.5K | 1 | 0.967 | claude-opus-5-5 | 39/34/120 | 3.92/2.03/1.72 |  |
| 8 | Final report | 3m59s | 6 | 8 | 1.6 | 4 | 21.1K | 205.6K | 510.3K | 0 | 0.947 | claude-fable-5-1 | 1/1/2 | 1.00/1.00/2.50 |  |
| **run total** |  | 1h06m | 560 | 1085 | 2.24 | 13 | 445.1K |  | 510.3K |  | 0.959 | claude-opus-5-5 | 97/66/280 (exec 77% of wall) | 3.81/2.12/1.76 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h06m.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 51m28s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

CI wait: 4m41s in `ci-poll.sh` calls; framework wall (wall less CI wait) 1h01m.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a07297bdb4fcf94b6 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 2/1/2 | 1.00/1.00/3.50 | 4.5K | 54.0K | 60.1K | 0.875 | claude-fable-5-1 |  |
| agent-a0801b07358050dc8 | mayker-dev:planner | deliver | 5 | 12 | 33 | 3.0 | 1/1/8 | 6.00/2.00/2.12 | 13.5K | 76.0K | 91.5K | 0.914 | claude-opus-5-5 |  |
| agent-a17653b817f3af4f1 | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/2/3 | 5.00/1.50/1.00 | 3.7K | 54.8K | 59.5K | 0.895 | claude-sonnet-5-5 |  |
| agent-a1a12a1fcd18408f4 | mayker-dev:orchestrator | deliver | 5 | 10 | 21 | 2.33 | 1/2/5 | 4.00/3.00/2.00 | 10.2K | 78.1K | 95.3K | 0.878 | claude-fable-5-1 |  |
| agent-a1c55b8a013d100cf | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 2.8K | 53.9K | 60.1K | 0.814 | claude-sonnet-5-5 |  |
| agent-a1c564d514d24e2c5 | mayker-dev:reviewer | deliver | 5 | 5 | 21 | 5.25 | 4/0/0 | 5.25/n/a/n/a | 5.8K | 52.3K | 63.6K | 0.792 | claude-opus-5-5 |  |
| agent-a221f9a281ded54e6 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 1/2/5 | 3.00/1.50/1.20 | 5.3K | 53.3K | 58.8K | 0.905 | claude-sonnet-5-5 |  |
| agent-a2a74c6a5538641e6 | mayker-dev:orchestrator | deliver | 5 | 7 | 21 | 3.5 | 1/1/4 | 8.00/2.00/2.75 | 6.2K | 58.4K | 66.0K | 0.87 | claude-fable-5-1 |  |
| agent-a2ca67c2fb50a2694 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 5.00/2.00/1.33 | 4.6K | 47.6K | 53.2K | 0.813 | claude-fable-5-1 |  |
| agent-a3622852875b91478 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 8.00/2.50/1.00 | 4.5K | 62.0K | 69.5K | 0.87 | claude-sonnet-5-5 |  |
| agent-a3977d96caf21f50b | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 1/1/2 | 2.00/1.00/2.00 | 1.9K | 40.5K | 43.3K | 0.852 | claude-sonnet-5-5 |  |
| agent-a39f8a174901962b3 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 0/0/2 | n/a/n/a/2.50 | 1.2K | 37.8K | 39.5K | 0.769 | claude-sonnet-5-5 |  |
| agent-a3a3a8ac3e183e8e4 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 2.50/3.00/1.50 | 5.1K | 52.5K | 58.9K | 0.891 | claude-sonnet-5-5 |  |
| agent-a3daff5659c263b17 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.50/2.00/1.50 | 4.5K | 56.3K | 62.5K | 0.891 | claude-sonnet-5-5 |  |
| agent-a4522fc34b149d73f | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 992 | 42.6K | 55.3K | 0.671 | claude-sonnet-5-5 |  |
| agent-a48fe88c6949197f9 | mayker-dev:builder | deliver | 5 | 8 | 23 | 3.29 | 3/1/3 | 3.67/9.00/1.00 | 8.4K | 66.8K | 77.6K | 0.855 | claude-sonnet-5-5 |  |
| agent-a53318595f0a4575d | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.1K | 43.8K | 57.4K | 0.563 | claude-opus-5-5 |  |
| agent-a536b7dc1062dc958 | mayker-dev:reviewer | deliver | 5 | 3 | 7 | 3.5 | 2/0/0 | 3.50/n/a/n/a | 2.4K | 40.9K | 50.6K | 0.663 | claude-opus-5-5 |  |
| agent-a549984beaf60e838 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 1/1/3 | 2.00/1.00/2.33 | 3.7K | 47.5K | 52.5K | 0.815 | claude-fable-5-1 |  |
| agent-a57a80590cf43b68c | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 2/1/3 | 2.00/1.00/1.67 | 2.4K | 52.1K | 59.9K | 0.872 | claude-sonnet-5-5 |  |
| agent-a5af5e3052a16b6d9 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.00/2.00/1.00 | 4.8K | 48.6K | 54.5K | 0.857 | claude-fable-5-1 |  |
| agent-a5c34b6a453efb10c | mayker-dev:reviewer | deliver | 5 | 5 | 22 | 5.5 | 4/0/0 | 5.50/n/a/n/a | 6.9K | 57.4K | 74.7K | 0.772 | claude-opus-5-5 |  |
| agent-a60604a6a27e4dfdb | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 4.50/1.00/1.00 | 4.5K | 51.6K | 56.0K | 0.86 | claude-fable-5-1 |  |
| agent-a62b0171a9a4fca4b | mayker-dev:planner | deliver | 5 | 16 | 32 | 2.13 | 2/2/10 | 3.00/1.50/1.70 | 12.2K | 76.2K | 94.7K | 0.933 | claude-opus-5-5 |  |
| agent-a6660f4e76040509f | mayker-dev:orchestrator | deliver | 8 | 4 | 6 | 2.0 | 1/0/2 | 1.00/n/a/2.50 | 10.4K | 56.2K | 64.9K | 0.774 | claude-fable-5-1 |  |
| agent-a67db685ad0e0fe8d | mayker-dev:orchestrator | deliver | 3 | 12 | 24 | 2.4 | 2/2/5 | 2.50/2.00/2.80 | 19.3K | 85.9K | 108.9K | 0.894 | claude-fable-5-1 |  |
| agent-a71503c4b6f3cd637 | mayker-dev:reviewer | deliver | 5 | 2 | 6 | 6.0 | 1/0/0 | 6.00/n/a/n/a | 1.9K | 36.6K | 47.0K | 0.484 | claude-opus-5-5 |  |
| agent-a77dd4052f78f6a89 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 0/2/3 | n/a/2.50/2.33 | 3.2K | 48.9K | 53.4K | 0.863 | claude-sonnet-5-5 |  |
| agent-a78170f77863106c0 | mayker-dev:orchestrator | deliver | 5 | 8 | 16 | 2.29 | 1/1/5 | 7.00/1.00/1.60 | 6.1K | 50.8K | 56.4K | 0.861 | claude-fable-5-1 |  |
| agent-a7c46376af570e7d5 | mayker-dev:orchestrator | deliver | 5 | 9 | 17 | 2.12 | 1/2/4 | 4.00/2.00/2.00 | 12.7K | 83.2K | 105.6K | 0.859 | claude-fable-5-1 |  |
| agent-a824e33a479e72fe0 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 874 | 51.0K | 62.3K | 0.76 | claude-sonnet-5-5 |  |
| agent-a88a51caedc69ac7a | mayker-dev:planner | deliver | 5 | 13 | 28 | 2.33 | 2/2/7 | 4.00/1.50/1.71 | 11.6K | 73.9K | 93.0K | 0.903 | claude-opus-5-5 |  |
| agent-a8f4bf99abe25e275 | mayker-dev:builder | deliver | 5 | 5 | 15 | 3.75 | 2/1/1 | 6.00/2.00/1.00 | 3.2K | 55.0K | 63.3K | 0.818 | claude-sonnet-5-5 |  |
| agent-a968cb31aa998ebd7 | mayker-dev:orchestrator | deliver | 5 | 9 | 16 | 2.0 | 3/1/4 | 3.33/2.00/1.00 | 6.2K | 49.9K | 56.5K | 0.874 | claude-fable-5-1 |  |
| agent-aa1686ce95667358c | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/2/2 | 4.50/2.00/1.00 | 5.9K | 61.2K | 70.0K | 0.868 | claude-sonnet-5-5 |  |
| agent-aa2c46c9a5f035e47 | mayker-dev:reviewer | deliver | 5 | 6 | 29 | 5.8 | 5/0/0 | 5.80/n/a/n/a | 8.0K | 65.9K | 83.9K | 0.811 | claude-opus-5-5 |  |
| agent-aa3751a52d5af540b | mayker-dev:builder | deliver | 5 | 5 | 6 | 1.5 | 2/0/2 | 2.00/n/a/1.00 | 1.4K | 48.1K | 56.6K | 0.82 | claude-sonnet-5-5 |  |
| agent-aaf6e0e2cc9f15d06 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 4.7K | 47.5K | 52.6K | 0.86 | claude-fable-5-1 |  |
| agent-aafb32397d586c234 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.00/2.00/1.00 | 3.0K | 52.2K | 57.1K | 0.86 | claude-sonnet-5-5 |  |
| agent-ab72bb544c867c797 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.50/2.00/1.50 | 4.0K | 52.7K | 58.6K | 0.892 | claude-sonnet-5-5 |  |
| agent-ac72f296c7313c594 | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 5.50/2.00/1.50 | 3.2K | 54.0K | 60.0K | 0.856 | claude-sonnet-5-5 |  |
| agent-ad850b559623746b0 | mayker-dev:builder | deliver | 5 | 12 | 20 | 1.82 | 1/1/8 | 4.00/2.00/1.62 | 4.6K | 61.5K | 67.5K | 0.926 | claude-sonnet-5-5 |  |
| agent-adcd015afc43ae097 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 2.50/1.50/1.25 | 6.1K | 53.3K | 60.2K | 0.902 | claude-sonnet-5-5 |  |
| agent-ae8bddc5304b4369f | mayker-dev:reviewer | deliver | 5 | 5 | 19 | 4.75 | 4/0/0 | 4.75/n/a/n/a | 6.6K | 53.1K | 64.9K | 0.756 | claude-opus-5-5 |  |
| agent-aec98f5f81af70de2 | mayker-dev:builder | deliver | 5 | 13 | 26 | 2.17 | 1/1/9 | 3.00/3.00/2.11 | 6.3K | 61.6K | 69.3K | 0.93 | claude-sonnet-5-5 |  |
| agent-aedcf4e8a121ebb42 | mayker-dev:planner | deliver | 5 | 12 | 32 | 2.91 | 1/2/7 | 6.00/1.00/2.86 | 16.5K | 80.4K | 101.5K | 0.895 | claude-opus-5-5 |  |
| agent-aefaa145d5bbf1de3 | mayker-dev:builder | deliver | 5 | 8 | 29 | 4.14 | 2/1/4 | 6.50/12.00/1.00 | 8.4K | 63.9K | 73.4K | 0.882 | claude-sonnet-5-5 |  |
| agent-af4430e15a39e8ee1 | mayker-dev:planner | deliver | 5 | 11 | 33 | 3.3 | 0/2/8 | n/a/1.50/3.75 | 15.1K | 79.6K | 100.8K | 0.885 | claude-opus-5-5 |  |
| agent-af7bd2b47d647a8e6 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.7K | 48.3K | 52.5K | 0.836 | claude-fable-5-1 |  |
| agent-af828833e0f6ce856 | mayker-dev:builder | deliver | 5 | 8 | 25 | 3.57 | 2/1/4 | 3.50/9.00/2.25 | 6.8K | 64.9K | 73.6K | 0.884 | claude-sonnet-5-5 |  |

**50 dispatch(es)** in `deliver` (mayker-dev:builder 24, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 7): median ctx max 60.1K, peak 108.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.5K, 43.3K, 47.0K, 50.6K, 52.5K, 52.5K, 52.6K, 53.2K, 53.4K, 54.5K, 55.3K, 56.0K, 56.4K, 56.5K, 56.6K, 57.1K, 57.4K, 58.6K, 58.8K, 58.9K, 59.5K, 59.9K, 60.0K, 60.1K, 60.1K, 60.2K, 62.3K, 62.5K, 63.3K, 63.6K, 64.9K, 64.9K, 66.0K, 67.5K, 69.3K, 69.5K, 70.0K, 73.4K, 73.6K, 74.7K, 77.6K, 83.9K, 91.5K, 93.0K, 94.7K, 95.3K, 100.8K, 101.5K, 105.6K, 108.9K.

**All runs:** 1 run(s), wall 1h06m (sum of per-run walls, idle time between runs excluded), 560 turns, 1085 tool calls, 445.1K output tokens, cache hit 0.959.

Turn classes across every bucket, read / edit / exec: 97/66/280 turns, 3.81/2.12/1.76 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 51m28s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

All runs: CI wait: 4m41s in `ci-poll.sh` calls; framework wall (wall less CI wait) 1h01m.

5 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/3).
