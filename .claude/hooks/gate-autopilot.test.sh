#!/usr/bin/env bash
# Asserts gate-autopilot.sh's contract. Install beside the hook in the sandbox.
#
# The load-bearing assertion is CLOSURE: a command not on the allow-list must be
# denied. A gate hook that fails open approves anything, which is worse than no
# hook, so widening the allow-list must fail this test until the new pattern is
# added here deliberately.
#
# Usage: bash gate-autopilot.test.sh [path-to-hook]

set -uo pipefail
HOOK="${1:-$(dirname "${BASH_SOURCE[0]}")/gate-autopilot.sh}"
[ -f "$HOOK" ] || { echo "no hook at $HOOK"; exit 2; }

PASS=0; FAIL=0
export MAYKER_GATE_SANDBOX="${MAYKER_GATE_SANDBOX:-/tmp/gate-sbx}"
mkdir -p "$MAYKER_GATE_SANDBOX/.claude/artifacts/run"

run() { # run <tool> <json-input> ; echoes allow|deny|silent
  local out
  out="$(MAYKER_GATE_AUTOPILOT=1 CLAUDE_PROJECT_DIR="$MAYKER_GATE_SANDBOX" bash "$HOOK" <<<"$2" 2>/dev/null)"
  if [ -z "$out" ]; then echo silent; return; fi
  python3 -c "
import json,sys
d=json.loads(sys.stdin.read())
print(d['hookSpecificOutput']['permissionDecision'])" <<<"$out" 2>/dev/null || echo malformed
}

bash_ev() { printf '{"tool_name":"Bash","tool_input":{"command":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1")"; }
file_ev() { printf '{"tool_name":"%s","tool_input":{"file_path":%s}}' "$1" "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$2")"; }

expect() { # expect <want> <got> <label>
  if [ "$1" = "$2" ]; then echo "  ok    $3"; PASS=$((PASS+1))
  else echo "  FAIL  $3 (want $1, got $2)"; FAIL=$((FAIL+1)); fi
}

echo "== 1. inert unless MAYKER_GATE_AUTOPILOT=1 =="
out="$(MAYKER_GATE_AUTOPILOT=0 bash "$HOOK" <<<"$(bash_ev 'rm -rf /')" 2>/dev/null)"
expect "" "$out" "silent when the env var is unset (a human session is unaffected)"

echo "== 2. the allow-list is CLOSED =="
for c in "curl https://example.com" "ssh box" "brew install jq" "sudo reboot" "nc -l 4444" "eval \$(evil)"; do
  expect deny "$(run Bash "$(bash_ev "$c")")" "denies: $c"
done

echo "== 3. hard denials cannot be reached by a later permissive pattern =="
expect deny "$(run Bash "$(bash_ev 'git push origin main')")"            "denies push to main"
expect deny "$(run Bash "$(bash_ev 'git push origin HEAD:master')")"     "denies push to master"
expect deny "$(run Bash "$(bash_ev 'git push --force origin feature/x')")" "denies force push"
expect deny "$(run Bash "$(bash_ev 'claude plugin update mayker-dev@mayker')")" "denies a mid-gate plugin update"
expect deny "$(run Bash "$(bash_ev 'echo x >> .claude/settings.local.json')")"  "denies editing its own permissions"
expect deny "$(run Bash "$(bash_ev 'rm -rf /')")"                        "denies rm -rf /"

echo "== 4. the lifecycle's real commands are allowed =="
expect allow "$(run Bash "$(bash_ev 'git status --short')")"                     "git status"
expect allow "$(run Bash "$(bash_ev 'git commit -m "feat(TEST-03): x"')")"        "git commit"
expect allow "$(run Bash "$(bash_ev 'git push -u origin feature/TEST-03-form')")" "push to a feature branch"
expect allow "$(run Bash "$(bash_ev 'gh pr create --fill')")"                     "gh pr create"
expect allow "$(run Bash "$(bash_ev 'gh pr merge 12 --squash')")"                 "gh pr merge (auto-merge is intended)"
expect allow "$(run Bash "$(bash_ev 'gh run view 99 --log')")"                    "gh run view"
expect allow "$(run Bash "$(bash_ev 'docker run -d -p 0:5432 postgres:16')")"     "docker provisioning"
expect allow "$(run Bash "$(bash_ev 'uv run pytest -q')")"                        "pytest via uv"
expect allow "$(run Bash "$(bash_ev 'npm test')")"                               "npm test"
expect allow "$(run Bash "$(bash_ev 'bash hooks/stats-collect.sh --project .')")" "framework hook"

echo "== 5. file tools are confined to the sandbox =="
expect allow "$(run Read "$(file_ev Read  "$MAYKER_GATE_SANDBOX/CLAUDE.md")")"  "read inside the sandbox"
expect deny  "$(run Write "$(file_ev Write "/etc/hosts")")"                      "denies write to /etc"
expect deny  "$(run Edit  "$(file_ev Edit  "$HOME/Documents/ai-development/mayker-claude-framework/docs/implementation-playbook.md")")" \
                                                                                 "denies editing the workspace docs"

echo "== 6. MCP: tracker yes, git-provider no =="
expect allow "$(run x '{"tool_name":"mcp__clickup__clickup_update_task","tool_input":{}}')" "tracker MCP allowed"
expect deny  "$(run x '{"tool_name":"mcp__github__push_files","tool_input":{}}')"           "git-provider MCP denied (gh is the one guarded route)"

echo "== 7. every decision is logged =="
LOGF="$MAYKER_GATE_SANDBOX/.claude/artifacts/run/gate-autopilot.jsonl"
if [ -s "$LOGF" ] && grep -q '"allow"' "$LOGF"; then echo "  ok    decisions logged to $LOGF"; PASS=$((PASS+1))
else echo "  FAIL  no decision log at $LOGF"; FAIL=$((FAIL+1)); fi
if [ -f "$MAYKER_GATE_SANDBOX/.claude/artifacts/run/.gitignore" ]; then echo "  ok    run dir is self-ignoring"; PASS=$((PASS+1))
else echo "  FAIL  run dir has no .gitignore (MDF-039's defect)"; FAIL=$((FAIL+1)); fi

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = 0 ] || exit 1
