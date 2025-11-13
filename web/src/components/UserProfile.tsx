import React, { useState, useEffect } from 'react';
import { User, Trophy, Star, Award, Camera, Edit3, X, Crown, Zap, Target, MapPin, Clock } from 'lucide-react';
import { fetchSites, checkQuizAttempts, getQuizzesBySite, getApiUrl, updateEmail, changePassword, getUserProfile, getXPLeaderboard, getAchievementsList, updateUserProfile, updateSchoolClass, uploadAvatar } from '../services/api';

interface UserProfile {
  user_name: string;
  display_name: string;
  avatar: string | null;
  bio: string;
  total_xp: number;
  level: number;
  xp_for_next_level: number;
  current_level_xp: number;
  xp_progress_percentage: number;
  joined_at: string;
  last_active: string;
  achievements: Achievement[];
  achievement_count: number;
  class_name?: string;
  school_name?: string;
  email?: string;
  role?: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked_at: string;
}

interface LeaderboardEntry {
  rank: number;
  user_name: string;
  display_name: string;
  avatar: string | null;
  total_xp: number;
  level: number;
  joined_at: string;
}

interface UserProfileProps {
  userName: string;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userName, onClose }) => {
  console.log('[UserProfile] Component rendered with userName:', userName);
  
  // Helper to get full avatar URL
  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;

    const baseUrl = getApiUrl();

    // Always use API base URL for media files (not via Vite proxy)
    // For localhost development, use direct API port
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const url = `http://localhost:8000${avatar}`;
        return url;
      }
    }

    // For Cloudflare tunnel
    const url = `${baseUrl}${avatar}`;
    return url;
  };
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: ''
  });
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'badges' | 'leaderboard' | 'settings'>('profile');
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = React.useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [schoolClassData, setSchoolClassData] = React.useState({
    school_name: '',
    class_name: ''
  });
  const [isUpdatingSchoolClass, setIsUpdatingSchoolClass] = React.useState(false);

  useEffect(() => {
    loadData();
  }, [userName]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, leaderboardData, achievementsData] = await Promise.all([
        getUserProfile(userName),
        getXPLeaderboard(),
        getAchievementsList()
      ]);

      setProfile(profileData);
      setLeaderboard(leaderboardData);
      setAllAchievements(achievementsData);

      if (profileData) {
        setEditForm({
          display_name: profileData.display_name || '',
          bio: profileData.bio || ''
        });
        // Set school/class data for the form
        setSchoolClassData({
          school_name: profileData.school_name || '',
          class_name: profileData.class_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      // If only avatar is being uploaded, use dedicated uploadAvatar function
      if (selectedAvatar && !editForm.display_name && !editForm.bio) {
        const result = await uploadAvatar(userName, selectedAvatar);
        // Reload full profile data to get updated avatar URL
        await loadData();
        setEditing(false);
        setSelectedAvatar(null);
        setAvatarPreview(null);
        return;
      }

      // For general profile updates (with or without avatar)
      const formData = new FormData();
      formData.append('user_name', userName);
      formData.append('display_name', editForm.display_name);
      formData.append('bio', editForm.bio);

      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      const updatedProfile = await updateUserProfile(userName, formData);

      // Reload full profile data to get updated avatar URL
      await loadData();

      setEditing(false);
      setSelectedAvatar(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Lỗi khi cập nhật profile');
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="w-4 h-4" />;
      case 'epic': return <Star className="w-4 h-4" />;
      case 'rare': return <Zap className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <X className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy profile</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2>
            <User className="w-6 h-6 text-blue-500" />
            Hồ sơ cá nhân
          </h2>
          <button
            onClick={onClose}
            className="modal-close-button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs-container">
          {[
            { key: 'profile', label: 'Profile', icon: User },
            { key: 'badges', label: 'Huy Hiệu', icon: Award },
            { key: 'leaderboard', label: 'Bảng xếp hạng', icon: Target },
            { key: 'settings', label: 'Cài đặt', icon: Edit3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`modal-tab-button ${activeTab === key ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="modal-content">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : profile.avatar ? (
                      <img src={getAvatarUrl(profile.avatar) || undefined} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  {editing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Tên hiển thị"
                      />
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Tiểu sử"
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{profile.display_name}</h3>
                      <p className="text-gray-600">@{profile.user_name}</p>
                      {profile.bio && <p className="text-gray-700 mt-2">{profile.bio}</p>}
                    </div>
                  )}
                </div>
                
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                )}
                
                {editing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setSelectedAvatar(null);
                        setAvatarPreview(null);
                        setEditForm({
                          display_name: profile.display_name || '',
                          bio: profile.bio || ''
                        });
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              {/* Level and XP */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">Level {profile.level}</h4>
                    <p className="text-gray-600">{profile.total_xp} XP tổng cộng</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{profile.current_level_xp}/{profile.xp_for_next_level}</div>
                    <div className="text-sm text-gray-600">XP</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${profile.xp_progress_percentage}%` }}
                  ></div>
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  {Math.round(profile.xp_progress_percentage)}% đến level {profile.level + 1}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{profile.achievement_count}</div>
                  <div className="text-sm text-gray-600">Thành tích</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{profile.level}</div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{profile.total_xp}</div>
                  <div className="text-sm text-gray-600">Tổng XP</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-800">
                    {new Date(profile.joined_at).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="text-sm text-gray-600">Tham gia</div>
                </div>
              </div>

              {/* School and Class Info */}
              {(profile.school_name || profile.class_name) && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-500" />
                    Thông tin học tập
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.school_name && (
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Trường</div>
                        <div className="text-lg font-semibold text-gray-800">{profile.school_name}</div>
                      </div>
                    )}
                    {profile.class_name && (
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Lớp</div>
                        <div className="text-lg font-semibold text-gray-800">{profile.class_name}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-6" style={{ minHeight: '300px' }}>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Huy Hiệu ({profile.achievements.length > 0 ? '2/5' : '0/5'})
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Bậc Thầy Câu Hỏi */}
                <div className={`relative rounded-xl p-6 text-center ${
                  profile.achievement_count >= 1 
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <div className="absolute top-2 right-2">
                    {profile.achievement_count >= 1 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🔒</span>
                      </div>
                    )}
                  </div>
                  <div className="text-4xl mb-3">🏆</div>
                  <h4 className="font-bold mb-1">Bậc Thầy Câu Hỏi</h4>
                  <p className="text-xs opacity-90">
                    {profile.achievement_count >= 1 
                      ? 'Hoàn thành 10 câu đố' 
                      : 'Trả lời đúng tất cả câu hỏi trong 1 bài kiểm tra'}
                  </p>
                  {profile.achievement_count >= 1 && (
                    <div className="mt-2 text-xs">30/10/2025</div>
                  )}
                </div>

                {/* Điểm Hoàn Hảo */}
                <div className={`relative rounded-xl p-6 text-center ${
                  profile.total_xp > 0
                    ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <div className="absolute top-2 right-2">
                    {profile.total_xp > 0 ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🔒</span>
                      </div>
                    )}
                  </div>
                  <div className="text-4xl mb-3">⚡</div>
                  <h4 className="font-bold mb-1">Tia Chớp</h4>
                  <p className="text-xs opacity-90">
                    {profile.total_xp > 0
                      ? 'Hoàn thành câu đố trong vòng 10 giây'
                      : 'Trả lời đúng tất cả câu hỏi trong 1 bài kiểm tra'}
                  </p>
                  {profile.total_xp > 0 && (
                    <div className="mt-2 text-xs">30/10/2025</div>
                  )}
                </div>

                {/* Người Khám Phá (Locked) */}
                <div className="relative rounded-xl p-6 text-center bg-gray-100 text-gray-400">
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔒</span>
                    </div>
                  </div>
                  <div className="text-4xl mb-3">🗺️</div>
                  <h4 className="font-bold mb-1">Người Khám Phá</h4>
                  <p className="text-xs opacity-90">Ghé thăm 5 địa điểm khác nhau</p>
                </div>

                {/* Học Giả (Locked) */}
                <div className="relative rounded-xl p-6 text-center bg-gray-100 text-gray-400">
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔒</span>
                    </div>
                  </div>
                  <div className="text-4xl mb-3">📚</div>
                  <h4 className="font-bold mb-1">Học Giả</h4>
                  <p className="text-xs opacity-90">Đạt cấp độ 10</p>
                </div>

                {/* Chiến Binh (Locked) */}
                <div className="relative rounded-xl p-6 text-center bg-gray-100 text-gray-400">
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔒</span>
                    </div>
                  </div>
                  <div className="text-4xl mb-3">⚔️</div>
                  <h4 className="font-bold mb-1">Chiến Binh</h4>
                  <p className="text-xs opacity-90">Thắng 3 trận battle liên tiếp</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div style={{ minHeight: '300px' }}>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có dữ liệu bảng xếp hạng</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.slice(0, 20).map((entry) => (
                    <div
                      key={entry.user_name}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        entry.user_name === userName ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        entry.rank === 2 ? 'bg-gray-400 text-gray-900' :
                        entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {entry.rank}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                        {entry.avatar ? (
                          <img src={getAvatarUrl(entry.avatar) || undefined} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          entry.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{entry.display_name}</div>
                        <div className="text-sm text-gray-600">@{entry.user_name}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-gray-800">Level {entry.level}</div>
                        <div className="text-sm text-gray-600">{entry.total_xp} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6" style={{ minHeight: '300px' }}>
              {/* School and Class Update Section */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  Cập nhật thông tin Trường & Lớp
                </h3>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  if (!schoolClassData.school_name.trim() || !schoolClassData.class_name.trim()) {
                    alert('Vui lòng điền đầy đủ thông tin trường và lớp!');
                    return;
                  }

                  setIsUpdatingSchoolClass(true);
                  
                  try {
                    await updateSchoolClass(schoolClassData.school_name.trim(), schoolClassData.class_name.trim());
                    alert('Cập nhật thông tin thành công!');
                    await loadData();
                    setSchoolClassData({ school_name: '', class_name: '' });
                  } catch (error: any) {
                    alert(`Lỗi: ${error.response?.data?.error || 'Không thể cập nhật thông tin'}`);
                  } finally {
                    setIsUpdatingSchoolClass(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên trường
                    </label>
                    <input
                      type="text"
                      value={schoolClassData.school_name}
                      onChange={(e) => setSchoolClassData({ ...schoolClassData, school_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: THPT Nguyễn Huệ"
                      required
                      disabled={isUpdatingSchoolClass}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lớp
                    </label>
                    <input
                      type="text"
                      value={schoolClassData.class_name}
                      onChange={(e) => setSchoolClassData({ ...schoolClassData, class_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="VD: 12A1"
                      required
                      disabled={isUpdatingSchoolClass}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isUpdatingSchoolClass}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdatingSchoolClass ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật thông tin'
                    )}
                  </button>
                </form>
              </div>

              {/* Email Change Section */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-green-500" />
                  Đổi Email
                </h3>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newEmail = formData.get('new_email') as string;

                  if (!newEmail || !newEmail.includes('@')) {
                    alert('Email không hợp lệ!');
                    return;
                  }

                  if (newEmail === profile.email) {
                    alert('Email mới phải khác email hiện tại!');
                    return;
                  }

                  try {
                    await updateEmail(newEmail);
                    alert('Đổi email thành công!');
                    await loadData();
                    e.currentTarget.reset();
                  } catch (error: any) {
                    alert(`Lỗi: ${error.response?.data?.error || 'Không thể đổi email'}`);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email hiện tại
                    </label>
                    <input
                      type="email"
                      value={(profile as any)?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email của bạn trong database</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email mới
                    </label>
                    <input
                      type="email"
                      name="new_email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                      placeholder="example@email.com"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Cập nhật Email
                  </button>
                </form>
              </div>
              
              {/* Password Change Section */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-500" />
                  Đổi mật khẩu
                </h3>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  if (passwordData.new_password !== passwordData.confirm_password) {
                    alert('Mật khẩu mới không khớp!');
                    return;
                  }
                  
                  if (passwordData.new_password.length < 6) {
                    alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
                    return;
                  }
                  
                  try {
                    await changePassword(passwordData.old_password, passwordData.new_password);
                    alert('Đổi mật khẩu thành công!');
                    setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                  } catch (error: any) {
                    alert(`Lỗi: ${error.response?.data?.error || 'Không thể đổi mật khẩu'}`);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Đổi mật khẩu
                  </button>
                </form>
              </div>
              
              <div className="bg-gray-50 rounded-lg border p-6">
                <h4 className="font-bold text-gray-800 mb-2">💡 Lưu ý</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Mật khẩu mới phải có ít nhất 6 ký tự</li>
                  <li>Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại</li>
                  <li>Đừng chia sẻ mật khẩu của bạn với ai</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};