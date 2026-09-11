#!/usr/bin/env bash
# materialized-from: mayker-dev v0.3.167; do not edit, regenerate with /upgrade-project
#
# Additive reconciler for a consuming repo's `.claude/settings.json` permissions
# block (MDF-178).
#
# THE PROBLEM THIS EXISTS FOR. That block was written once and never updated.
# `/init-project` Section C step 2 copies `templates/settings.json` when the file
# is absent and merges the `permissions` block only when the file has none —
# "never clobber a user-tuned `permissions` block: only add it when absent" — and
# `/sync-project` Section 5.1 reconciled only the `mcp__<server>__*` entries. So
# every change to the shipped block reached new repos and no existing one, and
# `migrations/0.3.104-01-development-md-settings-add-only` documented that rule
# without implementing a heal for it. This script is the heal.
#
# THE ONE SOURCE OF SHIPPED GRANTS IS `templates/settings.json`. This script
# carries no second enumeration of them: the add set is DERIVED from that
# baseline (or from its vendored copy), exactly as `feature-map-validate.sh`
# derives the map's column set from `templates/feature_map.md`. Without a
# baseline there is nothing to reconcile against: exit 2.
#
# THE ONE LIST THE BASELINE CANNOT EXPRESS is the retire set below: the template
# says what ships, not what once shipped. That list is therefore the only thing
# spelled out here, it is short, it is explicit, and every member is removed only
# when it is present VERBATIM.
#
# THIS SCRIPT IS ALSO VENDORED. `/init-project` Section V copies it and its
# baseline into a consuming repo as `.claude/scripts/settings-permissions-reconcile.sh`
# and `.claude/scripts/settings.baseline.json`, and `/upgrade-project` Step 2
# re-vendors both as migration zero. The pair exists for one caller that cannot
# reach the plugin at all: the migration ledger. A migration's `Detect` and
# `Apply` run in `sh`, in the consuming repo, with no environment the plugin sets
# (`migrations/README.md`), so `migrations/0.3.136-01-settings-permissions-reconcile`
# can only run this script if the script is physically in the repo. It resolves
# its baseline itself, in the order below, so both layouts work with no
# environment set and no flag — the vendored SIBLING is tried first, because a
# consuming repo may legitimately own a `templates/settings.json` of its own that
# is not this baseline.
#
# Usage:
#   bash hooks/lib/settings-permissions-reconcile.sh --check <path-to-settings.json>
#   bash hooks/lib/settings-permissions-reconcile.sh --apply <path-to-settings.json>
#
#   --check  report what a run would change and change nothing
#   --apply  make the changes and print one line per added or retired entry
#
# Both modes also print an ADVISORY `inert` line for every never-consulted
# file-path rule left in the block, including the operator's own (MDF-185). It
# changes nothing and moves no exit code; see the INERT-FORM ADVISORY block below.
#
# Baseline resolution, first hit wins:
#   1. $SETTINGS_BASELINE                     explicit override (the fixtures use it)
#   2. {script dir}/settings.baseline.json    the vendored pair
#   3. {script dir}/../../templates/settings.json   the plugin layout
#
# MCP source resolution (optional; absent means the MCP slice is left alone):
#   1. $MCP_CONFIG                            explicit override (the fixtures use it)
#   2. {settings dir}/../.mcp.json            the repo root beside `.claude/`
#
# DECLARED-COMMAND source resolution (optional; absent means the derived-program
# slice is skipped entirely, exactly as an absent `.mcp.json` leaves the MCP
# slice alone):
#   1. $CLAUDE_MD                             explicit override (the fixtures use it)
#   2. {settings dir}/../CLAUDE.md            the repo root beside `.claude/`
#
# THE THIRD SLICE IS ALSO DERIVED, NOT ENUMERATED (MDF-173). A project declares
# the commands its own stack needs — `Test gate command:`, `Scoped test
# command:`, `Full suite command:`, the Backing Services `Start command:` and
# `Teardown command:`, and `Handover health check:` — and every program in them
# gets a `Bash(<program>:*)` grant it is missing. This is why
# `templates/settings.json` carries NO speculative stack list (`make`, `poetry`,
# `go`, ...): a project that needs one declares it, and an unused grant is a
# grant nobody audits. It is strictly ADD-ONLY and never retires: a program
# merely absent from `CLAUDE.md` is indistinguishable from a grant an operator
# added, which is the same asymmetry that forces the retire list above.
#
# Exit codes:
#   0  nothing to do — the block already carries every shipped entry and none of
#      the retired ones (`--check`), or the changes were written (`--apply`)
#   1  `--check` only: a run would change something. An `inert` advisory line is
#      NOT "something": it reports a rule this script deliberately does not
#      touch, so a block that is otherwise current still exits 0 with one.
#   2  cannot reconcile — no settings file, no baseline, either one does not
#      parse as JSON, or the retire set contradicts the baseline (a row that
#      withdraws an entry the baseline still ships). The settings file is NEVER
#      rewritten on this path.
#
# EXIT 2 IS NEVER A PASS, and it is never a silent one either. A caller that
# reads "cannot reconcile" as "already current" reports a healed permissions
# block having healed nothing — the same failure `feature-map-validate.sh`'s
# header names for a half-vendored pair. The ledger entry's Detect turns it into
# `not applicable`, which is correct there only because migration zero has
# re-vendored the pair before the ledger is read (`REPO-19`).
#
# WHAT IT TOUCHES, AND WHAT IT NEVER TOUCHES.
#   * Touched: `permissions.allow`, `permissions.deny`,
#     `permissions.additionalDirectories` and the scalar keys directly under
#     `permissions`. Nothing else in the file — `extraKnownMarketplaces`,
#     `enabledPlugins`, `env`, `hooks` and every other top-level key are read
#     back out unchanged.
#   * An entry in neither the add set nor the retire set is never touched. An
#     operator's own grant survives, and so does an operator's explicit value for
#     a scalar the baseline carries — `false` included. The report says when one
#     was kept, because a silently-honoured operator value and a silently-ignored
#     one look identical.
#   * REPORTED BUT NEVER TOUCHED: an entry in any list under `permissions` whose
#     FORM is never consulted by a file permission check — a path rule on
#     `Write`, `NotebookEdit`, `Glob` or `MultiEdit`. It gets one `inert` line
#     and is left byte-for-byte. This is the only thing this script says about an
#     entry it does not write, and it exists because nothing else in the
#     framework ever looked at one (MDF-185).
#   * ONE ACCEPTED SIDE EFFECT: on a run that changes something, the file is
#     re-serialised by `python3 -m json` at two-space indent, so key ORDER inside
#     each object is preserved but the original whitespace is not (the shipped
#     template packs several grants onto one line; the rewrite puts one per
#     line). A run that would change nothing writes nothing at all, so the
#     reformat never happens on its own.
#
# Callers: `/sync-project` Section 5.1 runs it with `--apply` on every run, in
# both modes (Section E step 5 routes existing mode through 5.1), which is what
# makes the block re-run healed; the vendored copy is run by
# `migrations/0.3.136-01-settings-permissions-reconcile`'s Detect (`--check`) and
# by the human that entry's `## Manual` text names (`--apply`).

