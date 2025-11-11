import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatar?: string;
  xp: number;
  level: number;
  badges: Badge[];
  completedQuizzes: string[]; // quiz IDs
  visitedPlaces: string[]; // place IDs
}

interface GameState {
  profile: UserProfile | null;
  weeklyRank: number;
  
  initProfile: (username: string, displayName: string) => void;
  addXP: (amount: number) => void;
  awardBadge: (badge: Badge) => void;
  markQuizCompleted: (quizId: string) => void;
  markPlaceVisited: (placeId: string) => void;
  calculateLevel: () => number;
}

// XP thresholds for levels
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      profile: null,
      weeklyRank: 0,
      
      initProfile: (username, displayName) => {
        const existing = get().profile;
        if (existing && existing.username === username) return;
        
        set({
          profile: {
            username,
            displayName,
            xp: 0,
            level: 1,
            badges: [],
            completedQuizzes: [],
            visitedPlaces: [],
          }
        });
      },
      
      addXP: (amount) => set((state) => {
        if (!state.profile) return state;
        
        const newXP = state.profile.xp + amount;
        const newLevel = get().calculateLevel();
        
        return {
          profile: {
            ...state.profile,
            xp: newXP,
            level: newLevel,
          }
        };
      }),
      
      awardBadge: (badge) => set((state) => {
        if (!state.profile) return state;
        
        // Check if badge already earned
        const hasIt = state.profile.badges.some(b => b.id === badge.id);
        if (hasIt) return state;
        
        return {
          profile: {
            ...state.profile,
            badges: [...state.profile.badges, { ...badge, earnedAt: new Date().toISOString() }],
          }
        };
      }),
      
      markQuizCompleted: (quizId) => set((state) => {
        if (!state.profile || state.profile.completedQuizzes.includes(quizId)) return state;
        
        return {
          profile: {
            ...state.profile,
            completedQuizzes: [...state.profile.completedQuizzes, quizId],
          }
        };
      }),
      
      markPlaceVisited: (placeId) => set((state) => {
        if (!state.profile || state.profile.visitedPlaces.includes(placeId)) return state;
        
        return {
          profile: {
            ...state.profile,
            visitedPlaces: [...state.profile.visitedPlaces, placeId],
          }
        };
      }),
      
      calculateLevel: () => {
        const profile = get().profile;
        if (!profile) return 1;
        
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
          if (profile.xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
          }
        }
        return 1;
      },
    }),
    {
      name: 'game-storage',
    }
  )
);
