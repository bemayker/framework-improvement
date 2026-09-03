#!/usr/bin/env bash
# materialized-from: mayker-dev v0.3.132; do not edit, regenerate with /upgrade-project
#
# Schema validator for a consuming repo's `.claude/feature_map.md` (MDF-044).
#
# That file IS the dependency graph: `plan-feature` Section 1, `build-feature`
# Section 1 and `deliver` Section 3 parse it for `depends_on`, `branch` and the
# scaffold flag. It is produced by an LLM materializing markdown, and every
# realistic corruption (a blank `depends_on`, `scaffold: true` instead of `✅`,
# a branch without the `feature/{ID}-` prefix the auto-Done pipeline matches,
# an unescaped pipe shifting every cell) still renders fine and still "parses",
# into the wrong edges. Prose cannot enforce a schema, so this does.
#
# The schema is NOT restated here. The column set and the illustrative rows are
# read from `templates/feature_map.md`, the single source of truth, so this
# validator follows the template instead of becoming a second definition of it.
# Without that template there is nothing to validate against: exit 2.
#
# THIS SCRIPT IS ALSO VENDORED (MDF-047). `/init-project` Section V copies it and
# its schema source into a consuming repo as `.claude/scripts/feature-map-validate.sh`
# and `.claude/scripts/feature_map.template.md`, so that repo's OWN CI can check
# the map on the one path that bypasses a Claude session entirely: a human editing
# `.claude/feature_map.md` and pushing. It resolves the schema source itself, in
# the order below, so both layouts work with no environment set and no flag —
# the vendored SIBLING is tried first, because a consuming repo may legitimately
# own a `templates/feature_map.md` of its own that is not this schema.
#
# Usage:
#   bash hooks/lib/feature-map-validate.sh <path-to-feature_map.md>
#
#   -q  quiet: suppress the "valid" summary line (violations still print)
#
# Schema source resolution, first hit wins:
#   1. $FEATURE_MAP_TEMPLATE            explicit override (the fixtures use it)
#   2. {script dir}/feature_map.template.md   the vendored pair
#   3. {script dir}/../../templates/feature_map.md   the plugin layout
#
# Exit codes:
#   0  valid (warnings may still have been printed)
#   1  one or more rule violations, each printed as
#      [feature-map] {file}:{line}: {rule}: row {n} ({ID}): {what and why}
#   2  cannot check (no file, unreadable, or the template SSOT is missing)
#
# EXIT 2 IS NEVER A PASS. A caller that treats "cannot check" as green reports a
# validated dependency graph while having validated nothing, which is strictly
# worse than no check at all — the vendored copy's whole point is that a stale or
# half-vendored pair must go red, not quiet (MDF-047).
#
# Callers, WRITE side: `/sync-project` Section 4 and `/deliver` Section 2 step 6 +
# Section 3 step 3 run it on the file they just wrote and refuse to proceed on
# non-zero; `hooks/feature-map-guard.sh` runs it advisorily after any write to the
# file; the vendored copy runs in the consuming repo's `pr-tests.yml` `feature-map`
# job.
#
# Callers, READ side (MDF-147): the seven pipeline skills that consume the graph
# without writing it — build-feature, build-features, plan-feature, plan-features,
# fix, revise-feature, deliver — run it with `-q` at Load Context, chained onto the
# rule-drift command so it costs no exec turn of its own. They WARN and continue
# (`/deliver` stops, having nobody to warn), they never repair, and they treat a
# `cannot check: file not found` as "no map, nothing to say" because a `local`
# work-item source legitimately has none. Every other exit 2 is reported there too.
# Before that, a map corrupted between two sessions was read as fact by every
# readiness, branch, scaffold and checkpoint decision downstream, and only the
# repo's CI ever objected — at push time, after the work was built.
#
# READERS OF THE COLUMNS, which is why the schema grows by APPENDING and never by
# inserting: `hooks/lib/test-scope.sh` reads the first six positionally, and
# `hooks/lib/checkpoint-suite.sh` reads the seventh (`test_checkpoint`, MDF-071).
# A column inserted rather than appended silently re-points both of them, and
# both fail in the quiet direction — a scoped test run against the wrong closure,
# and a checkpoint that never fires.

set -uo pipefail

QUIET=0
MAP=""
for arg in "$@"; do
  case "$arg" in
    -q) QUIET=1 ;;
    -*) printf '[feature-map] unknown option: %s\n' "$arg" >&2; exit 2 ;;
    *) MAP="$arg" ;;
  esac
