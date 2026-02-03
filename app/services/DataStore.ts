import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TYPES ---
export interface LogEntry {
  id: string;
  date: string;         // ISO Format
  timestamp: number;    
  type: string;         // 'SIMULATION', 'RUN', 'WORKOUT'
  title: string;
  totalTime: string;    
  totalSeconds: number; 
  sessionType?: string; 
  splits?: any[];       
  details?: any;        // Stores HR, RPE
}

export interface AnalyticsProfile {
  totalOps: number;
  totalRunDistance: number;
  totalTonnage: number;       
  consistencyScore: number;   
  trends: {
    // 1. PHYSIOLOGY
    avgHr: number[];          
    rpe: number[];            
    
    // 2. RUNNING
    runPace: number[];        // Run 1 Splits
    fatigueIndex: number[];   // Degradation %
    
    // 3. THE 8 STATIONS (Specific Tracking)
    skiErg: number[];
    sledPush: number[];
    sledPull: number[];
    burpees: number[];
    rowing: number[];
    farmers: number[];
    lunges: number[];
    wallBalls: number[];
    
    // 4. TRANSITION
    roxzone: number[];
  };
  records: {
    best5k: string;
    bestSledPush: number;
    bestRoxzone: number;
  };
}

const KEY_HISTORY = 'raceHistory';
const KEY_ANALYTICS = 'user_analytics_engine';
const KEY_PROFILE = 'user_profile';

export const DataStore = {

  // 1. WRITE
  async logEvent(entry: any) {
    try {
      const newLog: LogEntry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: Date.now(),
        totalSeconds: entry.totalSeconds || this._timeToSeconds(entry.totalTime)
      };

      const historyJson = await AsyncStorage.getItem(KEY_HISTORY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      const updatedHistory = [newLog, ...history];

      await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(updatedHistory));

      const analytics = this._calculateAnalytics(updatedHistory);
      await AsyncStorage.setItem(KEY_ANALYTICS, JSON.stringify(analytics));

      return true;
    } catch (e) {
      console.error("DataStore Save Error", e);
      return false;
    }
  },

  // 2. READ
  async getFullDossier() {
     const history = await this.getHistory();
     const analytics = await this.getAnalytics();
     return { history, analytics };
  },

  async getHistory(): Promise<LogEntry[]> {
    try {
      const json = await AsyncStorage.getItem(KEY_HISTORY);
      return json ? JSON.parse(json) : [];
    } catch (e) { return []; }
  },

  async getAnalytics(): Promise<AnalyticsProfile> {
    try {
      const json = await AsyncStorage.getItem(KEY_ANALYTICS);
      return json ? JSON.parse(json) : this._getEmptyAnalytics();
    } catch (e) { return this._getEmptyAnalytics(); }
  },

  async clearAll() {
    await AsyncStorage.multiRemove([KEY_HISTORY, KEY_ANALYTICS, KEY_PROFILE, 'userCategory', 'user_pbs']);
  },

  // --- ANALYTICS ENGINE V7 (FULL TRACKING) ---
  _calculateAnalytics(history: LogEntry[]): AnalyticsProfile {
    const stats = this._getEmptyAnalytics();
    
    stats.totalOps = history.length;
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    let workoutsLast7Days = 0;

    history.forEach(log => {
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
        if (log.details?.hrAvg) stats.trends.avgHr.push(log.details.hrAvg);
        if (log.details?.rpe) stats.trends.rpe.push(log.details.rpe);

        // D. SPLIT MINING
        const splits = log.splits; 
        
        if (splits && Array.isArray(splits)) {
             
             // HELPER: Handles 'actual' (Sims) AND 'time' (Active Workouts)
             const find = (key: string) => {
                 const s = splits.find((x: any) => x.name.toUpperCase().includes(key));
                 if (!s) return null;
                 
                 let val = s.actual;
                 if (val === undefined || val === null) val = s.time;
                 
                 return (typeof val === 'number' && val > 0) ? val : null;
             };

             // 1. RUNNING
             const r1 = find('1KM') || find('RUN 1') || find('RUN 1 (');
             if (r1) stats.trends.runPace.push(r1);

             // 2. STATIONS
             const ski = find('SKI'); if(ski) stats.trends.skiErg.push(ski);
             const push = find('PUSH'); if(push) stats.trends.sledPush.push(push);
             const pull = find('PULL'); if(pull) stats.trends.sledPull.push(pull);
             const burp = find('BURPEE'); if(burp) stats.trends.burpees.push(burp);
             const row = find('ROW'); if(row) stats.trends.rowing.push(row);
             const farm = find('FARM'); if(farm) stats.trends.farmers.push(farm);
             const lung = find('LUNG'); if(lung) stats.trends.lunges.push(lung);
             const wall = find('WALL'); if(wall) stats.trends.wallBalls.push(wall);
             
             // 3. TRANSITION
             const rox = find('ROXZONE'); if(rox) stats.trends.roxzone.push(rox);

             // 4. FATIGUE
             const runs = splits.filter((s:any) => s.name.toUpperCase().includes('RUN'));
             if (runs.length >= 2) {
                 const getVal = (s: any) => (typeof s.actual === 'number' ? s.actual : s.time) || 0;
                 const first = getVal(runs[0]);
                 const last = getVal(runs[runs.length - 1]);
                 
                 if (first > 0 && last > 0) {
                     const degradation = ((last - first) / first) * 100;
                     stats.trends.fatigueIndex.push(degradation);
                 }
             }
        }
    });

    // E. FINALIZE
    stats.consistencyScore = Math.min(100, Math.round((workoutsLast7Days / 4) * 100));

    const process = (arr: number[]) => arr.slice(0, 10).reverse();
    
    (Object.keys(stats.trends) as Array<keyof typeof stats.trends>).forEach(key => {
        // @ts-ignore
        stats.trends[key] = process(stats.trends[key]);
    });

    return stats;
  },

  _getEmptyAnalytics(): AnalyticsProfile {
      return {
          totalOps: 0, totalRunDistance: 0, totalTonnage: 0, consistencyScore: 0,
          trends: { 
            avgHr: [], rpe: [], runPace: [], fatigueIndex: [],
            skiErg: [], sledPush: [], sledPull: [], burpees: [], rowing: [], farmers: [], lunges: [], wallBalls: [],
            roxzone: []
          },
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