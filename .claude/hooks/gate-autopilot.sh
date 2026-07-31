#!/usr/bin/env bash
# PreToolUse permission hook for an unattended gate run.
#
# INSTALL IN THE SANDBOX, not here:
#   cp bin/sandbox-install/gate-autopilot.sh   <sandbox>/.claude/hooks/
#   cp bin/sandbox-install/gate-autopilot.test.sh <sandbox>/.claude/hooks/
# then register it as a PreToolUse hook in <sandbox>/.claude/settings.json.
# The OPERATOR does this. A session installing its own permission hook is the
# bypass run (d) was correctly blocked for.
#
# WHY A HOOK RATHER THAN A PERMISSION MODE: a headless run inherits none of the
# parent session's grants, and `--permission-mode bypassPermissions` would
# approve everything — throwing away the boundary that caught run (d). The docs
# name PreToolUse as the intended way to make automated permission decisions
# non-interactively, and the sandbox already runs two PreToolUse hooks
# (branch-guard.sh, test-gate.sh) which this does NOT override.
#
# Contract:
#   * INERT unless MAYKER_GATE_AUTOPILOT=1. A human working in the sandbox is
#     unaffected, and the hook cannot silently widen a normal session.
#   * The allow-list is CLOSED. Anything not matched is DENIED with a reason.
#     gate-autopilot.test.sh asserts the closure; a widening fails that test.
#   * Every decision is logged with the command, so the gate comment can carry
#     the list of what ran unattended.
#   * NEVER approves a push to a protected base, and never approves anything
#     whose resolved path is outside the sandbox.
#
# Input: PreToolUse JSON on stdin. Output: a permission decision on stdout.

set -uo pipefail

LOG="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/artifacts/run/gate-autopilot.jsonl"

# Inert outside a gate run: stay silent and let the normal flow decide.
if [ "${MAYKER_GATE_AUTOPILOT:-0}" != "1" ]; then
  exit 0
fi

# python needs the script on stdin (heredoc) AND the event JSON, so the event
# goes to a temp file and its path is passed as argv. Two stdin redirections
# would silently drop the first.
EVENT_FILE="$(mktemp)"
trap 'rm -f "$EVENT_FILE"' EXIT
cat >"$EVENT_FILE"

python3 - "$LOG" "$EVENT_FILE" <<'PY'
import json, os, re, sys, time

log_path, event_path = sys.argv[1], sys.argv[2]
try:
    with open(event_path) as f:
        ev = json.load(f)
except Exception:
    # Malformed input: say nothing and let the normal permission flow run.
    sys.exit(0)

tool = ev.get("tool_name") or ev.get("toolName") or ""
inp  = ev.get("tool_input") or ev.get("toolInput") or {}
cmd  = (inp.get("command") or "").strip()
path = inp.get("file_path") or inp.get("path") or ""

sandbox = os.environ.get("MAYKER_GATE_SANDBOX") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
sandbox = os.path.realpath(sandbox)

PROTECTED = ("main", "master", "develop")

def decide(allow, reason):
    rec = {"ts": int(time.time()), "tool": tool, "allow": allow,
           "reason": reason, "command": cmd[:400], "path": path}
    try:
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        gi = os.path.join(os.path.dirname(log_path), ".gitignore")
        if not os.path.exists(gi):
            open(gi, "w").write("*\n")
        with open(log_path, "a") as f:
            f.write(json.dumps(rec) + "\n")
    except Exception:
        pass
    out = {"hookSpecificOutput": {"hookEventName": "PreToolUse",
           "permissionDecision": "allow" if allow else "deny",
           "permissionDecisionReason": reason}}
    print(json.dumps(out))
    sys.exit(0)

# ---- non-Bash tools ---------------------------------------------------------
# File tools are confined to the sandbox. This is what stops a gate run editing
# the workspace docs or anything else outside its own tree.
if tool in ("Read", "Write", "Edit", "NotebookEdit", "Glob", "Grep"):
    if not path:
        decide(True, "gate: no path argument")
    rp = os.path.realpath(os.path.expanduser(path))
    if rp.startswith(sandbox + os.sep) or rp == sandbox:
        decide(True, "gate: inside the sandbox")
    decide(False, f"gate: path outside the sandbox ({rp}); a gate run may not write beyond its own tree")

