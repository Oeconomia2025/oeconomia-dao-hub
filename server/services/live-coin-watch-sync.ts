import { db } from "../db";
import { liveCoinWatchCoins, type InsertLiveCoinWatchCoin } from "@shared/schema";
import { liveCoinWatchApiService } from "./live-coin-watch-api";
import { eq, desc } from "drizzle-orm";

class LiveCoinWatchSyncService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30 * 1000; // 30 seconds

  async start() {
    console.log('🚫 Live Coin Watch sync service DISABLED - no usage consumption');
    console.log('📊 App will serve data from database cache only');
    return;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Live Coin Watch sync service stopped');
  }

  private async syncData(): Promise<void> {
    console.log('🚫 Sync disabled - no API calls or usage consumption');
    return;
  }

  async getStoredCoins() {
    try {
      if (!db) return [];
      const result = await db.select().from(liveCoinWatchCoins);
      // Sort by market cap in descending order (highest first)
      return result.sort((a, b) => (b.cap || 0) - (a.cap || 0));
    } catch (error) {
      console.error('Error fetching stored coins:', error);
      return [];
    }
  }

  isServiceRunning() {
    return this.isRunning;
  }
}

export const liveCoinWatchSyncService = new LiveCoinWatchSyncService();