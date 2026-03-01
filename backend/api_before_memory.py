# -*- coding: utf-8 -*-
"""
OAN Architect Backend API
Bridges React Frontend ↔ OAN Protocol + Ollama AI + Trading
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import sys
from pathlib import Path
import json
import asyncio
import re
import requests
import random

# Add OAN Protocol to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "ObsidianArcadia"))

try:
    from oan_engine import PySmartEngine
    OAN_AVAILABLE = True
except ImportError:
    print("WARNING: OAN Engine not available")
    OAN_AVAILABLE = False

app = FastAPI(title="OAN Architect API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://0.0.0.0:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
engine = PySmartEngine() if OAN_AVAILABLE else None
active_entities: Dict[str, dict] = {}
active_connections: List[WebSocket] = []

# Trading state
trading_sessions = {}
current_price = 52000.0

# Ollama Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma3:12b"

# Pydantic Models
class EntityCreate(BaseModel):
    node_id: str
    name: str
    entity_type: str = "fighter"

class EntityTrain(BaseModel):
    entity_id: str
    skill: str
    intensity: float

class MatchRequest(BaseModel):
    entity_a_id: str
    entity_b_id: str

class ChatMessage(BaseModel):
    message: str

class ConversationRequest(BaseModel):
    entity_a_id: str
    entity_b_id: str
    topic: str = "How do you feel about each other?"

# Ollama Helper
def query_ollama(prompt: str, system: str = "", temperature: float = 0.8) -> str:
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "system": system,
                "stream": False,
                "options": {"temperature": temperature, "num_predict": 200}
            },
            timeout=60
        )
        if response.status_code == 200:
            return response.json()["response"].strip()
        return f"[Ollama Error: {response.status_code}]"
    except:
        return "[Ollama not available]"

def create_entity_personality(entity_data: dict) -> str:
    return f"""You are {entity_data['name']}, an AI entity in OAN.
