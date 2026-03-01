/**
 * TradingSessionManager — singleton that lives OUTSIDE React.
 *
 * Problem: React components mount/unmount/re-render. Each mount was
 * creating a new setInterval, leading to 6+ simultaneous trading loops
 * for the same session.
 *
 * Solution: One global Map of sessionId → interval. The component just
 * calls start/stop on this manager. No intervals inside React at all.
 */

type StatsCallback = (stats: {
  win_rate: number;
  trades: number;
  profit: number;
  balance: number;
}) => void;

class TradingSessionManager {
  private intervals  = new Map<string, NodeJS.Timeout>();
  private callbacks  = new Map<string, StatsCallback>();
  private active     = new Set<string>();

  isRunning(sessionId: string): boolean {
    return this.active.has(sessionId);
  }

  start(sessionId: string, onStats: StatsCallback, confidence = 0.5) {
    // Guard: never start the same session twice
    if (this.intervals.has(sessionId)) {
      console.log(`[TradingManager] ${sessionId} already running — skipping duplicate start`);
      // Update callback in case component remounted
      this.callbacks.set(sessionId, onStats);
      return;
    }

    console.log(`[TradingManager] Starting: ${sessionId}`);
    this.active.add(sessionId);
    this.callbacks.set(sessionId, onStats);

    const tick = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/trading/auto/${sessionId}?confidence=${confidence}`,
          { method: 'POST' }
        );
        const result = await response.json();

        if (result.success && result.stats) {
          const cb = this.callbacks.get(sessionId);
          if (cb) cb(result.stats);
        }
      } catch (err) {
        // Backend unreachable — don't crash, just skip this tick
      }
    };

    // Fire immediately then every 3s
    tick();
    const interval = setInterval(tick, 3000);
    this.intervals.set(sessionId, interval);
  }

  stop(sessionId: string) {
    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
    }
    this.active.delete(sessionId);
    this.callbacks.delete(sessionId);
    console.log(`[TradingManager] Stopped: ${sessionId}`);
  }

  updateCallback(sessionId: string, onStats: StatsCallback) {
    if (this.active.has(sessionId)) {
      this.callbacks.set(sessionId, onStats);
    }
  }

  stopAll() {
    for (const id of this.intervals.keys()) {
      this.stop(id);
    }
  }
}

// Singleton — one instance for the entire app lifetime
export const tradingManager = new TradingSessionManager();