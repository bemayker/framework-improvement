#!/usr/bin/env bash
# Asserts gate-autopilot.sh's contract. Install beside the hook in the sandbox.
#
# The load-bearing assertions are:
#   * it DENIES its short list of gate-specific dangers;
#   * it PASSES EVERYTHING ELSE THROUGH BY SAYING NOTHING, so the sandbox's own
#     settings.json still decides. It must never return "allow", because a
#     PreToolUse allow short-circuits the permission system and would override a
#     deny rule the operator deliberately set (e.g. Read(./.env)); and it must
#     never return "defer" either, because that ENDS THE QUERY holding the tool
#     call rather than passing it on. Until 2026-08-03 this suite asserted `defer`
#     as the EXPECTED pass-through verdict and passed 42 assertions doing it, while
#     every tool call in a gate run was being parked (MDF-108). The verdict this
#     suite now expects is `pass_through`, which is the absence of any output;
#   * it is inert without MAYKER_GATE_AUTOPILOT=1;
#   * it fails CLOSED when the sandbox boundary is unknown;
#   * and, added by MDF-100, that the route to a lifecycle command is OPEN.
#     Every other assertion here is satisfiable by a hook that denies
#     everything, and the sandbox ran one for a day.
#
# Usage: bash gate-autopilot.test.sh [path-to-hook]

set -uo pipefail
HOOK="${1:-$(dirname "${BASH_SOURCE[0]}")/gate-autopilot.sh}"
[ -f "$HOOK" ] || { echo "no hook at $HOOK"; exit 2; }

PASS=0; FAIL=0
SBX="${MAYKER_GATE_SANDBOX:-/tmp/gate-sbx}"
mkdir -p "$SBX/.claude/artifacts/run"

# decide <json> -> allow|deny|ask|defer|pass_through|malformed|none
# `pass_through` is EMPTY OUTPUT with exit status 0: the documented no-opinion, and
# the healthy answer for anything that is not one of the gate's restrictions. It is
# reported distinctly from `none` (the hook could not be run) on the exit status,
# because conflating a correct silence with a broken hook is half of MDF-108.
# Mirrors hook_decision() in bin/gate-lib.sh deliberately — that function is what
# gate-exec.sh and sandbox-heal.sh probe with, and the two must agree on the
# vocabulary or this suite and the pre-launch guard stop asserting the same thing.
#
# IT UNSETS ALL THREE WIDENING VARIABLES (MDF-109, MDF-116). Each widens the
# file-tool boundary with a read-only prefix, and this suite runs both from a plain
# shell and from gate-exec.sh — which exports all three. Inheriting any of them would
# make every "outside the sandbox is denied" assertion below depend on the caller's
# environment. §5b and §5c set them explicitly, for the cases that are about them.
decide() {
  local out rc
  out="$(env -u MAYKER_GATE_PLUGIN_ROOT -u MAYKER_GATE_DOCS_ROOT -u MAYKER_GATE_BASELINE_DIRS \
           MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" bash "$HOOK" <<<"$1" 2>/dev/null)"
  rc=$?
  if [ -z "$out" ]; then
    if [ "$rc" = 0 ]; then echo pass_through; else echo none; fi
    return
  fi
  python3 -c 'import json,sys
