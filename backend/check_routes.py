import sys
sys.path.insert(0, '.')

from api import app

print("\nAll registered routes:")
for route in app.routes:
    if hasattr(route, 'path'):
        methods = getattr(route, 'methods', None)
        print(f"  {route.path} -> {methods}")

# Check for conversation
conv_routes = [r for r in app.routes if 'conversation' in str(getattr(r, 'path', ''))]
print(f"\nConversation routes found: {len(conv_routes)}")
for r in conv_routes:
    print(f"  Path: {r.path}")
    print(f"  Methods: {getattr(r, 'methods', 'N/A')}")
