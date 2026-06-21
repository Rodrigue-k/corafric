import os
from PIL import Image

def compress_image(image_path, new_path, quality=80):
    try:
        # Open the image
        img = Image.open(image_path)
        # Save as WebP with optimized compression settings
        img.save(new_path, "WEBP", quality=quality, method=6) # method=6 is slowest/best compression speed
        print(f"Compressed {image_path} -> {new_path}")
        print(f"Original size: {os.path.getsize(image_path) / 1024:.1f} KB")
        print(f"Compressed size: {os.path.getsize(new_path) / 1024:.1f} KB")
    except Exception as e:
        print(f"Failed to compress {image_path}: {e}")

def main():
    images_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "images")
    
    # 1. Homepage Hero Image
    hero_orig = os.path.join(images_dir, "hero-person-original.webp")
    hero_current = os.path.join(images_dir, "hero-person.webp")
    
    if not os.path.exists(hero_orig) and os.path.exists(hero_current):
        os.rename(hero_current, hero_orig)
        print(f"Renamed {hero_current} to {hero_orig}")
    
    if os.path.exists(hero_orig):
        compress_image(hero_orig, hero_current, quality=75)
        
    # 2. Contributor Image
    contrib_orig = os.path.join(images_dir, "contribute-person-original.webp")
    contrib_current = os.path.join(images_dir, "contribute-person.webp")
    
    if not os.path.exists(contrib_orig) and os.path.exists(contrib_current):
        os.rename(contrib_current, contrib_orig)
        print(f"Renamed {contrib_current} to {contrib_orig}")
        
    if os.path.exists(contrib_orig):
        compress_image(contrib_orig, contrib_current, quality=75)

if __name__ == "__main__":
    main()
