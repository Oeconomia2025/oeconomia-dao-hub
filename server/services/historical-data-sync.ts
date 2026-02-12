import { liveCoinWatchApiService } from './live-coin-watch-api';
import { db } from '../db';
import { priceHistoryData, type InsertPriceHistoryData } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

class HistoricalDataSyncService {
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // Contract address mappings for tokens
  private readonly TOKEN_CONTRACTS: Record<string, string> = {
    ETH: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    BTC: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  };

  async start() {
    console.log('🚫 ETH Historical sync DISABLED - simulating Replit usage exhaustion');
    console.log('⛽ No ETH data updates - using database cache only');
    return;
  }

  async stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Historical data sync service stopped');
  }

  private async syncETHHistoricalData() {
    try {
      console.log('Fetching ETH historical data...');
      const now = Date.now();
      
      // Define timeframes with their intervals and durations
      const timeframes = [
        { key: '1H', intervalMs: 5 * 60 * 1000, durationMs: 60 * 60 * 1000 }, // 5-min intervals for 1 hour
        { key: '1D', intervalMs: 60 * 60 * 1000, durationMs: 24 * 60 * 60 * 1000 }, // 1-hour intervals for 24 hours
        { key: '7D', intervalMs: 6 * 60 * 60 * 1000, durationMs: 7 * 24 * 60 * 60 * 1000 }, // 6-hour intervals for 7 days
        { key: '30D', intervalMs: 24 * 60 * 60 * 1000, durationMs: 30 * 24 * 60 * 60 * 1000 }, // 1-day intervals for 30 days
      ];

      for (const timeframe of timeframes) {
        await this.syncTimeframeData('ETH', timeframe.key, timeframe.intervalMs, timeframe.durationMs, now);
        
        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('Successfully synced ETH historical data for all timeframes');
    } catch (error) {
      console.error('Error syncing ETH historical data:', error);
    }
  }

  private async syncTimeframeData(
    tokenCode: string, 
    timeframe: string, 
    intervalMs: number, 
    durationMs: number, 
    endTime: number
  ) {
    try {
      const startTime = endTime - durationMs;
      
      // Get the latest data point for this timeframe to avoid duplicates
      const latestRecord = await db
        .select()
        .from(priceHistoryData)
        .where(and(
          eq(priceHistoryData.tokenCode, tokenCode),
          eq(priceHistoryData.timeframe, timeframe)
        ))
        .orderBy(desc(priceHistoryData.timestamp))
        .limit(1);

      const lastSyncTime = latestRecord.length > 0 ? latestRecord[0].timestamp : startTime;
      
      // Only fetch new data if we need updates
      if (endTime - lastSyncTime < intervalMs) {
        console.log(`${tokenCode} ${timeframe} data is up to date`);
        return;
      }

      // Fetch historical data from Live Coin Watch
      const historicalData = await liveCoinWatchApiService.getHistoricalData(
        tokenCode,
        Math.max(lastSyncTime, startTime),
        endTime
      );

      if (!historicalData || !historicalData.history) {
        console.warn(`No historical data received for ${tokenCode} ${timeframe}`);
        return;
      }

      // Process and insert data points
      const dataPoints: InsertPriceHistoryData[] = [];
      const contractAddress = this.TOKEN_CONTRACTS[tokenCode] || '';

      for (const point of historicalData.history) {
        // Ensure we don't duplicate existing data
        const timestamp = point.date;
        if (timestamp <= lastSyncTime) continue;

        dataPoints.push({
          tokenCode,
          contractAddress,
          timestamp,
          price: point.rate || 0,
          volume: point.volume || 0,
          marketCap: point.cap || 0,
          timeframe,
        });
      }

      if (dataPoints.length > 0) {
        await db.insert(priceHistoryData).values(dataPoints);
        console.log(`Inserted ${dataPoints.length} new ${tokenCode} ${timeframe} data points`);
      } else {
        console.log(`No new ${tokenCode} ${timeframe} data points to insert`);
      }

    } catch (error) {
      console.error(`Error syncing ${tokenCode} ${timeframe} data:`, error);
    }
  }

  async getHistoricalData(tokenCode: string, timeframe: string, limit: number = 100): Promise<any[]> {
    try {
      if (!db) return [];
      const records = await db
        .select()
        .from(priceHistoryData)
        .where(and(
          eq(priceHistoryData.tokenCode, tokenCode),
          eq(priceHistoryData.timeframe, timeframe)
        ))
        .orderBy(desc(priceHistoryData.timestamp))
        .limit(limit);

      // Transform to match PriceHistory interface
      return records.map(record => ({
        timestamp: record.timestamp,
        price: record.price,
      })).reverse(); // Reverse to get chronological order

    } catch (error) {
      console.error(`Error fetching ${tokenCode} ${timeframe} historical data:`, error);
      return [];
    }
  }

  async getHistoricalDataByContract(contractAddress: string, timeframe: string, limit: number = 100): Promise<any[]> {
    try {
      if (!db) return [];
      const records = await db
        .select()
        .from(priceHistoryData)
        .where(and(
          eq(priceHistoryData.contractAddress, contractAddress),
          eq(priceHistoryData.timeframe, timeframe)
        ))
        .orderBy(desc(priceHistoryData.timestamp))
        .limit(limit);

      return records.map(record => ({
        timestamp: record.timestamp,
        price: record.price,
      })).reverse();

    } catch (error) {
      console.error(`Error fetching historical data for contract ${contractAddress}:`, error);
      return [];
    }
  }
}

export const historicalDataSyncService = new HistoricalDataSyncService();