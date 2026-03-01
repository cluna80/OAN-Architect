# ADD THESE ENDPOINTS TO YOUR api.py

from trading_engine import trading_engine

@app.get("/trading/market")
async def get_market_data():
    """Get current market price"""
    price = trading_engine.get_current_price()
    change = random.uniform(-5, 5)
    return {
        "price": price,
        "change": change,
        "volume": random.randint(1000000, 10000000),
        "trend": "UP" if change > 0 else "DOWN"
    }

@app.post("/trading/start/{agent_id}")
async def start_trading(agent_id: str, balance: float = 10000):
    """Start trading session"""
    session = trading_engine.start_session(agent_id, balance)
    return {"success": True, "balance": session['balance']}

@app.post("/trading/trade/{agent_id}")
async def make_trade(agent_id: str, action: str, amount: float):
    """Execute trade"""
    price = trading_engine.get_current_price()
    trade = trading_engine.execute_trade(agent_id, action, amount, price)
    
    if trade:
        stats = trading_engine.get_stats(agent_id)
        return {"success": True, "trade": trade.__dict__, "stats": stats}
    
    return {"success": False, "error": "Trade failed"}

@app.get("/trading/stats/{agent_id}")
async def get_stats(agent_id: str):
    """Get trading stats"""
    stats = trading_engine.get_stats(agent_id)
    if stats:
        return stats
    return {"error": "No session found"}

# AUTO-TRADE LOGIC
@app.post("/trading/auto/{agent_id}")
async def auto_trade(agent_id: str, confidence: float = 0.5):
    """Make automatic trading decision"""
    stats = trading_engine.get_stats(agent_id)
    price = trading_engine.get_current_price()
    
    # Simple strategy: Buy if no position, sell if have position
    if stats and not stats['has_position']:
        # BUY
        amount = 0.05 * confidence
        trade = trading_engine.execute_trade(agent_id, 'BUY', amount, price)
        if trade:
            return {
                "success": True,
                "action": "BUY",
                "amount": amount,
                "price": price,
                "stats": trading_engine.get_stats(agent_id)
            }
    elif stats and stats['has_position']:
        # SELL
        session = trading_engine.active_sessions[agent_id]
        amount = session['position']['amount']
        trade = trading_engine.execute_trade(agent_id, 'SELL', amount, price)
        if trade:
            return {
                "success": True,
                "action": "SELL",
                "amount": amount,
                "price": price,
                "profit": trade.profit_loss,
                "stats": trading_engine.get_stats(agent_id)
            }
    
    return {"success": False, "action": "HOLD"}
