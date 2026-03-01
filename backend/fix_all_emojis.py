import re

# Read file
try:
    with open('api.py', 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
except:
    with open('api.py', 'r', errors='replace') as f:
        lines = f.readlines()

# Add encoding declaration at top if not present
if lines[0].strip() != '# -*- coding: utf-8 -*-':
    lines.insert(0, '# -*- coding: utf-8 -*-\n')

# Fix all lines with emoji issues
for i, line in enumerate(lines):
    # Replace any problematic emoji characters with text
    if i >= 665 and i <= 675:  # Around the problem area
        # Remove any non-ASCII characters and replace with text
        line = line.replace("'í¸Œ'", "'[CALM]'")
        line = line.replace("'í´‘'", "'[GREEDY]'")
        line = line.replace("'í¸°'", "'[FEARFUL]'")
        line = line.replace("'í¸¤'", "'[AGGRESSIVE]'")
        line = line.replace("'í´–'", "'[AI]'")
        
        # Also handle corrupted emoji bytes
        if "\\xe" in repr(line) or "ï¿½ï¿½ï¿½" in line:
            # If line has corrupted bytes, replace the whole thing
            if "'calm':" in line:
                line = "        'calm': '[CALM]',\n"
            elif "'greedy':" in line:
                line = "        'greedy': '[GREEDY]',\n"
            elif "'fearful':" in line:
                line = "        'fearful': '[FEARFUL]',\n"
            elif "'aggressive':" in line:
                line = "        'aggressive': '[AGGRESSIVE]'\n"
            elif "emoji = " in line and "get" in line:
                line = "    emoji = emotion_icons.get(data.emotion, '[AI]')\n"
        
        lines[i] = line

# Write back
with open('api.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("âœ… Fixed all emojis and added UTF-8 encoding!")
