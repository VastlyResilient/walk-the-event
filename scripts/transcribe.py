import mlx_whisper,json,pathlib
r=pathlib.Path('/Users/bobby/walk-the-event')
for f in ['downstairs','upstairs']:
 o=mlx_whisper.transcribe(str(r/f'input/videos/{f}.mp4'),path_or_hf_repo='mlx-community/whisper-small-mlx',verbose=False)
 (r/f'data/transcript_{f}.json').write_text(json.dumps(o,indent=2))
 print(f,o.get('text','')[:10000],flush=True)
