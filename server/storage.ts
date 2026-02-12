import { db } from "./db";
import { users, trackedTokens, tokenSnapshots, userWatchlists } from "@shared/schema";
import type { 
  User,
  InsertUser,
  TrackedToken, 
  InsertTrackedToken, 
  TokenSnapshot, 
  InsertTokenSnapshot,
  UserWatchlist,
  InsertUserWatchlist 
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management (keeping existing interface)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Token management
  getTrackedToken(contractAddress: string): Promise<TrackedToken | undefined>;
  createTrackedToken(token: InsertTrackedToken): Promise<TrackedToken>;
  updateTrackedToken(id: number, updates: Partial<InsertTrackedToken>): Promise<TrackedToken | undefined>;
  getAllTrackedTokens(): Promise<TrackedToken[]>;
  
  // Token snapshots for historical data
  createTokenSnapshot(snapshot: InsertTokenSnapshot): Promise<TokenSnapshot>;
  getTokenSnapshots(tokenId: number, limit?: number): Promise<TokenSnapshot[]>;
  
  // User watchlists
  getUserWatchlist(userAddress: string): Promise<UserWatchlist[]>;
  addToWatchlist(watchlist: InsertUserWatchlist): Promise<UserWatchlist>;
  removeFromWatchlist(userAddress: string, tokenId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods (existing interface)
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not available");
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, id })
      .returning();
    return user;
  }

  // Token methods
  async getTrackedToken(contractAddress: string): Promise<TrackedToken | undefined> {
    if (!db) return undefined;
    const [token] = await db
      .select()
      .from(trackedTokens)
      .where(eq(trackedTokens.contractAddress, contractAddress));
    return token || undefined;
  }

  async createTrackedToken(token: InsertTrackedToken): Promise<TrackedToken> {
    if (!db) throw new Error("Database not available");
    const [newToken] = await db
      .insert(trackedTokens)
      .values(token)
      .returning();
    return newToken;
  }

  async updateTrackedToken(id: number, updates: Partial<InsertTrackedToken>): Promise<TrackedToken | undefined> {
    if (!db) return undefined;
    const [updatedToken] = await db
      .update(trackedTokens)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trackedTokens.id, id))
      .returning();
    return updatedToken || undefined;
  }

  async getAllTrackedTokens(): Promise<TrackedToken[]> {
    if (!db) return [];
    return await db
      .select()
      .from(trackedTokens)
      .where(eq(trackedTokens.isActive, true));
  }

  async createTokenSnapshot(snapshot: InsertTokenSnapshot): Promise<TokenSnapshot> {
    if (!db) throw new Error("Database not available");
    const [newSnapshot] = await db
      .insert(tokenSnapshots)
      .values(snapshot)
      .returning();
    return newSnapshot;
  }

  async getTokenSnapshots(tokenId: number, limit: number = 100): Promise<TokenSnapshot[]> {
    if (!db) return [];
    return await db
      .select()
      .from(tokenSnapshots)
      .where(eq(tokenSnapshots.tokenId, tokenId))
      .orderBy(desc(tokenSnapshots.createdAt))
      .limit(limit);
  }

  async getUserWatchlist(userAddress: string): Promise<UserWatchlist[]> {
    if (!db) return [];
    return await db
      .select()
      .from(userWatchlists)
      .where(eq(userWatchlists.userAddress, userAddress));
  }

  async addToWatchlist(watchlist: InsertUserWatchlist): Promise<UserWatchlist> {
    if (!db) throw new Error("Database not available");
    const [newWatchlist] = await db
      .insert(userWatchlists)
      .values(watchlist)
      .returning();
    return newWatchlist;
  }

  async removeFromWatchlist(userAddress: string, tokenId: number): Promise<boolean> {
    if (!db) return false;
    const result = await db
      .delete(userWatchlists)
      .where(
        and(
          eq(userWatchlists.userAddress, userAddress),
          eq(userWatchlists.tokenId, tokenId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();