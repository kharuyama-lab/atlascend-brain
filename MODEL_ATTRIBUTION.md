# Model Attribution — cervical-cord-registered.glb

- **Original anatomical geometry:** BodyParts3D / Anatomography, © The Database Center for Life Science (DBCLS).
- **Intermediate source:** OrganUI `spinal-cord.glb` (https://github.com/organui/spinal-cord-3d), supplied by the user.
- **Source model license as stated by OrganUI:** Creative Commons Attribution–ShareAlike 2.1 Japan (CC BY-SA 2.1 JP). https://creativecommons.org/licenses/by-sa/2.1/jp/
- **OrganUI source-model license summary:** https://organui.com/docs/licences
- **Modifications in this build:** Isolated the spinal-cord surface; removed distal spinal-cord geometry below approximately the T1 root region; registered the geometry to the Brain Project original medulla via a uniform scale, X-axis reflection and translation; saved as a GLB; precomputed transverse external contours for the viewer.
- **Registration is geometric, not independent clinical validation:** Compared 3,042 native Brain Project medulla surface vertices with the OrganUI/BodyParts3D medulla reference using nearest-neighbor ICP. Median residual 1.216e-6 Brain Project coordinate units; 95th-percentile 1.745e-6. Does not establish accuracy of all source-model anatomy.
- **The Brain Project (Itay Inbar)** and its model/third-party credits remain unchanged in the application's existing LICENSE and credits files.
- **License of this derived cervical geometry:** Preserve the CC BY-SA 2.1 JP attribution and license when adapting or redistributing. The app's source code and other models may carry separate licenses.
