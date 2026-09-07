cd /home/user/Tokkenly/app
for f in scripts/*.mjs; do
  b=$(basename "$f" .mjs)
  case "$b" in seen|_probe|_shot) continue;; esac
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
