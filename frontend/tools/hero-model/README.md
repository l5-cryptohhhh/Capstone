# Modello 3D della pagina di accesso

Script Blender (5.2) che producono `public/models/boy-juggling.glb` dal modello originale (`base_basic_pbr.glb`).
Ordine: `parts.py` (componenti connesse) -> `rig.py` (scheletro e pesi) -> `parts2.py` (pallone, occhi, bocca)
-> `look.py` (materiali di maglia e pantaloncini) -> `anim3.py --src stage2.blend --export <file.glb>`
(animazioni "juggle", "kick_p", "kick_n").

I percorsi in cima a ogni script (`S = ...`) puntano alla cartella di lavoro: vanno adattati. Si lanciano con
`blender -b --python <script>`.
