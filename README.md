# Skybound: Journey of Light — Phase 1

An **original** 3D browser adventure prototype. Walk and jump around a floating sanctuary, fly above clouds, control the camera, find 12 lost light orbs, and restore the island's glow. No characters, music, artwork or assets are copied from another game.

## Features

- Procedurally built floating 3D island, distant islets, clouds, trees, stone sanctuary, glowing plants and a character with a cape.
- Third-person follow camera: drag on touchscreen or mouse to orbit, mouse wheel to zoom.
- Walking, jumping, flight with limited energy, soft landings and recovery after falling.
- 12 collectible lights with an animated glow, progress tracker and persistent progress in `localStorage`.
- Mobile joystick plus JUMP and FLY buttons, keyboard controls, responsive HUD.
- No compilation, account, paid service, model downloads, or backend needed.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | WASD or arrow keys | Drag left joystick |
| Jump | Space | Tap JUMP |
| Fly upward | Hold F or Shift | Hold FLY |
| Orbit camera | Drag mouse over scene | Drag across scene |
| Zoom | Mouse wheel | Not implemented in Phase 1 |

When FLY is released, the character gradually falls. Flight energy regenerates when standing on the island. The character is reset to the sanctuary if it falls beneath the cloud layer.

## Run locally

Requires internet to load pinned Three.js from jsDelivr CDN. **Do not double-click `index.html` as a file**; serve the folder via HTTP.

From the directory containing these files:

```bash
python -m http.server 8765
```

Open `http://localhost:8765` on the same computer. For phone testing, use a deployed HTTPS site, or serve on your local network with the appropriate firewall settings.

## GitHub Pages deployment

1. Create a **new**, public repository named `skybound-journey-of-light` under `flowbeacon-labs`. It should be independent of the other arcade games.
2. Upload `index.html`, `style.css`, `game.js` and `README.md` to the repository root. GitHub's **Add file → Upload files** works; or use git:

   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "Add original Skybound Phase 1 prototype"
   git remote add origin https://github.com/flowbeacon-labs/skybound-journey-of-light.git
   git push -u origin main
   ```

3. In **Settings → Pages**, set **Source: Deploy from a branch**, **Branch: main**, **Folder: / (root)** and save.
4. After the Pages deployment succeeds, visit `https://flowbeacon-labs.github.io/skybound-journey-of-light/`.
5. Play in Safari or Chrome. Use landscape orientation on phones for more scenery, although portrait controls are supported.

## Known Phase 1 limitations

- Requires an internet connection to load Three.js; rest of the game uses in-repo assets and procedural geometry.
- Low-poly prototype models and lighting; no voiceover, multiplayer, quests, texture files, or server-side progress.
- Traversable main island only; distant islets are scenery in this phase.
- The camera orbits freely but no automatic collision avoidance is implemented.
- GPU/WebGL and JavaScript ES modules are required. Older browsers/devices may not support the game.

## Follow-on phases

Add wind corridors, landing on multiple islands, a quest journal, richer flight movement, animated characters, environmental audio, improved camera collision, and additional original world themes.

## License / dependencies

Game code and visual design are original prototype work. Three.js is third-party software under the MIT license; see <https://threejs.org/>. The runtime module is loaded via jsDelivr and pinned to `three@0.186.1`.