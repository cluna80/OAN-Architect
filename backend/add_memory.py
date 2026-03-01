with open('api.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find line 425 (after MarketEnvironment import)
for i, line in enumerate(lines):
    if 'from oan_ai.market_environment import MarketEnvironment' in line:
        # Add memory import after this line
        lines.insert(i + 1, '    from oan_ai.memory_system import ShortTermMemory\n')
        print(f"✅ Added memory import at line {i+2}")
        break

# Find COGNITIVE_AVAILABLE = True line
for i, line in enumerate(lines):
    if 'COGNITIVE_AVAILABLE = True' in line:
        # Add MEMORY_AVAILABLE after this
        lines.insert(i + 1, '    MEMORY_AVAILABLE = True\n')
        print(f"✅ Added MEMORY_AVAILABLE = True at line {i+2}")
        break

# Find COGNITIVE_AVAILABLE = False line  
for i, line in enumerate(lines):
    if 'COGNITIVE_AVAILABLE = False' in line:
        # Add MEMORY_AVAILABLE = False after this
        lines.insert(i + 1, '    MEMORY_AVAILABLE = False\n')
        print(f"✅ Added MEMORY_AVAILABLE = False at line {i+2}")
        break

# Find cognitive_graphs = {} line
for i, line in enumerate(lines):
    if 'cognitive_graphs = {}' in line:
        # Add agent_memories after this
        lines.insert(i + 1, 'agent_memories = {}  # ShortTermMemory per agent\n')
        print(f"✅ Added agent_memories dict at line {i+2}")
        break

# Find entity_state dict (look for "experience": entity_data)
for i, line in enumerate(lines):
    if '"experience": entity_data.get("experience", 0)' in line:
        # Add memory to entity_state
        old_line = line
        new_line = line.rstrip().rstrip('}') + ',\n        "memory": agent_memories.get(data.entity_id)\n    }\n'
        lines[i] = new_line
        print(f"✅ Added memory to entity_state at line {i+1}")
        break

# Add memory initialization before entity_state creation
for i, line in enumerate(lines):
    if 'entity_state = {' in line and 'entity_id' in lines[i+1]:
        # Add memory init before this
        init_code = '''    # Initialize memory for this agent
    if MEMORY_AVAILABLE:
        if data.entity_id not in agent_memories:
            agent_memories[data.entity_id] = ShortTermMemory(max_size=10)
    
'''
        lines.insert(i, init_code)
        print(f"✅ Added memory initialization at line {i+1}")
        break

with open('api.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("\n✅ Memory integration complete!")
