import { RaceEvent } from '@/app/data/races';
import { ALL_WORKOUTS } from '@/app/data/workouts';

// --- TYPES ---
export type SkillLevel = 'ROOKIE' | 'INTERMEDIATE' | 'ELITE';
export type AthleteBias = 'RUNNER' | 'LIFTER' | 'BALANCED';

export interface UserProfile {
  name: string;
  level: SkillLevel;
  athleteType: AthleteBias;
  targetRace?: RaceEvent | null;
}

export interface TrainingSession {
  id: string; 
  dayIndex: number; 
  workoutId?: string;
  title: string;
  type: 'ENGINE' | 'STRENGTH' | 'MIXED' | 'SIMULATION' | 'RECOVERY';
  intent: string;
  duration: number;
  rpeTarget: number;
  status: 'PENDING' | 'COMPLETED' | 'MISSED' | 'SKIPPED';
  steps: string[];
  rounds: string | number;
  feedback?: {
    rpeActual: number;
    note: string;
  };
}

// --- RECOVERY ROUTINES (These are NOT in your workouts file, they are for Rest Days) ---
const RECOVERY_ROUTINES = [
    {
        title: "SYSTEM FLUSH",
        steps: ["10min Light Cycle/Jog (Zone 1)", "5min Foam Roll Quads", "5min Dynamic Stretch", "10min Walk"],
        intent: "Flush lactate. Promote blood flow."
    },
    {
        title: "MOBILITY FLOW",
        steps: ["5min Neck/Shoulders", "5min Thoracic Rotation", "10min Hip Openers", "10min Hamstring Floss"],
        intent: "Increase range of motion."
    },
    {
        title: "CNS RESET",
        steps: ["5min Dead Hangs", "10min Yoga Flow", "5min Box Breathing", "10min Light Walk"],
        intent: "Nervous system down-regulation."
    }
];

// --- FALLBACK (Only appears if something breaks) ---
const SAFE_WORKOUT = {
    id: 'fallback-safe',
    title: 'BASE CONDITIONING', // <--- If you see this, the database connection failed
    station: 'RUN',
    type: 'ENGINE',
    estTime: '45 MINS',
    steps: ['10min Warmup', '25min Steady Run', '10min Cooldown'],
    rounds: '1 Round'
};

const INTENTS: Record<string, string> = {
  ENGINE: "Build aerobic capacity.",
  STRENGTH: "Increase structural integrity.",
  MIXED: "Compromised running mechanics.",
  SIMULATION: "Race-pace efficiency.",
  RECOVERY: "System reboot."
};

export const TrainingEngine = {
  
  generateWeek: (profile: UserProfile): TrainingSession[] => {
    const days = [0, 1, 2, 3, 4, 5, 6]; 
    const plan: TrainingSession[] = [];
    
    // 1. Volume Logic
    let workDays = [1, 3, 5]; 
    if (profile.level === 'INTERMEDIATE') workDays = [0, 1, 3, 4, 5]; 
    if (profile.level === 'ELITE') workDays = [0, 1, 2, 3, 4, 5]; 

    const weeksOut = profile.targetRace 
      ? Math.ceil((new Date(profile.targetRace.isoDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))
      : 52;
    const isPeaking = weeksOut <= 6;

    days.forEach(day => {
      const isRest = !workDays.includes(day);
      
      if (isRest) {
        const routine = RECOVERY_ROUTINES[day % RECOVERY_ROUTINES.length];
        plan.push({
          id: `rest-${day}`,
          dayIndex: day,
          title: routine.title,
          type: 'RECOVERY',
          intent: routine.intent,
          duration: 30,
          rpeTarget: 3,
          status: 'PENDING',
          steps: routine.steps,
          rounds: "1 Flow"
        });
        return;
      }

      // Work Day Logic
      let type: 'ENGINE' | 'STRENGTH' | 'MIXED' | 'SIMULATION' = 'ENGINE';
      if (day === 1 || day === 4) type = 'STRENGTH';
      if (day === 3) type = 'MIXED';
      if (day === 5 || day === 0) type = isPeaking ? 'SIMULATION' : 'MIXED';

      if (profile.athleteType === 'LIFTER' && type === 'STRENGTH' && day === 4) type = 'ENGINE';

      // --- UPDATED FILTER LOGIC ---
      const db = (Array.isArray(ALL_WORKOUTS) && ALL_WORKOUTS.length > 0) ? ALL_WORKOUTS : [SAFE_WORKOUT];

      let candidates = db.filter(w => {
        if (!w || !w.type) return false;

        // ENGINE: Catch Endurance, Aerobic, Threshold, Power (Ski/Row)
        if (type === 'ENGINE') {
            return ['ENDURANCE', 'AEROBIC', 'THRESHOLD', 'POWER'].includes(w.type) && 
                   ['RUN', 'ROWING', 'SKI ERG'].includes(w.station || '');
        }

        // STRENGTH: Catch Sleds, Wall Balls, Farmers, Lunges, Burpees
        if (type === 'STRENGTH') {
            return ['SLED PUSH', 'SLED PULL', 'WALL BALLS', 'FARMERS', 'LUNGES', 'BURPEES'].includes(w.station || '');
        }

        // SIMULATION: Catch actual Simulations
        if (type === 'SIMULATION') {
            return w.type === 'SIMULATION' || w.title.includes('SIM');
        }

        // MIXED: Catch Hybrids, Compromised, Speed, Explosive
        if (type === 'MIXED') {
            return ['HYBRID', 'COMPROMISED', 'SPEED', 'EXPLOSIVE', 'LEGS'].includes(w.type) || w.station === 'HYBRID';
        }
        
        return false;
      });

      // FALLBACK: If specific filter fails, just give any workout of the broader category to ensure VARIETY
      if (candidates.length === 0) {
          if (type === 'ENGINE') candidates = db.filter(w => ['ROWING', 'SKI ERG'].includes(w.station || ''));
          else if (type === 'STRENGTH') candidates = db.filter(w => !['ROWING', 'SKI ERG', 'HYBRID'].includes(w.station || ''));
          else candidates = db.filter(w => w.station === 'HYBRID');
      }
      
      // FINAL FALLBACK
      if (candidates.length === 0) candidates = db;

      const selected = candidates[Math.floor(Math.random() * candidates.length)] || SAFE_WORKOUT;

      let durationVal = 60;
      if (selected.estTime) {
          const parsed = parseInt(selected.estTime);
          if (!isNaN(parsed)) durationVal = parsed;
      }

      let targetRpe = 7;
      if (type === 'SIMULATION') targetRpe = 9;
      if (isPeaking) targetRpe += 1;

      plan.push({
        id: `work-${day}-${selected.id || 'gen'}`,
        dayIndex: day,
        workoutId: selected.id || 'unknown',
        title: selected.title || 'Training Session',
        type: type,
        intent: INTENTS[type] || "Train Hard",
        duration: durationVal,
        rpeTarget: Math.min(10, targetRpe),
        status: 'PENDING',
        steps: selected.steps || ["Standard Protocol"],
        rounds: selected.rounds || 1
      });
    });

    return plan;
  },

  adaptPlan: (currentPlan: TrainingSession[]): TrainingSession[] => {
    if (!currentPlan || !Array.isArray(currentPlan)) return [];
    const jsDay = new Date().getDay(); 
    const currentDayIndex = jsDay === 0 ? 6 : jsDay - 1;
    
    return currentPlan.map(session => {
      if (session.dayIndex < currentDayIndex && session.status === 'PENDING') {
        return { ...session, status: 'MISSED' };
      }
      return session;
    });
  }
};