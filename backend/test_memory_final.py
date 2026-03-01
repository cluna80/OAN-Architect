# -*- coding: utf-8 -*-
import requests

BASE_URL = "http://localhost:8000"

print("Final Memory Test - Multiple Decisions\n")
print("="*60)

# Create entity
entity_data = {"node_id": "final-test-agent", "name": "FinalTestTrader", "entity_type": "fighter"}
requests.post(f"{BASE_URL}/entities/create", json=entity_data)

print("\nMaking 3 decisions to build memory...")
print("Watch backend terminal for memory evolution!\n")

for i in range(3):
    print(f"\nDecision {i+1}:")
    response = requests.post(
        f"{BASE_URL}/cognitive/decision",
        json={"entity_id": "final-test-agent", "use_llm": True}
    )
    
    decision = response.json()
    print(f"  Action: {decision.get('action')}")
    print(f"  Amount: {decision.get('amount'):.2f}")
    
    # Simulate a win/loss to update emotion
    profit = 100 if i % 2 == 0 else -50
    win_rate = 0.6
    
    requests.post(
        f"{BASE_URL}/cognitive/emotion/update",
        json={
            "entity_id": "final-test-agent",
            "profit": profit,
            "win_rate": win_rate,
            "volatility": 0.02
        }
    )
    
    import time
    time.sleep(2)

print("\n" + "="*60)
print("MEMORY TEST COMPLETE!")
print("\nIn backend you should have seen:")
print("  - Decision 1: 'No trading history yet' + 0.7x multiplier")
print("  - Decision 2-3: Memory influence messages")
print("  - Position sizes adapting to performance")
