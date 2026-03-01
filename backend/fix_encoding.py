with open('api.py', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace the problematic emoji dict with Unicode codes
old_dict = """    emotion_icons = {
        'calm': 'í¸Œ',
        'greedy': 'í´‘',
        'fearful': 'í¸°',
        'aggressive': 'í¸¤'
    }"""

new_dict = """    emotion_icons = {
        'calm': '\U0001F60C',
        'greedy': '\U0001F911',
        'fearful': '\U0001F630',
        'aggressive': '\U0001F624'
    }"""

# Try to replace
if old_dict in content:
    content = content.replace(old_dict, new_dict)
    print("Found and replaced emoji dict")
else:
    # Find and replace the specific problematic line
    import re
    # Just remove emojis entirely and use text
    simple_dict = """    emotion_icons = {
        'calm': '[CALM]',
        'greedy': '[GREEDY]',
        'fearful': '[FEARFUL]',
        'aggressive': '[AGGRESSIVE]'
    }"""
    
    # Replace any emotion_icons dict
    pattern = r'emotion_icons\s*=\s*{[^}]+}'
    content = re.sub(pattern, "emotion_icons = {'calm': '[CALM]', 'greedy': '[GREEDY]', 'fearful': '[FEARFUL]', 'aggressive': '[AGGRESSIVE]'}", content)
    print("Replaced with text markers")

# Add UTF-8 encoding declaration at top
if '# -*- coding: utf-8 -*-' not in content:
    content = '# -*- coding: utf-8 -*-\n' + content
    print("Added UTF-8 encoding declaration")

with open('api.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("âœ… Fixed encoding!")