try: print(json.load(sys.stdin)["hookSpecificOutput"]["permissionDecision"])
except Exception: print("malformed")' <<<"$out"
}
bev() { printf '{"tool_name":"Bash","tool_input":{"command":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1")"; }
fev() { printf '{"tool_name":"%s","tool_input":{"file_path":%s}}' "$1" "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$2")"; }
want() { if [ "$1" = "$2" ]; then echo "  ok    $3"; PASS=$((PASS+1)); else echo "  FAIL  $3 (want $1, got $2)"; FAIL=$((FAIL+1)); fi; }

echo "== 1. inert unless MAYKER_GATE_AUTOPILOT=1 =="
want "" "$(MAYKER_GATE_AUTOPILOT=0 bash "$HOOK" <<<"$(bev 'claude plugin update x')" 2>/dev/null)" \
        "silent when the env var is unset (a human session is unaffected)"

echo "== 2. NEVER returns allow — it restricts, it does not grant =="
for c in "git status" "gh pr merge 1 --squash" "docker run -d postgres" "uv run pytest -q" "npm test" "curl https://example.com" "ssh box" "sudo reboot"; do
  got="$(decide "$(bev "$c")")"
  if [ "$got" = allow ]; then echo "  FAIL  returned allow for: $c  (would override settings.json deny rules)"; FAIL=$((FAIL+1))
  else echo "  ok    no allow for: $c ($got)"; PASS=$((PASS+1)); fi
done
want pass_through "$(decide "$(fev Read "$SBX/.env")")" "passes through a .env read so the sandbox's own Read(./.env) deny still applies"

echo "== 3. passes through what is not its business, so settings.json decides =="
want pass_through "$(decide "$(bev 'git commit -m x')")"                    "passes through git commit"
want pass_through "$(decide "$(bev 'git push -u origin feature/TEST-03')")" "passes through push to a feature branch"
want pass_through "$(decide "$(bev 'gh pr merge 12 --squash')")"            "passes through gh pr merge (auto-merge is intended)"
want pass_through "$(decide "$(bev 'curl https://example.com')")"           "passes through curl — settings.json has no Bash(curl:*), so it denies"
want pass_through "$(decide "$(fev Edit "$SBX/CLAUDE.md")")"                "passes through an edit inside the sandbox"

echo "== 3b. POSITIVE CONTROL: the route to a lifecycle command is open =="
# MDF-100. Every assertion above this point is satisfiable by a hook that denies
# everything, and for one day the sandbox ran one: a closed-allow-list copy that
# refused `Skill`, `ToolSearch`, every non-ClickUp MCP tool and every `claude`
# command. gate-exec.sh probed only the plugin-update denial, got `deny`, reported
# the guard healthy, and the after-order-20.97 re-run spent 661 seconds executing
# no lifecycle at all before returning INCONCLUSIVE with rc=0.
#
# A guard check with no positive control cannot tell a working hook from a brick.
# These are that control. Keep them: a widening of the deny list that closes the
# Skill route again fails here rather than six hours into an unattended run.
#
# THE FIRST PAYLOAD IS BYTE-IDENTICAL TO gate-lib.sh's $HOOK_PROBE_PASS, which is
# what gate-exec.sh and sandbox-heal.sh probe before launch. Change one and change
# both, or the pre-launch guard and this suite stop asserting the same thing —
# which is the class of divergence this whole ticket exists to remove.
sev() { printf '{"tool_name":"Skill","tool_input":{"skill":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1")"; }
tev() { printf '{"tool_name":"%s","tool_input":{}}' "$1"; }

want pass_through "$(decide '{"tool_name":"Skill","tool_input":{"skill":"mayker-dev:refactor"}}')" \
     "passes through the exact payload gate-exec.sh probes (Skill mayker-dev:refactor)"
for s in mayker-dev:plan-feature mayker-dev:build-feature mayker-dev:generate-tests mayker-dev:security-fix; do
  want pass_through "$(decide "$(sev "$s")")" "passes through Skill($s)"
done
want pass_through "$(decide "$(tev ToolSearch)")"  "passes through ToolSearch (a deny here strands a session with deferred tools)"
want pass_through "$(decide "$(tev TodoWrite)")"   "passes through TodoWrite"
want pass_through "$(decide "$(tev mcp__claude_ai_composio__COMPOSIO_MULTI_EXECUTE_TOOL)")" \
     "passes through a Composio MCP tool — the tracker route the gate writes its verdict through"
want pass_through "$(decide "$(tev mcp__claude_ai_ClickUp__clickup_create_comment)")" \
     "passes through a ClickUp MCP tool"
want pass_through "$(decide "$(bev 'claude -p "/mayker-dev:refactor backend"')")" \
     "passes through a nested claude -p (settings.json decides; MDF-101 keeps it ungranted there)"

echo "== 3c. the pass-through prints NOTHING, and 'defer' appears in no output =="
# MDF-108. §3 and §3b above ask decide() for a verdict, and `pass_through` is what
# decide() reports for empty output — so on their own they would also pass if the
# hook printed a permissionDecision this suite happened to spell `pass_through`,
# which is not a value the permission system knows. These assert the RAW bytes.
#
# The word `defer` is the regression pin. It is what the hook printed until
# 2026-08-03, it satisfied every other assertion in this file, and it ended the
# query holding the tool call — so a lifecycle could not start and the run still
# exited 0. A future edit that reinstates it fails HERE, in a second, rather than
# hours into an unattended gate.
raw() { env -u MAYKER_GATE_PLUGIN_ROOT -u MAYKER_GATE_DOCS_ROOT -u MAYKER_GATE_BASELINE_DIRS \
          MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" bash "$HOOK" <<<"$1" 2>/dev/null; }
want "" "$(raw '{"tool_name":"Skill","tool_input":{"skill":"mayker-dev:refactor"}}')" \
        "the Skill route produces literally no stdout (the documented no-opinion)"
want "" "$(raw "$(bev 'git commit -m x')")" \
        "a passed-through Bash command produces literally no stdout"
DEFER_SEEN=0
for e in '{"tool_name":"Skill","tool_input":{"skill":"mayker-dev:refactor"}}' \
         "$(bev 'git commit -m x')" "$(tev ToolSearch)" "$(fev Read "$SBX/CLAUDE.md")" \
         "$(bev 'claude plugin update mayker-dev@mayker')" "$(fev Write /etc/hosts)"; do
  case "$(raw "$e")" in *defer*) DEFER_SEEN=1; echo "  .. 'defer' printed for: $e" ;; esac
done
want 0 "$DEFER_SEEN" "the string 'defer' is printed for NO input, denied or not (MDF-108)"
# And the deny branch must still print its object, or the assertion above could be
# satisfied by a hook that prints nothing ever.
case "$(raw "$(bev 'rm -rf /')")" in
  *'"permissionDecision": "deny"'*|*'"permissionDecision":"deny"'*)
    echo "  ok    the deny branch still prints a deny decision"; PASS=$((PASS+1)) ;;
  *) echo "  FAIL  the deny branch printed no deny decision — silence now means the OPPOSITE of a refusal"; FAIL=$((FAIL+1)) ;;
