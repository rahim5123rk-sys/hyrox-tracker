import { ALL_WORKOUTS } from '../data/workouts';
import { AnalyticsProfile, METRICS } from './DataStore';

export interface AnalysisReport {
  archetype: string;
  archetypeDesc: string;
  primaryWeakness: string; 
  secondaryWeakness: string;
  focusArea: string; 
  tacticalAdvice: string[];
  radarAnalysis: string;
  recommendedWorkouts: any[];
  // [NEW] Centralized Intelligence Fields
  bioSignature: {
      speed: number;
      power: number;
      engine: number;
      grit: number;
      consistency: number;
  };
  racePrediction: {
      totalTime: string;
      splitAnalysis: string;
  };
}

// DYNAMIC ELITE STANDARDS (Seconds)
const ELITE_STANDARDS: Record<string, any> = {
    MEN_PRO: {
        RUN_PACE: 210,  // 3:30/km
        SKI: 210,       // 3:30
        SLED_PUSH: 135, // 2:15 (Heavy)
        SLED_PULL: 165, // 2:45 (Heavy)
        BURPEES: 225,   // 3:45
        ROW: 190,       // 3:10
        FARMERS: 95,    // 1:35 (Heavy)
        LUNGES: 195,    // 3:15 (Heavy)
        WALLBALLS: 225, // 3:45 (Heavy)
        ROXZONE: 210    // 3:30 Total
    },
    WOMEN_PRO: {
        RUN_PACE: 235,  // 3:55/km
        SKI: 240,       // 4:00
        SLED_PUSH: 165, // 2:45 (Heavy)
        SLED_PULL: 195, // 3:15 (Heavy)
        BURPEES: 255,   // 4:15
        ROW: 220,       // 3:40
        FARMERS: 110,   // 1:50 (Heavy)
        LUNGES: 225,    // 3:45 (Heavy)
        WALLBALLS: 255, // 4:15 (Heavy)
        ROXZONE: 240    // 4:00 Total
    },
    MEN_OPEN: {
        RUN_PACE: 240,  // 4:00/km
        SKI: 225,       // 3:45
        SLED_PUSH: 140, // 2:20
        SLED_PULL: 180, // 3:00
        BURPEES: 240,   // 4:00
        ROW: 225,       // 3:45
        FARMERS: 105,   // 1:45
        LUNGES: 210,    // 3:30
        WALLBALLS: 240, // 4:00
        ROXZONE: 270    // 4:30 Total
    },
    WOMEN_OPEN: {
        RUN_PACE: 270,  // 4:30/km
        SKI: 255,       // 4:15
        SLED_PUSH: 165, // 2:45
        SLED_PULL: 225, // 3:45
        BURPEES: 285,   // 4:45
        ROW: 255,       // 4:15
        FARMERS: 135,   // 2:15
        LUNGES: 240,    // 4:00
        WALLBALLS: 270, // 4:30
        ROXZONE: 300    // 5:00 Total
    },
    // DOUBLES
    DOUBLES_MEN: {
        RUN_PACE: 230, SKI: 120, SLED_PUSH: 80, SLED_PULL: 100, BURPEES: 120,
        ROW: 120, FARMERS: 60, LUNGES: 110, WALLBALLS: 120, ROXZONE: 200
    },
    DOUBLES_WOMEN: {
        RUN_PACE: 260, SKI: 135, SLED_PUSH: 95, SLED_PULL: 120, BURPEES: 140,
        ROW: 135, FARMERS: 75, LUNGES: 130, WALLBALLS: 140, ROXZONE: 220
    },
    DOUBLES_MIXED: {
        RUN_PACE: 245, SKI: 130, SLED_PUSH: 90, SLED_PULL: 110, BURPEES: 130,
        ROW: 130, FARMERS: 70, LUNGES: 120, WALLBALLS: 130, ROXZONE: 210
    }
};

