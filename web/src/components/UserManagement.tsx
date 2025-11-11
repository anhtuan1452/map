import React, { useState, useEffect } from 'react';
import api from '../lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  date_joined: string;
  last_login: string | null;
}

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  currentUsername: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose, apiBaseUrl, currentUsername }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: 'student' });

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/heritage/admin/users/list/`, {
        params: { 
          page,
          page_size: 20,
          search: searchTerm,
          role: roleFilter
        }
      });
      setUsers(response.data.results);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.count);
      setCurrentPage(response.data.current_page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi tải danh sách user');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.password) {
      alert('Username và password là bắt buộc');
      return;
    }
    try {
      await api.post(`/api/heritage/admin/users/create/`, newUser);
      setShowAddForm(false);
      setNewUser({ username: '', password: '', email: '', role: 'student' });
      loadUsers(currentPage);
      alert('Tạo user thành công');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi tạo user');
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      await api.post(`/api/heritage/admin/users/${userId}/role/`, { role });
      loadUsers(currentPage);
      alert('Cập nhật vai trò thành công');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi cập nhật vai trò');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers(1);
  };

  const getRoleDisplay = (role: string) => {
    const map: any = {
      'super_admin': 'Super Admin',
      'teacher': 'Giáo viên',
      'student': 'Học sinh',
      'tourist': 'Khách du lịch'
    };
    return map[role] || role;
  };

  const getRoleColor = (role: string) => {
    const map: any = {
      'super_admin': '#9C27B0',
      'teacher': '#FF9800',
      'student': '#2196F3',
      'tourist': '#4CAF50'
    };
    return map[role] || '#9E9E9E';
  };

  useEffect(() => {
    if (isOpen && currentUsername) {
      loadUsers(currentPage);
    }
  }, [isOpen, roleFilter]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-container" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>👥 Quản lý người dùng</h2>
          <button onClick={onClose} className="modal-close-button" style={{ fontSize: '24px' }}>×</button>
        </div>
        <div className="modal-content">

        {error && (
          <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {/* Search and Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm (username hoặc email)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
            <option value="tourist">Khách du lịch</option>
          </select>

          <button
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Tìm kiếm
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Thêm user
          </button>
        </div>

        {/* Create User Form */}
        {showAddForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ marginTop: 0 }}>Tạo user mới</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Username *"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type="password"
                placeholder="Password *"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}
              >
                <option value="student">Học sinh</option>
                <option value="tourist">Khách du lịch</option>
                <option value="teacher">Giáo viên</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={createUser}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Tạo user
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewUser({ username: '', password: '', email: '', role: 'student' });
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <strong>Tổng số user: {totalCount} | Trang {currentPage}/{totalPages}</strong>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Username</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Vai trò</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Đăng ký</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <strong>{user.username}</strong>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {user.email || '-'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: getRoleColor(user.role),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {new Date(user.date_joined).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <select
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        defaultValue=""
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        <option value="" disabled>Đổi role...</option>
                        <option value="student">Học sinh</option>
                        <option value="tourist">Khách du lịch</option>
                        <option value="teacher">Giáo viên</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}>
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      loadUsers(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === 1 ? '#ddd' : '#2196F3',
                    color: currentPage === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Trước
                </button>

                <span style={{ fontSize: '14px', padding: '0 10px' }}>
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => {
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                      loadUsers(currentPage + 1);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === totalPages ? '#ddd' : '#2196F3',
                    color: currentPage === totalPages ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Sau →
                </button>
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h4>📋 Phân quyền:</h4>
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                <li><strong>Khách du lịch:</strong> Xem bản đồ, viết comment (không có quiz/leaderboard)</li>
                <li><strong>Học sinh:</strong> Làm quiz, tham gia battle, xem leaderboard</li>
                <li><strong>Giáo viên:</strong> Quản lý comment báo cáo, thêm/xóa địa điểm, tạo quiz + tất cả quyền Học sinh</li>
                <li><strong>Super Admin:</strong> Quản lý user + tất cả quyền Giáo viên</li>
              </ul>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
