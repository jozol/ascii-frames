#!/usr/bin/env bash
# ==============================================================================
# scripts/harness_gate.sh
# Hard Harness Verification Gate
#
# 1. Finds repo root and parses verification command from .antigravity/active_spec.md
# 2. Executes command in an isolated subshell with a 120-second timeout
# 3. On success: exits 0
# 4. On failure/timeout: writes full log to /tmp/build_full.log, truncates emitted
#    output to tail 40 lines, and exits with a non-zero exit code.
# ==============================================================================

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SPEC_FILE="${REPO_ROOT}/.antigravity/active_spec.md"
LOG_FILE="/tmp/build_full.log"
TIMEOUT_SECS=120

# 1. Validate spec file existence
if [[ ! -f "$SPEC_FILE" ]]; then
  echo "Error: Specification file not found at ${SPEC_FILE}" >&2
  exit 1
fi

# 2. Parse target test/build command from .antigravity/active_spec.md
TARGET_CMD=""

if command -v python3 >/dev/null 2>&1; then
  TARGET_CMD=$(python3 - << 'EOF' "$SPEC_FILE"
import sys, re, os

bt = chr(96)
spec_path = sys.argv[1]
if not os.path.exists(spec_path):
    sys.exit(1)

with open(spec_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1) YAML Frontmatter (command, test_command, verification_command)
fm_match = re.search(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
if fm_match:
    fm = fm_match.group(1)
    m = re.search(r"^(?:command|test_command|verification_command|verification|target_command):\s*(.*?)\s*$", fm, re.MULTILINE | re.IGNORECASE)
    if m:
        val = m.group(1).strip()
        if len(val) >= 2 and ((val[0] == '"' and val[-1] == '"') or (val[0] == "'" and val[-1] == "'")):
            val = val[1:-1].strip()
        if val:
            print(val)
            sys.exit(0)

# 2) Markdown Section (## Verification Command or ## Command followed by fenced code)
sec_match = re.search(r"##\s*(?:Verification|Test|Build|Gate)?\s*Command\s*\n+" + bt * 3 + r"(?:bash|sh)?\s*\n(.*?)\n" + bt * 3, text, re.IGNORECASE)
if sec_match and sec_match.group(1).strip():
    print(sec_match.group(1).strip())
    sys.exit(0)

# 3) Inline pattern (Verification Command: `...` or Command: `...` or Command: ...)
inline_match = re.search(r"^(?:[\*#>\s-]*)(?:Verification\s+Command|Test\s+Command|Build\s+Command|Target\s+Command|Command):\s*" + bt + r"?([^" + bt + r"\r\n]+)" + bt + r"?", text, re.MULTILINE | re.IGNORECASE)
if inline_match and inline_match.group(1).strip():
    print(inline_match.group(1).strip())
    sys.exit(0)

# 4) Comment tag <!-- command: ... -->
comment_match = re.search(r"<!--\s*(?:command|test_command|verification):\s*(.*?)\s*-->", text, re.IGNORECASE)
if comment_match and comment_match.group(1).strip():
    print(comment_match.group(1).strip())
    sys.exit(0)

sys.exit(2)
EOF
)
fi

# Fallback parser using awk if python failed or is unavailable
if [[ -z "$TARGET_CMD" ]]; then
  TARGET_CMD=$(awk '
    BEGIN { in_fm=0 }
    /^---$/ { in_fm++; next }
    in_fm == 1 && /^(command|test_command|verification_command|verification):/ {
      sub(/^(command|test_command|verification_command|verification):[ \t]*/, "")
      gsub(/^["\x27]|["\x27]$/, "")
      print
      exit
    }
    in_fm >= 2 { exit }
  ' "$SPEC_FILE")
fi

if [[ -z "$TARGET_CMD" ]]; then
  TARGET_CMD=$(grep -i -E "^(Verification Command|Test Command|Command):" "$SPEC_FILE" | head -n 1 | sed -E 's/^[^:]+:[ \t]*//' | tr -d '`')
fi

if [[ -z "$TARGET_CMD" ]]; then
  echo "Error: Could not parse target test/build command from ${SPEC_FILE}" >&2
  echo "Ensure .antigravity/active_spec.md includes either:" >&2
  echo "  - Frontmatter: 'command: <cmd>'" >&2
  echo "  - Section: '## Verification Command' with fenced code block" >&2
  echo "  - Inline: 'Verification Command: <cmd>'" >&2
  exit 1
fi

# 3. Setup log file
rm -f "$LOG_FILE"
touch "$LOG_FILE"

echo "[Harness Gate] Target Command: $TARGET_CMD"
echo "[Harness Gate] Executing with ${TIMEOUT_SECS}s timeout in isolated subshell..."

# 4. Execute target command in isolated subshell with 120s timeout
(
  # Isolated subshell: execute command
  bash -c "$TARGET_CMD"
) > "$LOG_FILE" 2>&1 &
CMD_PID=$!

# Watchdog process for 120s timeout
(
  sleep "$TIMEOUT_SECS"
  if kill -0 "$CMD_PID" 2>/dev/null; then
    echo -e "\n[GATE TIMEOUT] Command timed out after ${TIMEOUT_SECS} seconds." >> "$LOG_FILE"
    pkill -P "$CMD_PID" -TERM 2>/dev/null || true
    kill -TERM "$CMD_PID" 2>/dev/null || true
    sleep 1
    pkill -P "$CMD_PID" -KILL 2>/dev/null || true
    kill -KILL "$CMD_PID" 2>/dev/null || true
  fi
) >/dev/null 2>&1 &
WATCHDOG_PID=$!

# Wait for command completion
wait "$CMD_PID" 2>/dev/null
EXIT_CODE=$?

# Terminate watchdog and any child sleep processes
pkill -P "$WATCHDOG_PID" 2>/dev/null || true
kill -KILL "$WATCHDOG_PID" 2>/dev/null || true
wait "$WATCHDOG_PID" 2>/dev/null || true

# 5. Handle Gate Result
if grep -q "\[GATE TIMEOUT\]" "$LOG_FILE" 2>/dev/null; then
  EXIT_CODE=124
fi

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "[Harness Gate] SUCCESS (exit code 0)"
  exit 0
else
  echo "[Harness Gate] FAILURE (exit code ${EXIT_CODE})" >&2
  echo "--- [TAIL 40 LINES OF OUTPUT] ---" >&2
  tail -n 40 "$LOG_FILE" >&2
  echo "----------------------------------" >&2
  echo "Full output preserved at: ${LOG_FILE}" >&2
  exit "$EXIT_CODE"
fi
