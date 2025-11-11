import React, { useState, useEffect } from 'react';
import { getUserProfile, getApiUrl } from '../services/api';
import './NavigationMenu.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  userRole?: string;
  onUserManagement?: () => void;
  onManagementDashboard?: () => void;
  onLeaderboard?: () => void;
  onBattle?: () => void;
  onAddSite?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
};

const roleLabel = (role?: string) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'teacher') return 'Giáo viên';
  if (role === 'student') return 'Học sinh';
  if (role === 'tourist') return 'Khách du lịch';
  return 'Người dùng';
};

const NavigationMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  userRole,
  onUserManagement,
  onManagementDashboard,
  onLeaderboard,
  onBattle,
  onAddSite,
  onProfile,
  onLogout
}) => {
  console.log('[NavigationMenu] Rendered with isOpen:', isOpen);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  // Load user avatar when component mounts or user changes
  useEffect(() => {
    const loadAvatar = async () => {
      if (user?.username) {
        try {
          const profile = await getUserProfile(user.username);
          if (profile.avatar) {
            setAvatarUrl(getAvatarUrl(profile.avatar));
          }
        } catch (error) {
          console.error('[NavigationMenu] Failed to load avatar:', error);
        }
      }
    };
    
    if (isOpen) {
      loadAvatar();
    }
  }, [user?.username, isOpen]);

  return (
    <div className={`nav-card ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="nav-header">
        <button className="greet-btn" onClick={() => {
          console.log('[NavigationMenu] Profile button clicked');
          console.log('[NavigationMenu] onProfile function:', onProfile);
          if (onProfile) onProfile();
        }} title="Xem hồ sơ cá nhân">
          <div className="greet">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '18px',
                border: '2px solid #fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="greet-text">
            <div className="greet-hi">Xin chào, <strong>{user?.username || 'User'}</strong></div>
            <div className="greet-role">{roleLabel(userRole)}</div>
          </div>
        </button>
        <button className="close-btn" onClick={onClose} aria-label="Đóng menu">✕</button>
      </div>

      <div className="nav-grid">
        {userRole === 'super_admin' && (
          <button className="nav-item" style={{ background: '#7E57C2' }} onClick={onUserManagement}>
            <div className="icon">👥</div>
            <div className="label">Quản lý User</div>
          </button>
        )}

        {(userRole === 'super_admin' || userRole === 'teacher') && (
          <button className="nav-item" style={{ background: '#26C6DA' }} onClick={onManagementDashboard}>
            <div className="icon">📝</div>
            <div className="label">Quiz & Phản hồi</div>
          </button>
        )}

        {/* Ẩn Leaderboard và Quiz Battle cho tourist */}
        {userRole !== 'tourist' && (
          <>
            <button className="nav-item" style={{ background: '#FFCA28' }} onClick={onLeaderboard}>
              <div className="icon">🏆</div>
              <div className="label">Bảng xếp hạng</div>
            </button>

            <button className="nav-item" style={{ background: '#FF6F61' }} onClick={onBattle}>
              <div className="icon">⚔️</div>
              <div className="label">Quiz Battle</div>
            </button>
          </>
        )}

        {(userRole === 'super_admin' || userRole === 'teacher') && (
          <button className="nav-item" style={{ background: '#66BB6A' }} onClick={onAddSite}>
            <div className="icon">📍</div>
            <div className="label">Thêm địa điểm</div>
          </button>
        )}

        <button className="nav-item logout" style={{ background: '#EF5350' }} onClick={onLogout}>
          <div className="icon">🚪</div>
          <div className="label">Đăng xuất</div>
        </button>
      </div>

      <div className="nav-foot">Học thật, chơi thật — Học cùng công nghệ</div>
    </div>
  );
};

export default NavigationMenu;
