#!/bin/bash
# Usage: ./combine.sh <template_folder>
# Screenshots the template's preview.html gallery layout (all 5 slides in a row, scaled, with labels)
# into ONE shareable PNG at out/carousel_preview.png

set -e
TPL="$1"
if [ -z "$TPL" ]; then
  echo "usage: combine.sh <template_folder>"
  exit 1
fi

DIR="$(cd "$(dirname "$0")/$TPL" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Gallery layout: 5 slides × 486w + 4 gaps × 32 + 2 × 20 padding ≈ 2598w
# Height: 607.5 + label 28 + top/bottom padding 80 ≈ 720h
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=2640,740 \
  --screenshot="$DIR/carousel_preview.png" \
  "file://$DIR/preview.html" 2>/dev/null

echo "wrote $DIR/carousel_preview.png"
