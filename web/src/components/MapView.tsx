import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { fetchSites, checkQuizAttempts, getQuizzesBySite, getApiUrl } from '../services/api';
import PopupContent from './PopupContent';
import AddSiteModal from './AddSiteModal';
import EditSiteModal from './EditSiteModal';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import UserManagement from './UserManagement';
import { ManagementDashboard } from './ManagementDashboard';
import { Leaderboard } from './Leaderboard';
import NavigationMenu from './NavigationMenu';
import { useAuth } from '../contexts/AuthContext';
import { InfoPanel } from './InfoPanel';
import { IntroTab } from './IntroTab';
import { RuleCard } from './RuleCard';
import { StatusGauge } from './StatusGauge';
import { QuizTab } from './QuizTab';
import { XPDisplay } from './XPDisplay';
import { BadgeGrid } from './BadgeGrid';
import { BattleList } from './BattleList';
import { UserProfile } from './UserProfile';
import { CommentSection } from './CommentSection';
import { usePlacesStore } from '../store/placesStore';

function colorFor(status: string) {
  if (status === 'critical') return '#e03b3b';  // Đỏ - Nguy cấp
  if (status === 'watch') return '#f0ad4e';     // Vàng - Cần quan tâm
  return '#4bb543';                              // Xanh - Tốt (good)
}

