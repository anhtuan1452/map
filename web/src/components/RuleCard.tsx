import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Scale } from 'lucide-react';

interface RuleCardProps {
  conduct?: {
    dos?: string[];
    donts?: string[];
    lawExcerpt?: string;
    lawLink?: string;
  };
}

export const RuleCard: React.FC<RuleCardProps> = ({ conduct }) => {
  const { t } = useTranslation();

  if (!conduct) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Scale className="mx-auto mb-3 opacity-30" size={48} />
        <p>{t('conduct.noRules') || 'Chưa có quy tắc cho địa điểm này'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Do's Section */}
      {conduct.dos && conduct.dos.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-green-800 font-semibold mb-3">
            <CheckCircle2 size={20} className="text-green-600" />
            {t('conduct.dos')}
          </h3>
          <ul className="space-y-2">
            {conduct.dos.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-green-900">
                <span className="text-green-600 mt-1 flex-shrink-0">✓</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Don'ts Section */}
      {conduct.donts && conduct.donts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-red-800 font-semibold mb-3">
            <XCircle size={20} className="text-red-600" />
            {t('conduct.donts')}
          </h3>
          <ul className="space-y-2">
            {conduct.donts.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-red-900">
                <span className="text-red-600 mt-1 flex-shrink-0">✗</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legal Basis */}
      {conduct.lawExcerpt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-blue-800 font-semibold mb-3">
            <Scale size={20} className="text-blue-600" />
            {t('conduct.lawTitle')}
          </h3>
          <p className="text-sm text-blue-900 italic mb-2">{conduct.lawExcerpt}</p>
          {conduct.lawLink && (
            <a
              href={conduct.lawLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              Xem chi tiết
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
