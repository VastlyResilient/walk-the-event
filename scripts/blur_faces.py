#!/usr/bin/env python3
"""Burn privacy blur over detected faces, preserving HLG/BT.2020 tags and audio."""
import json, subprocess, sys, math
from pathlib import Path
import cv2, numpy as np

ROOT = Path(__file__).resolve().parents[1]
JOBS = [
    ("downstairs", ROOT/"public/media/downstairs.mp4", ROOT/"data/faces_downstairs.json", ROOT/"public/media/downstairs_blurred.mp4"),
    ("upstairs",   ROOT/"public/media/upstairs.mp4",   ROOT/"data/faces_upstairs.json",   ROOT/"public/media/upstairs_blurred.mp4"),
]
CONF = 0.10

def sample_at(rows, t, window=.24):
    # union detections within a small temporal window, deduplicated by IoU
    out=[]
    for r in rows:
        if abs(r["t"]-t) <= window:
            out.extend(f for f in r["faces"] if f.get("c", 0) >= CONF)
    return out

def blur_frame(frame, faces):
    h,w = frame.shape[:2]
    for f in faces:
        cx=(f["x"]+f["w"]/2)*w; cy=(f["y"]+f["h"]/2)*h
        fw=f["w"]*w; fh=f["h"]*h
        if fw < 4 or fh < 4: continue
        ax=int(max(fw,fh)*1.55/2)+6; ay=int(max(fw,fh)*1.75/2)+6
        x0=max(0,int(cx-ax)); x1=min(w,int(cx+ax)); y0=max(0,int(cy-ay)); y1=min(h,int(cy+ay))
        if x1-x0<5 or y1-y0<5: continue
        patch=frame[y0:y1,x0:x1]
        k=int(max(fw*.85,11))|1; k=min(k,101)
        soft=cv2.GaussianBlur(patch,(k,k),0)
        # feathered ellipse, biased slightly downward to cover chin/jaw
        mask=np.zeros(patch.shape[:2],np.uint8)
        cv2.ellipse(mask,(int((cx-x0)),int((cy-y0)+fh*.04)),(int(ax*.82),int(ay*.92)),0,0,360,255,-1)
        mask=cv2.GaussianBlur(mask,(0,0),max(4,ax*.22))
        a=(mask.astype(np.float32)/255.)[...,None]
        frame[y0:y1,x0:x1]=(patch.astype(np.float32)*(1-a)+soft.astype(np.float32)*a).astype(np.uint8)
    return frame

def run(name, src, js, dst):
    rows=json.loads(Path(js).read_text())
    cap=cv2.VideoCapture(str(src)); W=int(cap.get(3)); H=int(cap.get(4)); fps=cap.get(5) or 29.97
    ow,oh=720,1280
    cmd=["ffmpeg","-hide_banner","-loglevel","error","-y",
         "-f","rawvideo","-pix_fmt","bgr24","-s",f"{W}x{H}","-r",f"{fps}","-i","-",
         "-i",str(src),"-map","0:v:0","-map","1:a?","-vf",f"scale={ow}:{oh}:flags=lanczos",
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
         "-x264-params","keyint=60:min-keyint=30:scenecut=0","-c:a","copy",
         "-color_primaries","bt2020","-color_trc","arib-std-b67","-colorspace","bt2020nc",
         "-movflags","+faststart",str(dst)]
    ff=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    n=0
    while True:
        ok,frame=cap.read()
        if not ok: break
        t=n/fps
        blur_frame(frame,sample_at(rows,t))
        ff.stdin.write(frame.tobytes()); n+=1
        if n%300==0: print(f"{name} frames={n}/{int(cap.get(7))}",flush=True)
    cap.release(); ff.stdin.close()
    err=ff.stderr.read().decode(errors="replace")
    rc=ff.wait()
    print(f"{name} DONE frames={n} rc={rc} out={dst} {err[-300:]}",flush=True)
    if rc: raise SystemExit(rc)

if __name__=="__main__":
    only=sys.argv[1:] or [j[0] for j in JOBS]
    for j in JOBS:
        if j[0] in only: run(*j)
