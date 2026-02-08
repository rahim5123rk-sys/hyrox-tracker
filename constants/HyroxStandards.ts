// Source of truth for all official Hyrox weights and distances
export const HYROX_STANDARDS = {
    MEN_OPEN: { 
        SLED_PUSH: '152', 
        SLED_PULL: '103', 
        LUNGE: '20', 
        WALL_BALL: '6', 
        FARMER: '24', 
        DEADLIFT: '100', // For hybrids
        KETTLEBELL: '24' 
    },
    MEN_PRO: { 
        SLED_PUSH: '202', 
        SLED_PULL: '153', 
        LUNGE: '30', 
        WALL_BALL: '9', 
        FARMER: '32', 
        DEADLIFT: '140',
        KETTLEBELL: '32'
    },
    WOMEN_OPEN: { 
        SLED_PUSH: '102', 
        SLED_PULL: '78', 
        LUNGE: '10', 
        WALL_BALL: '4', 
        FARMER: '16', 
        DEADLIFT: '70',
        KETTLEBELL: '16'
    },
    WOMEN_PRO: { 
        SLED_PUSH: '152', 
        SLED_PULL: '103', 
        LUNGE: '20', 
        WALL_BALL: '6', 
        FARMER: '24', 
        DEADLIFT: '100',
        KETTLEBELL: '24'
    },
    DOUBLES_MEN: { 
        SLED_PUSH: '152', 
        SLED_PULL: '103', 
        LUNGE: '20', 
        WALL_BALL: '6', 
        FARMER: '24', 
        DEADLIFT: '100',
        KETTLEBELL: '24'
    },
    DOUBLES_WOMEN: { 
        SLED_PUSH: '102', 
        SLED_PULL: '78', 
        LUNGE: '10', 
        WALL_BALL: '4', 
        FARMER: '16', 
        DEADLIFT: '70',
        KETTLEBELL: '16'
    },
    DOUBLES_MIXED: { 
        SLED_PUSH: '152', 
        SLED_PULL: '103', 
        LUNGE: '20', 
        WALL_BALL: '6', 
        FARMER: '24', 
        DEADLIFT: '100',
        KETTLEBELL: '24'
    }
} as const;

export type HyroxDivision = keyof typeof HYROX_STANDARDS;