esac

echo "== 4. denies its gate-specific dangers =="
want deny "$(decide "$(bev 'claude plugin update mayker-dev@mayker')")" "mid-gate plugin update"
want deny "$(decide "$(bev 'claude plugin install foo')")"              "mid-gate plugin install"
want deny "$(decide "$(bev 'echo x >> .claude/settings.local.json')")"  "writing its own permissions"
want deny "$(decide "$(bev 'sed -i s/a/b/ .claude/hooks/gate-autopilot.sh')")" "writing this hook"
want deny "$(decide "$(bev 'cp /tmp/x .claude/gate-env.json')")"        "writing gate-env.json"
want deny "$(decide "$(bev 'git push origin main')")"                   "push to main"
want deny "$(decide "$(bev 'git push origin HEAD:master')")"            "push to master"
want deny "$(decide "$(bev 'git push --force origin feature/x')")"      "force push (long form)"
want deny "$(decide "$(bev 'git push -f origin feature/x')")"           "force push (-f)"
want deny "$(decide "$(bev 'rm -rf /')")"                               "rm -rf /"
want deny "$(decide "$(bev 'rm -rf ~')")"                               "rm -rf ~"

echo "== 5. file tools are confined to the sandbox =="
want deny  "$(decide "$(fev Write /etc/hosts)")"  "denies write to /etc"
want deny  "$(decide "$(fev Edit "$HOME/Documents/ai-development/mayker-claude-framework/docs/implementation-playbook.md")")" \
                                                  "denies editing the workspace docs"
want pass_through "$(decide "$(fev Read "$SBX/CLAUDE.md")")" "passes through a read inside the sandbox"

echo "== 5b. POSITIVE CONTROL: the measured plugin tree is READABLE, and only that =="
# MDF-109. §5 above is a textbook example of the failure MEASURE-11 names: it
# asserts the boundary by denying a write to /etc and an edit of the workspace docs
# — both correct, both things a gate must never touch — and never once probes the
# one outside path a gate run legitimately MUST read. Every assertion in it is
# satisfied by a hook that denies every path in the world except the sandbox, and
# that is exactly the hook that shipped: the loaded plugin lives at
# {config-dir}/plugins/cache/mayker/mayker-dev/{version}, 23 files under skills/,
# agents/ and rules/ resolve CLAUDE_PLUGIN_ROOT, and every dispatch reads the seven
# always-on standards from there. So no dispatch could read a single standard.
#
# The boundary had a negative control and no positive one. This is the positive
# one, plus the three properties that keep it from being a hole: read-only,
# version-pinned, and absent unless the variable is in effect.
PROOT_BASE="${TMPDIR:-/tmp}/gate-proot.$$/plugins/cache/mayker/mayker-dev"
PROOT="$PROOT_BASE/0.3.60"
mkdir -p "$PROOT/rules" "$PROOT/skills/watch-pr"
: >"$PROOT/rules/coding_standards.md"
# decide_pr(): the same probe as decide(), with the plugin root in effect.
decide_pr() {
  local out rc
  out="$(env -u MAYKER_GATE_DOCS_ROOT -u MAYKER_GATE_BASELINE_DIRS \
           MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" MAYKER_GATE_PLUGIN_ROOT="$PROOT" \
           bash "$HOOK" <<<"$1" 2>/dev/null)"
  rc=$?
  if [ -z "$out" ]; then
    if [ "$rc" = 0 ]; then echo pass_through; else echo none; fi
    return
  fi
  python3 -c 'import json,sys
