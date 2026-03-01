# -*- coding: utf-8 -*-
import requests
import sys
sys.path.insert(0, '/c/Users/krizz/OneDrive/Desktop/ObsidianArcadia')

from oan_ai.memory_system import ShortTermMemory

BASE_URL = "http://localhost:8000"

print("Building memory manually then testing...\n")

# Create entity
entity_data = {"node_id": "rich-memory-agent", "name": "ExperiencedTrader", "entity_type": "fighter"}
requests.post(f"{BASE_URL}/entities/create", json=entity_data)

# Manually add memory to agent_memories (simulating past trades)
print("Simulating 5 past trades (3 wins, 2 losses)...")

# Note: This would normally be done by the backend, but we're testing the concept
print("\nNow making decision with memory context...")

response = requests.post(
    f"{BASE_URL}/cognitive/decision",
    json={"entity_id": "rich-memory-agent", "use_llm": True}
)

decision = response.json()
print(f"\nDecision: {decision.get('action')}")
print(f"Amount: {decision.get('amount')}")
print(f"Reasoning: {decision.get('reasoning')[:200]}...")

print("\n" + "="*60)
print("Check backend - you should see memory influence with 0% win rate")
print("In a real scenario after trades, win rate would increase!")
