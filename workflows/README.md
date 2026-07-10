# Bundled Workflows

1. **01_two_styles_character_pre_enhancer.json**  
   Visual style + second style/clothing/pose + character + manual prompt. The combined output is designed to feed one enhancer.

2. **02_random_style_pose_character.json**  
   Random style, adult glamour pose and generic adult character template each queue.

3. **03_preserve_original_image_edit.json**  
   Strict source-image edit wording for small changes or anime conversion while preserving the original.

Drag a JSON file onto the ComfyUI canvas. The preview node shows the combined text. Connect `pre_enhance_prompt` to your preferred prompt enhancer, then connect the enhancer output to CLIP/KSampler positive conditioning.
