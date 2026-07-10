# ComfyUI Nova Nodes Essentials v1.0.0

A clean replacement package containing only the current Nova nodes, organized CSV libraries and fresh workflows.

## Important clean-install step

Remove or rename the old `ComfyUI-NovaNodes` custom-node folder before installing this package. Do not run the old and new packages together because both use the same CSV refresh web route.

Extract this zip so the folder is:

```text
ComfyUI/custom_nodes/ComfyUI-NovaNodes/
```

Restart ComfyUI once after installation. After that, use **Reload CSV Dropdown** when switching or editing CSV files.

## Current node set

- **Nova CSV Style Loader**
- **Nova CSV Character Loader**
- **Nova Prompt Builder (Pre-Enhancer)**
- **Nova Text Prompt**
- **Nova Prompt Preview**
- **Nova Prompt Spice**
- **Nova Secret Sauce**
- **Nova Overlay Text Pro**
- **Nova Prompt Logger**
- **Nova Image Compare**

Old v3/v4/v5/v8-v12 node aliases and duplicate switch nodes are intentionally not registered.

## Nova Image Compare

Connect a before image to `image_a` and an after image to `image_b`, then run the workflow once. The node preview provides four comparison modes:

- **Wipe** — drag directly across the preview to reveal either image.
- **Side by Side** — display both images next to each other.
- **Overlay** — drag across the preview to adjust image B opacity.
- **Difference** — display the absolute pixel difference between the images.

The node also displays both source resolutions. If the images have different dimensions, the difference view resizes image B to match image A for comparison.

## Recommended prompt flow

```text
Style CSV 1 ─┐
Style CSV 2 ─┼─> Nova Prompt Builder (Pre-Enhancer) ─> ONE Prompt Enhancer ─> CLIP/KSampler
Character CSV ┤
Manual Prompt ┘
```

This keeps the enhancer after all style, pose, clothing, character and manual instructions, reducing prompt override and removing the need for two enhancers.

## Organized CSV suite

```text
csv/
├─ styles/         visual and photography styles
├─ poses/          general and adult glamour poses
├─ clothing/       clothing pieces and outfit aesthetics
├─ characters/     generic adult character templates
├─ editing/        preserve-original image editing instructions
├─ lighting/       lighting setups
├─ camera/         framing, lenses and composition
├─ environments/   backgrounds and locations
├─ effects/        atmosphere and visual effects
└─ templates/      blank CSV examples
```

All CSVs use:

```csv
name,prompt,negative_prompt,category,weight,favorite
```

## Included workflows

See `workflows/README.md`. Drag any JSON workflow onto ComfyUI.

## Notes

- The character templates are generic original adult archetypes, not a celebrity database.
- Adult glamour pose prompts explicitly describe adult subjects and remain non-explicit.
- No extra Python packages are required beyond a normal ComfyUI installation.
- Nova Image Compare is an independent implementation inspired by the familiar before/after comparison workflow used by image tools.

## License

Nova Nodes Essentials is released under the MIT License. See [`LICENSE`](LICENSE).

Third-party names, brands, franchises, characters and artistic references mentioned in user-created prompts remain the property of their respective owners.
