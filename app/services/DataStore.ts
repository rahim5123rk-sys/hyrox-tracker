import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

// --- 1. TYPE SAFETY HARDENING ---

// A. MAGIC STRINGS ELIMINATED
// We define these ONCE. Every other file must reference this object.
export const METRICS = {
    RUN_PACE: 'runPace',
    SKI_ERG: 'skiErg',
    SLED_PUSH: 'sledPush',
    SLED_PULL: 'sledPull',
    BURPEES: 'burpees',
    ROWING: 'rowing',
    FARMERS: 'farmers',
    LUNGES: 'lunges',
    WALL_BALLS: 'wallBalls',
    ROXZONE: 'roxzone',
    FATIGUE: 'fatigueIndex',
    HR: 'avgHr',
    RPE: 'rpe'
} as const;

export type MetricKey = typeof METRICS[keyof typeof METRICS];

// B. STRICT INTERFACES (No more 'any')
export interface WorkoutSplit {
    name: string;
    actual: number; // Seconds
    target: number; // Seconds
    delta?: number;
    time?: number; // Legacy support
}

export interface WorkoutDetails {
    distance?: string; 
    weight?: string;   
    reps?: string;     
    rpe?: number;      
    hrAvg?: number;
    note?: string;
    subCategory?: string; 
}

export interface LogEntry {
  id: string;
  date: string;         
  timestamp: number;    
  type: string;         
  title: string;
  totalTime: string;    
  totalSeconds: number; 
  sessionType?: string; 
  splits?: WorkoutSplit[];       // Typed!
  details?: WorkoutDetails;      // Typed!
}

export interface AnalyticsProfile {
  totalOps: number;
  totalRunDistance: number;
  totalTonnage: number;       
  consistencyScore: number;   
  trends: Record<MetricKey, number[]>; // Enforced Keys
  recency: Record<MetricKey, number>;  // Enforced Keys
  records: {
    best5k: string;
    bestSledPush: number;
    bestRoxzone: number;
  };
}

const KEY_HISTORY_LEGACY = 'raceHistory';
const KEY_ANALYTICS = 'user_analytics_engine';
const DB_NAME = 'hyrox_data.db';

