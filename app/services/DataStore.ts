import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

// --- 1. CONSTANTS & TYPES ---

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

export interface WorkoutSplit {
    name: string;
    actual: number; 
    target: number; 
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
  splits?: WorkoutSplit[];       
  details?: WorkoutDetails;      
}

export interface UserProfile {
    name: string;
    category: string;
    level: string;
    targetTime: string;
    athleteType: string;
    joined: string;
}

export interface AnalyticsProfile {
  totalOps: number;
  totalRunDistance: number;
  totalTonnage: number;       
  consistencyScore: number;   
  trends: Record<MetricKey, number[]>; 
  recency: Record<MetricKey, number>;  
  records: { best5k: string; bestSledPush: number; bestRoxzone: number; };
}

// --- 2. DATABASE CONFIG ---
const DB_NAME = 'hyrox_data_v2.db'; 
const KEY_ANALYTICS = 'user_analytics_engine';

export const DataStore = {
  db: null as any,

  // --- 3. INITIALIZATION & MIGRATIONS ---
  async _getDb() {
    if (this.db) return this.db;
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // A. Define Schema
    await this.db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        timestamp INTEGER,
        date TEXT,
        type TEXT,
        title TEXT,
        total_time_str TEXT,
        total_seconds INTEGER,
        session_type TEXT,
        distance_km REAL,
        weight_kg REAL,
        reps INTEGER,
        rpe INTEGER,
        hr_avg INTEGER,
        notes TEXT,
        details_json TEXT 
      );

      CREATE TABLE IF NOT EXISTS splits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id TEXT,
        station_name TEXT,
        actual_seconds INTEGER,
        target_seconds INTEGER,
        FOREIGN KEY(log_id) REFERENCES logs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY DEFAULT 'main',
          name TEXT,
          category TEXT,
          level TEXT,
          target_time TEXT,
          athlete_type TEXT,
          joined_date TEXT
      );

      -- [NEW] SMART MEMORY TABLE
      CREATE TABLE IF NOT EXISTS station_defaults (
          station_id TEXT PRIMARY KEY,
          last_weight TEXT,
          last_reps TEXT,
          updated_at INTEGER
      );
    `);

    // B. Check Migrations
    const logCount = await this.db.getAllAsync('SELECT count(*) as c FROM logs');
    if (logCount[0].c === 0) await this._migrateFromLegacy();

    const profileCount = await this.db.getAllAsync('SELECT count(*) as c FROM user_profile');
    if (profileCount[0].c === 0) await this._migrateProfile();

    return this.db;
  },

  async _migrateFromLegacy() {
      const legacyKey = 'raceHistory'; 
      const json = await AsyncStorage.getItem(legacyKey);
      if (json) {
          try {
              const history: LogEntry[] = JSON.parse(json);
              for (const log of history) { await this.logEvent(log); }
          } catch (e) { console.error("Log Migration Failed", e); }
      }
  },

  async _migrateProfile() {
      try {
          const json = await AsyncStorage.getItem('user_profile');
          const cat = await AsyncStorage.getItem('userCategory');
          
          if (json) {
              const p = JSON.parse(json);
              const profile: UserProfile = {
                  name: p.name || 'Athlete',
                  category: cat || 'MEN_OPEN',
                  level: p.level || 'INTERMEDIATE',
                  targetTime: p.targetTime || '90',
                  athleteType: p.athleteType || 'BALANCED',
                  joined: p.joined || new Date().toISOString()
              };
              await this.saveUserProfile(profile);
          }
      } catch (e) { console.error("Profile Migration Error", e); }
  },

  // --- 4. SMART DEFAULTS (NEW) ---
  
  async getStationDefault(stationId: string) {
      try {
          const db = await this._getDb();
          const res = await db.getAllAsync('SELECT * FROM station_defaults WHERE station_id = ?', [stationId]);
          if (res.length > 0) return res[0];
          return null;
      } catch (e) { return null; }
  },

  async saveStationDefault(stationId: string, weight: string, reps: string) {
      try {
          const db = await this._getDb();
          await db.runAsync(`
            INSERT OR REPLACE INTO station_defaults (station_id, last_weight, last_reps, updated_at)
            VALUES (?, ?, ?, ?)
          `, [stationId, weight, reps, Date.now()]);
      } catch (e) { console.error("Failed to save default", e); }
  },

  // --- 5. WRITE OPERATIONS ---
  async logEvent(entry: any) {
    try {
      const db = await this._getDb();
      
      const newLog: LogEntry = {
        ...entry,
        id: entry.id || Date.now().toString(),
        timestamp: entry.timestamp || Date.now(),
        totalSeconds: entry.totalSeconds || this._timeToSeconds(entry.totalTime)
      };

      const d = newLog.details || {};
      const distance = parseFloat(d.distance || '0');
      const weight = parseFloat(d.weight || '0');
      const reps = parseInt(d.reps || '0');
      const rpe = d.rpe || 0;
      const hr = d.hrAvg || 0;

      await db.withTransactionAsync(async () => {
          await db.runAsync(
            `INSERT OR REPLACE INTO logs (
                id, timestamp, date, type, title, total_time_str, total_seconds, session_type,
                distance_km, weight_kg, reps, rpe, hr_avg, notes, details_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newLog.id, newLog.timestamp, newLog.date, newLog.type, newLog.title, 
                newLog.totalTime, newLog.totalSeconds, newLog.sessionType || '',
                distance, weight, reps, rpe, hr, d.note || '', JSON.stringify(d)
            ]
          );

          if (newLog.splits && newLog.splits.length > 0) {
              await db.runAsync('DELETE FROM splits WHERE log_id = ?', [newLog.id]);
              for (const s of newLog.splits) {
                  const actual = (s.actual !== undefined) ? s.actual : (s.time || 0);
                  await db.runAsync(
                      `INSERT INTO splits (log_id, station_name, actual_seconds, target_seconds) VALUES (?, ?, ?, ?)`,
                      [newLog.id, s.name, actual, s.target || 0]
                  );
              }
          }
      });

      // [NEW] UPDATE SMART DEFAULTS IF RELEVANT
      // If this was a workout with a known station/title, save the weight
      if (entry.details?.weight && parseFloat(entry.details.weight) > 0) {
          // Use title or station as key (e.g., "SLED PUSH POWER")
          const key = entry.title ? entry.title.toUpperCase() : 'UNKNOWN';
          await this.saveStationDefault(key, entry.details.weight, entry.details.reps || '0');
      }

      this._refreshAnalytics(); 
      return true;
    } catch (e) {
      console.error("DataStore Write Error", e);
      return false;
    }
  },

  async saveUserProfile(p: UserProfile) {
      const db = await this._getDb();
      await db.runAsync(`
        INSERT OR REPLACE INTO user_profile (id, name, category, level, target_time, athlete_type, joined_date)
        VALUES ('main', ?, ?, ?, ?, ?, ?)
      `, [p.name, p.category, p.level, p.targetTime, p.athleteType, p.joined]);
      
      await AsyncStorage.setItem('user_profile', JSON.stringify({
          name: p.name, level: p.level, targetTime: p.targetTime, 
          athleteType: p.athleteType, joined: p.joined, targetRace: null 
      }));
      await AsyncStorage.setItem('userCategory', p.category);
  },

  // --- 6. READ OPERATIONS ---
  async getFullDossier() {
     const history = await this.getHistory();
     const analytics = await this.getAnalytics();
     return { history, analytics };
  },

  async getHistory(): Promise<LogEntry[]> {
    try {
      const db = await this._getDb();
      const logs = await db.getAllAsync('SELECT * FROM logs ORDER BY timestamp DESC');
      if (logs.length === 0) return [];

      const splits = await db.getAllAsync('SELECT * FROM splits');
      const splitsMap = new Map<string, WorkoutSplit[]>();
      
      splits.forEach((s: any) => {
          const arr = splitsMap.get(s.log_id) || [];
          arr.push({ name: s.station_name, actual: s.actual_seconds, target: s.target_seconds });
          splitsMap.set(s.log_id, arr);
      });

      return logs.map((row: any) => ({
          id: row.id,
          date: row.date,
          timestamp: row.timestamp,
          type: row.type,
          title: row.title,
          totalTime: row.total_time_str,
          totalSeconds: row.total_seconds,
          sessionType: row.session_type,
          splits: splitsMap.get(row.id) || [],
          details: {
              distance: row.distance_km?.toString(),
              weight: row.weight_kg?.toString(),
              reps: row.reps?.toString(),
              rpe: row.rpe,
              hrAvg: row.hr_avg,
              note: row.notes,
              ...JSON.parse(row.details_json || '{}')
          }
      }));
    } catch (e) { return []; }
  },

  async getUserProfile(): Promise<UserProfile | null> {
      try {
          const db = await this._getDb();
          const rows = await db.getAllAsync('SELECT * FROM user_profile WHERE id = "main"');
          if (rows.length > 0) {
              const r = rows[0] as any;
              return {
                  name: r.name,
                  category: r.category,
                  level: r.level,
                  targetTime: r.target_time,
                  athleteType: r.athlete_type,
                  joined: r.joined_date
              };
          }
          return null;
      } catch (e) { return null; }
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
        await db.runAsync('DELETE FROM splits');
        await db.runAsync('DELETE FROM logs');
        await db.runAsync('DELETE FROM user_profile');
        await db.runAsync('DELETE FROM station_defaults');
        await AsyncStorage.multiRemove([KEY_ANALYTICS, 'user_profile', 'userCategory', 'user_pbs']);
    } catch (e) { console.error(e); }
  },

  // --- 7. ANALYTICS ENGINE (SQL OPTIMIZED) ---
  async _refreshAnalytics() {
      try {
          const db = await this._getDb();
          const stats = this._getEmptyAnalytics();
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

          const aggResult = await db.getAllAsync(`
            SELECT 
                COUNT(*) as totalOps,
                SUM(CASE WHEN type = 'SIMULATION' THEN 8 ELSE distance_km END) as totalDist,
                SUM(CASE WHEN type = 'SIMULATION' THEN 24350 ELSE (weight_kg * reps) END) as totalTon,
                SUM(CASE WHEN timestamp > ? THEN 1 ELSE 0 END) as recentLogs
            FROM logs
          `, [oneWeekAgo]);

          const agg = aggResult[0];
          stats.totalOps = agg.totalOps || 0;
          stats.totalRunDistance = agg.totalDist || 0;
          stats.totalTonnage = agg.totalTon || 0;
          stats.consistencyScore = Math.min(100, Math.round(((agg.recentLogs || 0) / 4) * 100));

          const pbs = await db.getAllAsync(`
            SELECT 
                MIN(CASE WHEN title LIKE '%5K%' OR title LIKE '%RUN TEST%' THEN total_seconds END) as best5k,
                MIN(CASE WHEN station_name = 'ROXZONE' THEN actual_seconds END) as bestRox
            FROM splits 
            JOIN logs ON splits.log_id = logs.id
          `);
          
          if (pbs[0]) {
              stats.records.best5k = this._formatTime(pbs[0].best5k);
              stats.records.bestRoxzone = pbs[0].bestRox || 0;
          }

          const fetchTrend = async (metricKey: MetricKey, sqlWhere: string, sqlCol: string, table: 'logs'|'splits' = 'splits') => {
             let query = '';
             if (table === 'splits') {
                 query = `SELECT ${sqlCol} as val, logs.timestamp 
                          FROM splits JOIN logs ON splits.log_id = logs.id 
                          WHERE ${sqlWhere} 
                          ORDER BY logs.timestamp DESC LIMIT 10`;
             } else {
                 query = `SELECT ${sqlCol} as val, timestamp 
                          FROM logs 
                          WHERE ${sqlWhere} 
                          ORDER BY timestamp DESC LIMIT 10`;
             }
             const rows = await db.getAllAsync(query);
             stats.trends[metricKey] = rows.map((r: any) => r.val).reverse();
             if (rows.length > 0) stats.recency[metricKey] = rows[0].timestamp;
          };

          await Promise.all([
              fetchTrend(METRICS.HR, "hr_avg > 0", "hr_avg", 'logs'),
              fetchTrend(METRICS.RPE, "rpe > 0", "rpe", 'logs'),
              fetchTrend(METRICS.RUN_PACE, "station_name LIKE '%RUN%' OR station_name LIKE '%1KM%'", "actual_seconds", 'splits'),
              fetchTrend(METRICS.SKI_ERG, "station_name LIKE '%SKI%'", "actual_seconds"),
              fetchTrend(METRICS.SLED_PUSH, "station_name LIKE '%PUSH%'", "actual_seconds"),
              fetchTrend(METRICS.SLED_PULL, "station_name LIKE '%PULL%'", "actual_seconds"),
              fetchTrend(METRICS.BURPEES, "station_name LIKE '%BURPEE%'", "actual_seconds"),
              fetchTrend(METRICS.ROWING, "station_name LIKE '%ROW%'", "actual_seconds"),
              fetchTrend(METRICS.FARMERS, "station_name LIKE '%FARM%'", "actual_seconds"),
              fetchTrend(METRICS.LUNGES, "station_name LIKE '%LUNG%'", "actual_seconds"),
              fetchTrend(METRICS.WALL_BALLS, "station_name LIKE '%WALL%'", "actual_seconds"),
              fetchTrend(METRICS.ROXZONE, "station_name LIKE '%ROXZONE%'", "actual_seconds"),
          ]);

          const simLogs = await db.getAllAsync(`SELECT id FROM logs WHERE type = 'SIMULATION' ORDER BY timestamp DESC LIMIT 10`);
          for (const log of simLogs) {
              const runSplits = await db.getAllAsync(`
                SELECT actual_seconds FROM splits 
                WHERE log_id = ? AND (station_name LIKE '%RUN%') 
                ORDER BY id ASC
              `, [log.id]);
              
              if (runSplits.length >= 8) {
                  const first = runSplits[0].actual_seconds;
                  const last = runSplits[runSplits.length - 1].actual_seconds;
                  if (first > 0 && last > 0) {
                      const degradation = ((last - first) / first) * 100;
                      stats.trends[METRICS.FATIGUE].push(degradation);
                  }
              }
          }
          stats.trends[METRICS.FATIGUE].reverse();

          await AsyncStorage.setItem(KEY_ANALYTICS, JSON.stringify(stats));
          return stats;

      } catch (e) {
          console.error("Analytics Engine Failure", e);
          return this._getEmptyAnalytics();
      }
  },

  _getEmptyAnalytics(): AnalyticsProfile {
      const trends = {} as Record<MetricKey, number[]>;
      const recency = {} as Record<MetricKey, number>;
      Object.values(METRICS).forEach(k => { trends[k] = []; recency[k] = 0; });
      return { totalOps: 0, totalRunDistance: 0, totalTonnage: 0, consistencyScore: 0, trends, recency, records: { best5k: '--:--', bestSledPush: 0, bestRoxzone: 0 } };
  },

  _formatTime(seconds: number) {
      if (!seconds) return '--:--';
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  },

  _timeToSeconds(timeStr: string) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }
};