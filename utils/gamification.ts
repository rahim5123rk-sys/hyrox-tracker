import AsyncStorage from '@react-native-async-storage/async-storage';

export const RANKS = [
  { id: 1, title: 'RECRUIT', minXP: 0, benefit: 'Basic Access' },
  { id: 2, title: 'SOLDIER', minXP: 500, benefit: 'Unlocks Stats Graph' },
  { id: 3, title: 'OPERATOR', minXP: 1500, benefit: 'Unlocks Adv. Templates' },
  { id: 4, title: 'VETERAN', minXP: 3000, benefit: 'Elite Strategies' },
  { id: 5, title: 'SPECIALIST', minXP: 5000, benefit: 'Coach Access' },
  { id: 6, title: 'ELITE', minXP: 8000, benefit: 'Pro League Invite' },
  { id: 7, title: 'APEX', minXP: 12000, benefit: 'Maximum Rank' },
];

export const calculateLevel = (currentXP: number) => {
  const rankIndex = RANKS.slice().reverse().findIndex(rank => currentXP >= rank.minXP);
  const currentRankIndex = rankIndex >= 0 ? RANKS.length - 1 - rankIndex : 0;
  
  const currentRank = RANKS[currentRankIndex];
  const nextRank = RANKS[currentRankIndex + 1] || null;

  let progress = 0;
  let xpNeeded = 0;

  if (nextRank) {
    const xpInLevel = currentXP - currentRank.minXP;
    const range = nextRank.minXP - currentRank.minXP;
    progress = xpInLevel / range;
    xpNeeded = nextRank.minXP - currentXP;
  } else {
    progress = 1;
  }

  return { currentRank, nextRank, progress, xpNeeded };
};

// --- NEW: RETENTION LOGIC ---

export const updateStreak = async () => {
  const today = new Date().toDateString();
  const lastLogin = await AsyncStorage.getItem('last_login_date');
  let currentStreak = parseInt(await AsyncStorage.getItem('user_streak') || '0');

  if (lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastLogin === yesterday.toDateString()) {
      currentStreak += 1; // Continued streak
    } else {
      currentStreak = 1; // Broken streak, reset
    }
    
    await AsyncStorage.setItem('last_login_date', today);
    await AsyncStorage.setItem('user_streak', currentStreak.toString());
  }
  return currentStreak;
};

export const checkCombineStatus = async () => {
  const lastCombine = await AsyncStorage.getItem('last_combine_date');
  const currentMonth = new Date().getMonth();
  
  if (!lastCombine) return { required: true, month: currentMonth };
  
  const lastDate = new Date(lastCombine);
  return { 
    required: lastDate.getMonth() !== currentMonth, // True if different month
    month: currentMonth 
  };
};