set -u

MODE=""
TARGET=""

for arg in "$@"; do
  case "$arg" in
    --check) MODE="check" ;;
    --apply) MODE="apply" ;;
    -*)
      printf '[settings-permissions] unknown option: %s\n' "$arg" >&2
      exit 2
      ;;
    *)
      if [ -n "$TARGET" ]; then
        printf '[settings-permissions] one settings file at a time (got %s and %s)\n' \
          "$TARGET" "$arg" >&2
        exit 2
      fi
      TARGET="$arg"
      ;;
  esac
done

if [ -z "$MODE" ] || [ -z "$TARGET" ]; then
  printf '[settings-permissions] usage: %s --check|--apply <path-to-settings.json>\n' \
    "$(basename "$0")" >&2
  exit 2
fi

if [ ! -f "$TARGET" ] || [ ! -r "$TARGET" ]; then
  printf '[settings-permissions] cannot reconcile: %s is not a readable file\n' "$TARGET" >&2
  exit 2
fi

# --- Resolve the baseline -----------------------------------------------------
# The sibling FIRST. `.claude/scripts/../../templates/settings.json` resolves
# onto a repo-root `templates/` a consuming project may legitimately own for
# something else, and an environment variable alone is not enough: a caller that
# sets no environment (the ledger's `sh -c`) would then be one forgotten export
# away from a silent exit 2.
LIB_DIR="$(cd "$(dirname "$0")" && pwd)"
BASELINE=""
if [ -n "${SETTINGS_BASELINE:-}" ]; then
  BASELINE="$SETTINGS_BASELINE"
