#!/usr/bin/env bash
# ============================================================
# Shared constitution-front-matter extractor for the four Sacred Rule hooks.
# Lets the hooks load pattern lists from constitution.md using only awk +
# bash (the prerequisites husky already requires).
# ============================================================
#
# extract_constitution_list <constitution-file> <rule-id> <key-name>
#
# Prints list items, one per line, from `sacred_rules.<rule-id>.<key>` or
# `sacred_rules.<rule-id>.patterns.<key>` in constitution.md's front-matter.
# The function locates <key-name> by name anywhere inside the rule's block
# (sub-key names are unique within each rule).
#
# Output is byte-equivalent to the previous parse path for the specific
# shape used in constitution.md:
#   - flat single-level lists of strings
#   - items single-quoted, double-quoted, or bare
#   - trailing `# comment` on item lines tolerated
# If the front-matter ever grows anchors, aliases, block scalars, nested
# lists, or multi-line strings, this parser must be revisited.

extract_constitution_list() {
  local file="$1" rule="$2" key="$3"
  awk -v rule="$rule" -v key="$key" '
    function strip(s,    end) {
      sub(/^[[:space:]]+- /, "", s)
      if (substr(s, 1, 1) == "\x27") {           # single-quoted: literal contents
        end = index(substr(s, 2), "\x27")
        return substr(s, 2, end - 1)
      } else if (substr(s, 1, 1) == "\"") {      # double-quoted (no escapes in our data)
        end = index(substr(s, 2), "\"")
        return substr(s, 2, end - 1)
      } else {                                    # bare scalar: strip trailing comment + ws
        sub(/[[:space:]]+#.*$/, "", s)
        sub(/[[:space:]]+$/, "", s)
        return s
      }
    }
    BEGIN { in_rule = 0; in_key = 0; key_indent = -1 }
    /^  SR-[0-9]+:/ {
      match($0, /SR-[0-9]+/)
      in_rule = (substr($0, RSTART, RLENGTH) == rule)
      in_key = 0
      next
    }
    !in_rule { next }
    /^[[:space:]]*#/ { next }                    # whole-line comment: skip without ending list
    /^[[:space:]]*$/ { next }                    # blank: skip
    {
      match($0, /^[[:space:]]*/); indent = RLENGTH
      if (in_key) {
        if (indent > key_indent && $0 ~ /^[[:space:]]+- /) { print strip($0); next }
        if (indent <= key_indent) in_key = 0
      }
      if ($0 ~ "^[[:space:]]+" key ":[[:space:]]*$") {
        in_key = 1
        key_indent = indent
      }
    }
  ' "$file"
}