Confidence: {entity_data['confidence']:.0%}
Record: {entity_data['wins']}W - {entity_data['losses']}L
Be authentic and concise (2-3 sentences)."""

def parse_entity_data(entity_id: str) -> dict:
    stats = engine.get_stats(entity_id)
    confidence = engine.get_confidence(entity_id)
    win_rate = engine.get_win_rate(entity_id)
    summary = engine.get_brain_summary(entity_id)
    
    record_match = re.search(r'Record: (\d+)-(\d+)-(\d+)', summary)
    xp_match = re.search(r'XP: (\d+)', summary)
    
    wins = int(record_match.group(1)) if record_match else 0
    losses = int(record_match.group(2)) if record_match else 0
    experience = int(xp_match.group(1)) if xp_match else 0
    
    return {
        "stats": stats,
        "confidence": confidence,
        "win_rate": win_rate,
        "wins": wins,
        "losses": losses,
        "experience": experience,
        "summary": summary
    }

# ROUTES
@app.get("/")
async def root():
    return {
        "service": "OAN Architect API",
        "version": "1.0.6",
        "oan_available": OAN_AVAILABLE,
        "entities": len(active_entities),
        "trading_sessions": len(trading_sessions),
        "cognitive_available": COGNITIVE_AVAILABLE if 'COGNITIVE_AVAILABLE' in globals() else False
    }

@app.post("/entities/create")
async def create_entity(data: EntityCreate):
    if not OAN_AVAILABLE:
        return {"error": "OAN Engine not available"}
    
    try:
        entity_id = engine.spawn_smart(data.name, data.entity_type)
        entity_brain_data = parse_entity_data(entity_id)
        
        entity_data = {
            "node_id": data.node_id,
            "entity_id": entity_id,
            "name": data.name,
            "type": data.entity_type,
            **entity_brain_data
        }
        
        active_entities[data.node_id] = entity_data
        await broadcast_entity_update(data.node_id, entity_data)
        
        return entity_data
    except Exception as e:
        return {"error": str(e)}

@app.get("/entities/{node_id}")
async def get_entity(node_id: str):
    if node_id not in active_entities:
        return {"error": "Entity not found"}
    
    entity_data = active_entities[node_id]
    entity_id = entity_data["entity_id"]
    
    try:
        brain_data = parse_entity_data(entity_id)
        entity_data.update(brain_data)
        return entity_data
    except Exception as e:
        return {"error": str(e)}

@app.post("/entities/{node_id}/train")
async def train_entity(node_id: str, data: EntityTrain):
    if node_id not in active_entities:
        return {"error": "Entity not found"}
    
    entity_id = active_entities[node_id]["entity_id"]
    
    try:
        engine.train_skill(entity_id, data.skill, data.intensity)
        brain_data = parse_entity_data(entity_id)
        
        entity_data = active_entities[node_id]
        entity_data.update(brain_data)
        
        await broadcast_entity_update(node_id, entity_data)
        
        return {"success": True, "entity": entity_data}
    except Exception as e:
        return {"error": str(e)}

@app.post("/match")
async def simulate_match(data: MatchRequest):
    """Simulate a match between two entities"""
    if data.entity_a_id not in active_entities or data.entity_b_id not in active_entities:
        return {"error": "One or both entities not found"}
    
    entity_a = active_entities[data.entity_a_id]
    entity_b = active_entities[data.entity_b_id]
    
    try:
        result = engine.smart_match(entity_a["entity_id"], entity_b["entity_id"])
        
        for node_id in [data.entity_a_id, data.entity_b_id]:
            entity_data = active_entities[node_id]
            brain_data = parse_entity_data(entity_data["entity_id"])
            entity_data.update(brain_data)
            await broadcast_entity_update(node_id, entity_data)
        
        print(f"[MATCH] {entity_a['name']} vs {entity_b['name']} - Winner: {result.get('winner', 'N/A')}")
        
        return {
            "result": result,
            "entity_a": active_entities[data.entity_a_id],
            "entity_b": active_entities[data.entity_b_id]
        }
    except Exception as e:
        print(f"[ERROR] Match failed: {e}")
        return {"error": str(e)}

@app.post("/entities/{node_id}/chat")
async def chat_with_entity(node_id: str, message: ChatMessage):
    if node_id not in active_entities:
        return {"error": "Entity not found"}
    
    entity_data = active_entities[node_id]
    personality = create_entity_personality(entity_data)
    response = query_ollama(message.message, system=personality)
    
    return {
        "entity": entity_data["name"],
        "message": response
    }

@app.post("/entities/conversation")
async def entity_conversation(data: ConversationRequest):
    """Two entities have a conversation"""
    if data.entity_a_id not in active_entities or data.entity_b_id not in active_entities:
        return {"error": "One or both entities not found"}
    
    entity_a = active_entities[data.entity_a_id]
    entity_b = active_entities[data.entity_b_id]
    
    try:
        try:
            relationship_a = engine.get_relationship(entity_a["entity_id"], entity_b["entity_id"])
        except:
            relationship_a = {"trust_level": 0.5, "interactions": 0, "wins_against": 0, "losses_against": 0}
        
        try:
            relationship_b = engine.get_relationship(entity_b["entity_id"], entity_a["entity_id"])
        except:
            relationship_b = {"trust_level": 0.5, "interactions": 0, "wins_against": 0, "losses_against": 0}
        
        personality_a = f"""{create_entity_personality(entity_a)}

Relationship with {entity_b['name']}:
- Trust: {relationship_a.get('trust_level', 0.5):.2f}
- Record vs them: {relationship_a.get('wins_against', 0)}W-{relationship_a.get('losses_against', 0)}L
- Interactions: {relationship_a.get('interactions', 0)}

Respond naturally about your relationship and experiences."""

        personality_b = f"""{create_entity_personality(entity_b)}

Relationship with {entity_a['name']}:
- Trust: {relationship_b.get('trust_level', 0.5):.2f}
- Record vs them: {relationship_b.get('wins_against', 0)}W-{relationship_b.get('losses_against', 0)}L
- Interactions: {relationship_b.get('interactions', 0)}

