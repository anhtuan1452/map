import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];

export const XPDisplay: React.FC = () => {
  const { t } = useTranslation();
  const profile = useGameStore((state) => state.profile);
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGainAmount, setXPGainAmount] = useState(0);
  const [prevXP, setPrevXP] = useState(0);

  useEffect(() => {
    if (profile && profile.xp > prevXP && prevXP > 0) {
      const gain = profile.xp - prevXP;
      setXPGainAmount(gain);
      setShowXPGain(true);
      setTimeout(() => setShowXPGain(false), 2000);
    }
    if (profile) setPrevXP(profile.xp);
  }, [profile?.xp]);

  if (!profile) return null;

  const currentLevel = profile.level;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInCurrentLevel = profile.xp - currentThreshold;
  const xpNeededForNextLevel = nextThreshold - currentThreshold;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);
  const isMaxLevel = currentLevel >= LEVEL_THRESHOLDS.length;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
      {/* XP Gain Notification */}
      {showXPGain && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce flex items-center gap-1 z-10">
          <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
          <span className="font-bold">+{xpGainAmount} XP</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{profile.displayName}</h3>
            <p className="text-xs text-gray-500">
              {t('level', { defaultValue: 'Cấp độ' })} {currentLevel}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-blue-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-lg font-bold">{profile.xp}</span>
          </div>
          <p className="text-xs text-gray-500">
            {t('totalXP', { defaultValue: 'Tổng XP' })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {!isMaxLevel && (
        <>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>{xpInCurrentLevel} XP</span>
            <span className="font-medium">
              {xpNeededForNextLevel - xpInCurrentLevel} {t('xpToNextLevel', { defaultValue: 'XP tới cấp tiếp' })}
            </span>
            <span>{xpNeededForNextLevel} XP</span>
          </div>
        </>
      )}

      {isMaxLevel && (
        <div className="text-center py-2">
          <p className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {t('maxLevel', { defaultValue: 'Đã đạt cấp độ tối đa!' })}
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </p>
        </div>
      )}
    </div>
  );
};
