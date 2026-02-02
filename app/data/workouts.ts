export const ALL_WORKOUTS = [
  // =======================================================
  // 1. HYBRID / FULL RACE SIMULATIONS
  // =======================================================
  { 
    id: 'hyb_1', title: 'THE PUNISHER', station: 'HYBRID', type: 'COMPROMISED', level: 'ADVANCED',
    desc: 'Strict continuous movement. No rest between runs and stations.',
    estTime: '50-60 MINS',
    steps: ['1km Run (Fast)', '50m Sled Push (Heavy)', '1km Run (Fast)', '20 Burpees'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 450, runKm: 8, sledKm: 0.2 } 
  },
  { 
    id: 'hyb_2', title: 'ENGINE ROOM', station: 'HYBRID', type: 'ENDURANCE', level: 'INTERMEDIATE',
    desc: 'Target Race Pace. Practice moving through stations without stopping.',
    estTime: '45-55 MINS',
    steps: ['1km Run (Race Pace)', '500m Row (Steady)', '1km Run (Race Pace)', '100m Farmers Carry'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 400, runKm: 8, sledKm: 0 }
  },
  { 
    id: 'hyb_3', title: 'ROXZONE SPRINT', station: 'HYBRID', type: 'SPEED', level: 'ELITE',
    desc: 'Focus on transition speed. Minimal air between tasks.',
    estTime: '30-40 MINS',
    steps: ['400m Sprint', '15 Wall Balls', '400m Sprint', '10m Sled Pull'],
    rounds: 'Repeat 6 Rounds',
    stats: { xp: 350, runKm: 4.8, sledKm: 0.06 }
  },
  { 
    id: 'hyb_4', title: 'THE HALF SIM (A)', station: 'HYBRID', type: 'SIMULATION', level: 'ADVANCED',
    desc: 'The first half of a standard Hyrox race. High volume.',
    estTime: '40-50 MINS',
    steps: ['1km Run', '1000m Ski', '1km Run', '50m Sled Push', '1km Run', '50m Sled Pull', '1km Run', '80m Burpees'],
    rounds: '1 Round For Time',
    stats: { xp: 500, runKm: 4, sledKm: 0.1 }
  },
  { 
    id: 'hyb_5', title: 'THE HALF SIM (B)', station: 'HYBRID', type: 'SIMULATION', level: 'ADVANCED',
    desc: 'The second half of a standard Hyrox race. Grip and leg focus.',
    estTime: '40-50 MINS',
    steps: ['1km Run', '1000m Row', '1km Run', '200m Farmers', '1km Run', '100m Lunges', '1km Run', '100 Wall Balls'],
    rounds: '1 Round For Time',
    stats: { xp: 500, runKm: 4, sledKm: 0 }
  },
  { 
    id: 'hyb_6', title: 'LEG COMPROMISE', station: 'HYBRID', type: 'LEGS', level: 'INTERMEDIATE',
    desc: 'Heavy leg fatigue simulation for running resilience.',
    estTime: '35-45 MINS',
    steps: ['800m Run', '40 Lunges', '40 Air Squats', '400m Run'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 300, runKm: 4.8, sledKm: 0 }
  },

  // =======================================================
  // 2. SKI ERG PROTOCOLS
  // =======================================================
  { 
    id: 'ski_1', title: 'SKI INTERVALS', station: 'SKI ERG', type: 'POWER', level: 'ALL LEVELS',
    desc: 'Build upper body aerobic capacity. Focus on high stroke rate.',
    estTime: '25-30 MINS',
    steps: ['250m SkiErg (Sprint)', '90s Rest', '250m SkiErg (Sprint)', '90s Rest'],
    rounds: 'Repeat 8 Rounds',
    stats: { xp: 200, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'ski_2', title: 'VO2 MAX SKI', station: 'SKI ERG', type: 'AEROBIC', level: 'ELITE',
    desc: 'Short, sharp bursts to increase maximum oxygen uptake.',
    estTime: '20 MINS',
    steps: ['30s Ski (Max Effort)', '30s Rest'],
    rounds: 'Repeat 20 Rounds',
    stats: { xp: 250, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'ski_3', title: 'THE 5K SKI', station: 'SKI ERG', type: 'ENDURANCE', level: 'ADVANCED',
    desc: 'Pure aerobic capacity builder. Steady state zone 2 work.',
    estTime: '20-25 MINS',
    steps: ['5000m Ski Erg (Zone 2)'],
    rounds: '1 Round',
    stats: { xp: 300, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'ski_4', title: 'MINUTE MAN', station: 'SKI ERG', type: 'THRESHOLD', level: 'INTERMEDIATE',
    desc: 'EMOM style training. Consistency is key.',
    estTime: '30 MINS',
    steps: ['Min 1: 150m Ski', 'Min 2: 15 Burpees', 'Min 3: Rest'],
    rounds: 'Repeat 10 Rounds (30 Mins)',
    stats: { xp: 350, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 3. SLED PUSH PROTOCOLS
  // =======================================================
  { 
    id: 'push_1', title: 'QUAD BURNER', station: 'SLED PUSH', type: 'STRENGTH', level: 'ADVANCED',
    desc: 'Heavy leg drive simulation for the Sled Push.',
    estTime: '35-45 MINS',
    steps: ['25m Sled Push (Very Heavy)', '10 Box Jumps', '25m Sled Push', '200m Run'],
    rounds: 'Repeat 5 Rounds',
    stats: { xp: 300, runKm: 1, sledKm: 0.25 }
  },
  { 
    id: 'push_2', title: 'SPEED SLEDS', station: 'SLED PUSH', type: 'SPEED', level: 'BEGINNER',
    desc: 'Lighter weight, focusing on running mechanics behind the sled.',
    estTime: '25-30 MINS',
    steps: ['15m Sled Sprint (Light)', '50m Sprint Run', '90s Rest'],
    rounds: 'Repeat 8 Rounds',
    stats: { xp: 150, runKm: 0.4, sledKm: 0.12 }
  },
  { 
    id: 'push_3', title: 'HEAVY PYRAMID', station: 'SLED PUSH', type: 'STRENGTH', level: 'ELITE',
    desc: 'Increase weight every round until failure.',
    estTime: '20-30 MINS',
    steps: ['15m Push', 'Add 20kg', '90s Rest'],
    rounds: 'Repeat until failure',
    stats: { xp: 250, runKm: 0, sledKm: 0.1 }
  },
  { 
    id: 'push_4', title: 'PUSH & RUN', station: 'SLED PUSH', type: 'HYBRID', level: 'INTERMEDIATE',
    desc: 'Simulating the "Roxzone" feeling after a sled.',
    estTime: '30-40 MINS',
    steps: ['50m Sled Push (Comp Weight)', '400m Run (Threshold)'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 280, runKm: 1.6, sledKm: 0.2 }
  },

  // =======================================================
  // 4. SLED PULL PROTOCOLS
  // =======================================================
  { 
    id: 'pull_1', title: 'BACK CHAIN', station: 'SLED PULL', type: 'STRENGTH', level: 'INTERMEDIATE',
    desc: 'Posterior chain endurance. Keep chest up and hips low.',
    estTime: '30-40 MINS',
    steps: ['25m Sled Pull', '15 Kettlebell Swings', '25m Sled Pull', '400m Run'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 250, runKm: 1.6, sledKm: 0.2 }
  },
  { 
    id: 'pull_2', title: 'HEAVY ANCHOR', station: 'SLED PULL', type: 'POWER', level: 'ADVANCED',
    desc: 'Short, heavy pulls to build raw power.',
    estTime: '20 MINS',
    steps: ['10m Sled Pull (Max Weight)', '60s Rest'],
    rounds: 'Repeat 10 Rounds',
    stats: { xp: 200, runKm: 0, sledKm: 0.1 }
  },
  { 
    id: 'pull_3', title: 'ARM PUMP', station: 'SLED PULL', type: 'ENDURANCE', level: 'BEGINNER',
    desc: 'Lighter weight, high volume walking backwards.',
    estTime: '25-35 MINS',
    steps: ['50m Sled Pull (Light)', '20 Pushups'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 180, runKm: 0, sledKm: 0.2 }
  },

  // =======================================================
  // 5. BURPEE BROAD JUMPS
  // =======================================================
  { 
    id: 'burp_1', title: 'JUMP CAPACITY', station: 'BURPEES', type: 'EXPLOSIVE', level: 'ADVANCED',
    desc: 'Plyometric fatigue management. Land soft.',
    estTime: '30-40 MINS',
    steps: ['40m Burpee Broad Jumps', '400m Run (Recovery Pace)', '20 Air Squats'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 220, runKm: 1.6, sledKm: 0 }
  },
  { 
    id: 'burp_2', title: 'TECHNIQUE 101', station: 'BURPEES', type: 'SKILL', level: 'BEGINNER',
    desc: 'Focus on efficient hip extension and landing mechanics.',
    estTime: '20-25 MINS',
    steps: ['10 Burpee Broad Jumps', '30s Rest', '10 Burpee Broad Jumps', '60s Rest'],
    rounds: 'Repeat 6 Rounds',
    stats: { xp: 150, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'burp_3', title: 'THE MILE', station: 'BURPEES', type: 'ENDURANCE', level: 'ELITE',
    desc: 'Volume accumulation. Mental toughness.',
    estTime: '45-60 MINS',
    steps: ['100m Burpee Broad Jumps', '800m Run'],
    rounds: 'Repeat 2 Rounds',
    stats: { xp: 350, runKm: 1.6, sledKm: 0 }
  },

  // =======================================================
  // 6. ROWING
  // =======================================================
  { 
    id: 'row_1', title: 'ROW FLUSH', station: 'ROWING', type: 'AEROBIC', level: 'BEGINNER',
    desc: 'Learning to recover while working. Negative splits.',
    estTime: '25-30 MINS',
    steps: ['1000m Row (Moderate)', '2 min Rest', '500m Row (Fast)', '1 min Rest'],
    rounds: 'Repeat 3 Rounds',
    stats: { xp: 180, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'row_2', title: '2K TEST PREP', station: 'ROWING', type: 'THRESHOLD', level: 'ELITE',
    desc: 'Classic interval training for the 2km distance.',
    estTime: '30-40 MINS',
    steps: ['500m Row (Target 2k Pace)', '90s Rest'],
    rounds: 'Repeat 6 Rounds',
    stats: { xp: 250, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'row_3', title: 'POWER STROKES', station: 'ROWING', type: 'POWER', level: 'INTERMEDIATE',
    desc: 'Max watts training. Focus on the catch.',
    estTime: '20 MINS',
    steps: ['10 Strokes Max Power', '50 Strokes Recovery'],
    rounds: 'Repeat 10 Rounds',
    stats: { xp: 200, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'row_4', title: '5K ROW', station: 'ROWING', type: 'ENDURANCE', level: 'ADVANCED',
    desc: 'Mental toughness and steady state cardio.',
    estTime: '20-25 MINS',
    steps: ['5000m Row (Consistent Pace)'],
    rounds: '1 Round',
    stats: { xp: 300, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 7. FARMERS CARRY
  // =======================================================
  { 
    id: 'farm_1', title: 'GRIP GAUNTLET', station: 'FARMERS', type: 'STRENGTH', level: 'ELITE',
    desc: 'Compromised grip training for the Farmers Carry.',
    estTime: '25-30 MINS',
    steps: ['200m Farmers Carry', '1 min Dead Hang', '200m Run (Shake out arms)'],
    rounds: 'Repeat 3 Rounds',
    stats: { xp: 200, runKm: 0.6, sledKm: 0 }
  },
  { 
    id: 'farm_2', title: 'TRACK CARRY', station: 'FARMERS', type: 'ENDURANCE', level: 'INTERMEDIATE',
    desc: 'Long distance carry endurance.',
    estTime: '35-45 MINS',
    steps: ['400m Run', '100m Farmers Carry', '400m Run'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 250, runKm: 3.2, sledKm: 0 }
  },
  { 
    id: 'farm_3', title: 'HEAVY HOLD', station: 'FARMERS', type: 'STRENGTH', level: 'ADVANCED',
    desc: 'Overloading the grip with heavier than competition weight.',
    estTime: '15-20 MINS',
    steps: ['50m Heavy Carry', '30s Rest'],
    rounds: 'Repeat 8 Rounds',
    stats: { xp: 220, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 8. LUNGES
  // =======================================================
  { 
    id: 'lung_1', title: 'LUNGE LEGION', station: 'LUNGES', type: 'ENDURANCE', level: 'ADVANCED',
    desc: 'High volume unilateral leg work.',
    estTime: '35-45 MINS',
    steps: ['50m Sandbag Lunges', '400m Run', '50m Sandbag Lunges', '20 Jumping Lunges'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 300, runKm: 1.6, sledKm: 0 }
  },
  { 
    id: 'lung_2', title: 'COMPROMISED LEGS', station: 'LUNGES', type: 'HYBRID', level: 'INTERMEDIATE',
    desc: 'Running on heavy legs.',
    estTime: '30-40 MINS',
    steps: ['400m Run (Hard)', '30m Lunges (Unweighted)', '400m Run (Hard)'],
    rounds: 'Repeat 5 Rounds',
    stats: { xp: 280, runKm: 4, sledKm: 0 }
  },
  { 
    id: 'lung_3', title: 'GLUTE BURNER', station: 'LUNGES', type: 'STRENGTH', level: 'BEGINNER',
    desc: 'Focusing on form and glute activation.',
    estTime: '20-25 MINS',
    steps: ['20m Lunges', '20 Air Squats', '20 Glute Bridges'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 150, runKm: 0, sledKm: 0 }
  },

  // =======================================================
  // 9. WALL BALLS
  // =======================================================
  { 
    id: 'wall_1', title: 'SHOULDER SMOKE', station: 'WALL BALLS', type: 'VOLUME', level: 'INTERMEDIATE',
    desc: 'Simulation of the final station fatigue.',
    estTime: '30-40 MINS',
    steps: ['30 Wall Balls', '10 Burpees', '30 Wall Balls', '200m Run'],
    rounds: 'Repeat 3 Rounds',
    stats: { xp: 220, runKm: 0.6, sledKm: 0 }
  },
  { 
    id: 'wall_2', title: 'KAREN BENCHMARK', station: 'WALL BALLS', type: 'THRESHOLD', level: 'ADVANCED',
    desc: 'The classic CrossFit benchmark. 150 Wall Balls for time.',
    estTime: '5-10 MINS',
    steps: ['150 Wall Balls for time'],
    rounds: '1 Round',
    stats: { xp: 300, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'wall_3', title: 'EMOM 10', station: 'WALL BALLS', type: 'AEROBIC', level: 'BEGINNER',
    desc: 'Consistent pacing practice.',
    estTime: '10 MINS',
    steps: ['10 Wall Balls every minute'],
    rounds: '10 Minutes',
    stats: { xp: 150, runKm: 0, sledKm: 0 }
  },
  { 
    id: 'wall_4', title: 'LEG & LUNG', station: 'WALL BALLS', type: 'HYBRID', level: 'ELITE',
    desc: 'Heavy squat volume under fatigue.',
    estTime: '35-45 MINS',
    steps: ['400m Run', '40 Wall Balls'],
    rounds: 'Repeat 4 Rounds',
    stats: { xp: 350, runKm: 1.6, sledKm: 0 }
  },

  // =======================================================
  // 10. BENCHMARKS & TESTS
  // =======================================================

  { 
    id: 'pft_1', title: 'THE HYROX PFT', station: 'BENCHMARK', type: 'TEST', level: 'ALL LEVELS',
    desc: 'The Official Physical Fitness Test. Use this to determine your racing division.',
    estTime: '15-40 MINS',
    steps: [
        '1000m Run', 
        '50 Burpee Broad Jumps', 
        '100 Stationary Lunges', 
        '1000m Row', 
        '30 HR Push Ups', 
        '100 Wall Balls'
    ],
    rounds: 'FOR TIME',
    stats: { xp: 500, runKm: 1, sledKm: 0 } 
  },
  { 
    id: 'pft_2', title: 'RUN TEST (5K)', station: 'BENCHMARK', type: 'TEST', level: 'ALL LEVELS',
    desc: 'Standard aerobic capacity test. Flat road or track.',
    estTime: '20-35 MINS',
    steps: ['5km Run for time'],
    rounds: '1 Round',
    stats: { xp: 300, runKm: 5, sledKm: 0 } 
  }

];