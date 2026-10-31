#!/bin/bash
set -e
cd "$(dirname "$0")/.."
for floor in downstairs upstairs; do
 ffmpeg -y -loglevel warning -i input/videos/$floor.mp4 -vf "scale=720:1280:flags=lanczos" -c:v libx264 -preset fast -crf 22 -g 12 -keyint_min 12 -sc_threshold 0 -pix_fmt yuv420p -color_primaries bt2020 -color_trc arib-std-b67 -colorspace bt2020nc -c:a aac -b:a 96k -af loudnorm=I=-22:TP=-2:LRA=11 -movflags +faststart public/media/$floor.mp4
done
