with open('api.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add memory import
old_imports = """try:
    from oan_ai.cognitive_engine import run_cognitive_cycle, create_cognitive_graph
    from oan_ai.emotion_system import EmotionSystem, Emotion
    from oan_ai.energy_system import EnergySystem
    from oan_ai.market_environment import MarketEnvironment
    COGNITIVE_AVAILABLE = True
    print("✅ LangGraph Cognitive Layer loaded")
except ImportError as e:
    print(f"⚠️  Cognitive layer not available: {e}")
    COGNITIVE_AVAILABLE = False"""

new_imports = """try:
    from oan_ai.cognitive_engine import run_cognitive_cycle, create_cognitive_graph
    from oan_ai.emotion_system import EmotionSystem, Emotion
    from oan_ai.energy_system import EnergySystem
    from oan_ai.market_environment import MarketEnvironment
    from oan_ai.memory_system import ShortTermMemory
    COGNITIVE_AVAILABLE = True
    MEMORY_AVAILABLE = True
    print("✅ LangGraph Cognitive Layer loaded")
    print("✅ Memory System loaded")
except ImportError as e:
    print(f"⚠️  Cognitive layer not available: {e}")
    COGNITIVE_AVAILABLE = False
    MEMORY_AVAILABLE = False"""

content = content.replace(old_imports, new_imports)

# Add agent_memories dict
old_dicts = "cognitive_graphs = {}"
new_dicts = "cognitive_graphs = {}\nagent_memories = {}  # ShortTermMemory per agent"

content = content.replace(old_dicts, new_dicts)

# Add memory initialization in cognitive_decision
old_entity_state = '    entity_state = {'
new_code = '''    # Initialize memory
    if MEMORY_AVAILABLE and data.entity_id not in agent_memories:
        agent_memories[data.entity_id] = ShortTermMemory(max_size=10)
    
    entity_state = {'''

content = content.replace(old_entity_state, new_code)

# Add memory to entity_state dict
old_experience = '"experience": entity_data.get("experience", 0)\n    }'
new_experience = '"experience": entity_data.get("experience", 0),\n        "memory": agent_memories.get(data.entity_id) if MEMORY_AVAILABLE else None\n    }'

content = content.replace(old_experience, new_experience)

with open('api.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Memory system integrated!")
print("Restart backend to see changes")
