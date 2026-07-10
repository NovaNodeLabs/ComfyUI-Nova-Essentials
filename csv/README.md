# Nova CSV Suite

Every bundled CSV uses the same columns:

```csv
name,prompt,negative_prompt,category,weight,favorite
```

- `name`: dropdown label. Numbered names are recommended.
- `prompt`: positive prompt fragment.
- `negative_prompt`: negative fragment returned separately.
- `category`: category dropdown/filter.
- `weight`: used by weighted random mode.
- `favorite`: `true` marks a built-in favorite.

Use **Reload CSV Dropdown** after editing or switching a CSV. A full ComfyUI restart is not needed for row changes once the frontend extension is loaded.
