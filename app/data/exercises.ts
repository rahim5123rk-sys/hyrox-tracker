export interface Exercise {
  id: string;
  name: string;
  type: string; // Used for icon/color logic later if needed
}

export const EXERCISE_LIBRARY: Exercise[] = [
  // --- RUNNING ---
  { id: 'run_200', name: '200m Sprint', type: 'Run' },
  { id: 'run_400', name: '400m Run (Threshold)', type: 'Run' },
  { id: 'run_800', name: '800m Run (Pace)', type: 'Run' },
  { id: 'run_1k', name: '1km Run', type: 'Run' },
  { id: 'run_1.5k', name: '1.5km Run', type: 'Run' },
  { id: 'run_5k', name: '5km Run (Steady)', type: 'Run' },
  { id: 'shuttle_10', name: '10x10m Shuttle Run', type: 'Run' },

  // --- SKI ERG ---
  { id: 'ski_250', name: '250m Ski Erg (Sprint)', type: 'Ski' },
  { id: 'ski_500', name: '500m Ski Erg', type: 'Ski' },
  { id: 'ski_1000', name: '1000m Ski Erg', type: 'Ski' },
  { id: 'ski_2000', name: '2000m Ski Erg', type: 'Ski' },
  { id: 'ski_cal_15', name: '15 Cal Ski Sprint', type: 'Ski' },
  { id: 'ski_cal_30', name: '30 Cal Ski', type: 'Ski' },

  // --- SLED PUSH ---
  { id: 'push_25_l', name: '25m Sled Push (Light)', type: 'Sled' },
  { id: 'push_25_c', name: '25m Sled Push (Comp Weight)', type: 'Sled' },
  { id: 'push_25_h', name: '25m Sled Push (Heavy)', type: 'Sled' },
  { id: 'push_50_c', name: '50m Sled Push (Comp Weight)', type: 'Sled' },
  { id: 'push_50_h', name: '50m Sled Push (Heavy)', type: 'Sled' },

  // --- SLED PULL ---
  { id: 'pull_25_l', name: '25m Sled Pull (Light)', type: 'Sled' },
  { id: 'pull_25_c', name: '25m Sled Pull (Comp Weight)', type: 'Sled' },
  { id: 'pull_25_h', name: '25m Sled Pull (Heavy)', type: 'Sled' },
  { id: 'pull_50_c', name: '50m Sled Pull (Comp Weight)', type: 'Sled' },

  // --- BURPEES ---
  { id: 'bbj_40', name: '40m Burpee Broad Jumps', type: 'Burpee' },
  { id: 'bbj_80', name: '80m Burpee Broad Jumps', type: 'Burpee' },
  { id: 'burp_10', name: '10 Burpees', type: 'Burpee' },
  { id: 'burp_20', name: '20 Burpees', type: 'Burpee' },
  { id: 'burp_erg_10', name: '10 Burpees Over Erg', type: 'Burpee' },

  // --- ROWING ---
  { id: 'row_250', name: '250m Row (Sprint)', type: 'Row' },
  { id: 'row_500', name: '500m Row', type: 'Row' },
  { id: 'row_1000', name: '1000m Row', type: 'Row' },
  { id: 'row_2000', name: '2000m Row', type: 'Row' },
  { id: 'row_cal_20', name: '20 Cal Row', type: 'Row' },

  // --- FARMERS CARRY ---
  { id: 'farm_100', name: '100m Farmers Carry', type: 'Carry' },
  { id: 'farm_200', name: '200m Farmers Carry', type: 'Carry' },
  { id: 'farm_400', name: '400m Farmers Carry', type: 'Carry' },
  { id: 'farm_hold', name: '1 Min Farmers Hold', type: 'Carry' },

  // --- LUNGES ---
  { id: 'lunge_50', name: '50m Sandbag Lunges', type: 'Lunge' },
  { id: 'lunge_100', name: '100m Sandbag Lunges', type: 'Lunge' },
  { id: 'lunge_body_20', name: '20 Alt Lunges (Bodyweight)', type: 'Lunge' },
  { id: 'lunge_jump_20', name: '20 Jumping Lunges', type: 'Lunge' },

  // --- WALL BALLS ---
  { id: 'wall_50', name: '50 Wall Balls', type: 'WallBall' },
  { id: 'wall_75', name: '75 Wall Balls', type: 'WallBall' },
  { id: 'wall_100', name: '100 Wall Balls', type: 'WallBall' },
  { id: 'wall_heavy_20', name: '20 Heavy Wall Balls', type: 'WallBall' },

  // --- HYBRID / FUNCTIONAL ---
  { id: 'box_10', name: '10 Box Jumps', type: 'Plyo' },
  { id: 'box_20', name: '20 Box Jumps', type: 'Plyo' },
  { id: 'squat_20', name: '20 Air Squats', type: 'Legs' },
  { id: 'squat_50', name: '50 Air Squats', type: 'Legs' },
  { id: 'pushup_10', name: '10 Hand Release Pushups', type: 'Upper' },
  { id: 'pushup_20', name: '20 Pushups', type: 'Upper' },
  { id: 'kb_swing_20', name: '20 KB Swings (24/16kg)', type: 'Kettlebell' },
  { id: 'kb_snatch_10', name: '10 KB Snatches', type: 'Kettlebell' },
  { id: 'thruster_10', name: '10 KB Thrusters', type: 'Kettlebell' },
  { id: 'situp_20', name: '20 Butterfly Situps', type: 'Core' },
  { id: 'plank_60', name: '60s Plank Hold', type: 'Core' },
  { id: 'bear_20', name: '20m Bear Crawl', type: 'Body' },
];