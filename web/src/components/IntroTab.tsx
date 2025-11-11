import React from 'react';
import { MapPin, Calendar, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';
import { deleteSite } from '../services/api';

interface IntroTabProps {
  site: any;
  isAuthenticated?: boolean;
  userRole?: string;
  onEditClick?: (feature: any) => void;
  onSiteDeleted?: () => void;
}

export const IntroTab: React.FC<IntroTabProps> = ({ 
  site, 
  isAuthenticated, 
  userRole,
  onEditClick,
  onSiteDeleted 
}) => {
  // Debug: Kiểm tra summary và history
  console.log('IntroTab site.properties:', {
    id: site.properties?.id,
    name: site.properties?.name,
    hasSummary: !!site.properties?.summary,
    hasHistory: !!site.properties?.history,
    summary: site.properties?.summary,
    history: site.properties?.history
  });
  
  const images = site.properties?.image_urls || [];
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHistoryExpanded, setIsHistoryExpanded] = React.useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Bạn có chắc muốn xóa "${site.properties?.name}"?`)) {
      try {
        await deleteSite(site.properties?.id);
        alert('Đã xóa địa điểm thành công');
        if (onSiteDeleted) {
          onSiteDeleted();
        }
      } catch (e) {
        console.error(e);
        alert('Xóa địa điểm thất bại');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="relative">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img
              src={images[currentImageIndex]}
              alt={`${site.properties?.name} - ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === 0 ? images.length - 1 : prev - 1
                  )}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  ›
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* No images placeholder */}
      {images.length === 0 && (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có hình ảnh</p>
          </div>
        </div>
      )}

      {/* Site Info */}
      <div className="space-y-3">
        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="text-primary-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-gray-900">Vị trí</h4>
            <p className="text-sm text-gray-600">
              {site.geometry?.coordinates 
                ? `${site.geometry.coordinates[1].toFixed(4)}°N, ${site.geometry.coordinates[0].toFixed(4)}°E`
                : 'Không xác định'
              }
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-start gap-3">
          <Calendar className="text-primary-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-gray-900">Thông tin</h4>
            <p className="text-sm text-gray-600">
              Mã di tích: <span className="font-mono">{site.properties?.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary (Tóm tắt) */}
      {site.properties?.summary && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">📝 Tóm tắt</h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            {site.properties.summary}
          </p>
        </div>
      )}

      {/* Description (if available) */}
      {site.properties?.description && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Giới thiệu</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {site.properties.description}
          </p>
        </div>
      )}

      {/* History (Lịch sử chi tiết) */}
      {site.properties?.history && (
        <div 
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 cursor-pointer select-none transition-all duration-200 hover:shadow-md"
        >
          <h4 className="font-semibold text-amber-900 mb-2">📚 Lịch sử chi tiết</h4>
          <div className="relative">
            <p 
              className={`text-sm text-amber-800 leading-relaxed whitespace-pre-line m-0 transition-all duration-300 ${
                isHistoryExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {site.properties.history}
            </p>
            {!isHistoryExpanded && site.properties.history.length > 150 && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-amber-50 to-transparent"></div>
            )}
          </div>
          <div className="flex items-center justify-center mt-2">
            <span 
              className={`text-2xl font-bold text-amber-700 inline-block transition-transform duration-300 ease-in-out ${
                !isHistoryExpanded ? 'animate-bounce-subtle' : ''
              }`}
              style={{ transform: isHistoryExpanded ? 'rotate(180deg)' : 'rotate(90deg)' }}
            >
              »
            </span>
          </div>
          <style>{`
            @keyframes bounce-subtle {
              0%, 100% {
                transform: translateY(0) rotate(90deg);
              }
              50% {
                transform: translateY(4px) rotate(90deg);
              }
            }
            .animate-bounce-subtle {
              animation: bounce-subtle 1.5s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}

      {/* Teacher/Admin Actions */}
      {isAuthenticated && (userRole === 'teacher' || userRole === 'super_admin') && (
        <div className="flex gap-2">
          <button
            onClick={() => onEditClick && onEditClick(site)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
          >
            <Edit size={18} />
            Sửa
          </button>
          
          {userRole === 'super_admin' && (
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <Trash2 size={18} />
              Xóa
            </button>
          )}
        </div>
      )}

      {/* Feedback Form */}
      <FeedbackForm 
        siteId={site.properties?.id} 
        siteName={site.properties?.name}
      />
    </div>
  );
};