elif [ -r "$LIB_DIR/settings.baseline.json" ]; then
  BASELINE="$LIB_DIR/settings.baseline.json"
elif [ -r "$LIB_DIR/../../templates/settings.json" ]; then
  BASELINE="$LIB_DIR/../../templates/settings.json"
fi

if [ -z "$BASELINE" ] || [ ! -r "$BASELINE" ]; then
  printf '[settings-permissions] cannot reconcile: no baseline found (looked for $SETTINGS_BASELINE, %s, %s)\n' \
    "$LIB_DIR/settings.baseline.json" "$LIB_DIR/../../templates/settings.json" >&2
  exit 2
fi

# --- Resolve the optional MCP source -----------------------------------------
# `.claude/settings.json` -> the repo root is two levels up. An absent or
# unparseable `.mcp.json` means the MCP slice is left entirely alone rather than
# emptied: a repo that has not configured its servers yet must not have its
# existing grants withdrawn by a file that is not there.
MCP=""
if [ -n "${MCP_CONFIG:-}" ]; then
  MCP="$MCP_CONFIG"
else
  _sd="$(cd "$(dirname "$TARGET")" && pwd)"
  if [ -r "$_sd/../.mcp.json" ]; then MCP="$_sd/../.mcp.json"; fi
fi

# --- Resolve the optional declared-command source -----------------------------
# Same contract as `.mcp.json`: absent or unparseable means the derived-program
# slice is skipped, never emptied. It can only ever ADD, so there is nothing to
# withdraw on the strength of a file that is not there.
CMD_SRC=""
if [ -n "${CLAUDE_MD:-}" ]; then
  CMD_SRC="$CLAUDE_MD"
else
  _td="$(cd "$(dirname "$TARGET")" && pwd)"
  if [ -r "$_td/../CLAUDE.md" ]; then CMD_SRC="$_td/../CLAUDE.md"; fi
fi

SP_MODE="$MODE" SP_TARGET="$TARGET" SP_BASELINE="$BASELINE" SP_MCP="$MCP" \
SP_CMD_SRC="$CMD_SRC" python3 - <<'PY'
import json
import os
import re
import sys

mode = os.environ["SP_MODE"]
target = os.environ["SP_TARGET"]
baseline_path = os.environ["SP_BASELINE"]
mcp_path = os.environ.get("SP_MCP") or ""
cmd_src_path = os.environ.get("SP_CMD_SRC") or ""

