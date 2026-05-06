#!/bin/bash
set -e
cd "$(dirname "$0")"
DIR="$(pwd)"
LIB="/Users/mohibrab/workdir/GitHub/BiteMap-AgenticCampaign/library"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WORK="$DIR/work"
mkdir -p "$WORK"

echo "[1/5] Render text overlays"
for n in 1 2 3 4 5; do
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --default-background-color=00000000 \
    --force-device-scale-factor=1 \
    --window-size=1080,1920 \
    --screenshot="$WORK/ov_$n.png" \
    "file://$DIR/overlays.html?s=$n" 2>/dev/null >/dev/null
done

echo "[2/5] Prep clips (crop/scale to 1080x1920, trim to desired duration)"

# Scene 1: drive_in — first 4s, vertical native
ffmpeg -y -hide_banner -loglevel error \
  -i "$LIB/videos/toronto_drive_in.mp4" -ss 0 -t 4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 20 "$WORK/c1_raw.mp4"

# Scene 2: entering_restaurant_slowly — horizontal 1920x1080 → crop vertical center 608x1080 → scale to 1080x1920. 4s
ffmpeg -y -hide_banner -loglevel error \
  -i "$LIB/videos/entering_restaurant_slowly.mp4" -ss 0 -t 4 \
  -vf "crop=608:1080:656:0,scale=1080:1920,fps=30" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 20 "$WORK/c2_raw.mp4"

# Scene 3: cheers_datenight_romantic — 1080x2048, trim to 6s
ffmpeg -y -hide_banner -loglevel error \
  -i "$LIB/videos/cheers_datenight_romantic.mp4" -ss 0 -t 6 \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 20 "$WORK/c3_raw.mp4"

# Scene 4: brownie still → 2s with slow zoom (Ken Burns)
ffmpeg -y -hide_banner -loglevel error \
  -loop 1 -i "$LIB/images/brownie.jpg" -t 2 \
  -vf "scale=1300:1950,zoompan=z='min(zoom+0.0015,1.2)':d=60:s=1080x1920,fps=30" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 20 "$WORK/c4_raw.mp4"

# Scene 5: CTA — solid dark still for 3s (the CTA overlay carries the content)
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "color=c=#141414:s=1080x1920:d=3:r=30" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 20 "$WORK/c5_raw.mp4"

echo "[3/5] Composite text overlays onto each clip"
for n in 1 2 3 4 5; do
  ffmpeg -y -hide_banner -loglevel error \
    -i "$WORK/c${n}_raw.mp4" -i "$WORK/ov_$n.png" \
    -filter_complex "[0:v][1:v]overlay=0:0[out]" \
    -map "[out]" -c:v libx264 -pix_fmt yuv420p -crf 20 "$WORK/c${n}.mp4"
done

echo "[4/5] Concat clips"
{
  for n in 1 2 3 4 5; do echo "file '$WORK/c${n}.mp4'"; done
} > "$WORK/concat.txt"
ffmpeg -y -hide_banner -loglevel error \
  -f concat -safe 0 -i "$WORK/concat.txt" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 "$WORK/video_only.mp4"

echo "[5/5] Mix music (fade in/out, -14 LUFS-ish feel)"
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/video_only.mp4")
ffmpeg -y -hide_banner -loglevel error \
  -i "$WORK/video_only.mp4" \
  -i "$LIB/music/alexgrohl-sweet-life-luxury-chill-438146.mp3" \
  -filter_complex "[1:a]volume=0.75,afade=t=in:st=0:d=1,afade=t=out:st=$(echo "$DURATION - 1.5" | bc -l):d=1.5[a]" \
  -map 0:v -map "[a]" -shortest \
  -c:v copy -c:a aac -b:a 192k \
  "$DIR/output.mp4"

echo "done → $DIR/output.mp4"