Respond naturally about your relationship and experiences."""
        
        response_a = query_ollama(data.topic, system=personality_a, temperature=0.8)
        response_b = query_ollama(data.topic, system=personality_b, temperature=0.8)
        
        print(f"[CONVERSATION] {entity_a['name']} <-> {entity_b['name']}")
        
        return {
            "topic": data.topic,
            "conversation": [
                {
                    "entity_id": data.entity_a_id,
                    "entity": entity_a["name"],
                    "message": response_a,
                    "stats": {
                        "confidence": entity_a["confidence"],
                        "wins": entity_a["wins"],
                        "losses": entity_a["losses"]
                    }
                },
                {
                    "entity_id": data.entity_b_id,
                    "entity": entity_b["name"],
                    "message": response_b,
                    "stats": {
                        "confidence": entity_b["confidence"],
                        "wins": entity_b["wins"],
                        "losses": entity_b["losses"]
                    }
                }
            ]
        }
    except Exception as e:
        print(f"[ERROR] Conversation failed: {e}")
        return {"error": str(e)}

# TRADING
@app.get("/trading/market")
async def get_market():
    global current_price
    current_price *= (1 + random.uniform(-0.02, 0.02))
    return {
        "price": round(current_price, 2),
        "change": random.uniform(-5, 5),
        "volume": random.randint(1000000, 10000000)
    }

@app.post("/trading/start/{agent_id}")
async def trading_start(agent_id: str):
    trading_sessions[agent_id] = {
        "balance": 10000,
        "position": None,
        "trades": 0,
        "wins": 0,
        "profit": 0
    }
    print(f"[TRADING] Started: {agent_id}")
    return {"success": True}

@app.post("/trading/auto/{agent_id}")
async def trading_auto(agent_id: str, confidence: float = 0.5):
    if agent_id not in trading_sessions:
        return {"success": False}
    
    session = trading_sessions[agent_id]
    price = current_price * (1 + random.uniform(-0.01, 0.01))
    
    if session["position"] is None:
        session["position"] = {"price": price, "amount": 0.05}
        session["balance"] -= price * 0.05
        session["trades"] += 1
        print(f"[BUY] 0.05 BTC @ ${price:,.2f} | Balance: ${session['balance']:,.2f}")
        return {"success": True, "action": "BUY", "price": price}
    else:
        entry = session["position"]["price"]
        profit = (price - entry) * 0.05
        session["balance"] += price * 0.05
        session["profit"] += profit
        if profit > 0:
            session["wins"] += 1
        session["position"] = None
        session["trades"] += 1
        print(f"[SELL] 0.05 BTC @ ${price:,.2f} | P/L: ${profit:,.2f}")
        return {
            "success": True,
            "action": "SELL",
            "price": price,
            "profit": profit,
            "stats": {
                "balance": session["balance"],
                "profit": session["profit"],
                "trades": session["trades"],
                "wins": session["wins"]
            }
        }

@app.get("/trading/stats/{agent_id}")
async def trading_stats(agent_id: str):
    if agent_id not in trading_sessions:
        return {"balance": 10000, "profit": 0, "trades": 0, "wins": 0, "win_rate": 0}
    
    session = trading_sessions[agent_id]
    win_rate = 0 if session["trades"] == 0 else (session["wins"] / session["trades"] * 100)
    
    return {
        "balance": round(session["balance"], 2),
        "profit": round(session["profit"], 2),
        "trades": session["trades"],
        "wins": session["wins"],
        "win_rate": round(win_rate, 1)
    }

# WEBSOCKET
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_entity_update(node_id: str, entity_data: dict):
    message = json.dumps({
        "type": "entity_update",
        "node_id": node_id,
        "data": entity_data
    }, default=str)
    
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except:
            disconnected.append(connection)
    
    for conn in disconnected:
        if conn in active_connections:
            active_connections.remove(conn)

# ============================================================================
# LANGGRAPH COGNITIVE INTELLIGENCE INTEGRATION
# ============================================================================

try:
    from oan_ai.cognitive_engine import run_cognitive_cycle, create_cognitive_graph
    from oan_ai.emotion_system import EmotionSystem, Emotion
    from oan_ai.energy_system import EnergySystem
    from oan_ai.market_environment import MarketEnvironment
    COGNITIVE_AVAILABLE = True
    print("✅ LangGraph Cognitive Layer loaded")
except ImportError as e:
    print(f"⚠️  Cognitive layer not available: {e}")
    COGNITIVE_AVAILABLE = False

# Global cognitive resources
cognitive_graphs = {}
emotion_systems = {}
energy_systems = {}
market_env = MarketEnvironment() if COGNITIVE_AVAILABLE else None

class CognitiveDecisionRequest(BaseModel):
    entity_id: str
    market_state: Optional[Dict] = None
    use_llm: bool = True

class EmotionUpdateRequest(BaseModel):
    entity_id: str
    profit: float
    win_rate: float
    volatility: float = 0.02

class CognitiveThought(BaseModel):
    entity_id: str
    entity_name: str
    thought: str
    emotion: str
    action: str
    stats: Dict

@app.post("/cognitive/decision")
async def cognitive_decision(data: CognitiveDecisionRequest):
    """Get AI-powered decision using LangGraph cognitive engine"""
    if not COGNITIVE_AVAILABLE:
        return {"error": "Cognitive layer not available"}
    
    if data.entity_id not in active_entities:
        return {"error": "Entity not found"}
    
    entity_data = active_entities[data.entity_id]
    
    if data.entity_id not in energy_systems:
        energy_systems[data.entity_id] = EnergySystem()
    
    energy = energy_systems[data.entity_id]
    
    if not energy.can_afford("analyze"):
        return {
            "action": "rest",
            "reasoning": "Insufficient energy - must rest",
            "energy": energy.get_status(),
            "emotion": emotion_systems.get(data.entity_id, "calm") if data.entity_id in emotion_systems else "calm"
        }
    
    if data.entity_id not in emotion_systems:
        emotion_systems[data.entity_id] = EmotionSystem()
    
    emotion = emotion_systems[data.entity_id]
    market_state = data.market_state or market_env.get_state_dict()
    
    entity_state = {
        "entity_id": data.entity_id,
        "name": entity_data["name"],
        "strength": 60.0,
        "agility": 55.0,
        "stamina": 65.0,
        "skill": 58.0,
        "energy": energy.current_energy,
        "emotion": emotion.current_emotion.value,
        "confidence": entity_data.get("confidence", 0.5),
        "wallet": 10000.0,
        "position": None,
        "market_state": market_state,
        "recent_observations": [],
        "internal_reasoning": [],
        "planned_action": "",
        "action_result": {},
        "wins": entity_data.get("wins", 0),
        "losses": entity_data.get("losses", 0),
        "experience": entity_data.get("experience", 0)
    }
    
    try:
        if data.use_llm:
            if data.entity_id not in cognitive_graphs:
                cognitive_graphs[data.entity_id] = create_cognitive_graph()
            
            graph = cognitive_graphs[data.entity_id]
            result = graph.invoke(entity_state)
            energy.consume_energy("analyze")
            
            action_data = json.loads(result.get("planned_action", "{}"))
            
            print(f"[COGNITIVE] {entity_data['name']}: {action_data.get('action')} (emotion: {emotion.current_emotion.value})")
            if result.get("internal_reasoning"):
                print(f"  Reasoning: {result.get('internal_reasoning')[0]}")
            
            return {
                "action": action_data.get("action", "hold"),
                "amount": action_data.get("amount", 0.0),
                "reasoning": result.get("internal_reasoning", ["AI reasoning"])[0] if result.get("internal_reasoning") else "Strategic decision",
                "emotion": emotion.current_emotion.value,
                "energy": energy.get_status(),
                "confidence": result.get("confidence", 0.5)
            }
        else:
            emotion_val = emotion.current_emotion.value
            
            if emotion_val == "greedy":
                action, reasoning = "buy", "Feeling greedy - looking for opportunities"
            elif emotion_val == "fearful":
                action, reasoning = "hold", "Feeling fearful - preserving capital"
            elif emotion_val == "aggressive":
                action, reasoning = "buy", "Aggressive stance - taking action"
            else:
                action, reasoning = "hold", "Calm analysis - waiting for signal"
            
            energy.consume_energy("analyze")
            
            return {
                "action": action,
                "amount": 0.3,
                "reasoning": reasoning,
                "emotion": emotion_val,
                "energy": energy.get_status()
            }
            
    except Exception as e:
        print(f"[COGNITIVE ERROR] {entity_data['name']}: {e}")
        return {
            "error": str(e),
            "action": "hold",
            "reasoning": f"Error: {str(e)}"
        }

@app.post("/cognitive/emotion/update")
async def update_emotion(data: EmotionUpdateRequest):
    """Update entity emotion based on performance"""
    if not COGNITIVE_AVAILABLE:
        return {"error": "Cognitive layer not available"}
    
    if data.entity_id not in emotion_systems:
        emotion_systems[data.entity_id] = EmotionSystem()
    
    emotion = emotion_systems[data.entity_id]
    new_emotion = emotion.update_emotion(
        profit=data.profit,
        market_volatility=data.volatility,
        win_rate=data.win_rate
    )
    
    print(f"[EMOTION] {data.entity_id}: {new_emotion.value} (intensity: {emotion.emotion_intensity:.2f})")
    
    return {
        "emotion": new_emotion.value,
        "intensity": emotion.emotion_intensity,
        "modifiers": emotion.get_emotion_modifiers()
    }

@app.get("/cognitive/energy/{entity_id}")
async def get_energy_status(entity_id: str):
    """Get entity energy status"""
    if entity_id not in energy_systems:
        energy_systems[entity_id] = EnergySystem()
    
    return energy_systems[entity_id].get_status()

@app.post("/cognitive/energy/{entity_id}/rest")
async def rest_entity(entity_id: str):
    """Entity rests to recover energy"""
    if entity_id not in energy_systems:
        energy_systems[entity_id] = EnergySystem()
    
    energy = energy_systems[entity_id]
    energy.rest()
    
    return {"success": True, "energy": energy.get_status()}

@app.get("/cognitive/market")
async def get_cognitive_market():
    """Get current market state"""
    if not COGNITIVE_AVAILABLE or not market_env:
        return {"error": "Market environment not available"}
    
    return market_env.get_state_dict()

@app.post("/cognitive/market/update")
async def update_cognitive_market(actions: List[Dict] = None):
    """Update market based on agent actions"""
    if not COGNITIVE_AVAILABLE or not market_env:
        return {"error": "Market environment not available"}
    
    market_env.update(actions or [])
    return market_env.get_state_dict()

@app.post("/cognitive/thought")
async def receive_thought(data: CognitiveThought):
    """Receive and display cognitive agent thoughts"""
    
    print("\n" + "="*60)
    print(f"[{data.emotion.upper()}] {data.entity_name}")
    print("="*60)
    print(f"Thought: {data.thought}")
    print(f"Action: {data.action}")
    print(f"Stats: {data.stats.get('trades', 0)} trades, P/L: ${data.stats.get('profit', 0):.0f}")
    print("="*60 + "\n")
    
    return {"success": True}

# STARTUP
if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("  OAN ARCHITECT - LANGGRAPH COGNITIVE DEMO")
    print("="*60)
    print(f"  OAN Engine: {'✅' if OAN_AVAILABLE else '❌'}")
    print(f"  Cognitive AI: {'✅' if COGNITIVE_AVAILABLE else '❌'}")
    print(f"  Server: http://0.0.0.0:8000")
    print(f"  Docs: http://0.0.0.0:8000/docs")
    print("="*60)
    print("  Features:")
    print("    ✅ Entity creation & training")
    print("    ✅ Match simulation")
    print("    ✅ Entity conversations")
    print("    ✅ Trading agents")
    print("    ✅ LangGraph cognitive decisions")
    print("    ✅ Emotion & energy systems")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
