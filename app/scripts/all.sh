cd /home/user/Tokkenly/app
for f in scripts/*.mjs; do
  b=$(basename "$f" .mjs)
  # `seen` is a helper, not a suite. `_ba` is the before-and-after harness and
  # `_figma-*` the design-file converter: all three take arguments and talk to
  # something a sweep does not start. The five `_site*` scripts are the
  # marketing site's and need its own server, so in an app sweep they crash —
  # which is how a real crash goes unnoticed.
  case "$b" in seen|_probe*|_shot|_ba|_site*|_figma-*) continue;; esac
  out=$(node "$f" 2>&1); code=$?
  n=$(printf '%s\n' "$out" | grep -c '^ *FAIL')
  # A suite that dies reports no failures at all, which read as green for one
  # whole tier. A non-zero exit, or a stack trace in the output, is a failure.
  if [ "$code" -ne 0 ] || printf '%s\n' "$out" | grep -q 'Error\|error:'; then
    printf '%-13s CRASH (exit %s)\n' "$b" "$code"
    printf '%s\n' "$out" | tail -4 | sed 's/^/    /'
    continue
  fi
  printf '%-13s FAIL=%s\n' "$b" "$n"
  [ "$n" -gt 0 ] && printf '%s\n' "$out" | grep '^ *FAIL' | head -8
done
echo DONE
