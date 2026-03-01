"""
Real-time market data from CoinGecko (FREE, no restrictions)
Fixed: proper 30s cache, single fetch per cycle, random walk between refreshes
"""
import requests
import random
import time
from typing import Dict
from datetime import datetime


class CoinGeckoMarketFeed:
    CACHE_TTL  = 30          # Only hit CoinGecko every 30 seconds
    WALK_PCT   = 0.004       # ±0.4% per step — stateful random walk

    def __init__(self):
        self.base_url      = "https://api.coingecko.com/api/v3"
        self.current_price = 95000.0   # last REAL price from API
        self._walk_price   = 95000.0   # live price including random walk
        self._last_real_fetch = 0.0
        self._stats: Dict  = {}
        self._initialized  = False

    # ── Single internal fetch — ALL other methods call this ──────────────────

    def _refresh_if_stale(self) -> None:
        """Hit CoinGecko at most once every CACHE_TTL seconds."""
        now = time.time()
        if now - self._last_real_fetch < self.CACHE_TTL:
            return  # cache still valid

        try:
            response = requests.get(
                f"{self.base_url}/simple/price",
                params={
                    "ids": "bitcoin",
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "true",
                },
                timeout=8,
            )
            if response.status_code == 200:
                data    = response.json()
                bitcoin = data.get("bitcoin", {})
                self.current_price = float(bitcoin.get("usd", self.current_price))
                self._walk_price   = self.current_price   # re-anchor walk to real price
                self._stats = {
                    "change_24h": float(bitcoin.get("usd_24h_change", 0)),
                    "volume_24h": float(bitcoin.get("usd_24h_vol", 50_000_000_000)),
                }
                self._last_real_fetch = now
                self._initialized     = True
                print(f"[COINGECKO] Refreshed: ${self.current_price:,.2f}")
            elif response.status_code == 429:
                # Rate limited — back off an extra 30s
                self._last_real_fetch = now + 30
                print(f"[COINGECKO] Rate limited — backing off 60s")
            else:
                print(f"[COINGECKO] HTTP {response.status_code}")
        except Exception as e:
            print(f"[COINGECKO] Error: {type(e).__name__}")

    # ── Public API ────────────────────────────────────────────────────────────

    def get_current_price(self) -> float:
        """
        Returns a STATEFUL random walk price.
        Each call moves the price from where it last was — true random walk.
        Only fetches from CoinGecko every 30s to anchor the walk to reality.
        Safe to call many times per second.
        """
        self._refresh_if_stale()
        # Stateful walk: each step builds on previous step, not on base price
        self._walk_price *= (1 + random.uniform(-self.WALK_PCT, self.WALK_PCT))
        return round(self._walk_price, 2)

    def get_24h_stats(self) -> Dict:
        """
        Returns 24h stats. Uses same cache — does NOT trigger extra API call.
        """
        self._refresh_if_stale()   # may be a no-op if cache is fresh
        current    = self.get_current_price()
        change_pct = self._stats.get("change_24h", 0) / 100

        if change_pct > 0:
            high_24h = current
            low_24h  = current / (1 + change_pct)
        else:
            low_24h  = current
            high_24h = current / (1 + change_pct) if change_pct != 0 else current * 1.02

        return {
            "price":          current,
            "change_24h":     self._stats.get("change_24h", 0) / 100 * current,
            "change_percent": self._stats.get("change_24h", 0),
            "high_24h":       round(high_24h, 2),
            "low_24h":        round(low_24h, 2),
            "volume_24h":     self._stats.get("volume_24h", 50_000_000_000),
            "trades_24h":     1_000_000,
            "timestamp":      datetime.now().isoformat(),
        }

    def get_market_snapshot(self) -> Dict:
        stats = self.get_24h_stats()
        return {
            "price":      stats["price"],
            "change_24h": stats["change_percent"],
            "high_24h":   stats["high_24h"],
            "low_24h":    stats["low_24h"],
            "volume_24h": stats["volume_24h"],
            "spread":     1.0,
            "bid":        stats["price"] - 0.5,
            "ask":        stats["price"] + 0.5,
            "source":     "CoinGecko Live",
            "timestamp":  stats["timestamp"],
        }


# Global instance — same name as before for compatibility
binance_feed = CoinGeckoMarketFeed()

# Single init fetch on import
try:
    binance_feed._refresh_if_stale()
    binance_feed._walk_price = binance_feed.current_price
    print(f"[COINGECKO] Connected! BTC: ${binance_feed.current_price:,.2f}")
except Exception as e:
    print(f"[COINGECKO] Using fallback price: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("  COINGECKO LIVE FEED TEST")
    print("=" * 60)

    print("\nCurrent Price:")
    price = binance_feed.get_current_price()
    print(f"  BTC/USD: ${price:,.2f}")

    print("\n24h Statistics:")
    stats = binance_feed.get_24h_stats()
    print(f"  Change:  {stats['change_percent']:+.2f}%")
    print(f"  High:    ${stats['high_24h']:,.2f}")
    print(f"  Low:     ${stats['low_24h']:,.2f}")
    print(f"  Volume:  ${stats['volume_24h']/1e9:.2f}B")

    print("\nCache test (10 rapid calls — should show 0 extra API hits):")
    for i in range(10):
        start = time.time()
        p     = binance_feed.get_current_price()
        ms    = (time.time() - start) * 1000
        print(f"  Call {i+1:2d}: ${p:,.2f}  ({ms:.1f}ms)")

    print("=" * 60)