# =============================================================================
# THE RETIRE SET — the one list that is spelled out here rather than derived.
#
# `templates/settings.json` says what the framework SHIPS. It cannot say what the
# framework ONCE shipped and has since withdrawn, and an entry that is simply
# absent from the baseline is indistinguishable from an entry an operator added:
# the add set can never remove anything. So a withdrawal is stated here, once,
# and only ever removes a member that is present VERBATIM.
#
# Each member is (list, entry, replaced_by-or-None):
#   list         "allow" or "deny" — the array the entry is withdrawn from
#   entry        the exact string, matched verbatim; nothing fuzzy, no globbing
#   replaced_by  the baseline entry that supersedes it, or None. When it is set
#                and that entry is in the add set, the pass reports one
#                `replaced` line instead of a separate retire and add, because a
#                replacement is what the operator is actually reading about.
#
# A ROW LANDS IN ONE COMMIT WITH ITS `templates/settings.json` EDIT, ALWAYS.
# A row added here while the baseline still carries the same entry makes the add
# set and the retire set disagree about one string, and the pass would add back
# what it had just removed, so the guard below turns that into a hard exit 2
# rather than a silent reversal. The list shipped EMPTY at 0.3.136, which is the
# version that built the vehicle; it carries its first row from 0.3.137.
#
#   MDF-169 at 0.3.137, the row below: `Write(./.git/**)` -> `Edit(./.git/**)`.
#            File permission checks consult `Edit(path)` and `Read(path)` rules
#            only, so a path rule on `Write` is accepted, never consulted, and
#            guards nothing — and it sat in `permissions.deny` of every repo
#            `/init-project` has ever created, reading as protection. The
#            successor guards one route MORE than the original author expected:
#            a Bash output redirection into `.git/` is checked against `Edit`
#            allow and deny rules too.
#
#   MDF-180 at 0.3.139, the five bare tool-name rows: `Read`, `Edit`, `Write`,
#            `Grep` and `Glob` with no specifier. A bare tool name "matches all
#            uses of a tool", so those five granted the file tools on ANY path,
#            in every permission mode, in every repo `/init-project` has ever
#            created. Inside the working directories they bought nothing —
#            reads there need no approval and `defaultMode: acceptEdits` already
#            auto-accepts edits — so their only effect was outside the repo.
#            MEASURED in both directions before retiring them, CLI 2.1.263
#            (`MEASURE-30`): with them present a headless Read of
#            `~/Downloads/x` and of a sibling repo both SUCCEEDED and a Write
#            outside the repo LANDED ON DISK; with them gone all three are
#            refused, in `acceptEdits`, `auto` and `bypassPermissions` alike,
#            while a read, an edit and a write INSIDE the repo, a read under
#            `.claude/worktrees/{ID}/` and a read of the plugin cache are all
#            unaffected. THESE FIVE HAVE NO SUCCESSOR ENTRY AND NEED NONE — the
#            retirement is the whole fix.
#
#   MDF-188 at 0.3.157 SETTLED the successor question, and the answer is that
#            `blockReadsOutsideWorkingDirectories` IS NOT ADDED — not "not yet",
#            not "pending an attended run". MDF-180 measured it to change no
#            verdict in the wanted direction and to OVERRIDE
#            `permissions.additionalDirectories`, and left open whether that
#            override was really a TRUST effect: its probe clone was trusted
#            before either entry existed, so a re-accepted trust dialog might
#            have restored the read. It would not. MDF-180's own fence-OFF twin
#            (`MEASURE-30`, row Q11) carried the SAME entry under the SAME
#            already-accepted trust and was ALLOWED, so an entry added after
#            trust takes effect without re-accepting anything; the trust state
#            is constant across both arms of a one-variable pair and therefore
#            cannot explain the difference between them. Re-confirmed forward on
#            CLI 2.1.266: an ordinary entry added after trust still opens a read
#            with the fence off. THE OVERRIDE IS REAL. Shipping the key required
#            both of that ticket's measurements to come back favourably and the
#            first did not, so the fence is declined on measurement and the
#            grounds are `rules/workflow_triggers.md` Section 5.6. Do not
#            re-adopt it from the documentation, and do not add a retire row for
#            it — a key that never shipped has nothing to withdraw.
#
# The rows still waiting, for whoever gets there first:
#
#   MDF-175  DISCHARGED at 0.3.141 WITHOUT A ROW, and the reason is worth
#            keeping: an `mcp__` entry is NOT retirable through this list. The
#            row would have read ("allow", "mcp__github__*", None). It was
#            dropped on reading the pass, not on judgement:
#              - `templates/settings.json` no longer ships `mcp__github__*`
#                (GitHub projects use `gh` exclusively), so the first-run
#                scaffold no longer carries it and the contradiction guard above
#                would have been satisfied.
#              - But the MCP slice (step 3 of the pass) runs AFTER the retire
#                step and is DERIVED from `.mcp.json`. Where a repo still
#                declares a `github` server the row's removal is put straight
#                back on the same run; where it does not, step 3 already retires
#                the entry itself ("not in .mcp.json"). The row is therefore
#                dead in both directions.
#              - Worse, it would be dead in a way that BREAKS a decided rule: an
#                absent or unparseable `.mcp.json` leaves the MCP slice ALONE
#                (`REPO-41` point 7), and a retire row does not — it would
#                withdraw a working grant from a repo whose server config could
#                not be read, which that note's "Do not" forbids by name.
#            The heal for a GitHub project is therefore removing the `github`
#            server from `.mcp.json`, which this script then follows on its own.
#            GENERAL RULE: an `mcp__` entry is owned by the MCP slice, so it is
#            retired by the project's `.mcp.json` and never by this list. Do not
#            add an `mcp__` row here.
#
# `tests/settings-permissions-reconcile.test.sh` Part 5 drives the shipped row
# end to end against the migration fixture's own pre-migration settings file, and
# proves the two shapes no shipped row has yet — a retire with no successor, and
# the half-landed contradiction — against a mutated copy of this script carrying
# an injected row. Adding a row here does not break that injection: it anchors on
# the `RETIRE = (` line and inserts after it, never on the list being empty.
# =============================================================================
RETIRE = (
    # MDF-169 — the inert `.git` deny. See the paragraph above before touching it.
    ("deny", "Write(./.git/**)", "Edit(./.git/**)"),
    # MDF-180 — the five bare file-tool grants. No successor, and none needed:
    # the retirement is the whole fix, measured. See the paragraph above before
    # touching them, and especially before adding a "replacement" setting.
    ("allow", "Read", None),
    ("allow", "Edit", None),
    ("allow", "Write", None),
    ("allow", "Grep", None),
    ("allow", "Glob", None),
)