done

if [ -z "$MAP" ]; then
  printf '[feature-map] usage: feature-map-validate.sh [-q] <path-to-feature_map.md>\n' >&2
  exit 2
fi
if [ ! -f "$MAP" ]; then
  printf '[feature-map] %s: cannot check: file not found\n' "$MAP" >&2
  exit 2
fi
if [ ! -r "$MAP" ]; then
  printf '[feature-map] %s: cannot check: not readable\n' "$MAP" >&2
  exit 2
fi

# Resolve the schema source: explicit override, then the vendored sibling, then
# the plugin layout. FEATURE_MAP_TEMPLATE is used by the fixtures to prove the
# SSOT wiring itself. The sibling is tried before the plugin-relative path
# because `.claude/scripts/../../templates/feature_map.md` resolves to a
# repo-root `templates/` a consuming project may own for something else.
LIB_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="${FEATURE_MAP_TEMPLATE:-}"
if [ -z "$TEMPLATE" ]; then
  if [ -r "$LIB_DIR/feature_map.template.md" ]; then
    TEMPLATE="$LIB_DIR/feature_map.template.md"
  else
    TEMPLATE="$LIB_DIR/../../templates/feature_map.md"
  fi
fi
if [ ! -r "$TEMPLATE" ]; then
  printf '[feature-map] %s: cannot check: schema source %s is missing.\n' "$MAP" "$TEMPLATE" >&2
  printf '[feature-map] The column set is defined only there; reinstall the plugin, re-run /upgrade-project to re-vendor the pair, or pass FEATURE_MAP_TEMPLATE.\n' >&2
  exit 2
fi

AWK_PROG='
function trim(s) { sub(/^[ \t\r]+/, "", s); sub(/[ \t\r]+$/, "", s); return s }

# Splits a markdown table row into out[1..n] trimmed cells.
# Returns the cell count, or -1 when the line is not a pipe-delimited row.
# Escaped pipes (\|, a literal pipe inside a cell) are not delimiters.
function rowcells(line, out,    tmp, n, i, cnt) {
  tmp = trim(line)
  if (tmp !~ /^\|/ || tmp !~ /\|$/) return -1
  gsub(/\\\|/, "\002", tmp)
  n = split(tmp, out, "|")
  cnt = 0
  for (i = 2; i < n; i++) {
    cnt++
    out[cnt] = trim(out[i])
    gsub(/\002/, "\\|", out[cnt])
  }
  for (i = cnt + 1; i <= n; i++) delete out[i]
  return cnt
}

function join(arr, cnt,    i, s) {
  s = arr[1]
  for (i = 2; i <= cnt; i++) s = s "\t" arr[i]
  return s
}

function isseparator(arr, cnt,    i) {
  for (i = 1; i <= cnt; i++) if (arr[i] !~ /^:?-+:?$/) return 0
  return 1
}

function err(lineno, rule, msg) {
  printf "[feature-map] %s:%s: %s: %s\n", FILE, lineno, rule, msg
  nerr++
}
function err0(rule, msg) {
  printf "[feature-map] %s: %s: %s\n", FILE, rule, msg
  nerr++
}
function warn(lineno, rule, msg) {
  printf "[feature-map] %s:%s: warning: %s: %s\n", FILE, lineno, rule, msg
  nwarn++
}
function rowref(i) { return "row " i " (" (id[i] == "" ? "no ID" : id[i]) ")" }

BEGIN {
  nerr = 0; nwarn = 0; nrows = 0; nedges = 0
  inItems = 0; sawItems = 0; sawSchema = 0; tableDone = 0
  hdrSeen = 0; sepSeen = 0; ncols = 0; ntpl = 0
  scaffoldCount = 0; scaffoldRow = 0; scaffoldId = ""
  checkpointCount = 0; checkpointIds = ""
  structural = 0; bail = 0

  # --- schema from the SSOT template -----------------------------------------
  while ((getline sigline < TPLSIG) > 0) {
    tag = substr(sigline, 1, 1)
    body = substr(sigline, 3)
    if (tag == "C") { ncols = body + 0 }
    else if (tag == "H") { tplHeader = body }
    else if (tag == "R") { ntpl++; tplRow[ntpl] = body }
  }
  close(TPLSIG)
  if (ncols == 0 || tplHeader == "") {
    printf "[feature-map] %s: cannot check: no \"## Work items\" table in the schema source\n", FILE
    bail = 1
    exit 2
  }
  ncolname = split(tplHeader, colname, "\t")
}

