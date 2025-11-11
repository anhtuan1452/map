import React, { useState, useEffect } from 'react';
import { Swords, Clock, Users, Play, Award, Calendar, Plus, X, Trophy, Check, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BattleArena } from './BattleArena';
import { 
  getBattles, 
  getBattle, 
  createBattle, 
  startBattle, 
  getLeaderboard,
  getUserProfile,
  getApiUrl,
  getBattleLiveLeaderboard
} from '../services/api';

interface Battle {
  id: number;
  created_at: string;
  scheduled_start_time: string;
  duration_minutes: number;
  status: 'pending' | 'in_progress' | 'completed';
  participants: string[];
  participant_count: number;
}

interface LeaderboardEntry {
  rank: number;
  user_name: string;
  display_name?: string;
  avatar?: string | null;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score_percentage: number;
  total_xp?: number;
  level?: number;
  total_time: number;
  average_time: number;
}

interface BattleListProps {
  userName: string;
  isAdmin: boolean;
}

export const BattleList: React.FC<BattleListProps> = ({ userName, isAdmin }) => {
  const { t } = useTranslation();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBattleId, setActiveBattleId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({
    scheduled_start_time: '',
    duration_minutes: 10,
    question_count: 6
  });

  const [showArchived, setShowArchived] = useState(false);
  const [viewingLeaderboard, setViewingLeaderboard] = useState<number | null>(null);
  const [battleLeaderboard, setBattleLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const [timeLeft, setTimeLeft] = useState<Record<number, number>>({});

  // Helper to get full avatar URL
  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    
    // For localhost development, use direct API port
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:8000${avatar}`;
      }
    }
    
    // For Cloudflare tunnel
    const baseUrl = getApiUrl();
    return `${baseUrl}${avatar}`;
  };

  useEffect(() => {
    loadBattles();
    const interval = setInterval(loadBattles, 10000); // Refresh every 10s
    
    // Update countdown timers every second
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        const newTimes: Record<number, number> = {};
        battles.forEach(battle => {
          if (battle.status === 'pending') {
            const startTime = new Date(battle.scheduled_start_time);
            const now = new Date();
            const diff = startTime.getTime() - now.getTime();
            newTimes[battle.id] = Math.max(0, Math.floor(diff / 1000));
          } else if (battle.status === 'in_progress') {
            const startTime = new Date(battle.scheduled_start_time);
            const endTime = new Date(startTime.getTime() + (battle.duration_minutes * 60 * 1000));
            const now = new Date();
            const diff = endTime.getTime() - now.getTime();
            newTimes[battle.id] = Math.max(0, Math.floor(diff / 1000));
          }
        });
        return newTimes;
      });
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [battles]);

  const loadBattles = async () => {
    try {
      const data = await getBattles();
      setBattles(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load battles:', err);
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Load quiz attempts leaderboard (not XP-based)
      const data = await getLeaderboard();
      
      // Load avatars for all users
      const enrichedData = await Promise.all(
        data.map(async (entry: any) => {
          try {
            const profile = await getUserProfile(entry.user_name);
            return {
              ...entry,
              avatar: profile.avatar,
              display_name: profile.display_name || entry.user_name
            };
          } catch (err) {
            return {
              ...entry,
              avatar: null,
              display_name: entry.user_name
            };
          }
        })
      );
      
      setLeaderboard(enrichedData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const handleParticipantToggle = (userName: string) => {
    console.log('🎯 Toggle participant:', userName);
    setSelectedParticipants(prev => {
      console.log('Current selected:', prev);
      if (prev.includes(userName)) {
        console.log('✅ Removing:', userName);
        return prev.filter(name => name !== userName);
      } else if (prev.length < 8) {
        console.log('✅ Adding:', userName);
        return [...prev, userName];
      } else {
        console.log('⚠️ Max limit reached (8 participants)');
      }
      return prev;
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Sắp diễn ra' },
      in_progress: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đang diễn ra' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã kết thúc' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return 'Đã bắt đầu';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleJoinBattle = async (battleId: number) => {
    // Load battle details to check status and time
    try {
      const battle = await getBattle(battleId);
      
      if (battle.status === 'pending') {
        alert('Trận đấu chưa bắt đầu!');
        return;
      }
      
      if (battle.status === 'completed') {
        // Allow viewing completed battles
        setActiveBattleId(battleId);
        return;
      }
      
      if (battle.status === 'in_progress') {
        // Check if battle has expired - still allow viewing to see results
        const startTime = new Date(battle.scheduled_start_time);
        const endTime = new Date(startTime.getTime() + (battle.duration_minutes * 60 * 1000));
        const currentTime = new Date();
        
        if (currentTime >= endTime) {
          // Battle expired but still in_progress - allow viewing results
          setActiveBattleId(battleId);
          return;
        }
      }
      
      // Check if user is participant for active battles (skip check for admin)
      if (battle.status === 'in_progress' && !battle.participants.includes(userName) && !isAdmin) {
        alert('Bạn không được tham gia trận đấu này!');
        return;
      }
      
      setActiveBattleId(battleId);
    } catch (err) {
      alert('Lỗi khi tải thông tin trận đấu!');
    }
  };

  const handleViewLeaderboard = async (battleId: number) => {
    setViewingLeaderboard(battleId);
    setLoadingLeaderboard(true);
    try {
      const data = await getBattleLiveLeaderboard(battleId);
      setBattleLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Failed to load battle leaderboard", error);
      alert("Không thể tải bảng xếp hạng cho trận đấu này.");
      setViewingLeaderboard(null);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleExitBattle = () => {
    setActiveBattleId(null);
    loadBattles();
  };

  const handleStartBattle = async (battleId: number) => {
    try {
      await startBattle(battleId);
      alert('Đã bắt đầu trận đấu!');
      loadBattles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể bắt đầu trận đấu');
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    loadLeaderboard();
  };

  const handleCreateBattle = async () => {
    if (selectedParticipants.length < 2) {
      alert('Cần chọn ít nhất 2 người chơi');
      return;
    }

    try {
      await createBattle({
        ...createForm,
        participants: selectedParticipants
      });
      
      alert('Tạo trận đấu thành công!');
      setShowCreateModal(false);
      setCreateForm({
        scheduled_start_time: '',
        duration_minutes: 10,
        question_count: 6
      });
      setSelectedParticipants([]);
      loadBattles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể tạo trận đấu');
    }
  };

  if (activeBattleId) {
    return <BattleArena battleId={activeBattleId} userName={userName} onExit={handleExitBattle} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Đang tải danh sách trận đấu...</div>
      </div>
    );
  }

  // Separate battles by status and time
  const currentTime = new Date();
  
  const activeBattles = battles.filter(battle => {
    if (battle.status !== 'in_progress') return false;
    const startTime = new Date(battle.scheduled_start_time);
    const endTime = new Date(startTime.getTime() + (battle.duration_minutes * 60 * 1000));
    return currentTime < endTime; // Still active if current time < end time
  });
  
  const pendingBattles = battles.filter(battle => {
    if (battle.status !== 'pending') return false;
    const startTime = new Date(battle.scheduled_start_time);
    return startTime > currentTime; // Pending if start time > current time
  });
  
  const expiredBattles = battles.filter(battle => {
    if (battle.status === 'completed') return true;
    if (battle.status === 'in_progress') {
      const startTime = new Date(battle.scheduled_start_time);
      const endTime = new Date(startTime.getTime() + (battle.duration_minutes * 60 * 1000));
      return currentTime >= endTime; // Expired if current time >= end time
    }
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in">
      <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 flex items-center gap-3 tracking-wide">
            <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-spin-slow" />
            Quiz Battle Arena
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Thi đấu trực tiếp với người chơi khác!</p>
        </div>
        {/* Nút tạo battle chỉ hiển thị cho admin */}
        {isAdmin && (
          <button
            className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
            onClick={openCreateModal}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Tạo trận đấu mới
          </button>
        )}
      </div>

      {/* Active Battles - Đang diễn ra */}
      {activeBattles.length > 0 && (
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600 animate-pulse" />
            🔥 Đang diễn ra ({activeBattles.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeBattles.map((battle) => {
              const isParticipant = battle.participants.includes(userName);
              const remainingTime = timeLeft[battle.id] || 0;
              return (
                <div
                  key={battle.id}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all animate-fade-in-up relative overflow-hidden"
                >
                  {/* Live indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Battle #{battle.id}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        Còn {formatCountdown(remainingTime)}
                      </p>
                    </div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      LIVE
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{battle.participant_count} người chơi</span>
                    </div>
                    {isParticipant ? (
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs inline-block animate-pulse border border-blue-300">
                        🎯 Bạn đang tham gia
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs inline-block">
                        👀 Bạn không thuộc trận này
                      </div>
                    )}
                  </div>
                  
                  {isParticipant ? (
                    <button
                      onClick={() => handleJoinBattle(battle.id)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-md animate-bounce"
                    >
                      <Play className="w-5 h-5" />
                      Tiếp tục thi đấu
                    </button>
                  ) : isAdmin && (
                    <button
                      onClick={() => handleJoinBattle(battle.id)}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <Eye className="w-5 h-5" />
                      Vào quan sát
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Battles - Sắp diễn ra */}
      {pendingBattles.length > 0 && (
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-600 animate-pulse" />
            ⏰ Sắp diễn ra ({pendingBattles.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingBattles.map((battle) => {
              const isParticipant = battle.participants.includes(userName);
              const remainingTime = timeLeft[battle.id] || 0;
              const isStartingSoon = remainingTime > 0 && remainingTime <= 300; // 5 minutes
              
              return (
                <div
                  key={battle.id}
                  className={`bg-gradient-to-br from-yellow-50 to-orange-50 border-2 rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all animate-fade-in-up ${
                    isStartingSoon ? 'border-orange-400 shadow-orange-200 shadow-lg' : 'border-yellow-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Battle #{battle.id}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(battle.scheduled_start_time)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isStartingSoon 
                        ? 'bg-orange-500 text-white animate-pulse' 
                        : 'bg-yellow-500 text-yellow-900'
                    }`}>
                      {remainingTime > 0 ? formatCountdown(remainingTime) : 'Sẵn sàng'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{battle.participant_count} người chơi đã được chọn</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Thời gian: {battle.duration_minutes} phút</span>
                    </div>
                    {isParticipant ? (
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs inline-block border border-blue-300">
                        🎯 Bạn đã được chọn tham gia!
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs inline-block">
                        👀 Bạn không thuộc trận này
                      </div>
                    )}
                  </div>
                  
                  {/* Countdown timer */}
                  {remainingTime > 0 && (
                    <div className="mb-4 p-3 bg-white/50 rounded-lg border border-yellow-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-700 font-mono">
                          {formatTime(remainingTime)}
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">
                          {isStartingSoon ? '🚀 Sắp bắt đầu!' : 'Thời gian còn lại'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Button bắt đầu battle cho admin */}
                  {isAdmin && (
                    <button
                      onClick={() => handleStartBattle(battle.id)}
                      disabled={remainingTime > 300} // Only allow manual start if more than 5 min left
                      className={`w-full mt-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md ${
                        remainingTime <= 300
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      {remainingTime <= 300 ? 'Bắt đầu trận đấu' : 'Chưa đến giờ'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired Battles - Đã kết thúc/hết hạn */}
      {expiredBattles.length > 0 && (
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-gray-600" />
            🏆 Đã kết thúc ({expiredBattles.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showArchived ? expiredBattles : expiredBattles.slice(0, 9)).map((battle) => {
              const isParticipant = battle.participants.includes(userName);
              const isExpiredInProgress = battle.status === 'in_progress';
              
              return (
                <div
                  key={battle.id}
                  className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-300 rounded-xl p-4 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  onClick={() => handleViewLeaderboard(battle.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-800">Battle #{battle.id}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isExpiredInProgress 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {isExpiredInProgress ? 'HẾT HẠN' : 'KẾT THÚC'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(battle.scheduled_start_time)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {battle.participant_count} người chơi
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card's onClick from firing
                      handleViewLeaderboard(battle.id);
                    }}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all flex items-center justify-center gap-1 text-sm"
                  >
                    <Trophy className="w-4 h-4" />
                    Xem kết quả
                  </button>
                </div>
              );
            })}
          </div>
          
          {expiredBattles.length > 9 && (
            <div className="text-center mt-4">
              <button 
                onClick={() => setShowArchived(prev => !prev)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                {showArchived ? 'Ẩn bớt' : `Xem thêm ${expiredBattles.length - 9} trận đấu đã kết thúc`}
              </button>
            </div>
          )}
        </div>
      )}

      {battles.length === 0 && (
        <div className="text-center py-12 sm:py-16 animate-fade-in">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center">
            <Swords className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">Chưa có trận đấu nào</h3>
          <p className="text-gray-500 mb-4 text-sm sm:text-base">Các trận đấu sẽ xuất hiện ở đây khi được tạo</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>Đang diễn ra</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span>Sắp diễn ra</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Đã kết thúc</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem lại bảng xếp hạng */}
      {viewingLeaderboard !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Kết quả Battle #{viewingLeaderboard}
              </h2>
              <button onClick={() => setViewingLeaderboard(null)} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingLeaderboard ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Đang tải bảng xếp hạng...</p>
                </div>
              ) : battleLeaderboard.length > 0 ? (
                <div className="space-y-3">
                  {battleLeaderboard.map((participant: any, index) => {
                    const getRankColor = (rank: number) => {
                      if (rank === 1) return 'from-yellow-500 to-yellow-600';
                      if (rank === 2) return 'from-gray-400 to-gray-500';
                      if (rank === 3) return 'from-orange-600 to-orange-700';
                      return 'from-blue-500 to-blue-600';
                    };
                    
                    return (
                      <div
                        key={index}
                        className={`bg-gradient-to-r ${getRankColor(participant.rank)} p-4 rounded-lg shadow-md transition-all hover:scale-105`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-white drop-shadow">#{participant.rank}</div>
                            <div>
                              <div className="font-bold text-white text-lg">{participant.user_name}</div>
                              <div className="text-sm text-white/90">
                                {participant.correct_answers} câu đúng
                                {participant.finished && participant.time_completed && (
                                  <span className="ml-2">• {participant.time_completed}s</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white font-mono">{participant.score}</div>
                            <div className="text-xs text-white/90">XP</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có dữ liệu bảng xếp hạng cho trận đấu này.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex-shrink-0 bg-gray-50">
              <button
                onClick={() => setViewingLeaderboard(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo trận đấu */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                Tạo trận đấu mới
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedParticipants([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Form thông tin battle */}
              <div className="p-4 sm:p-6 border-b lg:border-b-0 lg:border-r lg:w-1/3 xl:w-1/4 flex-shrink-0">
                <h3 className="font-semibold text-gray-800 mb-4">Thông tin trận đấu</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      value={createForm.scheduled_start_time}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, scheduled_start_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian thi (phút)
                    </label>
                    <select
                      value={createForm.duration_minutes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value={5}>5 phút</option>
                      <option value={10}>10 phút</option>
                      <option value={15}>15 phút</option>
                      <option value={20}>20 phút</option>
                      <option value={30}>30 phút</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số câu hỏi
                    </label>
                    <select
                      value={createForm.question_count}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, question_count: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value={3}>3 câu</option>
                      <option value={5}>5 câu</option>
                      <option value={6}>6 câu</option>
                      <option value={8}>8 câu</option>
                      <option value={10}>10 câu</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-2">
                      Đã chọn: {selectedParticipants.length} người chơi
                    </div>
                    <div className="text-xs text-gray-500">
                      (Tối thiểu 2, tối đa 8 người chơi)
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách người chơi */}
              <div className="p-4 sm:p-6 lg:w-2/3 overflow-y-auto flex-1">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 flex-shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  Chọn người chơi từ bảng xếp hạng
                </h3>

                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Đang tải bảng xếp hạng...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 20).map((entry) => (
                      <div
                        key={entry.user_name}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedParticipants.includes(entry.user_name)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleParticipantToggle(entry.user_name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            {entry.avatar ? (
                              <img 
                                src={getAvatarUrl(entry.avatar) || undefined}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-gray-300">
                                {(entry.display_name || entry.user_name).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-800 truncate">{entry.display_name || entry.user_name}</div>
                              <div className="text-xs sm:text-sm text-gray-600 truncate">
                                {entry.total_questions} câu • {entry.correct_answers} đúng • {entry.score_percentage}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {selectedParticipants.includes(entry.user_name) && (
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                            )}
                            <input
                              type="checkbox"
                              checked={selectedParticipants.includes(entry.user_name)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleParticipantToggle(entry.user_name);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky buttons at bottom */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0 sticky bottom-0">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedParticipants([]);
                }}
                className="flex-1 px-4 py-3 sm:py-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium min-h-[48px] sm:min-h-[52px]"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateBattle}
                disabled={selectedParticipants.length < 2}
                className="flex-1 px-4 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px] sm:min-h-[52px] shadow-md"
              >
                Tạo trận đấu ({selectedParticipants.length} người chơi)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