# The arrays the baseline is allowed to contribute entries to. Anything else
# under `permissions` that is a list is the operator's and is left alone.
ENTRY_LISTS = ("allow", "deny", "additionalDirectories")

# `mcp__...` allow entries are NOT part of the baseline-derived add set. They are
# derived from the project's own `.mcp.json` instead (Section 5.1's contract,
# folded in here so the block has one writer). The baseline's own `mcp__clickup__*`
# is the FIRST-RUN scaffold that `/init-project` Section C step 2 copies in whole;
# reconciliation is per project from that point on. It ships no `mcp__github__*`
# any more: GitHub projects configure no Git provider server (MDF-175).
MCP_ENTRY = re.compile(r"^mcp__")

# =============================================================================
# THE INERT-FORM ADVISORY (MDF-185) — the one thing this script reports on
# entries it does not WRITE.
#
# Everything else in this pass is scoped to the two sets: the baseline-derived
# add set and the `RETIRE` list. An entry in neither is never touched, which is
# `REPO-41`'s "never clobber a user-tuned block" and is not negotiable. The
# consequence was that nothing in the framework ever LOOKED at an
# operator-authored entry — and the framework itself shipped the broken form for
# 134 versions in the one file every project copies, so a repo mimicking
# `Write(./.git/**)` with its own path is the expected case rather than a
# hypothetical.
#
# THE GOVERNING FACT, from the permissions documentation's "File permission
# rules" and measured in `MEASURE-25`: a file permission check consults
# `Edit(path)` and `Read(path)` rules ONLY. A path rule on `Write`,
# `NotebookEdit`, `Glob` or the legacy `MultiEdit` is accepted by the settings
# parser, never consulted, and guards nothing — a rule that reads as protection
# in a committed file every teammate and cloud session loads.
#
# THREE PROPERTIES, AND EACH IS A DECISION RATHER THAN AN OVERSIGHT:
#   1. REPORT, NEVER REWRITE. The entry is not added to the retire set and is
#      not touched. A retire row is for a string the FRAMEWORK once shipped; an
#      operator's own rule is theirs, and rewriting it is the clobber rule
#      broken. `Write(./secrets/**)` may even be deliberate documentation of an
#      intent the operator will express another way.
#   2. IT DOES NOT SET `changed`, so it cannot move an exit code. An inert
#      operator rule is a warning about the block, not a difference from the
#      baseline: `--check` on an otherwise-current block still exits 0, and
#      `--apply` still writes nothing.
#   3. IT IS EVALUATED OVER THE BLOCK AS IT WILL STAND, after the retire and add
#      steps, so an entry a retire row is already replacing is reported once as
#      `replace` and not a second time as `inert`. The fixture's own
#      `Write(./.git/**)` is exactly that case.
#
# THE FORBIDDEN SET LIVES HERE AND NOWHERE ELSE.
# `tests/settings-inert-path-rules.test.sh` guards the same forms in every
# settings block the PLUGIN ships, and it DERIVES its list by reading the tuple
# below rather than restating it — the second-enumeration rule `REPO-41` point 5
# forces on the grants, applied to this list. The tuple must stay a single
# literal line of plain strings so that extraction is a parse and not a guess.
# This script cannot read the test instead: it is vendored into consuming repos
# (`REPO-19`) and the test is not.
INERT_TOOLS = ("Write", "NotebookEdit", "Glob", "MultiEdit")

