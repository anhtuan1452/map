import React, { useState } from 'react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
  apiBaseUrl: string;
  registerType?: 'normal' | 'tourist'; // Loại đăng ký: bình thường hoặc khách du lịch
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onRegisterSuccess, apiBaseUrl, registerType = 'normal' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const isTouristMode = registerType === 'tourist';

  // Reset form when registerType changes
  React.useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setSchoolName('');
      setClassName('');
      setError('');
      setSuccess('');
    }
  }, [registerType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    // Validate username length
    if (trimmedUsername.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      setIsLoading(false);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setIsLoading(false);
      return;
    }

    // Validate email format if provided (only in normal mode)
    if (!isTouristMode && trimmedEmail && !trimmedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Email không đúng định dạng');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/heritage/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          email: isTouristMode ? '' : trimmedEmail,
          school_name: isTouristMode ? '' : schoolName.trim(),
          class_name: isTouristMode ? '' : className.trim(),
          role: isTouristMode ? 'tourist' : 'student'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
        // Reset form
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
        setSchoolName('');
        setClassName('');
        
        // Notify parent and close after 2 seconds
        setTimeout(() => {
          onRegisterSuccess();
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError('Không thể kết nối đến server');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000, overflowY: 'auto', padding: '20px' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '450px',
        maxWidth: '90vw',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
          {isTouristMode ? '🧳 Đăng ký khách du lịch' : '📝 Đăng ký tài khoản'}
        </h2>
        
        {isTouristMode && (
          <div style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #ffeaa7',
            fontSize: '13px'
          }}>
            ⚡ <strong>Đăng ký nhanh:</strong> Chỉ cần tên đăng nhập và mật khẩu
          </div>
        )}
        
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #f5c6cb',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #c3e6cb',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
              Tên đăng nhập <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={150}
              pattern="[a-zA-Z0-9_-]+"
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Chữ cái, số, _ hoặc -"
              disabled={isLoading}
              title="Chỉ được dùng chữ cái, số, gạch dưới (_) hoặc gạch ngang (-)"
            />
          </div>
          
          {/* Password */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
              Mật khẩu <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Ít nhất 6 ký tự"
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: isTouristMode ? '20px' : '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
              Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Nhập lại mật khẩu"
              disabled={isLoading}
            />
          </div>

          {/* Email - Hidden in tourist mode */}
          {!isTouristMode && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="email@example.com (không bắt buộc)"
                disabled={isLoading}
              />
            </div>
          )}

          {/* School Name - Hidden in tourist mode */}
          {!isTouristMode && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                Tên trường
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="VD: THPT Chuyên Lê Hồng Phong"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Class Name - Hidden in tourist mode */}
          {!isTouristMode && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                Lớp
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="VD: 12A1"
                disabled={isLoading}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6c757d', 
                color: 'white',
                border: 'none', 
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </div>
        </form>

        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: isTouristMode ? '#fff3cd' : '#e7f3ff', 
          borderRadius: '4px',
          fontSize: '13px',
          color: isTouristMode ? '#856404' : '#004085',
          borderLeft: `4px solid ${isTouristMode ? '#ffc107' : '#007bff'}`
        }}>
          <strong>💡 Lưu ý:</strong><br/>
          • Tên đăng nhập: 3-150 ký tự (chữ, số, _, -)<br/>
          • Mật khẩu: ít nhất 6 ký tự<br/>
          {isTouristMode ? (
            <>• Khách du lịch không truy cập Quiz Battle & Bảng xếp hạng</>
          ) : (
            <>• Thông tin trường và lớp giúp hệ thống tốt hơn</>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
