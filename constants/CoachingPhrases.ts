export const COACHING_DATABASE = {
  CRITICAL_FAILURE: [ // Behind target by > 60s
    "You hit a wall at {worst}. Your heart rate was red-lined. Back off 5% on the preceding run next time.",
    "Tactical error at {worst}. You're red-lining too early. Hyrox is won in the second half, not the first.",
    "Engine failure at {worst}. You over-pulled on the Sleds and paid for it here. Breathe more, pull less.",
    "The lactate trap caught you at {worst}. Stop racing the person in the next lane and race your own ghost.",
  ],
  STRENGTH_GAP: [ // Lost most time on a Station
    "Runs are elite, but {worst} is bleeding your clock. Add heavy carries to your Sunday session.",
    "You're a runner, but {worst} proved you need more raw power. Time to live in the squat rack.",
    "Solid aerobic base, but {worst} was a grind. Focus on compromised grip work to keep your HR lower.",
    "Technical sloppy work at {worst}. Efficiency beats effort on heavy stations. Stay low, drive hard.",
  ],
  AEROBIC_GAP: [ // Lost most time on a Run
    "You crush the weights, but your 1km loops are too slow. More Zone 2 work is non-negotiable.",
    "Power is there, but you can't recover between stations. Your recovery pace is currently a survival pace.",
    "Elite strength at the stations, but the running 'distraction' is hurting you. Volume is the only fix.",
    "Stop walking the Roxzone. Every second standing still is a second you'll never get back.",
  ],
  ELITE: [ // Ahead or near target
    "Clinical performance. You stayed ahead of the ghost pacer. It's time to set a sub-{time} goal.",
    "Absolute masterclass in pacing. You didn't just race; you engineered a result.",
    "Textbook execution. You controlled the Sleds and didn't let the runs fall apart. You're ready for Pro.",
    "You've outgrown this target time. Stop playing safe and go into the dark place next time.",
  ]
};