# A path rule is the tool name with a NON-EMPTY specifier. A BARE tool name is a
# tool grant, it IS consulted, and flagging it here would tell an operator to
# delete a working rule. `permissions.allow`'s bare file-tool grants are
# forbidden for an entirely different reason (MDF-180) and by a different check.
INERT_RULE = re.compile(r"^(%s)\((.+)\)$" % "|".join(INERT_TOOLS))


def die_cannot(msg):
    sys.stderr.write("[settings-permissions] cannot reconcile: %s\n" % msg)
    sys.exit(2)


def load(path, what):
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        die_cannot("%s not found at %s" % (what, path))
    except (OSError, UnicodeDecodeError) as exc:
        die_cannot("%s at %s is unreadable (%s)" % (what, path, exc))
    except ValueError as exc:
        die_cannot("%s at %s does not parse as JSON (%s)" % (what, path, exc))
    if not isinstance(data, dict):
        die_cannot("%s at %s is not a JSON object" % (what, path))
    return data


project = load(target, "the settings file")
baseline = load(baseline_path, "the baseline")

bperms = baseline.get("permissions")
if not isinstance(bperms, dict):
    die_cannot("the baseline at %s has no `permissions` object" % baseline_path)

pperms = project.get("permissions")
if pperms is None:
    pperms = {}
elif not isinstance(pperms, dict):
    die_cannot("`permissions` in %s is not a JSON object" % target)

# --- The one authoring error this script refuses to paper over ----------------
# A retire row whose entry the baseline STILL carries is a contradiction: the
# retire set removes it and the add set puts it straight back, so the pass
# reports a removal it has already reversed and `--check` never reaches 0. That
# is the exact half-landed state a row added without its `templates/settings.json`
# edit produces, so it is a hard exit 2 rather than a warning — a silently
# reversed withdrawal is indistinguishable from a withdrawal that worked.
for _lst, _entry, _ in RETIRE:
    _want = bperms.get(_lst)
    if isinstance(_want, list) and _entry in _want:
        die_cannot(
            "the retire set withdraws permissions.%s: %s while the baseline at %s "
            "still ships it. A retire row and the matching edit to the baseline "
            "must land together." % (_lst, _entry, baseline_path)
        )

# --- The desired MCP entry set, derived from `.mcp.json` ----------------------
# `None` means "no MCP source": the slice is left exactly as it is. An empty set
# means the source exists and declares no servers, which legitimately retires
# every `mcp__` grant.
mcp_wanted = None
if mcp_path:
    try:
        with open(mcp_path, encoding="utf-8") as fh:
            mcp_data = json.load(fh)
        servers = mcp_data.get("mcpServers")
        if isinstance(servers, dict):
            mcp_wanted = ["mcp__%s__*" % k for k in sorted(servers)]
    except (OSError, UnicodeDecodeError, ValueError):
        # Unparseable is the same fact as absent HERE and deliberately so: this
        # script must not withdraw a working grant on the strength of a file it
        # could not read. `/sync-project` Section 0 is what verifies `.mcp.json`.
        mcp_wanted = None

# --- The derived program grants, from `CLAUDE.md`'s declared commands ---------
# The FIELDS are named (they are `CLAUDE.md`'s own contract) and the PROGRAMS are
# derived. Nothing here enumerates a grant.
DECLARED_FIELDS = (
    "Test gate command",
    "Scoped test command",
    "Full suite command",
    "Start command",
    "Teardown command",
    "Handover health check",
)

# The CLI's own command separators, per the permissions documentation's
# "Compound commands": a rule must match each subcommand independently, so each
# subcommand needs its own grant and each is split out here.
SEPARATORS = re.compile(r"\|\||&&|\|&|;|\||&|\n")

# A leading `FOO=bar` assignment is not the program.
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")

