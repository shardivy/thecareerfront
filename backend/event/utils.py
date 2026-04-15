import os
import requests
from django.conf import settings

def get_font_path():
    font_dir = os.path.join(settings.BASE_DIR, "fonts")
    os.makedirs(font_dir, exist_ok=True)

    font_path = os.path.join(font_dir, "GreatVibes-Regular.ttf")

    if os.path.exists(font_path):
        return font_path

    url = "https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        with open(font_path, "wb") as f:
            f.write(response.content)

        print("✅ Font downloaded successfully")

    except Exception as e:
        print("❌ Font download failed:", e)
        return None

    return font_path
