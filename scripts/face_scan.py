from ultralytics import YOLO
import cv2, json, sys, time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
model=YOLO(str(root/"models/yolo26n-face.pt"))
for name in ["downstairs","upstairs"]:
    src=root/"input/videos"/f"{name}.mp4"
    cap=cv2.VideoCapture(str(src)); fps=cap.get(cv2.CAP_PROP_FPS); total=int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step=max(1,round(fps/8.0))
    rows=[]; idx=0; t0=time.time()
    print(f"START {name} frames={total} fps={fps:.3f} step={step}",flush=True)
    while True:
        ok=cap.grab()
        if not ok: break
        if idx % step == 0:
            ok, frame = cap.retrieve()
            if ok:
                frame=cv2.resize(frame,(720,1280))
                t=idx/fps
                res=model(frame,conf=0.10,iou=0.45,imgsz=1280,verbose=False,batch=1)[0]
                boxes=[]
                h,w=frame.shape[:2]
                for b in res.boxes:
                    x1,y1,x2,y2=[float(v) for v in b.xyxy[0]]
                    c=float(b.conf)
                    boxes.append({"x":round(x1/w,5),"y":round(y1/h,5),"w":round((x2-x1)/w,5),"h":round((y2-y1)/h,5),"c":round(c,3)})
                rows.append({"t":round(t,4),"faces":boxes})
                if len(rows)%250==0:
                    print(f"{name} {t:.1f}s rows={len(rows)} faces={sum(len(x['faces']) for x in rows)} elapsed={time.time()-t0:.0f}s",flush=True)
        idx+=1
    cap.release()
    out=root/"data"/f"faces_{name}.json"
    out.write_text(json.dumps(rows,separators=(",",":")))
    print(f"DONE {name} samples={len(rows)} faces={sum(len(x['faces']) for x in rows)} out={out}",flush=True)
