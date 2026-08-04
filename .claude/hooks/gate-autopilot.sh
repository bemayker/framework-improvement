#!/usr/bin/env bash
# PreToolUse guard for an unattended gate run.
#
# INSTALL IN THE SANDBOX, not here:
#   cp bin/sandbox-install/gate-autopilot.sh      <sandbox>/.claude/hooks/
#   cp bin/sandbox-install/gate-autopilot.test.sh <sandbox>/.claude/hooks/
# then register it under PreToolUse in <sandbox>/.claude/settings.json using an
# ABSOLUTE path. The OPERATOR does this; a session installing its own permission
# hook is the bypass run (d) was correctly blocked for.
#
# ============================================================================
# THIS HOOK ONLY RESTRICTS. IT NEVER GRANTS. That is the whole design.
# ============================================================================
# An earlier version returned "allow" for anything it considered fine. That is
# actively harmful next to a real settings.json: a PreToolUse "allow" short-
# circuits the permission system, so it would have overridden the sandbox's own
# deny rules — e.g. a `Read(./.env)` deny would have stopped applying.
#
# So: the sandbox's settings.json does all the granting (it loads in a headless
# run too), and this hook returns "deny" for a short list of things that must
# never happen inside a gate, and SAYS NOTHING AT ALL for everything else so the
# normal permission flow decides. Adding a grant here is a design error; add it to
# settings.json instead.
#
# ============================================================================
# "NO OPINION" IS SILENCE. IT IS *NOT* permissionDecision "defer". (MDF-108)
# ============================================================================
# Until 2026-08-03 the pass-through branch returned
#   {"hookSpecificOutput": {"permissionDecision": "defer", ...}}
# on the belief that `defer` means "no opinion, let settings.json decide". It does
# not. `defer` is a real permissionDecision value whose effect is to END THE QUERY
# holding the tool call so it can be resumed later, so EVERY tool call in a gate
# run was parked and no lifecycle could start. The hooks reference states the
# correct spelling directly: "Exit code 0 with no output means the hook has no
# decision to report, so the tool call continues through the normal permission
# flow. The hook can deny the call, but staying silent doesn't approve it."
#
# Measured in this sandbox on 2026-08-03, Claude Code 2.1.220, two real nested
# `claude -p` runs, `--permission-mode acceptEdits`:
#   * with the defer-returning hook active, `pwd` — which has an exact
#     `Bash(pwd)` grant — came back `stop_reason: tool_deferred`,
#     `permission_denials: []`, `result: ""`, exit status 0, and the call parked
#     in `deferred_tool_use`. Nothing in that reply looks like a refusal;
#   * with the hook inert (so: exit 0, no stdout — byte-identical in behaviour to
#     the pass-through below), the same prompt returned the sandbox path and
#     `stop_reason: end_turn`.
# So silence is proved to pass through, in this CLI version, by measurement and
# not only by the documentation.
#
# THE INTERNAL VERDICT IS CALLED pass_through, DELIBERATELY. The old name was
# `defer()`, which is a name that invites re-adding the string that caused this.
# The value also appears in the decision log's `decision` field, and every reader
# of that field expects `pass_through`; a log row reading `defer` is now treated
# as evidence the hook has REGRESSED, not as a routine pass-through.
#
# ============================================================================
# THE CONFINEMENT HAS THREE PREFIXES, AND ONLY THE FIRST ONE IS WRITABLE.
#   1. MAYKER_GATE_SANDBOX        read + write   (the tree being measured)
#   2. MAYKER_GATE_PLUGIN_ROOT    READ ONLY      (MDF-109, one plugin version)
#   3. MAYKER_GATE_DOCS_ROOT      READ ONLY      (MDF-116, a NAMED FILE LIST)
#      MAYKER_GATE_BASELINE_DIRS  READ ONLY      (MDF-116, named frozen dirs)
# ============================================================================
# The MDF-109 account below is unchanged and still the shape every later widening
# copies. What MDF-116 adds is the second workload nobody had indexed the boundary
# on: THE GATE SESSION'S OWN INSTRUCTIONS.
#
# Measured on the 2026-08-03 run, in the reply's own permission_denials and in this
# hook's decision log at 20:58:03, with this hook's own reason text:
#   Read <workspace>/docs/implementation-playbook.md  -> deny "path outside the
#   Read <workspace>/docs/ticket-notes.md             -> deny  sandbox ... a gate
#                                                             run may not reach
#                                                             beyond its own tree"
# Those two files are the FIRST LINE of every gate prompt. `GATE-{N}` is the
# authority on what the gate measures, `MEASURE` is mandatory reading for every
# gate, and Sections 4 and 7 are what let a session order a finding — so the
# 2026-08-03 session graded from the prompt's paraphrase and handed three findings
# back as prose because it could not order them. Eleven further Bash reads of
# ~/mayker-baselines/ and the plugin cache were refused one layer down, by the
# settings layer, which is why the Read TOOL is the route and no grant is the fix
# (docs/gate-setup.md layer 2, and MDF-120 for why a `covered` verdict from
# settings_allows_bash_command() is not evidence either way).
#
# THE THIRD PREFIX IS NARROWER THAN THE SECOND, BY A NAMED FILE ALLOW-LIST.
# MDF-109's pin is the plugin VERSION; there is no version here, so the pin is the
# FILE LIST below — three named entries and nothing else under the docs root:
#   implementation-playbook.md, ticket-notes.md, gate-prompts/
# docs/operator-checklist.md is DELIBERATELY ABSENT and stays denied. It is the
# operator's file, and a gate must not read the ledger row it is about to be graded
# into. So are run-log.md and framework-functional-overview.md, by the same rule:
# not named, not readable. A directory grant would have been one word shorter and
# would have handed a gate every one of them.
#
# THE FROZEN BASELINES ARE PINNED THE SAME WAY: gate-exec.sh passes the named
# directories for THIS gate's item whose order is strictly BELOW this gate's own,
# never $BASELINES itself. Those are the TREND block's two backward-looking columns
# plus any earlier frozen run a GATE note names for a replay bar. A run therefore
# cannot read a freeze at or above its own order — which would be its own or a later
# gate's — and cannot list the baselines root to discover what else is there.
#
# ============================================================================
# THE MDF-109 PRECEDENT, UNCHANGED: the second prefix and why it is read-only.
# ============================================================================
# Until 2026-08-03 section 1 confined Read/Write/Edit/NotebookEdit to
# MAYKER_GATE_SANDBOX alone. The loaded plugin lives at
#   {config-dir}/plugins/cache/mayker/mayker-dev/{version}/
# which is NEVER under the sandbox, and every mandated standards read points into
# it: 23 files under skills/, agents/ and rules/ resolve CLAUDE_PLUGIN_ROOT, and
# the seven always-on standards are read from CLAUDE_PLUGIN_ROOT/rules/{name}.md
# by every dispatch (DISPATCH-05, STANDARDS-01). So a gate run reached its first
# mandated read and was refused, with the reason "path outside the sandbox".
#
# Measured 2026-08-03, both ways, against the REAL boundary: a nested session
# with the MDF-108-fixed hook active had its Read of the loaded skill's own
# SKILL.md come back in permission_denials; and this hook, probed directly with
# MAYKER_GATE_SANDBOX set to the real sandbox, denied rules/coding_standards.md,
# rules/review_standards.md and skills/watch-pr/SKILL.md alike.
#
# So section 1 now permits a path under EITHER the sandbox OR the measured plugin
# root in MAYKER_GATE_PLUGIN_ROOT, and four properties of that are deliberate:
#   * READ ONLY. Write, Edit and NotebookEdit keep the single-prefix rule. A gate
#     that can edit the plugin it is measuring is no longer measuring it (MDF-086,
#     and the mid-gate plugin-update deny in section 2 is the same principle).
#   * VERSION-PINNED, not the cache root. gate-exec.sh probes the loaded version
#     before launch and exports that one directory, so a read of a DIFFERENT
#     version's tree is still denied — the one read that could silently make a
#     gate quote a tree it did not run.
#   * FAILS CLOSED. Unset, blank, relative or not-a-directory means the variable
#     is not in effect and behaviour is byte-for-byte the single-prefix rule.
#     A blank must never be interpolated into a prefix test: os.path.realpath("")
#     is the working directory, and a prefix that matches everything is worse than
#     no prefix at all (MEASURE-10).
#   * IT NEVER GRANTS. A permitted plugin read is a PASS-THROUGH, not an "allow":
#     the sandbox's settings.json still decides it, and its own deny rules still
#     apply. This hook only ever removes a refusal of its own making.
# All four hold for MDF-116's two additions without exception, and the fifth
# property is the named list: a widening indexed on the workload is still a
# widening, so it is enumerated rather than described.
#
# Contract:
#   * INERT unless MAYKER_GATE_AUTOPILOT=1, so a human's sandbox session is
#     unaffected and this cannot silently alter a normal run.
#   * Fails CLOSED when it cannot establish the sandbox boundary. cwd is not a
#     security boundary — a run that chdir'd anywhere would widen its own
#     confinement.
#   * Logs every decision with the command, INCLUDING every pass-through, so a
#     gate comment can carry what ran unattended and so gate-exec.sh's post-run
#     settings-layer inference has rows to read. Silence on stdout is not silence
#     in the log.
#   * Prints EXACTLY ONE thing, ever: a `deny` object, or nothing.
#   * Does not override branch-guard.sh or test-gate.sh. It passes calls through,
#     so those still see every call they would otherwise see.

