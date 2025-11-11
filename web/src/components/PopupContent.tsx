import React from 'react';
import { postFeedback, deleteSite } from '../services/api';
import { QuizComponent } from './QuizComponent';

const PopupContent: React.FC<{ 
  feature: any; 
  onSiteDeleted?: () => void;
  onEditClick?: (feature: any) => void;
  isAuthenticated?: boolean;
  userRole?: string;
  userName?: string;
}> = ({ feature, onSiteDeleted, onEditClick, isAuthenticated = false, userRole = 'student', userName }) => {
  const props = feature.properties || {};
  const [showForm, setShowForm] = React.useState(false);
  const [showQuiz, setShowQuiz] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);

  const submit = async () => {
    try {
      const formData = new FormData();
      formData.append('site_id', props.id);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('category', 'general');
      formData.append('message', message);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      await postFeedback(formData);
      setMessage('');
      setName('');
      setEmail('');
      setSelectedImage(null);
      setShowForm(false);
      alert('Gửi góp ý thành công');
    } catch (e) {
      console.error(e);
      alert('Gửi góp ý thất bại');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Bạn có chắc muốn xóa "${props.name}"?`)) {
      try {
        await deleteSite(props.id);
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
    <div style={{ width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
      <h3 style={{ margin: '0 0 15px 0' }}>{props.name}</h3>
      
      {/* Hiển thị nhiều hình ảnh với slider nếu có */}
      {props.image_urls && props.image_urls.length > 0 && (
        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <div style={{ 
            overflow: 'hidden', 
            borderRadius: '4px',
            position: 'relative'
          }}>
            <img 
              src={props.image_urls[currentImageIndex]} 
              alt={`${props.name} ${currentImageIndex + 1}`}
              style={{ 
                width: '100%', 
                maxHeight: '250px', 
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          
          {/* Navigation buttons nếu có nhiều hơn 1 ảnh */}
          {props.image_urls.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => 
                  prev === 0 ? props.image_urls.length - 1 : prev - 1
                )}
                style={{
                  position: 'absolute',
                  left: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => 
                  prev === props.image_urls.length - 1 ? 0 : prev + 1
                )}
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ›
              </button>
              
              {/* Dots indicator */}
              <div style={{
                position: 'absolute',
                bottom: '5px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '5px'
              }}>
                {props.image_urls.map((_: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.3)'
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      <p><strong>Tóm tắt:</strong> {props.summary}</p>
      
      {props.history && (
        <details style={{ marginTop: '10px' }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontWeight: 'bold',
            padding: '5px',
            backgroundColor: '#f0f0f0',
            borderRadius: '3px',
            userSelect: 'none'
          }}>
            📜 Chi tiết lịch sử
          </summary>
          <div style={{ 
            marginTop: '8px', 
            padding: '8px',
            backgroundColor: '#f9f9f9',
            borderRadius: '3px',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <p style={{ margin: 0 }}>{props.history}</p>
          </div>
        </details>
      )}

      {props.dos && props.dos.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ marginBottom: '5px', color: '#28a745' }}>✅ Hành vi nên làm</h4>
          <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
            {props.dos.map((d: string, i: number) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      {props.donts && props.donts.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ marginBottom: '5px', color: '#dc3545' }}>❌ Hành vi không nên làm</h4>
          <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
            {props.donts.map((d: string, i: number) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      {props.legal_excerpt && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ marginBottom: '5px', color: '#6f42c1' }}>⚖️ Trích đoạn pháp lý</h4>
          <p style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '8px', 
            borderRadius: '3px',
            fontSize: '13px',
            borderLeft: '3px solid #6f42c1'
          }}>
            {props.legal_excerpt}
          </p>
        </div>
      )}

      <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button onClick={() => setShowForm(!showForm)}>Góp ý / Báo cáo</button>
        
        {/* Nút sửa cho giáo viên và super admin */}
        {isAuthenticated && (userRole === 'teacher' || userRole === 'super_admin') && (
          <button 
            onClick={() => onEditClick && onEditClick(feature)}
            style={{ 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              padding: '5px 10px', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            ✏️ Sửa
          </button>
        )}
        
        {/* Nút xóa chỉ cho super admin */}
        {isAuthenticated && userRole === 'super_admin' && (
          <button 
            onClick={handleDelete}
            style={{ 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              padding: '5px 10px', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            🗑️ Xóa
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ marginTop: '10px' }}>
          <input 
            placeholder="Tên (tùy chọn)" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', marginBottom: '5px', padding: '5px' }}
          />
          <input 
            placeholder="Email (tùy chọn)" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', marginBottom: '5px', padding: '5px' }}
          />
          <textarea 
            placeholder="Nội dung" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: '100%', marginBottom: '5px', padding: '5px', minHeight: '60px' }}
          />
          <div style={{ marginBottom: '5px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
              📷 Đính kèm ảnh (tùy chọn):
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              style={{ width: '100%' }}
            />
            {selectedImage && (
              <small style={{ color: '#666', display: 'block', marginTop: '3px' }}>
                ✓ Đã chọn: {selectedImage.name}
              </small>
            )}
          </div>
          <button 
            onClick={submit}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '3px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            📤 Gửi góp ý
          </button>
        </div>
      )}

      {/* Quiz Section */}
      <div style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
        <button
          onClick={() => setShowQuiz(!showQuiz)}
          style={{
            backgroundColor: showQuiz ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '10px',
            fontWeight: '500'
          }}
        >
          {showQuiz ? '🎯 Ẩn câu hỏi' : '🎯 Trả lời câu hỏi về địa điểm này'}
        </button>
        
        {showQuiz && <QuizComponent siteId={props.id} userName={userName || 'Anonymous'} />}
      </div>
    </div>
  );
};

export default PopupContent;