try: print(json.load(sys.stdin)["hookSpecificOutput"]["permissionDecision"])
except Exception: print("malformed")' <<<"$out"
}

want pass_through "$(decide_pr "$(fev Read "$PROOT/rules/coding_standards.md")")" \
     "READS an always-on standard out of the measured plugin tree (the read every dispatch makes)"
want pass_through "$(decide_pr "$(fev Read "$PROOT/skills/watch-pr/SKILL.md")")" \
     "reads a plugin-resident SKILL.md (read in full by five callers, MARKERS-06)"
want pass_through "$(decide_pr "$(fev Read "$PROOT")")" \
     "reads the root itself, not only paths beneath it"

# READ ONLY. A gate that can edit the plugin it is measuring is no longer measuring
# it (MDF-086), so the second prefix widens Read and nothing else.
for t in Write Edit NotebookEdit; do
  want deny "$(decide_pr "$(fev "$t" "$PROOT/rules/coding_standards.md")")" \
       "$t to that same path is STILL DENIED — the plugin root is read-only"
done

# VERSION-PINNED. The prefix is one version directory, never the cache root: a run
# that can read another version can quote a tree it did not measure.
want deny "$(decide_pr "$(fev Read "$PROOT_BASE/0.3.51/rules/coding_standards.md")")" \
     "a Read of a DIFFERENT version's tree is denied (pinned to the probed version)"
want deny "$(decide_pr "$(fev Read "$PROOT_BASE/rules/coding_standards.md")")" \
     "a Read at the cache root above the version directory is denied"
want deny "$(decide_pr "$(fev Read "$PROOT.sibling/rules/x.md")")" \
     "a sibling whose name merely STARTS WITH the root is denied (prefix, not substring)"
want deny "$(decide_pr "$(fev Read /etc/hosts)")" \
     "a path under neither prefix is still denied while the plugin root is in effect"

# FAILS CLOSED, and the three shapes of "not in effect" are each the old behaviour.
pr_decide_with() {   # $1 = the raw MAYKER_GATE_PLUGIN_ROOT value, $2 = event
  local out rc
  out="$(env -u MAYKER_GATE_DOCS_ROOT -u MAYKER_GATE_BASELINE_DIRS \
           MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" MAYKER_GATE_PLUGIN_ROOT="$1" \
           bash "$HOOK" <<<"$2" 2>/dev/null)"
  rc=$?
  if [ -z "$out" ]; then if [ "$rc" = 0 ]; then echo pass_through; else echo none; fi; return; fi
  python3 -c 'import json,sys
try: print(json.load(sys.stdin)["hookSpecificOutput"]["permissionDecision"])
except Exception: print("malformed")' <<<"$out"
}
PLUGIN_READ_EV="$(fev Read "$PROOT/rules/coding_standards.md")"
want deny "$(decide "$PLUGIN_READ_EV")" \
     "with the variable UNSET, the plugin read is denied exactly as it was before MDF-109"
want deny "$(pr_decide_with ""  "$PLUGIN_READ_EV")" "an EMPTY root is not in effect"
want deny "$(pr_decide_with "   " "$PLUGIN_READ_EV")" \
     "a WHITESPACE root is not in effect (a blank prefix would otherwise match everything, MEASURE-10)"
want deny "$(pr_decide_with "plugins/cache/mayker/mayker-dev/0.3.60" "$PLUGIN_READ_EV")" \
     "a RELATIVE root is not in effect — it would resolve against cwd, and cwd is not a boundary"