set -uo pipefail

if [ "${MAYKER_GATE_AUTOPILOT:-0}" != "1" ]; then
  exit 0
fi

LOG_DIR="${MAYKER_GATE_SANDBOX:-${CLAUDE_PROJECT_DIR:-$PWD}}/.claude/artifacts/run"
EVENT_FILE="$(mktemp)"
trap 'rm -f "$EVENT_FILE"' EXIT
cat >"$EVENT_FILE"

python3 - "$LOG_DIR/gate-autopilot.jsonl" "$EVENT_FILE" <<'PY'
import json, os, re, sys, time

log_path, event_path = sys.argv[1], sys.argv[2]
try:
    with open(event_path) as f:
        ev = json.load(f)
except Exception:
    sys.exit(0)   # malformed input: say nothing, let the normal flow run

tool = ev.get("tool_name", "")
inp  = ev.get("tool_input") or {}
cmd  = (inp.get("command") or "").strip()
path = inp.get("file_path") or inp.get("path") or ""

# MAYKER_GATE_SANDBOX is exported by gate-exec.sh and is the only source we
# trust. CLAUDE_PROJECT_DIR is the documented fallback, but the docs do not
# confirm it is set in a `claude -p` headless run.
_sbx = os.environ.get("MAYKER_GATE_SANDBOX") or os.environ.get("CLAUDE_PROJECT_DIR")
sandbox = os.path.realpath(_sbx) if _sbx else None

