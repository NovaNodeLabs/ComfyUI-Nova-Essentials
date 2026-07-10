import os
import random
from typing import List

import numpy as np
from PIL import Image

try:
    import folder_paths
except Exception:
    folder_paths = None


class NovaImageCompare:
    """Interactive two-image comparison viewer for ComfyUI."""

    DESCRIPTION = (
        "Compare two IMAGE inputs directly on the node. Includes draggable wipe, "
        "side-by-side, overlay and difference views. Run the workflow once after "
        "connecting both images, then use the controls on the node preview."
    )

    def __init__(self):
        self.output_dir = folder_paths.get_temp_directory() if folder_paths else os.getcwd()
        self.type = "temp"
        self.prefix_append = "_nova_compare_" + "".join(
            random.choice("abcdefghijklmnopqrstuvwxyz") for _ in range(6)
        )

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image_a": ("IMAGE", {"tooltip": "First or before image."}),
                "image_b": ("IMAGE", {"tooltip": "Second or after image."}),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "compare"
    OUTPUT_NODE = True
    CATEGORY = "Nova Essentials/Image"

    @staticmethod
    def _first_image(tensor) -> Image.Image:
        array = tensor[0].detach().cpu().numpy()
        array = np.clip(array * 255.0, 0, 255).astype(np.uint8)
        return Image.fromarray(array).convert("RGB")

    @staticmethod
    def _difference_image(a: Image.Image, b: Image.Image) -> Image.Image:
        if b.size != a.size:
            b = b.resize(a.size, Image.Resampling.LANCZOS)
        aa = np.asarray(a, dtype=np.int16)
        bb = np.asarray(b, dtype=np.int16)
        diff = np.abs(aa - bb).clip(0, 255).astype(np.uint8)
        return Image.fromarray(diff, mode="RGB")

    def _save_images(self, images: List[Image.Image]):
        if folder_paths:
            full_output_folder, filename, counter, subfolder, _ = folder_paths.get_save_image_path(
                "nova_compare" + self.prefix_append,
                self.output_dir,
                images[0].width,
                images[0].height,
            )
        else:
            full_output_folder = self.output_dir
            filename = "nova_compare"
            counter = random.randint(0, 99999)
            subfolder = ""

        os.makedirs(full_output_folder, exist_ok=True)
        results = []
        for image in images:
            file_name = f"{filename}_{counter:05}_.png"
            image.save(os.path.join(full_output_folder, file_name), compress_level=4)
            results.append({
                "filename": file_name,
                "subfolder": subfolder,
                "type": self.type,
            })
            counter += 1
        return results

    def compare(self, image_a, image_b):
        a = self._first_image(image_a)
        b = self._first_image(image_b)
        diff = self._difference_image(a, b)
        return {
            "ui": {
                "images": self._save_images([a, b, diff]),
                "nova_compare": [{
                    "a_width": a.width,
                    "a_height": a.height,
                    "b_width": b.width,
                    "b_height": b.height,
                }],
            }
        }


NODE_CLASS_MAPPINGS = {
    "NovaImageCompare": NovaImageCompare,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "NovaImageCompare": "Nova Image Compare",
}