# Names the columns a short row is missing, so a map written against an older
# schema says WHICH column it lacks rather than only how many cells it has.
function missingcols(cnt,    i, s) {
  s = ""
  for (i = cnt + 1; i <= ncolname; i++) s = s (s == "" ? "" : ", ") "`" colname[i] "`"
  return s
}

{
  line = $0
  sub(/\r$/, "", line)

  if (line ~ /^##[ \t]+Schema[ \t]*$/) { sawSchema = 1 }

  if (line ~ /^##[ \t]+Work items[ \t]*$/) {
    if (sawItems) err0("header", "more than one \"## Work items\" section")
    sawItems = 1; inItems = 1; tableDone = 0
    next
  }
  if (inItems && line ~ /^#/) { inItems = 0; next }
  if (!inItems) next

  if (trim(line) == "") { if (hdrSeen) tableDone = 1; next }
  if (line ~ /^[ \t]*>/) next          # the illustrative-rows note
  if (tableDone) next
  if (line !~ /^[ \t]*\|/) next

  cnt = rowcells(line, cell)

  if (!hdrSeen) {
    hdrSeen = 1; hdrLine = FNR
    if (cnt != ncols || join(cell, cnt) != tplHeader) {
      err(FNR, "header", "the \"## Work items\" header row must be exactly the schema columns\n" \
        "               expected: | " tplHeader " |\n" \
        "               actual:   | " (cnt < 1 ? trim(line) : join(cell, cnt)) " |" \
        ((cnt >= 1 && cnt < ncols) ? "\n               missing: " missingcols(cnt) " — this map predates the current schema; re-run /sync-project to re-materialize it" : ""))
    }
    next
  }
  if (!sepSeen) {
    sepSeen = 1
    if (cnt != ncols || !isseparator(cell, cnt)) {
      err(FNR, "header", "the header row must be followed by a " ncols "-cell separator row (| --- | ... |)")
    }
    next
  }

  # --- data row --------------------------------------------------------------
  nrows++
  rowline[nrows] = FNR
  if (cnt != ncols) {
    id[nrows] = (cnt >= 1 ? cell[1] : "")
    if (cnt < 0) hint = "not a pipe-delimited table row (a row must start and end with |)"
    else if (cnt > ncols) hint = cnt " cells, expected " ncols ". An unescaped | inside a cell shifts every cell after it; write \\| instead"
    else hint = cnt " cells, expected " ncols ", missing " missingcols(cnt) \
      ". Trailing cells may be empty, but their pipes may not be omitted. A map written by an older plugin version is missing the columns added since; re-run /sync-project, or add the empty cells by hand"
    err(FNR, "cell-count", rowref(nrows) ": " hint "\n               " trim(line))
    structural = 1
    next
  }

  id[nrows] = cell[1]; title[nrows] = cell[2]; deps[nrows] = cell[3]
  branch[nrows] = cell[4]; scaf[nrows] = cell[5]; chk[nrows] = cell[7]

  # illustrative template rows must not survive generation
  sig = join(cell, cnt)
  for (t = 1; t <= ntpl; t++) {
    if (sig == tplRow[t]) {
      err(FNR, "template-rows", rowref(nrows) ": this is an illustrative row of the template, copied verbatim. " \
        "Replace it with a real work item (if a real item genuinely matches, change its slug or title)")
    }
  }

  # Feature ID
  if (id[nrows] == "") {
    err(FNR, "id-empty", "row " nrows ": Feature ID is empty")
    structural = 1
  } else if (id[nrows] in seen) {
    err(FNR, "id-unique", rowref(nrows) ": Feature ID already used by row " seen[id[nrows]] \
      ". Every row must be a distinct work item")
    structural = 1
  } else {
    seen[id[nrows]] = nrows
    if (id[nrows] !~ /^[A-Za-z0-9-]+$/)
      warn(FNR, "id-charset", rowref(nrows) ": Feature ID has characters outside [A-Za-z0-9-], so no depends_on cell can reference it")
  }

  # depends_on
  if (deps[nrows] !~ /^\[\]$/ && deps[nrows] !~ /^\[[A-Za-z0-9-]+(,[ ]?[A-Za-z0-9-]+)*\]$/) {
    err(FNR, "depends-on-format", rowref(nrows) ": depends_on is \"" deps[nrows] \
      "\", expected [] (literal, never blank) or a bracketed list of direct dependency IDs such as [US-101, US-102]")
    structural = 1
  } else if (deps[nrows] != "[]") {
    dl = deps[nrows]
    sub(/^\[/, "", dl); sub(/\]$/, "", dl)
    dn = split(dl, dparts, ",")
    for (d = 1; d <= dn; d++) {
      dep = trim(dparts[d])
      nedges++
      ef[nedges] = dep; et[nedges] = id[nrows]; eline[nedges] = FNR; erow[nedges] = nrows
    }
  }

  # branch
  prefix = "feature/" id[nrows] "-"
  if (id[nrows] == "") {
    # already reported as id-empty
  } else if (index(branch[nrows], prefix) != 1) {
    err(FNR, "branch-format", rowref(nrows) ": branch is \"" branch[nrows] "\", expected \"" prefix \
      "{slug}\". The auto-Done pipeline extracts the feature ID from that prefix on merge, so a branch without it never transitions the item")
  } else {
    slug = substr(branch[nrows], length(prefix) + 1)
    if (slug !~ /^[a-z0-9-]+$/)
      err(FNR, "branch-format", rowref(nrows) ": branch slug \"" slug "\" must be lowercase alphanumeric and hyphens only")
    else if (length(slug) > 40)
      err(FNR, "branch-format", rowref(nrows) ": branch slug \"" slug "\" is " length(slug) " chars, max 40")
  }

  # scaffold
  if (scaf[nrows] != "") {
    if (scaf[nrows] != "✅") {
      err(FNR, "scaffold-marker", rowref(nrows) ": scaffold is \"" scaf[nrows] "\", the only accepted marker is ✅. " \
        "The plan-feature/build-feature precedence gate matches ✅ literally, so any other value silently disables the scaffold-first gate (scaffold: true is the local-frontmatter form, not this column)")
    } else {
      scaffoldCount++
      if (scaffoldCount == 1) { scaffoldId = id[nrows]; scaffoldRow = nrows }
      else err(FNR, "scaffold-count", rowref(nrows) ": a second row flagged scaffold ✅ (row " scaffoldRow \
        " already is). At most one item can be the scaffold")
    }
  }

  # test_checkpoint (MDF-071). DELIBERATELY NOT COUNTED: unlike scaffold, any
  # number of rows may be flagged — a project has one scaffold and as many
  # completion boundaries as it has groups of work.
  if (chk[nrows] != "") {
    if (chk[nrows] != "✅") {
      err(FNR, "checkpoint-marker", rowref(nrows) ": test_checkpoint is \"" chk[nrows] "\", the only accepted marker is ✅. " \
        "Every reader of this column matches ✅ literally, so any other value (true, yes, x) silently disables the full-suite checkpoint at this item: /build-feature and /build-features report nothing and /deliver keeps admitting newly ready items without ever running the whole suite against the integrated main")
    } else {
      checkpointCount++
      if (checkpointIds == "") checkpointIds = id[nrows]
      else checkpointIds = checkpointIds "," id[nrows]
    }
  }
}

END {
  if (bail) exit 2       # BEGIN could not load the schema; END still runs in awk

  if (!sawItems) err0("header", "no \"## Work items\" section. Materialize the template verbatim instead of composing the file")
  else if (!hdrSeen) err0("header", "the \"## Work items\" section has no table header row")

  if (!sawSchema) err0("schema-block", "no \"## Schema\" section. Materialize the template verbatim and keep its schema block intact")

  # unresolved depends_on
  for (k = 1; k <= nedges; k++) {
    if (!(ef[k] in seen)) {
      err(eline[k], "depends-on-unknown", rowref(erow[k]) ": depends_on names \"" ef[k] \
        "\" but no row defines it. Every dependency needs its own row, or the readiness check silently treats it as satisfiable")
      structural = 1
    }
  }

  # cycles (Kahn) — skipped when the rows or edges are already structurally broken,
  # so a duplicate-ID or malformed-depends_on file fails for its own reason only.
  if (!structural && nrows > 0) {
    for (i = 1; i <= nrows; i++) indeg[id[i]] = 0
    for (k = 1; k <= nedges; k++) indeg[et[k]]++
    remaining = nrows
    changed = 1
    while (changed) {
      changed = 0
      for (i = 1; i <= nrows; i++) {
        if (!(id[i] in removed) && indeg[id[i]] == 0) {
          removed[id[i]] = 1; remaining--; changed = 1
          for (k = 1; k <= nedges; k++) {
            if (!(k in edgedone) && ef[k] == id[i]) { edgedone[k] = 1; indeg[et[k]]-- }
          }
        }
      }
    }
    if (remaining > 0) {
      cyc = ""
      for (i = 1; i <= nrows; i++) if (!(id[i] in removed)) cyc = cyc (cyc == "" ? "" : ", ") id[i]
      err0("cycle", "the depends_on edges contain a cycle; these rows can never become ready: " cyc)
    }

    # A dependency that is also reachable transitively is a redundant edge: the
    # schema asks for direct edges only. Harmless for readiness, so: a warning.
    if (nedges > 0) {
      for (k = 1; k <= nedges; k++) {
        if (ef[k] == et[k]) continue        # a self-edge is a cycle, reported above
        # mark = everything reachable from et[k] through every OTHER edge
        split("", mark)
        mark[et[k]] = 1
        changed = 1
        while (changed) {
          changed = 0
          for (j = 1; j <= nedges; j++) {
            if (j == k) continue
            if ((et[j] in mark) && !(ef[j] in mark)) { mark[ef[j]] = 1; changed = 1 }
          }
        }
        if (ef[k] in mark)
          warn(eline[k], "depends-on-redundant", rowref(erow[k]) ": \"" ef[k] \
            "\" is already reachable through another dependency; depends_on lists direct edges only, never the transitive closure")
      }
    }
  }

  if (nerr > 0) {
    printf "[feature-map] %s: %d problem%s, the dependency graph is NOT valid\n", FILE, nerr, (nerr == 1 ? "" : "s")
    exit 1
  }
  if (!QUIET)
    printf "[feature-map] %s: valid (%d row%s, %d edge%s, scaffold %s%s%s)\n", FILE, nrows, (nrows == 1 ? "" : "s"), \
      nedges, (nedges == 1 ? "" : "s"), (scaffoldId == "" ? "none" : scaffoldId), \
      (checkpointCount > 0 ? ", checkpoint " checkpointIds : ""), \
      (nwarn > 0 ? ", " nwarn " warning" (nwarn == 1 ? "" : "s") : "")
  exit 0
}
'

# Pass 1: read the column set and the illustrative rows out of the SSOT template.
SIG_PROG='
function trim(s) { sub(/^[ \t\r]+/, "", s); sub(/[ \t\r]+$/, "", s); return s }
function rowcells(line, out,    tmp, n, i, cnt) {
  tmp = trim(line)
  if (tmp !~ /^\|/ || tmp !~ /\|$/) return -1
  gsub(/\\\|/, "\002", tmp)
  n = split(tmp, out, "|")
  cnt = 0
  for (i = 2; i < n; i++) { cnt++; out[cnt] = trim(out[i]); gsub(/\002/, "\\|", out[cnt]) }
  for (i = cnt + 1; i <= n; i++) delete out[i]
  return cnt
}
function join(arr, cnt,    i, s) { s = arr[1]; for (i = 2; i <= cnt; i++) s = s "\t" arr[i]; return s }
function isseparator(arr, cnt,    i) { for (i = 1; i <= cnt; i++) if (arr[i] !~ /^:?-+:?$/) return 0; return 1 }
BEGIN { inItems = 0; hdrSeen = 0 }
{
  line = $0; sub(/\r$/, "", line)
  if (line ~ /^##[ \t]+Work items[ \t]*$/) { inItems = 1; next }
  if (inItems && line ~ /^#/) { inItems = 0 }
  if (!inItems) next
  if (trim(line) == "" && hdrSeen) { inItems = 0; next }
  if (line !~ /^[ \t]*\|/) next
  cnt = rowcells(line, cell)
  if (cnt < 1) next
  if (!hdrSeen) { hdrSeen = 1; print "C " cnt; print "H " join(cell, cnt); next }
  if (isseparator(cell, cnt)) next
  print "R " join(cell, cnt)
}
'

TPLSIG="$(mktemp "${TMPDIR:-/tmp}/feature-map-sig.XXXXXX")" || exit 2
trap 'rm -f "$TPLSIG"' EXIT
awk "$SIG_PROG" "$TEMPLATE" > "$TPLSIG" || exit 2

awk -v FILE="$MAP" -v TPLSIG="$TPLSIG" -v QUIET="$QUIET" "$AWK_PROG" "$MAP"
