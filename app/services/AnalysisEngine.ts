import { ALL_WORKOUTS } from '../data/workouts';
import { AnalyticsProfile } from './DataStore';

export interface AnalysisReport {
  archetype: string;
  archetypeDesc: string;
  primaryWeakness: string; // e.g. "WALL BALLS"
  secondaryWeakness: string; // e.g. "ROXZONE"
  focusArea: string; 
  tacticalAdvice: string[];
  radarAnalysis: string;
  recommendedWorkouts: any[];
}

// ELITE STANDARDS (Seconds) - The "Gold Standard"
const ELITE = {
    RUN_PACE: 240,      // 4:00/km
    SKI: 230,           // 3:50
    SLED_PUSH: 140,     // 2:20
    SLED_PULL: 200,     // 3:20
    BURPEES: 230,       // 3:50
    ROW: 230,           // 3:50
    FARMERS: 90,        // 1:30
    LUNGES: 200,        // 3:20
    WALLBALLS: 200,     // 3:20
    ROXZONE: 300        // 5:00 Total
};

export const AnalysisEngine = {
  
  generateReport(stats: AnalyticsProfile): AnalysisReport {
    // 1. DATA EXTRACTION (Most Recent Valid)
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

    // 2. CALCULATE "BLEED" (Performance Deficit vs Elite)
    // Result is % slower. 0.0 = Elite, 0.5 = 50% Slower
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

    // 3. IDENTIFY CRITICAL FAILURE POINTS (Highest Bleed)
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
    
    // Sort by biggest deficit (Desceding)
    stations.sort((a, b) => b.val - a.val);
    const worstStation = stations[0];
    const secondWorst = stations[1];

    // 4. DIAGNOSTIC LOGIC TREE (Archetype Detection)
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
    // --- SCENARIO C: THE "RUNNER" (Fast Run, Weak Sleds) ---
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
    // --- SCENARIO E: THE "GYM BRO" (Good Farmers/Lunges, Bad Cardio) ---
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

    // 5. GENERATE STATION SPECIFIC ADVICE (If not covered above)
    if (advice.length < 3) {
        advice.push(`Drill your weakness: ${worstStation.id} is your biggest bleed.`);
    }

    // 6. RECOMMEND WORKOUTS
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