function MapClickHandler({ onMapDoubleClick, isAuthenticated }: { onMapDoubleClick: (latlng: [number, number]) => void; isAuthenticated: boolean }) {
  useMapEvents({
    dblclick(e) {
      if (isAuthenticated) {
        onMapDoubleClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

const MapView: React.FC = () => {
  const [sites, setSites] = React.useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingSite, setEditingSite] = React.useState<any | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
  const [registerType, setRegisterType] = React.useState<'normal' | 'tourist'>('normal');
  const [isUserManagementOpen, setIsUserManagementOpen] = React.useState(false);
  const [isManagementDashboardOpen, setIsManagementDashboardOpen] = React.useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = React.useState(false);
  const [isBattleOpen, setIsBattleOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [clickedPosition, setClickedPosition] = React.useState<[number, number] | null>(null);
  const [isNavOpen, setIsNavOpen] = React.useState(false);
  const [siteStatuses, setSiteStatuses] = React.useState<{[key: string]: 'not_attempted' | 'all_correct' | 'some_wrong'}>({});
  
  const { isAuthenticated, user, login, logout } = useAuth();
  
  // Zustand store for drawer state
  const { isDrawerOpen, selectedPlaceId, activeTab, selectPlace, closeDrawer, setActiveTab } = usePlacesStore();
  
  const selectedSite = React.useMemo(() => {
    if (!selectedPlaceId) return null;
    const found = sites.find(s => s.properties?.id === selectedPlaceId);
    
    // If selected site no longer exists (e.g., after delete), close drawer
    if (!found && selectedPlaceId) {
      closeDrawer();
      return null;
    }
    
    return found || null;
  }, [selectedPlaceId, sites, closeDrawer]);

  // Get user role - prioritize from user object, fallback to localStorage
  const [roleRefreshKey, setRoleRefreshKey] = React.useState(0);
  const userRole = React.useMemo(() => {
    // Ưu tiên lấy từ user object (từ AuthContext)
    const roleFromUser = user?.role;
    // Fallback sang localStorage
    const roleFromStorage = localStorage.getItem('userRole');
    const role = roleFromUser || roleFromStorage || 'student';
    console.log('[MapView] userRole:', role, '(from user:', roleFromUser, ', storage:', roleFromStorage, ')');
    return role;
  }, [user, isAuthenticated, roleRefreshKey]);

  // Compute isAdmin based on role
  const isAdmin = React.useMemo(() => {
    return ['teacher', 'super_admin'].includes(userRole);
  }, [userRole]);
  
  // Listen for storage changes to update role
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userRole') {
        setRoleRefreshKey(prev => prev + 1);
      }
    };
    
    // Custom event for manual role refresh
    const handleRoleRefresh = () => {
      console.log('[MapView] Manual role refresh triggered');
      setRoleRefreshKey(prev => prev + 1);
    };
    
    // Custom event to open register modal
    const handleOpenRegisterModal = (event: any) => {
      const type = event.detail?.type || 'normal';
      setRegisterType(type);
      setIsRegisterModalOpen(true);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('refreshUserRole', handleRoleRefresh);
    window.addEventListener('openRegisterModal', handleOpenRegisterModal);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refreshUserRole', handleRoleRefresh);
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal);
    };
  }, []);

  // Check permissions
  const canAdd = isAuthenticated && (userRole === 'teacher' || userRole === 'super_admin');
  const canEdit = isAuthenticated && (userRole === 'teacher' || userRole === 'super_admin');
  const canDelete = isAuthenticated && userRole === 'super_admin';

  const loadSites = React.useCallback(async () => {
    try {
      const data = await fetchSites();
      setSites(data.features || []);
    } catch (err) {
      console.error('Failed to fetch sites', err);
    }
  }, []);

  React.useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Compute per-site quiz status for current user when sites or user changes
  React.useEffect(() => {
    let mounted = true;
    const computeStatuses = async () => {
      if (!isAuthenticated || !user?.username) {
        // mark all as not_attempted for unauthenticated users
        const map: {[key: string]: 'not_attempted' | 'all_correct' | 'some_wrong'} = {};
        (sites || []).forEach((s: any) => (map[s.properties.id] = 'not_attempted'));
        if (mounted) setSiteStatuses(map);
        return;
      }

      try {
        const promises = (sites || []).map(async (s: any) => {
          const siteId = s.properties.id;
          // fetch quizzes and attempts for this site
          const [quizzes, attempts] = await Promise.all([
            getQuizzesBySite(siteId),
            checkQuizAttempts(user.username, siteId)
          ]);

          const quizCount = Array.isArray(quizzes) ? quizzes.length : 0;
          const attemptsArr = Object.values(attempts || {});

          if (!attemptsArr || attemptsArr.length === 0) return [siteId, 'not_attempted'] as const;

          const correctCount = attemptsArr.filter((a: any) => a.is_correct).length;

          if (correctCount === quizCount && quizCount > 0) return [siteId, 'all_correct'] as const;
          return [siteId, 'some_wrong'] as const;
        });

        const results = await Promise.all(promises);
        const map: {[key: string]: 'not_attempted' | 'all_correct' | 'some_wrong'} = {};
        results.forEach(([siteId, status]) => { map[siteId] = status; });
        if (mounted) setSiteStatuses(map);
      } catch (err) {
        console.error('Failed to compute site statuses', err);
      }
    };

    computeStatuses();
    return () => { mounted = false; };
  }, [sites, isAuthenticated, user]);

  const handleMapClick = (latlng: [number, number]) => {
    if (isAuthenticated) {
      setClickedPosition(latlng);
      setIsAddModalOpen(true);
    }
  };

  const handleSiteAdded = () => {
    // Reload sites after adding new one
    loadSites();
  };

  const handleLogin = (token: string, user: any) => {
    login(token, user);
  };

  const handleEditClick = (feature: any) => {
    setEditingSite(feature);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        {/* Hamburger Menu Button */}
        {isAuthenticated && (
          <button
            onClick={() => {
              console.log('[MapView] Hamburger clicked, current isNavOpen:', isNavOpen);
              setIsNavOpen(!isNavOpen);
              console.log('[MapView] Setting isNavOpen to:', !isNavOpen);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1100,
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 12px',
              cursor: 'pointer',
              fontSize: '20px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease'
            }}
            title={isNavOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isNavOpen ? '✕' : '☰'}
          </button>
        )}

        {/* New NavigationMenu component (modern pastel card) */}
        <NavigationMenu
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          user={user}
          userRole={userRole}
          onUserManagement={() => { setIsUserManagementOpen(true); setIsNavOpen(false); }}
          onManagementDashboard={() => { setIsManagementDashboardOpen(true); setIsNavOpen(false); }}
          onLeaderboard={() => { setIsLeaderboardOpen(true); setIsNavOpen(false); }}
          onBattle={() => { setIsBattleOpen(true); setIsNavOpen(false); }}
          onAddSite={() => { setIsAddModalOpen(true); setIsNavOpen(false); }}
          onProfile={() => { 
            console.log('[MapView] onProfile clicked, current user:', user); 
            setIsProfileOpen(true); 
            setIsNavOpen(false); 
          }}
          onLogout={() => { logout(); setIsNavOpen(false); }}
        />

        {/* Login button for non-authenticated users */}
        {!isAuthenticated && (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            🔐 Đăng nhập Admin
          </button>
        )}

        {/* Info notice for non-authenticated users */}
        {!isAuthenticated && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '10px 15px',
            borderRadius: '5px',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1000,
            maxWidth: '300px'
          }}>
            <strong>ℹ️ Chế độ xem:</strong><br/>
            Bạn đang ở chế độ chỉ xem. Đăng nhập Admin để thêm/xóa địa điểm.
          </div>
        )}

        <MapContainer 
          center={[16.95, 106.85]} 
          zoom={9} 
          minZoom={8}
          maxZoom={14}
          maxBounds={[
            [15.8, 105.8],  // Southwest corner - mở rộng xuống Quảng Bình
            [17.8, 107.8]   // Northeast corner - bao gồm Quảng Trị cũ
          ]}
          maxBoundsViscosity={1.0}
          style={{ height: '100vh', width: '100%' }}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler onMapDoubleClick={handleMapClick} isAuthenticated={canAdd} />

          {sites.map((f) => {
            const coords = f.geometry.coordinates;
            const lon = coords[0];
            const lat = coords[1];
            const status = f.properties?.conservation_status || 'good';
            const icon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="background:${colorFor(status)};width:18px;height:18px;border-radius:9px;border:2px solid white"></div>`,
              iconSize: [18, 18]
            });
            
            // Hiển thị label "VIỆT NAM" cho Hoàng Sa và Trường Sa
            const isIsland = f.properties.id === 'quan_dao_hoang_sa' || f.properties.id === 'quan_dao_truong_sa';

            // Determine label color based on user's quiz progress for this site
            const siteStatus = siteStatuses[f.properties.id] || 'not_attempted';
            let labelColor = '#000';
            if (siteStatus === 'all_correct') labelColor = '#2ecc71'; // green
            else if (siteStatus === 'some_wrong') labelColor = '#9bd39b'; // light green
            
            return (
              <Marker 
                key={f.properties.id} 
                position={[lat, lon]} 
                icon={icon}
                eventHandlers={{
                  click: () => {
                    selectPlace(f.properties.id);
                  }
                }}
              >
                {/* Permanent label for all markers (special island label preserved) */}
                <Tooltip permanent direction="top" offset={[0, -18]} className="site-label" interactive={false}>
                  <strong style={{color: labelColor, fontSize: '13px', fontWeight: '700'}}>
                    {f.properties.name}
                  </strong>
                </Tooltip>

                {isIsland && (
                  <Tooltip permanent direction="top" offset={[0, -10]} className="island-label">
                    <strong style={{color: '#d00', fontSize: '14px', fontWeight: 'bold'}}>
                      {f.properties.name} - VIỆT NAM 🇻🇳
                    </strong>
                  </Tooltip>
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Info Panel with Tabs */}
      <InfoPanel
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        site={selectedSite}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        isAuthenticated={isAuthenticated}
      >
        {activeTab === 'intro' && (
          <IntroTab 
            site={selectedSite}
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            onEditClick={handleEditClick}
            onSiteDeleted={() => {
              loadSites();
              closeDrawer();
            }}
          />
        )}
        
        {activeTab === 'conduct' && (
          <RuleCard conduct={selectedSite?.properties?.conduct} />
        )}
        
        {activeTab === 'status' && (
          <StatusGauge 
            status={selectedSite?.properties?.conservation_status || 'good'} 
            description={selectedSite?.properties?.status_description}
          />
        )}
        
        {activeTab === 'quiz' && (
          <QuizTab 
            site={selectedSite}
            userName={user?.username}
            isAuthenticated={isAuthenticated}
          />
        )}
        
        {activeTab === 'gamification' && (
          <div className="space-y-4">
            <div className="mt-2">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                🏆 <span>Bảng Xếp Hạng Địa Điểm</span>
              </h3>
              <Leaderboard siteId={selectedSite?.properties?.id} />
            </div>
          </div>
        )}
        
        {activeTab === 'comments' && (selectedSite?.properties?.site_id || selectedSite?.properties?.id) && (
          <CommentSection siteId={selectedSite.properties.site_id || selectedSite.properties.id} />
        )}
      </InfoPanel>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        apiBaseUrl={getApiUrl()}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={() => {
          alert('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        apiBaseUrl={getApiUrl()}
        registerType={registerType}
      />

      <AddSiteModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setClickedPosition(null);
        }}
        onSiteAdded={handleSiteAdded}
        clickedPosition={clickedPosition}
      />

      <EditSiteModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSite(null);
        }}
        onSiteUpdated={loadSites}
        site={editingSite}
      />

      <UserManagement
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        apiBaseUrl={getApiUrl()}
        currentUsername={user?.username || ''}
      />

      {/* Management Dashboard Modal */}
      {isManagementDashboardOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-container">
            <div className="modal-header">
              <h2>⚙️ Quản lý Hệ thống</h2>
              <button
                onClick={() => setIsManagementDashboardOpen(false)}
                className="modal-close-button"
                style={{ fontSize: '24px' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <ManagementDashboard userRole={userRole} />
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '90%',
            maxHeight: '90%',
            width: '900px',
            overflow: 'auto',
            position: 'relative',
            padding: '20px'
          }}>
            <button
              onClick={() => setIsLeaderboardOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ×
            </button>
            <Leaderboard />
          </div>
        </div>
      )}

      {/* Battle Modal */}
      {isBattleOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '95%',
            maxHeight: '95%',
            width: '1200px',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsBattleOpen(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                zIndex: 1
              }}
            >
              ✕
            </button>
            <BattleList userName={user?.username || 'Guest'} isAdmin={isAdmin} />
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {isProfileOpen && user?.username && (
        <UserProfile
          userName={user.username}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
      {isProfileOpen && !user?.username && console.log('[MapView] Profile modal blocked - no username:', user)}
    </>
  );
};

export default MapView;