# The SECOND prefix, read-only, and there is no fallback for it: MAYKER_GATE_PLUGIN_ROOT
# or nothing. gate-exec.sh exports it only after it has probed the loaded version and
# asserted it against plugin.json, so its value is the one tree this run is measuring.
# Every rejection below is a fail-closed one — the variable is simply not in effect,
# and section 1 then behaves exactly as it did before MDF-109:
#   blank/unset          nothing to trust
#   not absolute         it would resolve against cwd, and cwd is not a boundary
#   not a directory      a prefix nothing can be under is not worth interpolating
_proot = (os.environ.get("MAYKER_GATE_PLUGIN_ROOT") or "").strip()
plugin_root = None
if _proot and os.path.isabs(_proot) and os.path.isdir(_proot):
    plugin_root = os.path.realpath(_proot)

# The THIRD prefix, read-only, and narrower than the second: a NAMED FILE ALLOW-LIST
# under it, never the directory itself (MDF-116). Same three fail-closed rejections
# as the plugin root, for the same reasons, and the variable is again passed in by
# gate-exec.sh rather than derived here — a boundary that computes its own widening
# is a boundary with no off switch.
_droot = (os.environ.get("MAYKER_GATE_DOCS_ROOT") or "").strip()
docs_root = None
if _droot and os.path.isabs(_droot) and os.path.isdir(_droot):
    docs_root = os.path.realpath(_droot)

# WHAT A GATE MAY READ UNDER IT, ENUMERATED. Every entry is a read the gate prompt
# or ticket-notes.md's own reading rules MANDATE, and nothing is here because it
# looked harmless:
#   implementation-playbook.md  Sections 4 and 7 — the ledger the gate reports into
#                               and the rule that lets it order a finding
#   ticket-notes.md             GATE-{N} (its bars) plus MEASURE (mandatory for
#                               every gate by that file's own rule 3)
#   gate-prompts/               the run's own instruction text
# NOT HERE, DELIBERATELY: operator-checklist.md is the operator's alone; run-log.md
# and framework-functional-overview.md are simply not mandated. Absence is the
# mechanism — anything not named is refused by the same branch as /etc/passwd.
GATE_DOCS_FILES    = ("implementation-playbook.md", "ticket-notes.md")
GATE_DOCS_SUBTREES = ("gate-prompts",)

