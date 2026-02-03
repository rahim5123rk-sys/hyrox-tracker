import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TYPES ---
export interface LogEntry {
  id: string;
  date: string;         // ISO Format: YYYY-MM-DD
  timestamp: number;    // Unix Timestamp for sorting
  type: string;         // 'SIMULATION', 'RUN', 'WORKOUT', etc.
  title: string;
  totalTime: string;    
  totalSeconds: number; 
  sessionType?: string; 
  splits?: any[];       
  details?: any;        
}

export interface AnalyticsProfile {
  totalOps: number;
  totalRunDistance: number;
  totalTonnage: number;       // Lifetime Kg Moved
  consistencyScore: number;   // 0-100% based on weekly activity
  trends: {
    runPace: number[];        // Last 10 Run splits
    sledStrength: number[];   // Last 10 Sled Pushes
    roxzone: number[];        // Last 10 Roxzone/Transition times
  };
  records: {
    best5k: string;
    bestSledPush: number;
  };
}

const KEY_HISTORY = 'raceHistory';
const KEY_ANALYTICS = 'user_analytics_engine';
const KEY_PROFILE = 'user_profile';

export const DataStore = {

  // 1. WRITE: Save Event & Update Analytics
  async logEvent(entry: any) {
    try {
      // 1. Prepare new entry with ID and Timestamp
      const newLog: LogEntry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: Date.now(),
        // Ensure totalSeconds exists, fallback to string parsing if needed
        totalSeconds: entry.totalSeconds || this._timeToSeconds(entry.totalTime)
      };

      // 2. Fetch existing history
      const historyJson = await AsyncStorage.getItem(KEY_HISTORY);
      const history = historyJson ? JSON.parse(historyJson) : [];

      // 3. Add to front of array
      const updatedHistory = [newLog, ...history];
      await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(updatedHistory));

      // 4. Run the Analytics Engine
      const analytics = this._calculateAnalytics(updatedHistory);
      await AsyncStorage.setItem(KEY_ANALYTICS, JSON.stringify(analytics));

      return true;
    } catch (e) {
      console.error("DataStore Write Error", e);
      return false;
    }
  },

  // 2. READ: Get History (For Calendar/List)
  async getHistory(): Promise<LogEntry[]> {
    try {
      const json = await AsyncStorage.getItem(KEY_HISTORY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      return [];
    }
  },

  // 3. READ: Get Analytics (For Profile)
  async getAnalytics(): Promise<AnalyticsProfile> {
    const json = await AsyncStorage.getItem(KEY_ANALYTICS);
    return json ? JSON.parse(json) : this._getEmptyAnalytics();
  },

  // 4. READ: Full Dossier (For Profile & Debug)
  async getFullDossier() {
     const history = await this.getHistory();
     const analytics = await this.getAnalytics();
     return { history, analytics };
  },

  // 5. MAINTENANCE: Factory Reset
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([
          KEY_HISTORY, 
          KEY_ANALYTICS, 
          KEY_PROFILE, 
          'userCategory', 
          'user_weekly_plan',
          'user_pbs' // Clear PBs too
      ]);
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- INTERNAL ANALYTICS ENGINE (THE BRAIN) ---
  _calculateAnalytics(history: LogEntry[]): AnalyticsProfile {
    const stats = this._getEmptyAnalytics();
    
    stats.totalOps = history.length;
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    let workoutsLast7Days = 0;

    history.forEach(log => {
        // 1. CONSISTENCY TRACKER
        if (now - log.timestamp < oneWeekMs) {
            workoutsLast7Days++;
        }

        // 2. VOLUME (RUNNING)
        if (log.type === 'SIMULATION') stats.totalRunDistance += 8;
        if (log.type === 'RUN' && log.details?.distance) {
            stats.totalRunDistance += parseFloat(log.details.distance) || 0;
        }

        // 3. VOLUME (TONNAGE)
        // A. From Simulations (Standard Weights)
        if (log.type === 'SIMULATION') {
            // Approx: Sled Push (152kg*50m) + Sled Pull (103kg*50m) + Lunges (20kg*100m) + Farmers (48kg*200m)
            // We treat distance as 'reps' for this rough calculation
            stats.totalTonnage += (152 * 50) + (103 * 50) + (20 * 100) + (48 * 200); 
        }
        // B. From Manual Station Logs
        if (log.sessionType === 'QUICK LOG' && log.details?.weight && log.details?.reps) {
            const w = parseFloat(log.details.weight) || 0;
            const r = parseFloat(log.details.reps) || 0;
            stats.totalTonnage += (w * r);
        }

        // 4. TRENDS (The Telemetry)
        if (log.splits && Array.isArray(log.splits)) {
             // RUN PACE
             const run1 = log.splits.find((s: any) => s.name.toUpperCase().includes('1KM') || s.name.toUpperCase().includes('RUN 1'));
             if (run1 && typeof run1.actual === 'number') stats.trends.runPace.push(run1.actual);
             
             // SLED STRENGTH
             const sled = log.splits.find((s: any) => s.name.toUpperCase().includes('SLED PUSH'));
             if (sled && typeof sled.actual === 'number') stats.trends.sledStrength.push(sled.actual);

             // ROXZONE EFFICIENCY
             // Checks for "ROXZONE" or "TRANSITION"
             const rox = log.splits.find((s: any) => s.name.toUpperCase().includes('ROXZONE'));
             if (rox && typeof rox.actual === 'number') stats.trends.roxzone.push(rox.actual);
        }
    });

    // 5. FINALIZE SCORES
    // Consistency Score: Goal = 4 workouts/week. Cap at 100%.
    stats.consistencyScore = Math.min(100, Math.round((workoutsLast7Days / 4) * 100));

    // Trim Trends to last 10 entries & Reverse so newest is rightmost (or strictly chronological for charts)
    stats.trends.runPace = stats.trends.runPace.slice(0, 10).reverse();
    stats.trends.sledStrength = stats.trends.sledStrength.slice(0, 10).reverse();
    stats.trends.roxzone = stats.trends.roxzone.slice(0, 10).reverse();

    return stats;
  },

  // INITIAL STATE (Typed Correctly)
  _getEmptyAnalytics(): AnalyticsProfile {
      return {
          totalOps: 0, 
          totalRunDistance: 0, 
          totalTonnage: 0, 
          consistencyScore: 0,
          trends: { 
              runPace: [] as number[],      
              sledStrength: [] as number[],
              roxzone: [] as number[]
          },
          records: { best5k: '--:--', bestSledPush: 0 }
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