want deny "$(pr_decide_with "$PROOT_BASE/0.3.99-absent" "$PLUGIN_READ_EV")" \
     "a root that is not a directory is not in effect"
# And the reason must send the reader to the variable rather than looking like the
# old blanket refusal, or the next operator debugs the wrong layer for a day.
case "$(env -u MAYKER_GATE_PLUGIN_ROOT -u MAYKER_GATE_DOCS_ROOT -u MAYKER_GATE_BASELINE_DIRS \
          MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" \
          bash "$HOOK" <<<"$PLUGIN_READ_EV" 2>/dev/null)" in
  *MAYKER_GATE_PLUGIN_ROOT*) echo "  ok    the denial names MAYKER_GATE_PLUGIN_ROOT as the missing input"; PASS=$((PASS+1)) ;;
  *) echo "  FAIL  the denial does not name MAYKER_GATE_PLUGIN_ROOT, so a fail-closed boundary reads as a blanket one"; FAIL=$((FAIL+1)) ;;
esac
# The permitted read must be a PASS-THROUGH and never an allow: settings.json still
# decides it, and a PreToolUse allow would override the operator's own deny rules.
case "$(env -u MAYKER_GATE_DOCS_ROOT -u MAYKER_GATE_BASELINE_DIRS \
          MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" MAYKER_GATE_PLUGIN_ROOT="$PROOT" \
          bash "$HOOK" <<<"$PLUGIN_READ_EV" 2>/dev/null)" in
  "") echo "  ok    the permitted plugin read prints NOTHING — it passes through, it does not grant"; PASS=$((PASS+1)) ;;
  *)  echo "  FAIL  the permitted plugin read printed a decision; it must be silence, never allow"; FAIL=$((FAIL+1)) ;;
esac
# It is logged, because report_settings_layer_denials() reads that field and a read
# nobody logged is a read no gate comment can account for.
if grep -q 'plugin tree this run is measuring' "$SBX/.claude/artifacts/run/gate-autopilot.jsonl"; then
  echo "  ok    the permitted plugin read is logged with its own reason"; PASS=$((PASS+1))
else
  echo "  FAIL  no logged row for the permitted plugin read (silence on stdout became silence in the log)"; FAIL=$((FAIL+1))
fi
rm -rf "${TMPDIR:-/tmp}/gate-proot.$$"

echo "== 5c. POSITIVE CONTROL: the gate's OWN INSTRUCTIONS are readable, by name =="
# MDF-116. §5b did for the LIFECYCLE's reads what §5 had failed to do, and left the
# gate session's second workload — its own instructions — untested. Measured on the
# 2026-08-03 run: the hook denied Read of docs/implementation-playbook.md and of
# docs/ticket-notes.md at 20:58:03, and those two files are the FIRST LINE of every
# gate prompt. So the session graded from the prompt's paraphrase.
#
# THE THIRD PREFIX IS NARROWER THAN THE SECOND, and that is what most of these
# assertions are about. It is a NAMED FILE ALLOW-LIST, so the negative control is a
# file that EXISTS under the same root and must still be refused — anything weaker
# would pass on a directory grant, which is what this must not become.
DOCS_FIX="${TMPDIR:-/tmp}/gate-docs.$$/docs"
mkdir -p "$DOCS_FIX/gate-prompts"
for f in implementation-playbook.md ticket-notes.md operator-checklist.md run-log.md \
         framework-functional-overview.md; do : >"$DOCS_FIX/$f"; done
: >"$DOCS_FIX/gate-prompts/20.97.txt"
BASE_FIX="${TMPDIR:-/tmp}/gate-bl.$$/mayker-baselines"
mkdir -p "$BASE_FIX/order-20.9-TEST-03" "$BASE_FIX/order-17.5-TEST-03" "$BASE_FIX/order-21-TEST-03"
: >"$BASE_FIX/order-20.9-TEST-03/stats_summary.json"

