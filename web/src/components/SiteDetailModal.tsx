import React, { useState } from 'react';
import PopupContent from './PopupContent';
import { CommentSection } from './CommentSection';

interface SiteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: any;
  onSiteDeleted?: () => void;
  onEditClick?: (feature: any) => void;
  isAuthenticated?: boolean;
  userRole?: string;
}

const SiteDetailModal: React.FC<SiteDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  feature,
  onSiteDeleted,
  onEditClick,
  isAuthenticated,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'comments'>('info');
  
  if (!isOpen || !feature) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs and close button */}
        <div style={{ backgroundColor: '#f8f9fa', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              zIndex: 10
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
          <div className="modal-tabs-container">
            <button
              onClick={() => setActiveTab('info')}
              className={`modal-tab-button ${activeTab === 'info' ? 'active' : ''}`}
            >
              📍 Thông tin
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`modal-tab-button ${activeTab === 'comments' ? 'active' : ''}`}
            >
              💬 Bình luận
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          backgroundColor: activeTab === 'comments' ? '#f5f5f5' : 'white'
        }}>
          {activeTab === 'info' ? (
            <div style={{ padding: '20px' }}>
              <PopupContent 
                feature={feature}
                onSiteDeleted={onSiteDeleted}
                onEditClick={onEditClick}
                isAuthenticated={isAuthenticated}
                userRole={userRole}
              />
            </div>
          ) : (
            <CommentSection siteId={feature.properties.site_id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteDetailModal;
