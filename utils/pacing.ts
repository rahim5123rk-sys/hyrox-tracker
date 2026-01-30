// utils/pacing.ts

export const CATEGORIES = {
    MEN_OPEN: { label: 'MEN OPEN', sledPush: 152, runPenalty: 1.15 },
    MEN_PRO: { label: 'MEN PRO', sledPush: 202, runPenalty: 1.20 },
    WOMEN_OPEN: { label: 'WOMEN OPEN', sledPush: 102, runPenalty: 1.15 },
    WOMEN_PRO: { label: 'WOMEN PRO', sledPush: 152, runPenalty: 1.20 },
    DOUBLES: { label: 'DOUBLES', sledPush: 152, runPenalty: 1.05 }, // Less penalty in doubles
};

// Helper: "20:00" -> 1200 seconds
export const timeToSeconds = (timeStr: string): number => {
    if (!timeStr.includes(':')) return parseInt(timeStr) * 60; // Handle raw minutes
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
    const freshPacePerKm = freshSeconds / 5; // e.g., 20:00 -> 4:00/km (240s)
    
    // Apply the "Hyrox Penalty" based on category
    // Heavier sleds = slower running afterwards
    const penalty = CATEGORIES[categoryKey as keyof typeof CATEGORIES].runPenalty;
    const roxPaceSeconds = freshPacePerKm * penalty;

    return roxPaceSeconds; // Seconds per km
};

// PREDICTION: Estimate total finish time based on that pace
export const predictFinishTime = (roxPaceSeconds: number, categoryKey: string) => {
    // 8km of running
    const totalRunTime = roxPaceSeconds * 8;
    
    // Average station times (derived from global data averages)
    // Open/Doubles tend to be faster on stations than Pro due to weights
    let avgStationTime = 4 * 60; // 4 mins per station is a safe "decent" average
    if (categoryKey.includes('PRO')) avgStationTime = 5 * 60; 

    const totalStationTime = avgStationTime * 8;
    
    // Total = Runs + Stations + RoxZone transitions (approx 3-5 mins total)
    const totalSeconds = totalRunTime + totalStationTime + (4 * 60);
    
    return Math.floor(totalSeconds / 60); // Return in Minutes for the input field
};