import React from 'react';
import { QuizComponent } from './QuizComponent';

interface QuizTabProps {
  site: any;
  userName?: string;
  isAuthenticated?: boolean;
}

export const QuizTab: React.FC<QuizTabProps> = ({ site, userName, isAuthenticated }) => {
  const siteId = site.properties?.id;

  if (!siteId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Không tìm thấy thông tin địa điểm</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Vui lòng đăng nhập để làm trắc nghiệm
          </p>
        </div>
      )}
      
      <QuizComponent 
        siteId={siteId} 
        userName={userName || 'Anonymous'}
      />
    </div>
  );
};