# decide_docs(): the same probe with the docs root and two named baselines in effect.
# order-21-TEST-03 is deliberately NOT passed: it stands for a freeze at or above this
# gate's own order, which gate-exec.sh never enumerates.
BL_IN_EFFECT="$BASE_FIX/order-20.9-TEST-03:$BASE_FIX/order-17.5-TEST-03"
decide_docs() {   # $1 = event
  local out rc
  out="$(env -u MAYKER_GATE_PLUGIN_ROOT MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" \
           MAYKER_GATE_DOCS_ROOT="$DOCS_FIX" MAYKER_GATE_BASELINE_DIRS="$BL_IN_EFFECT" \
           bash "$HOOK" <<<"$1" 2>/dev/null)"
  rc=$?
  if [ -z "$out" ]; then
    if [ "$rc" = 0 ]; then echo pass_through; else echo none; fi
    return
  fi
  python3 -c 'import json,sys
try: print(json.load(sys.stdin)["hookSpecificOutput"]["permissionDecision"])
except Exception: print("malformed")' <<<"$out"
}

want pass_through "$(decide_docs "$(fev Read "$DOCS_FIX/implementation-playbook.md")")" \
     "READS the playbook — the literal first read every gate prompt asks for"
want pass_through "$(decide_docs "$(fev Read "$DOCS_FIX/ticket-notes.md")")" \
     "reads ticket-notes.md, where GATE-{N} defines the gate's own bars"
want pass_through "$(decide_docs "$(fev Read "$DOCS_FIX/gate-prompts/20.97.txt")")" \
     "reads under gate-prompts/ — the one named SUBTREE, not a file"

# THE ALLOW-LIST IS THE PIN. Each of these exists, sits directly under the root, and
# is refused because it is not named. If the branch ever becomes _under(rp, docs_root)
# these three flip together and the gate gains the operator's checklist.
want deny "$(decide_docs "$(fev Read "$DOCS_FIX/operator-checklist.md")")" \
     "DENIES operator-checklist.md: the operator's file, and a gate may not read its own ledger row"
want deny "$(decide_docs "$(fev Read "$DOCS_FIX/run-log.md")")" \
     "denies run-log.md — not mandated, so not named, so not readable"
want deny "$(decide_docs "$(fev Read "$DOCS_FIX/framework-functional-overview.md")")" \
     "denies framework-functional-overview.md for the same reason"
want deny "$(decide_docs "$(fev Read "$DOCS_FIX")")" \
     "denies a read of the docs ROOT itself (a file list, not a directory grant)"
want deny "$(decide_docs "$(fev Read "$(dirname "$DOCS_FIX")/other.md")")" \
     "denies a sibling of the docs root"
want deny "$(decide_docs "$(fev Read "$DOCS_FIX.sibling/ticket-notes.md")")" \
     "denies a root whose name merely STARTS WITH the docs root (prefix, not substring)"

# READ ONLY. A gate that can edit the playbook, the notes, or the ledger row it is
# about to be graded into is measuring nothing (MDF-086).
for t in Write Edit NotebookEdit; do
  want deny "$(decide_docs "$(fev "$t" "$DOCS_FIX/implementation-playbook.md")")" \
       "$t of the playbook is STILL DENIED — the docs root is read-only"
  want deny "$(decide_docs "$(fev "$t" "$BASE_FIX/order-20.9-TEST-03/stats_summary.json")")" \
       "$t of a frozen baseline is STILL DENIED — five gates' only surviving record"
done

# THE BASELINES ARE PINNED TO NAMED DIRECTORIES, never the root.
want pass_through "$(decide_docs "$(fev Read "$BASE_FIX/order-20.9-TEST-03/stats_summary.json")")" \
     "reads the frozen summary MEASURE-08's generated_at check needs"
want pass_through "$(decide_docs "$(fev Read "$BASE_FIX/order-17.5-TEST-03")")" \
     "reads a named baseline directory itself, not only paths beneath it"
want deny "$(decide_docs "$(fev Read "$BASE_FIX")")" \
     "DENIES the baselines ROOT — otherwise a run can discover freezes it may not read"
want deny "$(decide_docs "$(fev Read "$BASE_FIX/order-21-TEST-03/stats_summary.json")")" \
     "denies a freeze at or above this gate's order (its own run's, or a later gate's)"

# FAILS CLOSED, and every not-in-effect shape is the OLD boundary rather than a wider
# one. MEASURE-10: a blank realpaths to the working directory, so a blank prefix would
# match everything — which is worse than no prefix at all.
docs_decide_with() {   # $1 = raw MAYKER_GATE_DOCS_ROOT, $2 = raw MAYKER_GATE_BASELINE_DIRS, $3 = event
  local out rc
  out="$(env -u MAYKER_GATE_PLUGIN_ROOT MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" \
           MAYKER_GATE_DOCS_ROOT="$1" MAYKER_GATE_BASELINE_DIRS="$2" bash "$HOOK" <<<"$3" 2>/dev/null)"
  rc=$?
  if [ -z "$out" ]; then if [ "$rc" = 0 ]; then echo pass_through; else echo none; fi; return; fi
  python3 -c 'import json,sys
