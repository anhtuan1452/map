import React, { useState, useEffect } from 'react';
import { updateSite } from '../services/api';

interface EditSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteUpdated: () => void;
  site: any | null;
}

const EditSiteModal: React.FC<EditSiteModalProps> = ({ isOpen, onClose, onSiteUpdated, site }) => {
  const [siteName, setSiteName] = useState('');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [dos, setDos] = useState<string[]>(['']);
  const [donts, setDonts] = useState<string[]>(['']);
  const [legalExcerpt, setLegalExcerpt] = useState('');
  const [conservationStatus, setConservationStatus] = useState('good');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (site && isOpen) {
      const props = site.properties || {};
      setSiteName(props.name || '');
      setDescription(props.summary || '');
      setHistory(props.history || '');
      setImageUrls(props.image_urls && props.image_urls.length > 0 ? props.image_urls : ['']);
      
      // Read from new conduct structure first, fallback to old dos/donts
      const conduct = props.conduct || {};
      setDos(conduct.dos && conduct.dos.length > 0 ? conduct.dos : (props.dos && props.dos.length > 0 ? props.dos : ['']));
      setDonts(conduct.donts && conduct.donts.length > 0 ? conduct.donts : (props.donts && props.donts.length > 0 ? props.donts : ['']));
      setLegalExcerpt(conduct.lawExcerpt || props.legal_excerpt || '');
      
      setConservationStatus(props.conservation_status || 'good');
    }
  }, [site, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !site) return;

    setIsLoading(true);
    try {
      // Build conduct object in new format
      const conductData = {
        dos: dos.filter(d => d.trim() !== ''),
        donts: donts.filter(d => d.trim() !== ''),
        lawExcerpt: legalExcerpt || '',
        lawLink: '' // Can add a field for this later
      };

      // Update geojson properties
      const updatedGeojson = {
        ...site,
        properties: {
          ...site.properties,
          name: siteName,
          summary: description,
          history: history,
          image_urls: imageUrls.filter(url => url.trim() !== ''),
          conservation_status: conservationStatus,
          conduct: conductData
        }
      };

      // Send to API - only geojson is needed as it contains all data
      await updateSite(site.properties.id, {
        geojson: updatedGeojson,
        conservation_status: conservationStatus,
        conduct: conductData
      });

      onSiteUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating site:', error);
      alert('Lỗi khi cập nhật địa điểm. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !site) return null;

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px'
  };

  const buttonStyle = (color: string) => ({
    padding: '10px 20px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-container" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>✏️ Chỉnh Sửa Địa Điểm</h2>
          <button onClick={onClose} className="modal-close-button" style={{ fontSize: '24px' }}>
            ✕
          </button>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Tên địa điểm *</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                style={inputStyle}
                placeholder="VD: Chùa Thiên Mụ"
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={labelStyle}>Mô tả ngắn</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...inputStyle, height: '80px', resize: 'vertical' as const }}
                placeholder="Mô tả ngắn gọn về địa điểm..."
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={labelStyle}>📜 Chi tiết lịch sử</label>
              <textarea
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                placeholder="Nhập chi tiết lịch sử của địa điểm..."
                style={{ ...inputStyle, height: '120px', resize: 'vertical' as const }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Multiple Images */}
            <div>
              <label style={labelStyle}>🖼️ Hình ảnh</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {imageUrls.map((url, index) => (
                  <div key={index}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...imageUrls];
                          newUrls[index] = e.target.value;
                          setImageUrls(newUrls);
                        }}
                        placeholder="https://example.com/image.jpg"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                          style={{ ...buttonStyle('#ef4444'), padding: '10px 14px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {url && (
                      <div style={{ marginTop: '8px', textAlign: 'center', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`}
                          style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '6px', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setImageUrls([...imageUrls, ''])}
                  style={buttonStyle('#3b82f6')}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  ➕ Thêm ảnh
                </button>
              </div>
            </div>

            {/* Dos - Hành vi nên làm */}
            <div>
              <label style={labelStyle}>✅ Hành vi nên làm</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dos.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newDos = [...dos];
                        newDos[index] = e.target.value;
                        setDos(newDos);
                      }}
                      placeholder="VD: Giữ gìn vệ sinh"
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#10b981'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                    {dos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDos(dos.filter((_, i) => i !== index))}
                        style={{ ...buttonStyle('#ef4444'), padding: '10px 14px' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDos([...dos, ''])}
                  style={buttonStyle('#10b981')}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  ➕ Thêm hành vi nên làm
                </button>
              </div>
            </div>

            {/* Don'ts - Hành vi không nên làm */}
            <div>
              <label style={labelStyle}>⛔ Hành vi không nên làm</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {donts.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newDonts = [...donts];
                        newDonts[index] = e.target.value;
                        setDonts(newDonts);
                      }}
                      placeholder="VD: Không vẽ bậy"
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                    {donts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDonts(donts.filter((_, i) => i !== index))}
                        style={{ ...buttonStyle('#ef4444'), padding: '10px 14px' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDonts([...donts, ''])}
                  style={buttonStyle('#f59e0b')}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                >
                  ➕ Thêm hành vi không nên làm
                </button>
              </div>
            </div>

            {/* Legal Excerpt */}
            <div>
              <label style={labelStyle}>⚖️ Trích đoạn pháp lý</label>
              <textarea
                value={legalExcerpt}
                onChange={(e) => setLegalExcerpt(e.target.value)}
                placeholder="VD: Theo Luật Di sản văn hóa 2001..."
                style={{ ...inputStyle, height: '80px', resize: 'vertical' as const }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={labelStyle}>🏛️ Tình trạng bảo tồn</label>
              <select
                value={conservationStatus}
                onChange={(e) => setConservationStatus(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <option value="good">✅ Tốt (Good)</option>
                <option value="watch">⚠️ Cần quan tâm (Watch)</option>
                <option value="critical">🚨 Nguy cấp (Critical)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '2px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={onClose}
                style={buttonStyle('#6b7280')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{ 
                  ...buttonStyle('#10b981'),
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#10b981')}
              >
                {isLoading ? '⏳ Đang cập nhật...' : '💾 Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSiteModal;
