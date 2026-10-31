# -*- coding: utf-8 -*-
"""Export deck slides to PNG via PowerPoint COM. Run: python _render.py"""
import os
import win32com.client

src = os.path.abspath("搏创workshop.pptx")
out = os.path.abspath("_render")
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.lower().endswith(".png"):
        os.remove(os.path.join(out, f))

app = win32com.client.Dispatch("PowerPoint.Application")
try:
    app.Visible = True
except Exception:
    pass
pres = app.Presentations.Open(src, ReadOnly=True, WithWindow=False)
pres.Export(out, "PNG", 1600, 900)
pres.Close()
app.Quit()

for f in os.listdir(out):
    if f.lower().endswith(".png"):
        n = int("".join(c for c in f if c.isdigit()))
        os.rename(os.path.join(out, f), os.path.join(out, f"slide{n}.png"))
print("exported", sorted(os.listdir(out)))
