import os
import subprocess

folders = [
    "Leaf Landscape supply internship 2025",
    "Green Leaf Internship 2024",
    "Landscape Bidding",
    "TAMU Jiu-Jitsu Coaching",
    "Mission landscape and dry creek"
]

for folder in folders:
    if os.path.exists(folder):
        for file in os.listdir(folder):
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                filepath = os.path.join(folder, file)
                temp_filepath = os.path.join(folder, "tmp_" + file)
                
                # Compress to ~720p bounding box (1280x1280)
                # force_original_aspect_ratio=decrease ensures we don't upscale if it's smaller
                cmd = [
                    "ffmpeg", "-y", "-i", filepath,
                    "-vf", "scale=1280:1280:force_original_aspect_ratio=decrease",
                    "-q:v", "3",
                    temp_filepath
                ]
                
                print(f"Compressing {filepath}...")
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                if os.path.exists(temp_filepath):
                    os.replace(temp_filepath, filepath)

print("Compression complete.")
