# -*- coding: utf-8 -*-
"""
OAN Architect Backend API
Bridges React Frontend <-> OAN Protocol + Ollama AI + Trading + OAN Brain
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
from market_data_live import binance_feed

# Add OAN Protocol to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "ObsidianArcadia"))

# ============================================================================
# OAN BRAIN INTEGRATION
# ============================================================================
try:
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from oan_brain.brain_routes import router as brain_router, get_brain
    BRAIN_AVAILABLE = True
    print("OK OAN Brain loaded")
except ImportError as e:
    print(f"WARNING: OAN Brain not available: {e}")
    BRAIN_AVAILABLE = False

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

# Wire in OAN Brain routes at /oan-brain/*
if BRAIN_AVAILABLE:
    app.include_router(brain_router, prefix="/oan-brain", tags=["OAN Brain"])

# Global instances
engine = PySmartEngine() if OAN_AVAILABLE else None
active_entities: Dict[str, dict] = {}
active_connections: List[WebSocket] = []

# Trading state
trading_sessions: Dict[str, dict] = {}

# Initialize from Binance
try:
    current_price = binance_feed.get_current_price()
    print(f"[MARKET] Initialized price from Binance: ${current_price:,.2f}")
except:
    current_price = 52000.0
    print("[MARKET] Using default price: $52,000")

# CoinGecko cache is handled in market_data_live.py (30s TTL + random walk built in)
def get_live_price() -> float:
    """Delegates to binance_feed which has built-in caching and random walk."""
    return binance_feed.get_current_price()

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

# ============================================================================
# STARTUP / SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup():
    """Wake the OAN Brain on server start."""
    if BRAIN_AVAILABLE:
        try:
            get_brain().wake_up()
        except Exception as e:
            print(f"[BRAIN] Wake-up error: {e}")

@app.on_event("shutdown")
async def shutdown():
    """Clean brain shutdown."""
    if BRAIN_AVAILABLE:
        try:
            get_brain().shutdown()
        except Exception:
            pass

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "OAN Architect API",
        "version": "1.0.7",
        "oan_available": OAN_AVAILABLE,
        "entities": len(active_entities),
        "trading_sessions": len(trading_sessions),
        "cognitive_available": COGNITIVE_AVAILABLE if 'COGNITIVE_AVAILABLE' in globals() else False,
        "brain_available": BRAIN_AVAILABLE,
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

# ============================================================================
# TRADING
# ============================================================================

@app.get("/trading/market")
async def get_market():
    """Get REAL market data from Binance/CoinGecko"""
    try:
        stats = binance_feed.get_24h_stats()
        live = get_live_price()  # uses cache, avoids 429
        market_data = {
            "price": live,
            "change": round(stats['change_percent'], 2),
            "volume": int(stats['volume_24h']),
            "high_24h": round(stats['high_24h'], 2),
            "low_24h": round(stats['low_24h'], 2),
            "source": "Binance Live"
        }

        # Feed market tick to OAN Brain (non-blocking)
        if BRAIN_AVAILABLE:
            try:
                brain = get_brain()
                brain.process_market_event(
                    price=market_data["price"],
                    volume=market_data["volume"],
                    change_24h=market_data["change"] / 100,
                )
            except Exception:
                pass  # Never let brain errors break market data

        return market_data

    except Exception as e:
        global current_price
        current_price *= (1 + random.uniform(-0.02, 0.02))
        return {
            "price": round(current_price, 2),
            "change": random.uniform(-5, 5),
            "volume": random.randint(1000000, 10000000),
            "source": "Simulation"
        }

# ── Strategy presets ─────────────────────────────────────────────────────────
STRATEGY_DEFAULTS = {
    "hodl":     {"take_profit": 0.20, "stop_loss": 0.10, "label": "HODL"},
    "scalp":    {"take_profit": 0.005,"stop_loss": 0.003,"label": "Scalper"},
    "swing":    {"take_profit": 0.05, "stop_loss": 0.02, "label": "Swing"},
    "momentum": {"take_profit": 0.08, "stop_loss": 0.03, "label": "Momentum"},
    "default":  {"take_profit": 0.005,"stop_loss": 0.003,"label": "Scalper"},
}
agent_strategies: Dict[str, dict] = {}

class StrategyConfig(BaseModel):
    strategy_type: str  = "swing"
    take_profit:   float = 0.0
    stop_loss:     float = 0.0

@app.post("/trading/strategy/{agent_id}")
async def set_strategy(agent_id: str, config: StrategyConfig):
    """Set trading strategy for an agent."""
    preset = STRATEGY_DEFAULTS.get(config.strategy_type, STRATEGY_DEFAULTS["default"])
    agent_strategies[agent_id] = {
        "type":        config.strategy_type,
        "take_profit": config.take_profit or preset["take_profit"],
        "stop_loss":   config.stop_loss   or preset["stop_loss"],
        "label":       preset["label"],
    }
    print(f"[STRATEGY] {agent_id}: {agent_strategies[agent_id]}")
    return {"success": True, "strategy": agent_strategies[agent_id]}

@app.get("/trading/strategy/{agent_id}")
async def get_strategy(agent_id: str):
    """Get current strategy for an agent."""
    return agent_strategies.get(agent_id, STRATEGY_DEFAULTS["default"])

@app.post("/trading/start/{agent_id}")
async def trading_start(agent_id: str):
    trading_sessions[agent_id] = {
        "balance":  10000,
        "position": None,
        "trades":   0,
        "wins":     0,
        "profit":   0,
    }
    print(f"[TRADING] Started: {agent_id} with $10,000")
    return {"success": True, "balance": 10000}

@app.post("/trading/auto/{agent_id}")
async def trading_auto(agent_id: str, confidence: float = 0.5):
    if agent_id not in trading_sessions:
        return {"success": False}

    session  = trading_sessions[agent_id]
    strategy = agent_strategies.get(agent_id, STRATEGY_DEFAULTS["default"])
    take_profit_pct = strategy["take_profit"]
    stop_loss_pct   = strategy["stop_loss"]

    price = get_live_price()

    action_taken = None
    profit       = None
    reason       = ""

    if session["position"] is None:
        # ── BUY ──────────────────────────────────────────────────────────────
        cost = price * 0.05
        if session["balance"] >= cost:
            session["position"] = {"price": price, "amount": 0.05}
            session["balance"] -= cost
            session["trades"]  += 1
            action_taken = "BUY"
            print(
                f"[BUY]  0.05 BTC @ ${price:,.2f} | "
                f"TP: +{take_profit_pct*100:.1f}%  SL: -{stop_loss_pct*100:.1f}% | "
                f"Balance: ${session['balance']:,.2f}"
            )
        else:
            action_taken = "SKIP"
            reason = "Insufficient balance"
    else:
        # ── HOLD or SELL ──────────────────────────────────────────────────────
        entry      = session["position"]["price"]
        amount     = session["position"]["amount"]
        profit_pct = (price - entry) / entry

        if profit_pct >= take_profit_pct:
            reason       = f"TAKE PROFIT (+{profit_pct*100:.2f}%)"
            should_sell  = True
        elif profit_pct <= -stop_loss_pct:
            reason       = f"STOP LOSS ({profit_pct*100:.2f}%)"
            should_sell  = True
        else:
            should_sell  = False

        if should_sell:
            profit = (price - entry) * amount
            session["balance"] += price * amount
            session["profit"]  += profit
            session["trades"]  += 1
            if profit > 0:
                session["wins"] += 1
            session["position"] = None
            action_taken = "SELL"
            print(
                f"[SELL] 0.05 BTC @ ${price:,.2f} | "
                f"{reason} | P/L: ${profit:+,.2f} | "
                f"Balance: ${session['balance']:,.2f}"
            )
        else:
            action_taken = "HOLD"
            reason = (
                f"Holding {profit_pct*100:+.2f}% | "
                f"Need TP +{take_profit_pct*100:.1f}% or SL -{stop_loss_pct*100:.1f}%"
            )
            print(f"[HOLD] {agent_id} | {reason}")

    # ── Notify OAN Brain ──────────────────────────────────────────────────────
    if BRAIN_AVAILABLE and action_taken in ("BUY", "SELL"):
        try:
            get_brain().process_agent_action(
                agent_id=agent_id,
                action="trade",
                result={
                    "type":    action_taken,
                    "price":   price,
                    "profit":  profit,
                    "balance": session["balance"],
                    "trades":  session["trades"],
                    "reason":  reason,
                }
            )
        except Exception:
            pass

    # ── Response ──────────────────────────────────────────────────────────────
    base = {
        "success":  True,
        "action":   action_taken,
        "price":    price,
        "reason":   reason,
        "strategy": strategy.get("label", "Default"),
    }
    if action_taken == "HOLD":
        entry      = session["position"]["price"]
        profit_pct = (price - entry) / entry
        return {**base, "position": {
            "entry_price": entry,
            "current_pct": round(profit_pct * 100, 2),
            "target_pct":  round(take_profit_pct * 100, 2),
            "stop_pct":    round(stop_loss_pct * 100, 2),
        }}
    if action_taken == "SELL":
        return {**base, "profit": profit, "stats": {
            "balance": session["balance"],
            "profit":  session["profit"],
            "trades":  session["trades"],
            "wins":    session["wins"],
        }}
    return base

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

@app.get("/trading/sessions/active")
async def get_active_sessions():
    active = []
    for session_id, data in trading_sessions.items():
        if data.get("trades", 0) > 0 or data.get("balance", 10000) != 10000:
            active.append({
                "id": session_id,
                "balance": data.get("balance", 10000),
                "trades": data.get("trades", 0),
                "profit": data.get("profit", 0)
            })
    return {"sessions": active}

@app.delete("/trading/sessions/clear")
async def clear_all_sessions():
    count = len(trading_sessions)
    trading_sessions.clear()
    print(f"[TRADING] Cleared {count} trading sessions")
    return {"success": True, "cleared": count}

# ============================================================================
# WEBSOCKET
# ============================================================================

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
    from oan_ai.memory_system import ShortTermMemory
    COGNITIVE_AVAILABLE = True
    MEMORY_AVAILABLE = True
    print("OK LangGraph Cognitive Layer loaded")
    print("OK Memory System loaded")
except ImportError as e:
    print(f"WARNING: Cognitive layer not available: {e}")
    COGNITIVE_AVAILABLE = False
    MEMORY_AVAILABLE = False

# Global cognitive resources
cognitive_graphs = {}
emotion_systems = {}
energy_systems = {}
agent_memories = {}
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

    if MEMORY_AVAILABLE:
        if data.entity_id not in agent_memories:
            agent_memories[data.entity_id] = ShortTermMemory(max_size=10)

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
        "experience": entity_data.get("experience", 0),
        "memory": agent_memories.get(data.entity_id) if MEMORY_AVAILABLE else None
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

            if MEMORY_AVAILABLE and data.entity_id in agent_memories:
                import random as _random
                outcome = "neutral" if action_data.get('action') == "hold" else "success"
                mem_profit = 0 if action_data.get('action') == "hold" else _random.uniform(-50, 100)

                agent_memories[data.entity_id].add_memory(
                    action=action_data.get('action', 'hold'),
                    outcome=outcome,
                    profit=mem_profit,
                    emotion=emotion.current_emotion.value,
                    reasoning=result.get('internal_reasoning', [''])[0][:100] if result.get('internal_reasoning') else '',
                    market_state=market_state
                )
                print(f"[MEMORY RECORDED] {action_data.get('action')} -> {outcome} (${mem_profit:+.0f})")

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
    if entity_id not in energy_systems:
        energy_systems[entity_id] = EnergySystem()

    return energy_systems[entity_id].get_status()

@app.post("/cognitive/energy/{entity_id}/rest")
async def rest_entity(entity_id: str):
    if entity_id not in energy_systems:
        energy_systems[entity_id] = EnergySystem()

    energy = energy_systems[entity_id]
    energy.rest()

    return {"success": True, "energy": energy.get_status()}

@app.get("/cognitive/market")
async def get_cognitive_market():
    if not COGNITIVE_AVAILABLE or not market_env:
        return {"error": "Market environment not available"}

    return market_env.get_state_dict()

@app.post("/cognitive/market/update")
async def update_cognitive_market(actions: List[Dict] = None):
    if not COGNITIVE_AVAILABLE or not market_env:
        return {"error": "Market environment not available"}

    market_env.update(actions or [])
    return market_env.get_state_dict()

@app.post("/cognitive/thought")
async def receive_thought(data: CognitiveThought):
    print("\n" + "="*60)
    print(f"[{data.emotion.upper()}] {data.entity_name}")
    print("="*60)
    print(f"Thought: {data.thought}")
    print(f"Action: {data.action}")
    print(f"Stats: {data.stats.get('trades', 0)} trades, P/L: ${data.stats.get('profit', 0):.0f}")
    print("="*60 + "\n")

    return {"success": True}

@app.delete("/cognitive/memory/{entity_id}")
async def clear_memory(entity_id: str):
    if entity_id in agent_memories:
        agent_memories[entity_id].clear()
        print(f"[MEMORY] Cleared memory for {entity_id}")
        return {"success": True, "message": f"Memory cleared for {entity_id}"}
    return {"success": False, "message": "No memory found"}

@app.delete("/cognitive/memory/all")
async def clear_all_memory():
    count = len(agent_memories)
    agent_memories.clear()
    print(f"[MEMORY] Cleared all memory ({count} agents)")
    return {"success": True, "message": f"Cleared memory for {count} agents"}

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("  OAN ARCHITECT - COGNITIVE PROTOCOL")
    print("="*60)
    print(f"  OAN Engine:    {'OK' if OAN_AVAILABLE else 'MISSING'}")
    print(f"  Cognitive AI:  {'OK' if COGNITIVE_AVAILABLE else 'MISSING'}")
    print(f"  OAN Brain:     {'OK' if BRAIN_AVAILABLE else 'MISSING'}")
    print(f"  Server:  http://0.0.0.0:8000")
    print(f"  Docs:    http://0.0.0.0:8000/docs")
    print(f"  Brain:   http://0.0.0.0:8000/oan-brain/status")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)