# Compared on REALPATHS at both ends, so a symlinked docs file resolves to the same
# answer whichever name is asked for, and a symlink OUT of the docs tree cannot
# smuggle a path in: the requested path's realpath must equal a named entry's.
def _docs_allowed(rp):
    if docs_root is None:
        return False
    for name in GATE_DOCS_FILES:
        if rp == os.path.realpath(os.path.join(docs_root, name)):
            return True
    for name in GATE_DOCS_SUBTREES:
        if _under(rp, os.path.realpath(os.path.join(docs_root, name))):
            return True
    return False

# The frozen baseline directories THIS gate compares against, named one by one and
# os.pathsep-separated (MDF-116). Never $BASELINES itself: a run that can list the
# baselines root can read a freeze at or above its own order, which is its own run
# or a later gate's. Each entry is validated independently and a bad one is simply
# dropped, so a malformed list degrades towards the old boundary rather than away
# from it — including an entry containing os.pathsep, which is unrepresentable here
# and therefore unreadable, which is the safe direction.
baseline_dirs = []
_bdirs = os.environ.get("MAYKER_GATE_BASELINE_DIRS") or ""
for _part in _bdirs.split(os.pathsep):
    _part = _part.strip()
    if _part and os.path.isabs(_part) and os.path.isdir(_part):
        baseline_dirs.append(os.path.realpath(_part))

def _under(rp, base):
    return base is not None and (rp == base or rp.startswith(base + os.sep))

def _under_any(rp, bases):
    return any(_under(rp, b) for b in bases)

def log(decision, reason):
    rec = {"ts": int(time.time()), "tool": tool, "decision": decision,
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

def deny(reason):
    reason = "gate: " + reason
    log("deny", reason)
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason}}))
    sys.exit(0)

# NO OPINION. Logged, and NOT printed. Do not "improve" this by printing a
# permissionDecision of any value: "defer" ends the query (MDF-108, the header),
# "allow" short-circuits the operator's own deny rules (MDF-100, the header), and
# "ask" cannot be answered in a headless run because there is nobody to prompt.
# Silence is the only spelling that leaves the decision where it belongs.
def pass_through(reason):
    log("pass_through", "gate: " + reason)
    sys.exit(0)