if tool in ("TodoWrite", "Task", "WebFetch", "WebSearch"):
    decide(True, "gate: allowed tool class")

if tool.startswith("mcp__"):
    # Tracker reads/writes are how a gate records its verdict. Git-provider MCP
    # writes are NOT allowed here: branch-guard.sh gates those paths and the
    # gate uses gh, so an MCP write route would be a second, unguarded one.
    if re.search(r"clickup", tool, re.I):
        decide(True, "gate: tracker MCP")
    decide(False, f"gate: MCP tool not on the allow-list ({tool})")

if tool != "Bash":
    decide(False, f"gate: tool not on the allow-list ({tool})")

# ---- Bash: closed allow-list ------------------------------------------------
if not cmd:
    decide(False, "gate: empty Bash command")

# Hard denials first, so a later permissive pattern cannot reach them.
for base in PROTECTED:
    if re.search(rf"git\s+push\b.*\b(origin\s+)?(HEAD:)?{base}\b", cmd):
        decide(False, f"gate: push to protected base '{base}' is never approved")
if re.search(r"\bgit\s+push\b.*--force(-with-lease)?\b", cmd):
    decide(False, "gate: force push is never approved")
if re.search(r"\brm\s+-rf?\s+/(\s|$)|\brm\s+-rf?\s+~", cmd):
    decide(False, "gate: refusing a destructive rm at filesystem or home root")
if re.search(r"\bclaude\s+plugin\s+update\b", cmd):
    decide(False, "gate: a plugin update mid-gate changes the thing being measured (MDF-086)")
# No \b before '>': both sides are non-word characters, so the boundary never
# matches and the guard silently never fires. Caught by gate-autopilot.test.sh.
if re.search(r"settings(\.local)?\.json|gate-env\.json|gate-autopilot", cmd) and \
   re.search(r">>?|\btee\b|\bsed\s+-i|\bpython3?\b|\bdd\b|\bmv\b|\bcp\b|\btruncate\b", cmd):
    decide(False, "gate: a run may not write its own permission settings, gate-env.json, or this hook")

ALLOW = [
    # git, read-only and local
    (r"^git\s+(status|log|show|diff|branch|rev-parse|rev-list|remote|describe|ls-files|check-ignore|fetch|stash)\b", "git read/local"),
    (r"^git\s+(add|commit|checkout|switch|restore|worktree|tag)\b", "git local write"),
    # push only to a feature/refactor/test branch; branch-guard.sh still runs
    (r"^git\s+push\b(?!.*\b(main|master|develop)\b)", "git push to a non-protected branch"),
    # gh: the gate opens, watches and MERGES its own PR in a throwaway sandbox repo
    (r"^gh\s+(pr|run|api|auth|repo|workflow)\b", "gh"),
    # containers for the integration tier
    (r"^docker(\s+compose)?\s+", "docker"),
    (r"^docker\s+", "docker"),
    # the framework's own hooks, scripts and tests
    (r"^bash\s+.*(hooks|tests|bin)/", "framework script"),
    (r"^python3?\s+", "python"),
    (r"^\.?/?(hooks|tests|bin)/\S+\.(sh|py)\b", "framework script"),
    # test runners and package managers the sandbox stack needs
    (r"^(uv|uvx|pytest|npm|npx|pnpm|yarn|node|playwright)\b", "test/package tooling"),
    # ordinary shell hygiene
    (r"^(ls|cat|head|tail|wc|grep|rg|sed|awk|cut|sort|uniq|find|mkdir|cp|mv|touch|printf|echo|test|\[|true|false|pwd|cd|export|env|which|command|date|sleep|jq|tr|paste|diff|realpath|dirname|basename|chmod|rm)\b", "shell utility"),
]

for pat, why in ALLOW:
    if re.match(pat, cmd):
        decide(True, f"gate: {why}")

decide(False, "gate: command not on the closed allow-list; widen gate-autopilot.sh deliberately, and gate-autopilot.test.sh must be updated with it")
PY
