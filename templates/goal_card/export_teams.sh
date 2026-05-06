#!/bin/bash
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="$(pwd)/out/teams"
TMP="$(pwd)/out/_tmp"
mkdir -p "$OUT" "$TMP"

# team: name p1 p2 p3 word long diaspora
TEAMS=(
  "BRA #FFC107 #1B9444 #1A2C77 GOL GOOOL BRASIL"
  "ARG #75AADB #FFFFFF #0E2C5C GOL GOOOL ARGENTINA"
  "FRA #0055A4 #FFFFFF #EF4135 BUT BUUUT FRANCE"
  "ESP #FFC107 #AA151B #0E0E0E GOL GOOOL ESPAÑA"
  "ENG #FFFFFF #CE1124 #1A2C77 GOAL GOOOAL ENGLAND"
  "GER #000000 #DD0000 #FFCE00 TOR TOOOR DEUTSCHLAND"
  "POR #006600 #FFFFFF #CE1126 GOL GOOOL PORTUGAL"
  "NED #AE1C28 #FFFFFF #21468B GOAL GOOOAL NEDERLAND"
  "MEX #006847 #FFFFFF #CE1126 GOL GOOOL MEXICO"
  "JPN #FFFFFF #BC002D #0E0E0E ゴール ゴーール NIHON"
  "USA #B22234 #FFFFFF #3C3B6E GOAL GOOOAL USA"
  "CAN #FF0000 #FFFFFF #0E0E0E GOAL GOOOAL CANADA"
)

SRC="$(pwd)/preview.html"

for row in "${TEAMS[@]}"; do
  read -r t p1 p2 p3 word long diaspora <<< "$row"
  VARIANT="$TMP/${t}.html"
  python3 <<PY
import re
src = open("$SRC").read()
# Override default CSS vars
src = src.replace("--p1: #FFC107;   /* primary (yellow) */", "--p1: $p1;")
src = src.replace("--p2: #1B9444;   /* secondary (green) */", "--p2: $p2;")
src = src.replace("--p3: #1A2C77;   /* tertiary (navy) */", "--p3: $p3;")
# Replace GOL celebration words + BRASIL diaspora text
src = re.sub(r'(<div class="gol" data-word>)GOL(</div>)', r'\g<1>$word\g<2>', src)
src = re.sub(r'(<div class="word-place" data-diaspora>)BRASIL(</div>)', r'\g<1>$diaspora\g<2>', src)
# slide 2 / slide 3 / slide 4 word spans with data-word
src = re.sub(r'(data-word[^>]*>)GOL(<)', r'\g<1>$word\g<2>', src)
# stretched variants
src = re.sub(r'(data-word-long[^>]*>)GOOOL(<)', r'\g<1>$long\g<2>', src)
open("$VARIANT", "w").write(src)
PY
  for n in 1 2 3 4 5; do
    "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
      --window-size=1080,1350 \
      --screenshot="$OUT/${t}_slide_0${n}.png" \
      "file://$VARIANT?slide=${n}" 2>/dev/null
    echo "wrote ${t}_slide_0${n}.png"
  done
done
