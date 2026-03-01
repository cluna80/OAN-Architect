with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the loadTemplate function
old_function = """  const loadTemplate = (template: any) => {
    setNodes(template.nodes);
    setEdges(template.edges);
  };"""

new_function = """  const loadTemplate = async (template: any) => {
    // Clear old trading sessions for fresh start
    try {
      const res = await fetch('http://localhost:8000/trading/sessions/clear', {
        method: 'DELETE'
      });
      const data = await res.json();
      console.log('[DEMO] Cleared', data.cleared, 'old trading sessions');
    } catch (e) {
      console.error('[DEMO] Failed to clear sessions:', e);
    }
    
    setNodes(template.nodes);
    setEdges(template.edges);
  };"""

if old_function in content:
    content = content.replace(old_function, new_function)
    print("âœ… Updated loadTemplate to clear sessions")
else:
    print("âš ï¸ Could not find exact match")
    print("\nSearching for loadTemplate...")
    if 'loadTemplate' in content:
        print("âœ… Found loadTemplate function")
        print("í³ MANUAL UPDATE NEEDED:")
        print("\n1. Open src/App.tsx")
        print("2. Find: const loadTemplate = (template: any) => {")
        print("3. Change signature to: const loadTemplate = async (template: any) => {")
        print("4. Add at the very start of function body:")
        print("""
    try {
      const res = await fetch('http://localhost:8000/trading/sessions/clear', {
        method: 'DELETE'
      });
      const data = await res.json();
      console.log('[DEMO] Cleared', data.cleared, 'sessions');
    } catch (e) {
      console.error('[DEMO] Failed to clear:', e);
    }
""")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