export const AnalysisEngine = {
  
  generateReport(stats: AnalyticsProfile, category: string = 'MEN_OPEN'): AnalysisReport {
    
    // 1. SELECT BENCHMARK
    const ELITE = ELITE_STANDARDS[category] || ELITE_STANDARDS.MEN_OPEN;

    // 2. DATA EXTRACTION
    const get = (arr: number[]) => {
        const clean = arr.filter(n => n > 0);
        return clean.length > 0 ? clean[clean.length - 1] : 0;
    };

    // Physiology
    const runPace = get(stats.trends[METRICS.RUN_PACE]);
    const fatigue = get(stats.trends[METRICS.FATIGUE]);
    const roxzone = get(stats.trends[METRICS.ROXZONE]);
    
    // Stations
    const ski = get(stats.trends[METRICS.SKI_ERG]);
    const push = get(stats.trends[METRICS.SLED_PUSH]);
    const pull = get(stats.trends[METRICS.SLED_PULL]);
    const burpees = get(stats.trends[METRICS.BURPEES]);
    const row = get(stats.trends[METRICS.ROWING]);
    const farmers = get(stats.trends[METRICS.FARMERS]);
    const lunges = get(stats.trends[METRICS.LUNGES]);
    const wallBalls = get(stats.trends[METRICS.WALL_BALLS]);

    // 3. CALCULATE "BLEED"
    const bleed = (actual: number, goal: number) => (actual > 0) ? (actual - goal) / goal : 0;

    const b = {
        run: bleed(runPace, ELITE.RUN_PACE),
        ski: bleed(ski, ELITE.SKI),
        push: bleed(push, ELITE.SLED_PUSH),
        pull: bleed(pull, ELITE.SLED_PULL),
        burpee: bleed(burpees, ELITE.BURPEES),
        row: bleed(row, ELITE.ROW),
        farm: bleed(farmers, ELITE.FARMERS),
        lunge: bleed(lunges, ELITE.LUNGES),
        wall: bleed(wallBalls, ELITE.WALLBALLS),
        rox: bleed(roxzone, ELITE.ROXZONE)
    };

    // 4. IDENTIFY CRITICAL FAILURE POINTS
    const stations = [
        { id: "SKI ERG", val: b.ski },
        { id: "SLED PUSH", val: b.push },
        { id: "SLED PULL", val: b.pull },
        { id: "BURPEES", val: b.burpee },
        { id: "ROWING", val: b.row },
        { id: "FARMERS", val: b.farm },
        { id: "LUNGES", val: b.lunge },
        { id: "WALL BALLS", val: b.wall }
    ];
    
    stations.sort((a, b) => b.val - a.val);
    const worstStation = stations[0];
    const secondWorst = stations[1];

    // --- 5. NEW: CENTRALIZED BIO-SIGNATURE ---
    const calculateScore = (val: number, elite: number, rookie: number) => {
          if (!val) return 0;
          if (val <= elite) return 100;
          if (val >= rookie) return 20;
          return Math.round(20 + ((rookie - val) / (rookie - elite)) * 80);
    };
    
    // Using MEN_OPEN/PRO averages to set the "Scale" for the radar chart
    // Speed: 4:00/km (Elite) to 7:00/km (Rookie) -> 240s to 420s
    // Power: 2:00 (Elite) to 5:00 (Rookie) for Sled Push -> 120s to 300s
    // Engine: 3:50 (Elite) to 6:00 (Rookie) for Ski/Row -> 230s to 360s
    
    const bio = {
        speed: calculateScore(runPace, 240, 420),
        power: calculateScore(push, 120, 300),
        engine: calculateScore((ski + row)/2, 230, 360),
        grit: Math.max(0, 100 - (fatigue * 2)), 
        consistency: stats.consistencyScore || 0
    };

    // --- 6. NEW: RACE PREDICTOR ---
    // Formula: (Avg Run Pace * 8) + (Sum of Stations) + (Est. Roxzone)
    // If no data for a station, we default to "Rookie" pace (safe estimate)
    const safe = (val: number, def: number) => val > 0 ? val : def;
    
    const totalRunTime = safe(runPace, 360) * 8; // 8km total
    
    const totalStationTime = 
        safe(ski, 300) + 
        safe(push, 180) + 
        safe(pull, 240) + 
        safe(burpees, 360) + 
        safe(row, 300) + 
        safe(farmers, 120) + 
        safe(lunges, 300) + 
        safe(wallBalls, 300);
        
    // Est Roxzone: Base 5:00 (300s) + penalty for low fitness
    // If Engine is 100 (Elite), Roxzone -> 300s
    // If Engine is 20 (Rookie), Roxzone -> 300 + (80 * 2) = 460s
    const estRox = 300 + ((100 - bio.engine) * 2); 
    
    const predictedSeconds = totalRunTime + totalStationTime + estRox;
    
    const pM = Math.floor(predictedSeconds / 60);
    const pS = Math.round(predictedSeconds % 60);
    const predTime = `${Math.floor(pM/60)}:${(pM%60).toString().padStart(2,'0')}:${pS.toString().padStart(2,'0')}`;

    let splitAnalysis = "Data suggests a balanced race.";
    if (bio.power < 40) splitAnalysis = "Heavy Sleds are adding ~4 mins to your time.";
    else if (bio.speed < 40) splitAnalysis = "Running pace is the primary bottleneck.";
    else if (bio.grit < 40) splitAnalysis = "Fade in second half costs you ~3 mins.";

    // 7. DIAGNOSTIC LOGIC (Archetype)
    let archetype = "THE ROOKIE";
    let desc = "Metrics established. Ready for optimization.";
    let advice: string[] = [];
    let focus = "GENERAL";
    let radarText = "Balanced profile detected.";

    if (b.rox > 0.5 && b.rox > worstStation.val) {
        archetype = "THE TOURIST";
        desc = "Your engine is fine, but you are hemorrhaging time walking between stations.";
        advice = ["RULE #1: Never walk. Jog every transition.", "Water strategy: Drink ONLY at R4 and R7.", "Visualise the layout. Run exact lines."];
        focus = "HYBRID";
        radarText = "Fitness scores appear artificially low due to transition inefficiency.";
    }
    else if (fatigue > 15) {
        archetype = "THE RED-LINER";
        desc = "You fly out of the gate but suffer catastrophic system failure after 40 minutes.";
        advice = [`Slower Start: Add 10-15s per km to Run 1-3.`, "Compromised Running: Train legs immediately before running.", "Increase Zone 2 volume to build metabolic durability."];
        focus = "ENDURANCE";
        radarText = "Bio-signature shows high peak power but critical lack of 'Grit'.";
    }
    else if (b.run < 0.2 && (b.push > 0.4 || b.pull > 0.4)) {
        archetype = "THE MARATHONER";
        desc = "Elite lungs, but you crumple under the heavy weights. The sleds are burying you.";
        advice = ["Heavy Sled Pushes (150kg+) 2x per week.", "Posterior Chain: Heavy Deadlifts and Sled Pulls.", "Your running gives you a buffer—spend it on getting stronger."];
        focus = "STRENGTH";
        radarText = "High 'Speed' score heavily compromised by low 'Power' metrics.";
    }
    else if (b.push < 0.2 && b.run > 0.4) {
        archetype = "THE TANK";
        desc = "You dominate the functional stations but lose minutes on the track.";
        advice = ["Speed Work: 1km repeats at target race pace.", "Weight Management: Optimize power-to-weight ratio.", "Cadence Drills: Improve running economy."];
        focus = "SPEED";
        radarText = "Dominant 'Power' score. 'Speed' is the sole limiting factor.";
    }
    else if (b.farm < 0.2 && b.lunge < 0.2 && (b.row > 0.4 || b.ski > 0.4)) {
        archetype = "THE LIFTER";
        desc = "Static strength is elite, but sustained aerobic output (Ski/Row) is weak.";
        advice = ["Long intervals on Ergometers (2000m+ Row/Ski).", "Force the lungs to work, not just the muscles.", "HIIT: 30s Sprint / 30s Rest cycles."];
        focus = "AEROBIC";
        radarText = "Strength metrics are solid. 'Engine' capacity needs expansion.";
    }
    else if (b.burpee > 0.4 || b.wall > 0.4) {
        archetype = "LACTATE INTOLERANT";
        desc = "You panic when the heart rate spikes on bodyweight movement. High lactate buildup.";
        advice = ["EMOMs: 15 Burpees on the minute for 10 min.", "Wall Ball volume: Sets of 50 unbroken.", "Practice 'flushing' legs with easy jogging after sets."];
        focus = "HIIT";
        radarText = "Profile shows weakness in high-cycle bodyweight endurance.";
    }
    else if (b.run > 0.2 && b.push > 0.2) {
        archetype = "THE OPERATOR";
        desc = "Well-rounded, but lacking a 'superpower'. You need global elevation.";
        advice = ["Increase overall training volume.", "Focus on the station with the highest bleed: " + worstStation.id, "Refine pacing strategy for marginal gains."];
        focus = "ADVANCED";
        radarText = "Symmetrical profile. Expand the entire perimeter.";
    }
    else if (b.run < 0.1 && b.push < 0.1) {
        archetype = "THE PRO";
        desc = "Exceptional metric balance. You are in striking distance of the podium.";
        advice = ["Maintain intensity. Avoid injury.", "Focus on 1% improvements in transitions.", "Race simulation is your primary training tool."];
        focus = "ELITE";
        radarText = "Nearly flawless bio-signature. Maximized potential.";
    }

    if (advice.length < 3) {
        advice.push(`Drill your weakness: ${worstStation.id} is your biggest bleed.`);
    }

    const filterKey = focus === "ELITE" ? "ADVANCED" : focus;
    const recommended = ALL_WORKOUTS
        .filter(w => w.type.toUpperCase().includes(filterKey) || w.station.toUpperCase().includes(filterKey))
        .slice(0, 2);

    if (recommended.length === 0) recommended.push(ALL_WORKOUTS[0], ALL_WORKOUTS[1]);

    return {
        archetype,
        archetypeDesc: desc,
        primaryWeakness: worstStation.id,
        secondaryWeakness: secondWorst.id,
        focusArea: focus,
        tacticalAdvice: advice,
        radarAnalysis: radarText,
        recommendedWorkouts: recommended,
        bioSignature: bio,
        racePrediction: {
            totalTime: predTime,
            splitAnalysis: splitAnalysis
        }
    };
  }
};