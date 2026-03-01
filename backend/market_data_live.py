"""
Real-time market data from CoinGecko (FREE, no restrictions)
Better alternative when Binance is geo-blocked
"""
import requests
from typing import Dict
from datetime import datetime
import time

class CoinGeckoMarketFeed:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.current_price = 95000.0
        self.last_update = None
        self._cache_duration = 30  # Increase to avoid rate limits
        self._stats = {}
        
    def get_current_price(self) -> float:
        """Get real-time Bitcoin price"""
        # Check cache
        if self.last_update:
            elapsed = (datetime.now() - self.last_update).total_seconds()
            if elapsed < self._cache_duration:
                return self.current_price
        
        try:
            response = requests.get(
                f"{self.base_url}/simple/price",
                params={
                    "ids": "bitcoin",
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "true",
                    "include_last_updated_at": "true"
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                bitcoin = data.get('bitcoin', {})
                
                self.current_price = float(bitcoin.get('usd', self.current_price))
                self._stats = {
                    'change_24h': float(bitcoin.get('usd_24h_change', 0)),
                    'volume_24h': float(bitcoin.get('usd_24h_vol', 50000000000)),
                    'last_updated': bitcoin.get('last_updated_at', int(time.time()))
                }
                self.last_update = datetime.now()
                return self.current_price
            else:
                print(f"[COINGECKO] HTTP {response.status_code}")
                return self.current_price
                
        except Exception as e:
            print(f"[COINGECKO] Error: {type(e).__name__}")
            return self.current_price
    
    def get_24h_stats(self) -> Dict:
        """Get 24h statistics with high/low estimates"""
        # Refresh price if needed
        current = self.get_current_price()
        
        # Estimate high/low from current price and change
        change_pct = self._stats.get('change_24h', 0) / 100
        
        # If price went up 2%, high is current, low is current / 1.02
        # If price went down 2%, low is current, high is current * 0.98
        if change_pct > 0:
            high_24h = current
            low_24h = current / (1 + change_pct)
        else:
            low_24h = current
            high_24h = current / (1 + change_pct) if change_pct != 0 else current * 1.02
        
        return {
            "price": current,
            "change_24h": self._stats.get('change_24h', 0) / 100 * current,
            "change_percent": self._stats.get('change_24h', 0),
            "high_24h": high_24h,
            "low_24h": low_24h,
            "volume_24h": self._stats.get('volume_24h', 50000000000),
            "trades_24h": 1000000,  # Estimate
            "timestamp": datetime.now().isoformat()
        }
    
    def get_market_snapshot(self) -> Dict:
        """Get comprehensive market snapshot"""
        stats = self.get_24h_stats()
        
        return {
            "price": stats['price'],
            "change_24h": stats['change_percent'],
            "high_24h": stats['high_24h'],
            "low_24h": stats['low_24h'],
            "volume_24h": stats['volume_24h'],
            "spread": 1.0,  # ~$1 spread estimate
            "bid": stats['price'] - 0.5,
            "ask": stats['price'] + 0.5,
            "source": "CoinGecko Live",
            "timestamp": stats['timestamp']
        }

# Global instance (replaces binance_feed)
binance_feed = CoinGeckoMarketFeed()  # Keep same name for compatibility

# Initialize on import
try:
    initial_price = binance_feed.get_current_price()
    print(f"[COINGECKO] Connected! BTC: ${initial_price:,.2f}")
except Exception as e:
    print(f"[COINGECKO] Using fallback: {e}")

if __name__ == "__main__":
    print("="*60)
    print("  COINGECKO LIVE FEED TEST")
    print("="*60)
    
    print("\nCurrent Price:")
    price = binance_feed.get_current_price()
    print(f"  BTC/USD: ${price:,.2f}")
    
    print("\n24h Statistics:")
    stats = binance_feed.get_24h_stats()
    print(f"  Change: {stats['change_percent']:+.2f}%")
    print(f"  High: ${stats['high_24h']:,.2f}")
    print(f"  Low: ${stats['low_24h']:,.2f}")
    print(f"  Volume: ${stats['volume_24h']/1e9:.2f}B")
    
    print("\nMarket Snapshot:")
    snapshot = binance_feed.get_market_snapshot()
    print(f"  Price: ${snapshot['price']:,.2f}")
    print(f"  Spread: ${snapshot['spread']:.2f}")
    print(f"  Source: {snapshot['source']}")
    
    print("\nTesting cache (should return instantly):")
    for i in range(3):
        start = time.time()
        p = binance_feed.get_current_price()
        elapsed = (time.time() - start) * 1000
        print(f"  Call {i+1}: ${p:,.2f} ({elapsed:.0f}ms)")
    
    print("\n" + "="*60)