try: print(json.load(sys.stdin)["hookSpecificOutput"]["permissionDecision"])
except Exception: print("malformed")' <<<"$out"
}
DOCS_READ_EV="$(fev Read "$DOCS_FIX/implementation-playbook.md")"
BASE_READ_EV="$(fev Read "$BASE_FIX/order-20.9-TEST-03/stats_summary.json")"
want deny "$(decide "$DOCS_READ_EV")" \
     "with both variables UNSET, the playbook read is denied exactly as it was before MDF-116"
want deny "$(decide "$BASE_READ_EV")" \
     "and so is the frozen baseline read (0.3.60's behaviour, unchanged)"
for bad in "" "   " "docs" "$DOCS_FIX-absent"; do
  want deny "$(docs_decide_with "$bad" "$BL_IN_EFFECT" "$DOCS_READ_EV")" \
       "an unusable docs root ('${bad:-empty}') is NOT IN EFFECT and the playbook read is denied"
  want deny "$(docs_decide_with "$bad" "$BL_IN_EFFECT" "$(fev Read /etc/hosts)")" \
       "  and it widens nothing else either ('${bad:-empty}')"
done
for bad in "" "   " "mayker-baselines/order-20.9-TEST-03" "$BASE_FIX/order-99-TEST-03"; do
  want deny "$(docs_decide_with "$DOCS_FIX" "$bad" "$BASE_READ_EV")" \
       "an unusable baseline list ('${bad:-empty}') is NOT IN EFFECT and the baseline read is denied"
done
want deny "$(docs_decide_with "$DOCS_FIX" "$BASE_FIX/order-20.9-TEST-03:  :relative/x" "$(fev Read "$BASE_FIX/order-17.5-TEST-03/stats_summary.json")")" \
     "a list with one good entry drops the bad ones rather than widening (the unlisted dir stays denied)"
want pass_through "$(docs_decide_with "$DOCS_FIX" "$BASE_FIX/order-20.9-TEST-03:  :relative/x" "$BASE_READ_EV")" \
     "  and the one good entry in that same list still works"

# The reason must send the reader to the right layer. A deliberate exclusion and a
# missing variable are different problems with different fixes, and a boundary that
# spells them the same way costs an operator a day (MDF-100's own lesson).
case "$(env -u MAYKER_GATE_PLUGIN_ROOT -u MAYKER_GATE_DOCS_ROOT -u MAYKER_GATE_BASELINE_DIRS \
          MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" bash "$HOOK" <<<"$DOCS_READ_EV" 2>/dev/null)" in
  *MAYKER_GATE_DOCS_ROOT*) echo "  ok    with the variable absent, the denial names MAYKER_GATE_DOCS_ROOT"; PASS=$((PASS+1)) ;;
  *) echo "  FAIL  the denial does not name MAYKER_GATE_DOCS_ROOT, so a fail-closed boundary reads as a blanket one"; FAIL=$((FAIL+1)) ;;
esac
case "$(env -u MAYKER_GATE_PLUGIN_ROOT MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" \
          MAYKER_GATE_DOCS_ROOT="$DOCS_FIX" MAYKER_GATE_BASELINE_DIRS="$BL_IN_EFFECT" \
          bash "$HOOK" <<<"$(fev Read "$DOCS_FIX/operator-checklist.md")" 2>/dev/null)" in
  *"NAMED ALLOW-LIST"*) echo "  ok    the operator-checklist denial says the ALLOW-LIST refused it, not the boundary"; PASS=$((PASS+1)) ;;
  *) echo "  FAIL  the operator-checklist denial reads as a missing grant; it is a deliberate exclusion and must say so"; FAIL=$((FAIL+1)) ;;
