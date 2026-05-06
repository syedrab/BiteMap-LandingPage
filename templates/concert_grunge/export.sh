#!/bin/bash
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$(pwd)/out"
mkdir -p "$OUT"
BASE="file://$(pwd)/preview.html"

for n in 1 2 3 4 5; do
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1080,1350 \
    --screenshot="$OUT/slide_0${n}.png" \
    "${BASE}?slide=${n}" 2>/dev/null
  echo "wrote slide_0${n}.png"
done
