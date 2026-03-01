
# ============================================================================
# SIMPLE TRADING ENGINE - INTEGRATED (FIXED)
# ============================================================================

import random

trading_sessions = {}
current_price = 52000

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
    print(f"[TRADING] STARTED: {agent_id}")
    return {"success": True}

@app.post("/trading/auto/{agent_id}")
async def trading_auto(agent_id: str):
    if agent_id not in trading_sessions:
        return {"success": False}
    
    session = trading_sessions[agent_id]
    price = current_price * (1 + random.uniform(-0.01, 0.01))
    
    # Simple strategy: alternate buy/sell
    if session["position"] is None:
        # BUY
        session["position"] = {"price": price, "amount": 0.05}
        session["balance"] -= price * 0.05
        session["trades"] += 1
        print(f"[BUY] {0.05} BTC @ ${price:,.2f} | Balance: ${session['balance']:,.2f}")
        return {"success": True, "action": "BUY", "price": price}
    else:
        # SELL
        entry = session["position"]["price"]
        profit = (price - entry) * 0.05
        session["balance"] += price * 0.05
        session["profit"] += profit
        if profit > 0:
            session["wins"] += 1
        session["position"] = None
        session["trades"] += 1
        print(f"[SELL] {0.05} BTC @ ${price:,.2f} | Profit: ${profit:,.2f} | Balance: ${session['balance']:,.2f}")
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
