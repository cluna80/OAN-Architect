# -*- coding: utf-8 -*-
import requests
import time

BASE_URL = "http://localhost:8000"

print("Testing Memory with LLM Mode\n")
print("="*60)

# Create entity
entity_data = {
    "node_id": "memory-llm-test",
    "name": "LLMMemoryAgent",
    "entity_type": "fighter"
}
response = requests.post(f"{BASE_URL}/entities/create", json=entity_data)
entity_id = "memory-llm-test"

print("\nMaking decision with LLM (this will use memory)...")
print("Watch backend terminal for [PERCEPTION] and [MEMORY INFLUENCE] messages!\n")

# Make decision with LLM enabled
response = requests.post(
    f"{BASE_URL}/cognitive/decision",
    json={
        "entity_id": entity_id,
        "use_llm": True  # This triggers LangGraph with memory!
    }
)

decision = response.json()
print(f"Decision: {decision.get('action')}")
print(f"Reasoning: {decision.get('reasoning')}")

print("\n" + "="*60)
print("Check backend terminal for full cognitive cycle output!")