# Shell builtins and keywords a `Bash(<x>:*)` rule cannot usefully grant. `cd`,
# `source`, `.` and `eval` were each MEASURED ungrantable (MDF-173, CLI 2.1.263),
# and a grant that cannot match anything is the defect `MEASURE-12` names, so
# they are dropped rather than emitted.
NOT_A_PROGRAM = frozenset((
    "cd", "set", "source", ".", "eval", "exec", "export", "unset", "shift",
    "if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done",
    "case", "esac", "function", "return", "exit", "trap", "wait", "time",
    "[", "[[", "{", "(", "!", "test",
))

# `auto` and `none` are the template's own off values; anything with a brace
# placeholder left in it ({FILES}, {ID}) is a template, not a program.
OFF_VALUES = frozenset(("auto", "none", "", "-"))


def declared_programs(path):
    """{program: the field that declared it}, or None when there is no source."""
    if not path:
        return None
    try:
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
    except (OSError, UnicodeDecodeError):
        return None
    found = {}
    for field in DECLARED_FIELDS:
        # `- **Field:** value  # comment` — the value is everything before the
        # first ` #`, which is where the template keeps its `e.g.` example.
        pat = re.compile(
            r"^\s*[-*]?\s*\**%s:?\**\s*:?\s*(.*)$" % re.escape(field),
            re.MULTILINE,
        )
        for m in pat.finditer(text):
            value = m.group(1)
            value = re.split(r"\s+#", value, maxsplit=1)[0]
            value = value.replace("`", "").strip()
            if value.lower() in OFF_VALUES:
                continue
            for segment in SEPARATORS.split(value):
                words = segment.strip().split()
                while words and ASSIGNMENT.match(words[0]):
                    words.pop(0)
                if not words:
                    continue
                prog = words[0].strip("\"'()")
                if not prog or prog in NOT_A_PROGRAM:
                    continue
                # A path-qualified program grants on its own spelling; a brace
                # placeholder is an unfilled template, not a command.
                if "{" in prog or "}" in prog:
                    continue
                if not re.match(r"^[A-Za-z0-9_./-]+$", prog):
                    continue
                found.setdefault(prog, field)
    return found


declared = declared_programs(cmd_src_path)

# --- Build the pass -----------------------------------------------------------
report = []
new_perms = {}
changed = False

# Scalars first, so the report reads in the order the file does.
for key in bperms:
    if key in ENTRY_LISTS:
        continue
    if isinstance(bperms[key], (list, dict)):
        continue
    if key in pperms:
        if pperms[key] != bperms[key]:
            report.append(
                "kept   permissions.%s = %s (operator value; the shipped default is %s)"
                % (key, json.dumps(pperms[key]), json.dumps(bperms[key]))
            )
    else:
        report.append(
            "set    permissions.%s = %s (absent, so the shipped default applies)"
            % (key, json.dumps(bperms[key]))
        )
        changed = True

# Every key the project already has, in its own order, so nothing is reordered
# and nothing outside the two sets is dropped.
for key in pperms:
    if key in ENTRY_LISTS and isinstance(pperms[key], list):
        continue
    new_perms[key] = pperms[key]
for key in bperms:
    if key in ENTRY_LISTS or isinstance(bperms[key], (list, dict)):
        continue
    if key not in new_perms:
        new_perms[key] = bperms[key]

retired_pairs = {}
for lst, entry, replaced_by in RETIRE:
    retired_pairs.setdefault(lst, {})[entry] = replaced_by

