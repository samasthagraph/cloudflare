import sys
from PIL import Image
import colorsys

def is_greenish(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
    # Green/Teal hue is roughly 0.25 to 0.55 (90 deg to 200 deg)
    # Gold is roughly 0.08 to 0.15 (30 deg to 55 deg)
    # Also if it's black/dark gray, we probably want it white against a dark background
    return h > 0.2 and h < 0.6 or (v < 0.4 and s < 0.2)

def process_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        if a == 0:
            new_data.append(item)
            continue
            
        h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
        
        # We want to change the green text/shape to white. 
        # Green is typically h > 0.25. Let's convert anything that isn't distinctly yellow/gold to white.
        # Gold hue is around 0.12 (43 degrees).
        # We will keep colors where hue is between 0.05 (orange) and 0.2 (yellow-green), AND saturation is high enough.
        is_gold = (0.05 <= h <= 0.20) and s > 0.3
        
        if not is_gold:
            # Change to #eef3f1 (brand-light) but preserve original alpha for smooth edges
            new_data.append((238, 243, 241, a))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

if __name__ == "__main__":
    process_image("public/Logo.png", "public/Logo_white.png")