esac
# The permitted reads must be PASS-THROUGHS and never allows: settings.json still
# decides them, and a PreToolUse allow would override the operator's own deny rules.
for ev in "$DOCS_READ_EV" "$BASE_READ_EV"; do
  case "$(env -u MAYKER_GATE_PLUGIN_ROOT MAYKER_GATE_AUTOPILOT=1 MAYKER_GATE_SANDBOX="$SBX" \
            MAYKER_GATE_DOCS_ROOT="$DOCS_FIX" MAYKER_GATE_BASELINE_DIRS="$BL_IN_EFFECT" \
            bash "$HOOK" <<<"$ev" 2>/dev/null)" in
    "") echo "  ok    the permitted read prints NOTHING — it passes through, it does not grant"; PASS=$((PASS+1)) ;;
    *)  echo "  FAIL  a permitted read printed a decision; it must be silence, never allow"; FAIL=$((FAIL+1)) ;;
  esac
done
# Logged, for the same reason §5b's is: report_settings_layer_denials() reads that
# field, and a read nobody logged is a read no gate comment can account for.
if grep -q 'NAMED workspace doc' "$SBX/.claude/artifacts/run/gate-autopilot.jsonl"; then
  echo "  ok    the permitted docs read is logged with its own reason"; PASS=$((PASS+1))
else
  echo "  FAIL  no logged row for the permitted docs read (silence on stdout became silence in the log)"; FAIL=$((FAIL+1))
fi
if grep -q 'frozen baseline this gate compares' "$SBX/.claude/artifacts/run/gate-autopilot.jsonl"; then
  echo "  ok    the permitted baseline read is logged with its own reason"; PASS=$((PASS+1))
else
  echo "  FAIL  no logged row for the permitted baseline read"; FAIL=$((FAIL+1))
fi
rm -rf "${TMPDIR:-/tmp}/gate-docs.$$" "${TMPDIR:-/tmp}/gate-bl.$$"

echo "== 6. fails CLOSED when the boundary is unknown =="
out="$(env -u MAYKER_GATE_SANDBOX -u CLAUDE_PROJECT_DIR MAYKER_GATE_AUTOPILOT=1 bash "$HOOK" <<<"$(fev Write /etc/passwd)" 2>/dev/null \
  | python3 -c 'import json,sys
try: print(json.load(sys.stdin)["hookSpecificOutput"]["permissionDecision"])
except Exception: print("none")')"
want deny "$out" "denies a file write when no sandbox boundary is set"

echo "== 7. logging =="
LOGF="$SBX/.claude/artifacts/run/gate-autopilot.jsonl"
if [ -s "$LOGF" ] && grep -q '"decision"' "$LOGF"; then echo "  ok    decisions logged"; PASS=$((PASS+1))
else echo "  FAIL  no decision log at $LOGF"; FAIL=$((FAIL+1)); fi
# MDF-108. SILENCE ON STDOUT IS NOT SILENCE IN THE LOG. The pass-through branch no
# longer prints anything, and the obvious way to write that is to skip the emit
# entirely — which would delete every pass-through row and leave
# report_settings_layer_denials() in gate-lib.sh with nothing to infer from, while it
# still printed a reassuring "no settings-layer denial inferred".
if grep -q '"decision": "pass_through"' "$LOGF" || grep -q '"decision":"pass_through"' "$LOGF"; then
  echo "  ok    pass-throughs are logged even though they print nothing"; PASS=$((PASS+1))
else
  echo "  FAIL  no pass_through row in the log — gate-exec.sh's settings-layer inference reads this field and would infer nothing from every future run"; FAIL=$((FAIL+1))
fi
if grep -q '"decision": "deny"' "$LOGF" || grep -q '"decision":"deny"' "$LOGF"; then
  echo "  ok    denials are logged too, so the log is not pass-throughs only"; PASS=$((PASS+1))
else
  echo "  FAIL  no deny row in the log"; FAIL=$((FAIL+1))
fi
if grep -q '"decision": "defer"' "$LOGF" || grep -q '"decision":"defer"' "$LOGF"; then
  echo "  FAIL  the log records a 'defer' decision — the value that ends the query (MDF-108)"; FAIL=$((FAIL+1))
else
  echo "  ok    no 'defer' decision anywhere in the log"; PASS=$((PASS+1))
fi
if [ -f "$SBX/.claude/artifacts/run/.gitignore" ]; then echo "  ok    run dir is self-ignoring"; PASS=$((PASS+1))
else echo "  FAIL  run dir has no .gitignore (MDF-039's defect)"; FAIL=$((FAIL+1)); fi

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = 0 ] || exit 1
