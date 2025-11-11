import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  site: any;
  activeTab: 'intro' | 'conduct' | 'status' | 'quiz' | 'gamification' | 'comments';
  onTabChange: (tab: 'intro' | 'conduct' | 'status' | 'quiz' | 'gamification' | 'comments') => void;
  children: React.ReactNode;
  userRole?: string;
  isAuthenticated?: boolean;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  isOpen,
  onClose,
  site,
  activeTab,
  onTabChange,
  children,
  userRole,
  isAuthenticated
}) => {
  const { t } = useTranslation();
  const [panelWidth, setPanelWidth] = React.useState(30); // % of screen width
  const [isResizing, setIsResizing] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Reset width when panel is closed
  React.useEffect(() => {
    if (!isOpen) {
      setPanelWidth(30);
    }
  }, [isOpen]);

  // Handle mouse resize for desktop only
  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (panelRef.current && window.innerWidth > 768) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        // Giới hạn từ 20% đến 60% màn hình
        if (newWidth >= 20 && newWidth <= 60) {
          setPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen || !site) return null;

  // Ẩn Quiz, BXH và Bình luận khi chưa đăng nhập
  // Ẩn Quiz và BXH cho tourist
  const allTabs = [
    { id: 'intro' as const, label: t('drawer.tabs.intro'), icon: '📖' },
    { id: 'conduct' as const, label: t('drawer.tabs.conduct'), icon: '⚖️' },
    { id: 'status' as const, label: t('drawer.tabs.status'), icon: '🛡️' },
    { id: 'quiz' as const, label: t('drawer.tabs.quiz'), icon: '🎯', requireAuth: true, hideForTourist: true },
    { id: 'gamification' as const, label: t('drawer.tabs.gamification'), icon: '🏆', requireAuth: true, hideForTourist: true },
    { id: 'comments' as const, label: 'Bình luận', icon: '💬', requireAuth: true },
  ];
  
  let tabs = allTabs;
  
  // Lọc tabs khi chưa đăng nhập
  if (!isAuthenticated) {
    tabs = tabs.filter(tab => !tab.requireAuth);
  }
  // Lọc tabs cho tourist
  else if (userRole === 'tourist') {
    tabs = tabs.filter(tab => !tab.hideForTourist);
  }
  
  console.log('[InfoPanel] isAuthenticated:', isAuthenticated, 'userRole:', userRole, 'tabs count:', tabs.length);

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[1500] transition-opacity duration-300"
      />
      
      {/* Drawer Panel */}
      <div 
        ref={panelRef}
        className="fixed top-0 left-0 bottom-0 bg-white z-[1600] shadow-2xl animate-slide-in-left flex flex-col info-panel"
        style={{
          width: window.innerWidth > 768 ? `${panelWidth}%` : '100%',
          minWidth: window.innerWidth > 768 ? '380px' : 'unset',
          maxWidth: window.innerWidth > 768 ? '60%' : 'unset'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-xl font-bold truncate">{site.properties?.name}</h2>
            <p className="text-sm opacity-90">ID: {site.properties?.id}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            aria-label={t('drawer.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 px-3 py-3 text-sm font-medium transition-all duration-200
                ${activeTab === tab.id 
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content - Ensure it can scroll with proper height */}
        <div 
          className="flex-1 p-4" 
          style={{ 
            minHeight: 0,
            overflowY: 'scroll',
            WebkitOverflowScrolling: 'touch',
            height: '100%'
          }}
        >
          {children}
        </div>

        {/* Resize Handle - Desktop only */}
        <div
          className="hidden md:block absolute top-0 right-0 bottom-0 w-1 bg-transparent hover:bg-primary-500 cursor-ew-resize transition-all duration-200 group"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          style={{ zIndex: 10 }}
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-12 bg-primary-500 rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex flex-col gap-1">
              <div className="w-0.5 h-1 bg-white rounded"></div>
              <div className="w-0.5 h-1 bg-white rounded"></div>
              <div className="w-0.5 h-1 bg-white rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile responsive - 90vh full screen drawer */}
      <style>{`
        @media (max-width: 768px) {
          .info-panel {
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            bottom: 0 !important;
            width: 100% !important;
            min-width: unset !important;
            max-width: unset !important;
            height: 90vh !important;
            max-height: 90vh !important;
            animation: slideInUp 0.3s ease-out !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
        }
        
        /* Prevent text selection during resize */
        ${isResizing ? `
          * {
            user-select: none !important;
            -webkit-user-select: none !important;
            cursor: ew-resize !important;
          }
        ` : ''}

        @keyframes slideInUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        /* Hide scrollbar but keep functionality */
        .flex-1::-webkit-scrollbar {
          width: 6px;
        }
        
        .flex-1::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .flex-1::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        .flex-1::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </>
  );
};
