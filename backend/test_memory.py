# -*- coding: utf-8 -*-
import requests
import json
import time

BASE_URL = "http://localhost:8000"

print("Testing Memory System Integration\n")
print("="*60)

# Test 1: Check if memory is available
print("\n1. Checking system status...")
response = requests.get(f"{BASE_URL}/")
data = response.json()
print(f"   Cognitive Available: {data.get('cognitive_available')}")
print(f"   Version: {data.get('version')}")

# Test 2: Create an entity
print("\n2. Creating test entity...")
entity_data = {
    "node_id": "memory-test-001",
    "name": "MemoryTestAgent",
    "entity_type": "fighter"
}
response = requests.post(f"{BASE_URL}/entities/create", json=entity_data)
entity = response.json()
print(f"   Entity created: {entity.get('name')}")
entity_id = entity.get('node_id')

# Test 3: Make 5 decisions (builds memory)
print("\n3. Making 5 cognitive decisions (building memory)...")
for i in range(5):
    response = requests.post(
        f"{BASE_URL}/cognitive/decision",
        json={
            "entity_id": entity_id,
            "use_llm": False
        }
    )
    decision = response.json()
    print(f"   Decision {i+1}: {decision.get('action')} (emotion: {decision.get('emotion')})")
    
    # Update emotion
    profit = 100 if i % 2 == 0 else -50
    win_rate = (i + 1) / 5
    
    requests.post(
        f"{BASE_URL}/cognitive/emotion/update",
        json={
            "entity_id": entity_id,
            "profit": profit,
            "win_rate": win_rate,
            "volatility": 0.02
        }
    )
    
    time.sleep(0.5)

print("\n4. Final decision with memory context...")
response = requests.post(
    f"{BASE_URL}/cognitive/decision",
    json={
        "entity_id": entity_id,
        "use_llm": False
    }
)
final_decision = response.json()
print(f"   Action: {final_decision.get('action')}")
print(f"   Emotion: {final_decision.get('emotion')}")
print(f"   Reasoning: {final_decision.get('reasoning')}")

print("\n" + "="*60)
print("Memory system test complete!")
print("\nCheck backend terminal for [MEMORY INFLUENCE] or [COGNITIVE] messages")
