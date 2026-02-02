// utils/pacing.ts

export const CATEGORIES = {
    // INDIVIDUALS
    MEN_OPEN: { label: 'MEN OPEN', sledPush: 152, runPenalty: 1.15 },
    MEN_PRO: { label: 'MEN PRO', sledPush: 202, runPenalty: 1.20 },
    WOMEN_OPEN: { label: 'WOMEN OPEN', sledPush: 102, runPenalty: 1.15 },
    WOMEN_PRO: { label: 'WOMEN PRO', sledPush: 152, runPenalty: 1.20 },
    
    // DOUBLES (New Specific Logic)
    DOUBLES_MEN: { label: 'MEN DOUBLES', sledPush: 152, runPenalty: 1.05 },
    DOUBLES_WOMEN: { label: 'WOMEN DOUBLES', sledPush: 102, runPenalty: 1.05 },
    DOUBLES_MIXED: { label: 'MIXED DOUBLES', sledPush: 152, runPenalty: 1.05 },
    
    // RELAY
    RELAY: { label: 'RELAY', sledPush: 152, runPenalty: 1.02 }, // Minimal penalty (sprint format)
};

// Helper: "20:00" -> 1200 seconds
export const timeToSeconds = (timeStr: string): number => {
    if (!timeStr.includes(':')) return parseInt(timeStr) * 60; 
    const [m, s] = timeStr.split(':').map(Number);
    return (m * 60) + (s || 0);
};

// Helper: 1200 -> "20:00"
export const secondsToTime = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// CORE LOGIC: Calculate "RoxPace" (The pace you can actually hold)
export const calculateRoxPace = (fiveKTime: string, categoryKey: string) => {
    const freshSeconds = timeToSeconds(fiveKTime);
    const freshPacePerKm = freshSeconds / 5; 
    
    const config = CATEGORIES[categoryKey as keyof typeof CATEGORIES] || CATEGORIES.MEN_OPEN;
    const penalty = config.runPenalty;
    const roxPaceSeconds = freshPacePerKm * penalty;

    return roxPaceSeconds; 
};

// PREDICTION: Estimate total finish time based on that pace
export const predictFinishTime = (roxPaceSeconds: number, categoryKey: string) => {
    const totalRunTime = roxPaceSeconds * 8;
    
    // Station Time Logic
    // Standard Open/Doubles Avg station time is often cited around 4 mins for decent athletes.
    let avgStationTime = 4 * 60; 
    
    // Pro is slower on stations due to heavier weights
    if (categoryKey.includes('PRO')) avgStationTime = 5 * 60; 
    
    // Doubles moves faster through stations (shared work means higher intensity/speed)
    // Avg station time drops significantly because work is split 50/50
    if (categoryKey.includes('DOUBLES')) avgStationTime = 2.5 * 60; 

    const totalStationTime = avgStationTime * 8;
    
    // RoxZone (Transitions) - Approx 4-5 mins total for good race
    const roxZoneTime = 4.5 * 60;
    
    const totalSeconds = totalRunTime + totalStationTime + roxZoneTime;
    
    return Math.floor(totalSeconds / 60); 
};