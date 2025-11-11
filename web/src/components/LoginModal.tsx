import React, { useState } from 'react';
import { setTokens } from '../lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string, user: any) => void;
  apiBaseUrl: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, apiBaseUrl }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLAnchorElement>(null);

  // Reset menu when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowRegisterMenu(false);
    }
  }, [isOpen]);

  // Close register menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showRegisterMenu &&
          menuRef.current &&
          buttonRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)) {
        setShowRegisterMenu(false);
      }
    };

    if (showRegisterMenu) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRegisterMenu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/heritage/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT tokens
        setTokens({
          access: data.access,
          refresh: data.refresh
        });

        // Store user info
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userRole', data.user.role || 'student');

        onLogin(data.access, data.user);
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError(data.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Không thể kết nối đến server');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '350px',
        maxWidth: '90vw',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Đăng nhập Admin</h2>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#6c757d'
        }}>
        </div>

        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '14px',
          position: 'relative'
        }}>
          Chưa có tài khoản?{' '}
          <a
            ref={buttonRef}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowRegisterMenu(!showRegisterMenu);
            }}
            style={{
              color: '#007bff',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Đăng ký ngay ▼
          </a>

          {showRegisterMenu && (
            <div
              ref={menuRef}
              style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 3000,
              minWidth: '200px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => {
                  setShowRegisterMenu(false);
                  onClose();
                  window.dispatchEvent(new CustomEvent('openRegisterModal', { detail: { type: 'normal' } }));
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#333',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <span style={{ fontSize: '18px' }}>👤</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Đăng ký tài khoản học sinh</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Với đầy đủ thông tin</div>
                </div>
              </button>

              <div style={{ height: '1px', backgroundColor: '#e0e0e0' }}></div>

              <button
                onClick={() => {
                  setShowRegisterMenu(false);
                  onClose();
                  window.dispatchEvent(new CustomEvent('openRegisterModal', { detail: { type: 'tourist' } }));
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#333',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <span style={{ fontSize: '18px' }}>🧳</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Đăng ký khách du lịch</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Đăng ký nhanh, chỉ cần tên & mật khẩu</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;