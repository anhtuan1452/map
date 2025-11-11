import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Eye, CheckCircle, Shield } from 'lucide-react';

interface StatusGaugeProps {
  status: 'critical' | 'watch' | 'good';
  description?: string;
}

export const StatusGauge: React.FC<StatusGaugeProps> = ({ status, description }) => {
  const { t } = useTranslation();

  const statusConfig = {
    critical: {
      color: 'text-status-critical',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      icon: AlertTriangle,
      label: t('conservation.critical'),
      progress: 30,
      barColor: 'bg-status-critical'
    },
    watch: {
      color: 'text-status-watch',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-300',
      icon: Eye,
      label: t('conservation.watch'),
      progress: 65,
      barColor: 'bg-status-watch'
    },
    good: {
      color: 'text-status-good',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      icon: CheckCircle,
      label: t('conservation.good'),
      progress: 95,
      barColor: 'bg-status-good'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`${config.color} p-2 bg-white rounded-full`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Tình trạng bảo tồn</h3>
          <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`${config.barColor} h-full rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${config.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Status Badges */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white rounded-full border border-gray-300">
          <Shield size={12} />
          Di sản văn hóa
        </span>
        {status === 'critical' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-200 text-red-800 rounded-full">
            Cần bảo vệ gấp
          </span>
        )}
        {status === 'watch' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-200 text-amber-800 rounded-full">
            Theo dõi thường xuyên
          </span>
        )}
        {status === 'good' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-200 text-green-800 rounded-full">
            Được bảo quản tốt
          </span>
        )}
      </div>
    </div>
  );
};
