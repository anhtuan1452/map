import React from 'react';
import { useGameStore, Badge } from '../store/gameStore';
import { Award, Lock, CheckCircle2, Zap, MapPin, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Define all available badges
const ALL_BADGES: Badge[] = [
  {
    id: 'quiz_master',
    name: 'Bậc Thầy Câu Hỏi',
    icon: 'Target',
    description: 'Hoàn thành 10 câu đố',
  },
  {
    id: 'perfect_score',
    name: 'Điểm Hoàn Hảo',
    icon: 'Award',
    description: 'Trả lời đúng tất cả câu hỏi trong 1 bài kiểm tra',
  },
  {
    id: 'speed_demon',
    name: 'Tia Chớp',
    icon: 'Zap',
    description: 'Hoàn thành câu đố trong vòng 10 giây',
  },
  {
    id: 'explorer',
    name: 'Nhà Thám Hiểm',
    icon: 'MapPin',
    description: 'Ghé thăm tất cả các di tích',
  },
  {
    id: 'first_steps',
    name: 'Bước Đầu Tiên',
    icon: 'CheckCircle2',
    description: 'Hoàn thành câu đố đầu tiên',
  },
];

const iconMap: Record<string, React.ReactNode> = {
  Target: <Target className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  MapPin: <MapPin className="w-6 h-6" />,
  CheckCircle2: <CheckCircle2 className="w-6 h-6" />,
};

export const BadgeGrid: React.FC = () => {
  const { t } = useTranslation();
  const profile = useGameStore((state) => state.profile);
  
  if (!profile) return null;

  const earnedBadgeIds = new Set(profile.badges.map(b => b.id));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-500" />
        {t('badges', { defaultValue: 'Huy Hiệu' })}
        <span className="text-sm font-normal text-gray-500">
          ({profile.badges.length}/{ALL_BADGES.length})
        </span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_BADGES.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const earnedBadge = profile.badges.find(b => b.id === badge.id);
          
          return (
            <div
              key={badge.id}
              className={`
                relative group p-4 rounded-lg border-2 transition-all duration-200
                ${isEarned 
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 hover:shadow-md hover:scale-105' 
                  : 'bg-gray-50 border-gray-300 opacity-60'
                }
              `}
            >
              {/* Badge Icon */}
              <div className={`
                flex items-center justify-center mb-2
                ${isEarned ? 'text-yellow-600' : 'text-gray-400'}
              `}>
                {isEarned ? (
                  iconMap[badge.icon] || <Award className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>

              {/* Badge Name */}
              <h4 className={`
                text-xs font-semibold text-center mb-1
                ${isEarned ? 'text-gray-800' : 'text-gray-500'}
              `}>
                {t(`badge.${badge.id}.name`, { defaultValue: badge.name })}
              </h4>

              {/* Badge Description */}
              <p className={`
                text-xs text-center
                ${isEarned ? 'text-gray-600' : 'text-gray-400'}
              `}>
                {t(`badge.${badge.id}.description`, { defaultValue: badge.description })}
              </p>

              {/* Earned Date */}
              {isEarned && earnedBadge?.earnedAt && (
                <p className="text-xs text-yellow-600 text-center mt-2 font-medium">
                  {new Date(earnedBadge.earnedAt).toLocaleDateString('vi-VN')}
                </p>
              )}

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {isEarned 
                  ? t('badgeEarned', { defaultValue: 'Đã đạt được!' })
                  : t('badgeLocked', { defaultValue: 'Chưa mở khóa' })
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