export const DataStore = {
  db: null as any,

  // --- 0. INITIALIZATION & MIGRATION ---
  async _getDb() {
    if (this.db) return this.db;
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        timestamp INTEGER,
        date TEXT,
        type TEXT,
        title TEXT,
        totalTime TEXT,
        totalSeconds INTEGER,
        sessionType TEXT,
        splits TEXT,
        details TEXT
      );
    `);

    const legacyData = await AsyncStorage.getItem(KEY_HISTORY_LEGACY);
    if (legacyData) {
      try {
        const history: LogEntry[] = JSON.parse(legacyData);
        if (history.length > 0) {
           await this.db.withTransactionAsync(async () => {
              for (const log of history) {
                  await this.db.runAsync(
                      `INSERT OR REPLACE INTO logs (id, timestamp, date, type, title, totalTime, totalSeconds, sessionType, splits, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [log.id, log.timestamp, log.date, log.type, log.title, log.totalTime, log.totalSeconds, log.sessionType || '', JSON.stringify(log.splits || []), JSON.stringify(log.details || {})]
                  );
              }
           });
        }
        await AsyncStorage.removeItem(KEY_HISTORY_LEGACY);
      } catch (e) { console.error("Migration Failed:", e); }
    }
    return this.db;
  },

  // --- 1. WRITE ---
  async logEvent(entry: any) {
    try {
      const db = await this._getDb();
      const newLog: LogEntry = {
        ...entry,
        id: entry.id || Date.now().toString(),
        timestamp: entry.timestamp || Date.now(),
        totalSeconds: entry.totalSeconds || this._timeToSeconds(entry.totalTime)
      };

      await db.runAsync(
        `INSERT INTO logs (id, timestamp, date, type, title, totalTime, totalSeconds, sessionType, splits, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newLog.id, newLog.timestamp, newLog.date, newLog.type, newLog.title, newLog.totalTime, newLog.totalSeconds, newLog.sessionType || '', JSON.stringify(newLog.splits || []), JSON.stringify(newLog.details || {})]
      );

      const fullHistory = await this.getHistory(); 
      const analytics = this._calculateAnalytics(fullHistory);
      await AsyncStorage.setItem(KEY_ANALYTICS, JSON.stringify(analytics));
      return true;
    } catch (e) {
      console.error("DataStore Save Error", e);
      return false;
    }
  },

  // --- 2. READ ---
  async getFullDossier() {
     const history = await this.getHistory();
     const analytics = await this.getAnalytics();
     return { history, analytics };
  },

  async getHistory(): Promise<LogEntry[]> {
    try {
      const db = await this._getDb();
      const result = await db.getAllAsync('SELECT * FROM logs ORDER BY timestamp DESC');
      return result.map((row: any) => ({
          ...row,
          splits: row.splits ? JSON.parse(row.splits) : [],
          details: row.details ? JSON.parse(row.details) : {}
      }));
    } catch (e) { return []; }
  },

  async getAnalytics(): Promise<AnalyticsProfile> {
    try {
      const json = await AsyncStorage.getItem(KEY_ANALYTICS);
      return json ? JSON.parse(json) : this._getEmptyAnalytics();
    } catch (e) { return this._getEmptyAnalytics(); }
  },

  async clearAll() {
    try {
        const db = await this._getDb();
        await db.runAsync('DELETE FROM logs');
        await AsyncStorage.multiRemove([KEY_HISTORY_LEGACY, KEY_ANALYTICS, 'user_profile', 'userCategory', 'user_pbs']);
    } catch (e) { console.error(e); }
  },

  // --- ANALYTICS ENGINE V7.2 (STRICT TYPES) ---
  _calculateAnalytics(history: LogEntry[]): AnalyticsProfile {
    const stats = this._getEmptyAnalytics();
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

    stats.totalOps = sortedHistory.length;
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    let workoutsLast7Days = 0;

    const markRecency = (key: MetricKey, timestamp: number) => {
        if (stats.recency[key] === 0) stats.recency[key] = timestamp;
    };

    sortedHistory.forEach(log => {
        // A. CONSISTENCY
        if (now - log.timestamp < oneWeekMs) workoutsLast7Days++;

        // B. VOLUME
        if (log.type === 'SIMULATION') {
            stats.totalRunDistance += 8;
            stats.totalTonnage += (152 * 50) + (103 * 50) + (20 * 100) + (48 * 200);
        } else if (log.type === 'RUN' && log.details?.distance) {
            stats.totalRunDistance += parseFloat(log.details.distance) || 0;
        }
        
        // C. PHYSIOLOGY
        if (log.details?.hrAvg) stats.trends[METRICS.HR].push(log.details.hrAvg);
        if (log.details?.rpe) stats.trends[METRICS.RPE].push(log.details.rpe);

        // D. SPLIT MINING
        const splits = log.splits; 
        if (splits && Array.isArray(splits)) {
             const find = (key: string) => {
                 const s = splits.find((x: any) => x.name.toUpperCase().includes(key));
                 if (!s) return null;
                 let val: number | undefined | null = s.actual;
                 if (val === undefined || val === null) val = s.time; // Legacy check
                 return (typeof val === 'number' && val > 0) ? val : null;
             };

             // 1. RUNNING (Using Constants)
             const r1 = find('1KM') || find('RUN 1') || find('RUN 1 (');
             if (r1) { 
                 stats.trends[METRICS.RUN_PACE].push(r1); 
                 markRecency(METRICS.RUN_PACE, log.timestamp); 
             }

             // 2. STATIONS (Using Constants)
             const ski = find('SKI'); if(ski) { stats.trends[METRICS.SKI_ERG].push(ski); markRecency(METRICS.SKI_ERG, log.timestamp); }
             const push = find('PUSH'); if(push) { stats.trends[METRICS.SLED_PUSH].push(push); markRecency(METRICS.SLED_PUSH, log.timestamp); }
             const pull = find('PULL'); if(pull) { stats.trends[METRICS.SLED_PULL].push(pull); markRecency(METRICS.SLED_PULL, log.timestamp); }
             const burp = find('BURPEE'); if(burp) { stats.trends[METRICS.BURPEES].push(burp); markRecency(METRICS.BURPEES, log.timestamp); }
             const row = find('ROW'); if(row) { stats.trends[METRICS.ROWING].push(row); markRecency(METRICS.ROWING, log.timestamp); }
             const farm = find('FARM'); if(farm) { stats.trends[METRICS.FARMERS].push(farm); markRecency(METRICS.FARMERS, log.timestamp); }
             const lung = find('LUNG'); if(lung) { stats.trends[METRICS.LUNGES].push(lung); markRecency(METRICS.LUNGES, log.timestamp); }
             const wall = find('WALL'); if(wall) { stats.trends[METRICS.WALL_BALLS].push(wall); markRecency(METRICS.WALL_BALLS, log.timestamp); }
             
             // 3. TRANSITION
             const rox = find('ROXZONE'); if(rox) { stats.trends[METRICS.ROXZONE].push(rox); markRecency(METRICS.ROXZONE, log.timestamp); }

             // 4. FATIGUE
             const runs = splits.filter((s:any) => s.name.toUpperCase().includes('RUN'));
             if (runs.length >= 2) {
                 const getVal = (s: any) => (typeof s.actual === 'number' ? s.actual : s.time) || 0;
                 const first = getVal(runs[0]);
                 const last = getVal(runs[runs.length - 1]);
                 if (first > 0 && last > 0) {
                     const degradation = ((last - first) / first) * 100;
                     stats.trends[METRICS.FATIGUE].push(degradation);
                 }
             }
        }
    });

    stats.consistencyScore = Math.min(100, Math.round((workoutsLast7Days / 4) * 100));
    const process = (arr: number[]) => arr.slice(0, 10).reverse();
    
    // Strict Typed Loop
    (Object.keys(stats.trends) as MetricKey[]).forEach(key => {
        stats.trends[key] = process(stats.trends[key]);
    });

    return stats;
  },

  _getEmptyAnalytics(): AnalyticsProfile {
      // Helper to create the object with all Metric Keys
      const trends = {} as Record<MetricKey, number[]>;
      const recency = {} as Record<MetricKey, number>;
      Object.values(METRICS).forEach(k => { trends[k] = []; recency[k] = 0; });

      return {
          totalOps: 0, totalRunDistance: 0, totalTonnage: 0, consistencyScore: 0,
          trends,
          recency,
          records: { best5k: '--:--', bestSledPush: 0, bestRoxzone: 0 }
      };
  },

  _timeToSeconds(timeStr: string) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }
};