import { ALL_WORKOUTS } from '../data/workouts';
import { AnalyticsProfile } from './DataStore';

export interface AnalysisReport {
  archetype: string;
  archetypeDesc: string;
  primaryWeakness: string; 
  secondaryWeakness: string;
  focusArea: string; 
  tacticalAdvice: string[];
  radarAnalysis: string;
  recommendedWorkouts: any[];
}

// [UPDATE] DYNAMIC ELITE STANDARDS (Seconds)
// Based on Top 5% Finisher Data (True Elite for that Division)
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
    // DOUBLES: Faster stations (split work), similiar run pace
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
  
  // [UPDATE] Now accepts 'category' to select the correct benchmark
  generateReport(stats: AnalyticsProfile, category: string = 'MEN_OPEN'): AnalysisReport {
    
    // 1. SELECT BENCHMARK
    const ELITE = ELITE_STANDARDS[category] || ELITE_STANDARDS.MEN_OPEN;

    // 2. DATA EXTRACTION (Most Recent Valid)
    // [NOTE] Includes Bio-Decay logic if you added it, otherwise standard extraction
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const NOW = Date.now();
    
    const get = (arr: number[]) => {
        const clean = arr.filter(n => n > 0);
        return clean.length > 0 ? clean[clean.length - 1] : 0;
    };

    // Physiology
    const runPace = get(stats.trends.runPace);
    const fatigue = get(stats.trends.fatigueIndex);
    const roxzone = get(stats.trends.roxzone);
    
    // Stations
    const ski = get(stats.trends.skiErg);
    const push = get(stats.trends.sledPush);
    const pull = get(stats.trends.sledPull);
    const burpees = get(stats.trends.burpees);
    const row = get(stats.trends.rowing);
    const farmers = get(stats.trends.farmers);
    const lunges = get(stats.trends.lunges);
    const wallBalls = get(stats.trends.wallBalls);

    // 3. CALCULATE "BLEED" (Performance Deficit vs SELECTED Elite)
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

    // 5. DIAGNOSTIC LOGIC TREE (Archetype Detection)
    let archetype = "THE ROOKIE";
    let desc = "Metrics established. Ready for optimization.";
    let advice: string[] = [];
    let focus = "GENERAL";
    let radarText = "Balanced profile detected.";

    // --- SCENARIO A: THE "LAZY" (Roxzone is worst) ---
    if (b.rox > 0.5 && b.rox > worstStation.val) {
        archetype = "THE TOURIST";
        desc = "Your engine is fine, but you are hemorrhaging time walking between stations.";
        advice = [
            "RULE #1: Never walk. Jog every transition.",
            "Water strategy: Drink ONLY at R4 and R7.",
            "Visualise the layout. Run exact lines."
        ];
        focus = "HYBRID";
        radarText = "Fitness scores appear artificially low due to transition inefficiency.";
    }
    // --- SCENARIO B: THE "GASSER" (Fatigue > 15%) ---
    else if (fatigue > 15) {
        archetype = "THE RED-LINER";
        desc = "You fly out of the gate but suffer catastrophic system failure after 40 minutes.";
        advice = [
            `Slower Start: Add 10-15s per km to Run 1-3.`,
            "Compromised Running: Train legs immediately before running.",
            "Increase Zone 2 volume to build metabolic durability."
        ];
        focus = "ENDURANCE";
        radarText = "Bio-signature shows high peak power but critical lack of 'Grit'.";
    }
    // --- SCENARIO C: THE "MARATHONER" (Fast Run, Weak Sleds) ---
    else if (b.run < 0.2 && (b.push > 0.4 || b.pull > 0.4)) {
        archetype = "THE MARATHONER";
        desc = "Elite lungs, but you crumple under the heavy weights. The sleds are burying you.";
        advice = [
            "Heavy Sled Pushes (150kg+) 2x per week.",
            "Posterior Chain: Heavy Deadlifts and Sled Pulls.",
            "Your running gives you a buffer—spend it on getting stronger."
        ];
        focus = "STRENGTH";
        radarText = "High 'Speed' score heavily compromised by low 'Power' metrics.";
    }
    // --- SCENARIO D: THE "TANK" (Strong Sleds, Slow Run) ---
    else if (b.push < 0.2 && b.run > 0.4) {
        archetype = "THE TANK";
        desc = "You dominate the functional stations but lose minutes on the track.";
        advice = [
            "Speed Work: 1km repeats at target race pace.",
            "Weight Management: Optimize power-to-weight ratio.",
            "Cadence Drills: Improve running economy."
        ];
        focus = "SPEED";
        radarText = "Dominant 'Power' score. 'Speed' is the sole limiting factor.";
    }
    // --- SCENARIO E: THE "LIFTER" (Good Farmers/Lunges, Bad Cardio) ---
    else if (b.farm < 0.2 && b.lunge < 0.2 && (b.row > 0.4 || b.ski > 0.4)) {
        archetype = "THE LIFTER";
        desc = "Static strength is elite, but sustained aerobic output (Ski/Row) is weak.";
        advice = [
            "Long intervals on Ergometers (2000m+ Row/Ski).",
            "Force the lungs to work, not just the muscles.",
            "HIIT: 30s Sprint / 30s Rest cycles."
        ];
        focus = "AEROBIC";
        radarText = "Strength metrics are solid. 'Engine' capacity needs expansion.";
    }
    // --- SCENARIO F: THE "PAIN CAVE VICTIM" (Bad Burpees/Wall Balls) ---
    else if (b.burpee > 0.4 || b.wall > 0.4) {
        archetype = "LACTATE INTOLERANT";
        desc = "You panic when the heart rate spikes on bodyweight movement. High lactate buildup.";
        advice = [
            "EMOMs: 15 Burpees on the minute for 10 min.",
            "Wall Ball volume: Sets of 50 unbroken.",
            "Practice 'flushing' legs with easy jogging after sets."
        ];
        focus = "HIIT";
        radarText = "Profile shows weakness in high-cycle bodyweight endurance.";
    }
    // --- SCENARIO G: BALANCED BUT AVERAGE ---
    else if (b.run > 0.2 && b.push > 0.2) {
        archetype = "THE OPERATOR";
        desc = "Well-rounded, but lacking a 'superpower'. You need global elevation.";
        advice = [
            "Increase overall training volume.",
            "Focus on the station with the highest bleed: " + worstStation.id,
            "Refine pacing strategy for marginal gains."
        ];
        focus = "ADVANCED";
        radarText = "Symmetrical profile. Expand the entire perimeter.";
    }
    // --- SCENARIO H: ELITE ---
    else if (b.run < 0.1 && b.push < 0.1) {
        archetype = "THE PRO";
        desc = "Exceptional metric balance. You are in striking distance of the podium.";
        advice = [
            "Maintain intensity. Avoid injury.",
            "Focus on 1% improvements in transitions.",
            "Race simulation is your primary training tool."
        ];
        focus = "ELITE";
        radarText = "Nearly flawless bio-signature. Maximized potential.";
    }

    // 6. GENERATE STATION SPECIFIC ADVICE (If not covered above)
    if (advice.length < 3) {
        advice.push(`Drill your weakness: ${worstStation.id} is your biggest bleed.`);
    }

    // 7. RECOMMEND WORKOUTS
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
        recommendedWorkouts: recommended
    };
  }
};