"""
OAN Trading Engine - FULLY FUNCTIONAL
"""

import random
import time
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Trade:
    id: str
    timestamp: datetime
    action: str
    amount: float
    price: float
    profit_loss: float = 0.0

class TradingEngine:
    def __init__(self):
        self.active_sessions: Dict[str, dict] = {}
        self.base_price = 52000
        
    def get_current_price(self) -> float:
        """Simulate live price with random walk"""
        change = random.uniform(-0.015, 0.02)
        self.base_price *= (1 + change)
        return round(self.base_price, 2)
    
    def start_session(self, agent_id: str, balance: float):
        """Start trading session"""
        self.active_sessions[agent_id] = {
            'balance': balance,
            'initial_balance': balance,
            'position': None,
            'trades': [],
            'wins': 0,
            'losses': 0
        }
        print(f"[TRADING] Started session for {agent_id} with ${balance}")
        return self.active_sessions[agent_id]
    
    def execute_trade(self, agent_id: str, action: str, amount: float, price: float):
        """Execute trade"""
        if agent_id not in self.active_sessions:
            print(f"[ERROR] Session not found: {agent_id}")
            return None
        
        session = self.active_sessions[agent_id]
        
        if action == 'BUY':
            cost = amount * price
            if cost > session['balance']:
                print(f"[ERROR] Insufficient funds: ${session['balance']:.2f} < ${cost:.2f}")
                return None
            
            session['balance'] -= cost
            session['position'] = {
                'amount': amount,
                'entry_price': price
            }
            
            trade = Trade(
                id=f"trade-{int(time.time() * 1000)}",
                timestamp=datetime.now(),
                action='BUY',
                amount=amount,
                price=price
            )
            
            print(f"[TRADE] BUY {amount:.4f} BTC @ ${price:,.2f} | Balance: ${session['balance']:.2f}")
            
        elif action == 'SELL':
            if not session['position']:
                print(f"[ERROR] No position to sell")
                return None
            
            position = session['position']
            profit_loss = (price - position['entry_price']) * position['amount']
            session['balance'] += (position['amount'] * price)
            
            if profit_loss > 0:
                session['wins'] += 1
            else:
                session['losses'] += 1
            
            trade = Trade(
                id=f"trade-{int(time.time() * 1000)}",
                timestamp=datetime.now(),
                action='SELL',
                amount=position['amount'],
                price=price,
                profit_loss=profit_loss
            )
            
            print(f"[TRADE] SELL {position['amount']:.4f} BTC @ ${price:,.2f} | P&L: ${profit_loss:,.2f} | Balance: ${session['balance']:.2f}")
            
            session['position'] = None
        else:
            return None
        
        session['trades'].append(trade)
        return trade
    
    def get_stats(self, agent_id: str):
        """Get session stats"""
        if agent_id not in self.active_sessions:
            return None
        
        session = self.active_sessions[agent_id]
        total_trades = len(session['trades'])
        profit = session['balance'] - session['initial_balance']
        win_rate = 0 if total_trades == 0 else (session['wins'] / total_trades * 100)
        
        return {
            'balance': round(session['balance'], 2),
            'profit': round(profit, 2),
            'total_trades': total_trades,
            'wins': session['wins'],
            'losses': session['losses'],
            'win_rate': round(win_rate, 1),
            'has_position': session['position'] is not None,
            'recent_trades': [
                {
                    'action': t.action,
                    'price': t.price,
                    'amount': t.amount,
                    'profit_loss': round(t.profit_loss, 2)
                }
                for t in session['trades'][-5:]
            ]
        }

trading_engine = TradingEngine()