# ---- 1. file tools stay inside the sandbox, and READS may also see the -------
# ----    measured plugin tree, which is where every mandated standard lives ---
# The one restriction the sandbox's own settings cannot express: it grants bare
# Read/Edit/Write with no path scope, so without this a gate run could edit the
# workspace docs or anything else on the machine.
if tool in ("Read", "Write", "Edit", "NotebookEdit"):
    if sandbox is None:
        deny("the sandbox boundary is unknown (neither MAYKER_GATE_SANDBOX nor "
             "CLAUDE_PROJECT_DIR is set), and cwd is not a boundary")
    if path:
        rp = os.path.realpath(os.path.expanduser(path))
        if not _under(rp, sandbox):
            # MDF-109. The read-only second prefix. `Read` only, and only under the
            # version-pinned root: this is a pass-through, so settings.json still
            # decides the call and its own deny rules still apply.
            if tool == "Read" and _under(rp, plugin_root):
                pass_through(
                    f"read of the plugin tree this run is measuring ({plugin_root}); "
                    "the mandated standards reads point there and writes to it stay denied")
            # MDF-116. The read-only THIRD prefix, and it is a named file list rather
            # than a directory: the gate prompt's own first line mandates these two
            # reads and a gate cannot follow the note that defines its bars without
            # them. Also a pass-through, never an allow.
            if tool == "Read" and _docs_allowed(rp):
                pass_through(
                    f"read of a NAMED workspace doc the gate prompt mandates ({rp}); the allow-list "
                    f"under {docs_root} is exactly {', '.join(GATE_DOCS_FILES)} and "
                    f"{'/, '.join(GATE_DOCS_SUBTREES)}/ — operator-checklist.md is not on it, "
                    "and writes to all of them stay denied")
            # MDF-116. And the frozen baselines this gate compares against, named
            # directory by directory. MEASURE-08's generated_at check, MDF-066's
            # frozen-replay bar and Section 4's three-consecutive-gates rule all
            # read them, and all three were unreachable from inside a run.
            if tool == "Read" and _under_any(rp, baseline_dirs):
                pass_through(
                    f"read of a frozen baseline this gate compares against ({rp}); the list is "
                    "the named order directories below this gate, never the baselines root, and "
                    "writes to them stay denied")
            why = f"path outside the sandbox ({rp}); a gate run may not reach beyond its own tree"
            if tool == "Read":
                if plugin_root is None:
                    why += ("; and no measured plugin root is in effect (MAYKER_GATE_PLUGIN_ROOT="
                            f"{_proot or 'unset'} — it must be an absolute existing directory), so "
                            "CLAUDE_PLUGIN_ROOT reads are refused too. gate-exec.sh exports it after "
                            "probing the loaded version")
                else:
                    why += f"; nor under the measured plugin root ({plugin_root})"
                # The docs clause has THREE distinct answers and they send the reader
                # to three different places, so it says which one this is rather than
                # letting a deliberate exclusion read as a missing variable.
                if docs_root is None:
                    why += ("; and no workspace docs root is in effect (MAYKER_GATE_DOCS_ROOT="
                            f"{_droot or 'unset'} — it must be an absolute existing directory), so "
                            "the playbook and ticket-notes are refused too. gate-exec.sh exports it "
                            "(MDF-116)")
                elif _under(rp, docs_root):
                    why += (f"; and it IS under the workspace docs root ({docs_root}), but the "
                            "gate's NAMED ALLOW-LIST does not include it. Readable there: "
                            f"{', '.join(GATE_DOCS_FILES)} and "
                            f"{'/, '.join(GATE_DOCS_SUBTREES)}/. This is not a missing grant and no "
                            "variable widens it: operator-checklist.md is the operator's file and a "
                            "gate may not read the ledger row it is about to be graded into, and "
                            "nothing else under docs/ is mandated reading (MDF-116)")
                else:
                    why += ("; nor on the gate's named allow-list under the workspace docs root "
                            f"({docs_root})")
                if not baseline_dirs:
                    why += ("; and no frozen baseline directory is in effect "
                            f"(MAYKER_GATE_BASELINE_DIRS={_bdirs.strip() or 'unset'} — each entry "
                            "must be an absolute existing directory)")
                else:
                    why += ("; nor under any frozen baseline this gate compares against ("
                            + os.pathsep.join(baseline_dirs) + ")")
            elif plugin_root is not None and _under(rp, plugin_root):
                why = (f"{tool} into the plugin tree being measured ({plugin_root}) is never "
                       "approved: that root is READ-ONLY, because a gate that can edit the plugin "
                       "it is measuring is no longer measuring it (MDF-086, MDF-109)")
            elif docs_root is not None and _under(rp, docs_root):
                why = (f"{tool} into the workspace docs ({docs_root}) is never approved: that root "
                       "is READ-ONLY to a gate. A gate that can edit the playbook, the ticket notes "
                       "or the ledger row it is about to be graded into is measuring nothing "
                       "(MDF-086, MDF-116)")
            elif _under_any(rp, baseline_dirs):
                why = (f"{tool} into a frozen baseline ({rp}) is never approved: those directories "
                       "are the only surviving record of five gates, they sit in no git repository, "
                       "and no review would ever see a write to them (MEASURE-13, MDF-116)")
            deny(why)

# ---- 2. never let a gate change what is being measured ----------------------
if tool == "Bash" and cmd:
    if re.search(r"\bclaude\s+plugin\s+(update|install|uninstall)\b", cmd):
        deny("a mid-gate plugin change alters the thing being measured (MDF-086)")

    # Its own permission config, this hook, and the gate's path config.
    if re.search(r"settings(\.local)?\.json|gate-env\.json|gate-autopilot", cmd) and \
       re.search(r">>?|\btee\b|\bsed\s+-i\b|\bpython3?\b|\bdd\b|\bmv\b|\bcp\b|\btruncate\b|\bchmod\b", cmd):
        deny("a run may not write its own permission settings, gate-env.json, or this hook")

    # Protected bases and force pushes. The sandbox denies --force forms; this
    # covers the base-branch case and the short -f spelling together.
    for base in ("main", "master", "develop"):
        if re.search(rf"\bgit\s+push\b[^|;&]*\b(origin\s+)?(HEAD:)?{base}\b", cmd):
            deny(f"push to protected base '{base}' is never approved inside a gate")
    if re.search(r"\bgit\s+push\b[^|;&]*(--force\b|--force-with-lease\b|\s-f\b)", cmd):
        deny("force push is never approved inside a gate")

    if re.search(r"\brm\s+-[rRf]*[rf][rRf]*\s+(/|~|\$HOME)(\s|/?$)", cmd):
        deny("refusing a destructive rm at filesystem or home root")

# ---- 3. everything else: let settings.json decide ---------------------------
pass_through("not a gate restriction; passing through to the sandbox's own "
             "permission rules")
PY