for lst in ENTRY_LISTS:
    have = pperms.get(lst)
    if not isinstance(have, list):
        have = []
    want = bperms.get(lst)
    if not isinstance(want, list):
        want = []

    retire_here = retired_pairs.get(lst, {})

    # 1. Retire, verbatim only.
    kept = []
    replaced = {}
    for item in have:
        if isinstance(item, str) and item in retire_here:
            successor = retire_here[item]
            if successor is not None and successor in want:
                replaced[successor] = item
            else:
                report.append("retire permissions.%s: %s" % (lst, item))
            changed = True
            continue
        kept.append(item)

    # 2. Add from the baseline, in baseline order, skipping the MCP slice.
    for item in want:
        if lst == "allow" and isinstance(item, str) and MCP_ENTRY.match(item):
            continue
        if item in kept:
            continue
        if item in replaced:
            report.append(
                "replace permissions.%s: %s -> %s" % (lst, replaced[item], item)
            )
        else:
            report.append("add    permissions.%s: %s" % (lst, item))
        kept.append(item)
        changed = True

    # A successor the baseline no longer carries is a retire with nothing to
    # pair it with, and it must still be reported rather than swallowed.
    for successor, old in replaced.items():
        if successor not in kept:
            report.append("retire permissions.%s: %s" % (lst, old))

    # 3. The MCP slice, derived from `.mcp.json`, allow only.
    if lst == "allow" and mcp_wanted is not None:
        surviving = []
        for item in kept:
            if isinstance(item, str) and MCP_ENTRY.match(item):
                if item in mcp_wanted:
                    surviving.append(item)
                else:
                    # A bare `mcp__*` (which Claude Code rejects outright) or a
                    # server that is no longer in `.mcp.json`.
                    report.append("retire permissions.allow: %s (not in .mcp.json)" % item)
                    changed = True
                continue
            surviving.append(item)
        for item in mcp_wanted:
            if item not in surviving:
                report.append("add    permissions.allow: %s (from .mcp.json)" % item)
                surviving.append(item)
                changed = True
        kept = surviving

    # 4. The derived program grants, allow only and ADD-ONLY. A program the
    #    project declares and the block does not grant is a permission prompt on
    #    every push, and on an unattended surface a push that is never made.
    if lst == "allow" and declared:
        for prog in sorted(declared):
            entry = "Bash(%s:*)" % prog
            if entry in kept:
                continue
            report.append(
                "add    permissions.allow: %s (declared in CLAUDE.md -> %s:)"
                % (entry, declared[prog])
            )
            kept.append(entry)
            changed = True

    if kept or lst in pperms or lst in bperms:
        new_perms[lst] = kept

# --- The inert-form advisory, over the block as it will STAND -----------------
# EVERY list under `permissions`, not only the three this script writes. `ask` is
# a real list the CLI reads and an inert rule in it is exactly as inert; the
# whole point of this pass is to look past the entries this script owns. It reads
# `new_perms`, so a rule a retire row already removed is not reported twice, and
# an entry that survived the pass is reported in both modes identically.
# `changed` is deliberately untouched: see property 2 above.
for _lst, _entries in new_perms.items():
    if not isinstance(_entries, list):
        continue
    for _entry in _entries:
        if not isinstance(_entry, str):
            continue
        _m = INERT_RULE.match(_entry)
        if _m:
            report.append(
                "inert  permissions.%s: %s (a path rule on %s is never consulted; "
                "Edit(path) and Read(path) are the forms a file permission check "
                "reads)" % (_lst, _entry, _m.group(1))
            )

if mode == "check":
    for line in report:
        sys.stdout.write(line + "\n")
    if changed:
        sys.stdout.write(
            "[settings-permissions] %s: a run would change the permissions block\n" % target
        )
        sys.exit(1)
    sys.stdout.write(
        "[settings-permissions] %s: the permissions block already matches the shipped baseline\n"
        % target
    )
    sys.exit(0)

# --- Apply --------------------------------------------------------------------
# Nothing to change means nothing is written, which is what keeps the one
# accepted side effect (the reformat) off a file that did not need it, and what
# makes a second `--apply` byte-identical to the first.
for line in report:
    sys.stdout.write(line + "\n")

if not changed:
    sys.stdout.write(
        "[settings-permissions] %s: already reconciled, nothing written\n" % target
    )
    sys.exit(0)

# `permissions` keeps the position it had, or lands last on a file that had none.
ordered = {}
placed = False
for key in project:
    if key == "permissions":
        ordered["permissions"] = new_perms
        placed = True
    else:
        ordered[key] = project[key]
if not placed:
    ordered["permissions"] = new_perms

tmp = target + ".spr.tmp"
try:
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(ordered, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.replace(tmp, target)
except OSError as exc:
    try:
        os.unlink(tmp)
    except OSError:
        pass
    sys.stderr.write("[settings-permissions] could not write %s (%s)\n" % (target, exc))
    sys.exit(2)

sys.stdout.write("[settings-permissions] %s: reconciled\n" % target)
sys.exit(0)
PY
