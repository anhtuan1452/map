import { useState, useEffect } from 'react';
import { 
  getAllQuizzes, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz,
  getAllFeedback,
  deleteFeedback,
  fetchSites,
  updateFeedbackEmail,
  getSystemSettings
} from '../services/api';

interface Quiz {
  id: number;
  site: number;
  site_id?: string;
  site_name: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  xp_reward: number;
  created: string;
}

interface Feedback {
  id: number;
  site: number;
  site_name: string;
  name: string;
  email: string;
  category: string;
  message: string;
  image: string | null;
  created: string;
}

interface Site {
  site_id: string;
  name: string;
}

export function ManagementDashboard({ userRole }: { userRole: string }) {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'feedback' | 'settings'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [newFeedbackEmail, setNewFeedbackEmail] = useState('');
  
  // Filter and search states
  const [quizSearchTerm, setQuizSearchTerm] = useState('');
  const [quizSiteFilter, setQuizSiteFilter] = useState('');
  const [feedbackSearchTerm, setFeedbackSearchTerm] = useState('');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('');
  
  // Pagination states
  const [quizPage, setQuizPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const itemsPerPage = 20;

  const [quizForm, setQuizForm] = useState({
    site_id: '',
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    xp_reward: 10
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'quizzes') {
        const [quizzesData, sitesData] = await Promise.all([
          getAllQuizzes(),
          fetchSites()
        ]);
        setQuizzes(quizzesData);
        // Extract sites from GeoJSON
        const sitesList = sitesData.features.map((f: any) => ({
          site_id: f.properties.id,
          name: f.properties.name
        }));
        setSites(sitesList);
      } else if (activeTab === 'feedback') {
        const data = await getAllFeedback();
        setFeedbacks(data);
      } else if (activeTab === 'settings') {
        // Load system settings
        try {
          const data = await getSystemSettings();
          setFeedbackEmail(data.feedback_email);
          setNewFeedbackEmail(data.feedback_email);
        } catch (error) {
          console.error('Error loading settings:', error);
          // Set default values if API fails
          setFeedbackEmail('');
          setNewFeedbackEmail('');
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      alert('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.question.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
                         quiz.site_name.toLowerCase().includes(quizSearchTerm.toLowerCase());
    const matchesSite = !quizSiteFilter || quiz.site_id === quizSiteFilter;
    return matchesSearch && matchesSite;
  });

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      (feedback.name?.toLowerCase() || '').includes(feedbackSearchTerm.toLowerCase()) ||
      (feedback.email?.toLowerCase() || '').includes(feedbackSearchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
      feedback.site_name.toLowerCase().includes(feedbackSearchTerm.toLowerCase());
    const matchesCategory = !feedbackCategoryFilter || feedback.category === feedbackCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const quizTotalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
  const feedbackTotalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  
  const paginatedQuizzes = filteredQuizzes.slice(
    (quizPage - 1) * itemsPerPage,
    quizPage * itemsPerPage
  );
  
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (feedbackPage - 1) * itemsPerPage,
    feedbackPage * itemsPerPage
  );

  // Reset to page 1 when filter changes
  const handleQuizSearchChange = (value: string) => {
    setQuizSearchTerm(value);
    setQuizPage(1);
  };

  const handleQuizSiteFilterChange = (value: string) => {
    setQuizSiteFilter(value);
    setQuizPage(1);
  };

  const handleFeedbackSearchChange = (value: string) => {
    setFeedbackSearchTerm(value);
    setFeedbackPage(1);
  };

  const handleFeedbackCategoryFilterChange = (value: string) => {
    setFeedbackCategoryFilter(value);
    setFeedbackPage(1);
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        await updateQuiz(editingQuiz.id, quizForm);
        alert('Cập nhật quiz thành công');
      } else {
        await createQuiz(quizForm);
        alert('Tạo quiz thành công');
      }
      resetQuizForm();
      loadData();
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Lỗi khi lưu quiz');
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      site_id: quiz.site_id || '',
      question: quiz.question,
      option_a: quiz.option_a,
      option_b: quiz.option_b,
      option_c: quiz.option_c,
      option_d: quiz.option_d,
      correct_answer: quiz.correct_answer,
      xp_reward: quiz.xp_reward || 10
    });
    setShowQuizForm(true);
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (window.confirm('Bạn có chắc muốn xóa quiz này?')) {
      try {
        await deleteQuiz(quizId);
        alert('Xóa quiz thành công');
        loadData();
      } catch (err) {
        console.error('Error deleting quiz:', err);
        alert('Lỗi khi xóa quiz');
      }
    }
  };

  const handleDeleteFeedback = async (feedbackId: number) => {
    if (window.confirm('Bạn có chắc muốn xóa phản hồi này?')) {
      try {
        await deleteFeedback(feedbackId);
        alert('Xóa phản hồi thành công');
        loadData();
      } catch (err) {
        console.error('Error deleting feedback:', err);
        alert('Lỗi khi xóa phản hồi');
      }
    }
  };

  const handleUpdateFeedbackEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFeedbackEmail || !newFeedbackEmail.includes('@')) {
      alert('Email không hợp lệ!');
      return;
    }
    
    try {
      await updateFeedbackEmail(newFeedbackEmail);
      alert('Cập nhật email thành công!');
      setFeedbackEmail(newFeedbackEmail);
    } catch (error: any) {
      console.error('Error updating feedback email:', error);
      alert(`Lỗi: ${error.response?.data?.error || 'Không thể cập nhật email'}`);
    }
  };

  const resetQuizForm = () => {
    setQuizForm({
      site_id: '',
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      xp_reward: 10
    });
    setEditingQuiz(null);
    setShowQuizForm(false);
  };

  if (userRole !== 'super_admin' && userRole !== 'teacher') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="management-dashboard">
      <div className="modal-tabs-container">
        <button
          className={`modal-tab-button ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          📝 Quản lý Quiz
        </button>
        <button
          className={`modal-tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          💬 Quản lý Phản hồi
        </button>
        <button
          className={`modal-tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Cài đặt
        </button>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <>
          {activeTab === 'quizzes' && (
            <div className="quiz-management">
              <div className="section-header">
                <h3>Danh sách Quiz ({filteredQuizzes.length}/{quizzes.length})</h3>
                <button className="btn-primary" onClick={() => setShowQuizForm(!showQuizForm)}>
                  {showQuizForm ? 'Đóng' : '+ Tạo Quiz Mới'}
                </button>
              </div>

              {/* Filter and Search */}
              <div className="filter-section">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm theo câu hỏi hoặc địa điểm..."
                    value={quizSearchTerm}
                    onChange={(e) => handleQuizSearchChange(e.target.value)}
                  />
                </div>
                <div className="filter-box">
                  <select
                    value={quizSiteFilter}
                    onChange={(e) => handleQuizSiteFilterChange(e.target.value)}
                  >
                    <option value="">Tất cả địa điểm</option>
                    {sites.map(site => (
                      <option key={site.site_id} value={site.site_id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
                {(quizSearchTerm || quizSiteFilter) && (
                  <button 
                    className="btn-clear-filter"
                    onClick={() => {
                      setQuizSearchTerm('');
                      setQuizSiteFilter('');
                      setQuizPage(1);
                    }}
                  >
                    ✕ Xóa bộ lọc
                  </button>
                )}
              </div>

              {showQuizForm && (
                <form className="quiz-form" onSubmit={handleQuizSubmit}>
                  <h4>{editingQuiz ? 'Chỉnh sửa Quiz' : 'Tạo Quiz Mới'}</h4>
                  
                  <div className="form-group">
                    <label>Địa điểm:</label>
                    <select
                      value={quizForm.site_id}
                      onChange={(e) => setQuizForm({ ...quizForm, site_id: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn địa điểm --</option>
                      {sites.map((site) => (
                        <option key={site.site_id} value={site.site_id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Câu hỏi:</label>
                    <textarea
                      value={quizForm.question}
                      onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Đáp án A:</label>
                    <input
                      type="text"
                      value={quizForm.option_a}
                      onChange={(e) => setQuizForm({ ...quizForm, option_a: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Đáp án B:</label>
                    <input
                      type="text"
                      value={quizForm.option_b}
                      onChange={(e) => setQuizForm({ ...quizForm, option_b: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Đáp án C:</label>
                    <input
                      type="text"
                      value={quizForm.option_c}
                      onChange={(e) => setQuizForm({ ...quizForm, option_c: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Đáp án D:</label>
                    <input
                      type="text"
                      value={quizForm.option_d}
                      onChange={(e) => setQuizForm({ ...quizForm, option_d: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Đáp án đúng:</label>
                    <select
                      value={quizForm.correct_answer}
                      onChange={(e) => setQuizForm({ ...quizForm, correct_answer: e.target.value })}
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Điểm XP thưởng:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quizForm.xp_reward}
                      onChange={(e) => setQuizForm({ ...quizForm, xp_reward: parseInt(e.target.value) || 10 })}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      {editingQuiz ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={resetQuizForm}>
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              <div className="quiz-list">
                {filteredQuizzes.length === 0 ? (
                  <p className="empty-state">
                    {quizzes.length === 0 ? 'Chưa có quiz nào.' : 'Không tìm thấy quiz phù hợp.'}
                  </p>
                ) : (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Địa điểm</th>
                          <th>Câu hỏi</th>
                          <th>Đáp án đúng</th>
                          <th>XP thưởng</th>
                          <th>Ngày tạo</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedQuizzes.map((quiz) => (
                        <tr key={quiz.id}>
                          <td>{quiz.id}</td>
                          <td>{quiz.site_name}</td>
                          <td title={quiz.question}>
                            {quiz.question.length > 50 
                              ? quiz.question.substring(0, 50) + '...' 
                              : quiz.question}
                          </td>
                          <td className="correct-answer">{quiz.correct_answer}</td>
                          <td>{quiz.xp_reward || 10} XP</td>
                          <td>{new Date(quiz.created).toLocaleDateString('vi-VN')}</td>
                          <td className="actions">
                            <button 
                              className="btn-edit"
                              onClick={() => handleEditQuiz(quiz)}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {quizTotalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="btn-page"
                        onClick={() => setQuizPage(1)}
                        disabled={quizPage === 1}
                      >
                        ⏮️ Đầu
                      </button>
                      <button
                        className="btn-page"
                        onClick={() => setQuizPage(quizPage - 1)}
                        disabled={quizPage === 1}
                      >
                        ◀️ Trước
                      </button>
                      <span className="page-info">
                        Trang {quizPage} / {quizTotalPages}
                      </span>
                      <button
                        className="btn-page"
                        onClick={() => setQuizPage(quizPage + 1)}
                        disabled={quizPage === quizTotalPages}
                      >
                        Sau ▶️
                      </button>
                      <button
                        className="btn-page"
                        onClick={() => setQuizPage(quizTotalPages)}
                        disabled={quizPage === quizTotalPages}
                      >
                        Cuối ⏭️
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="feedback-management">
              <div className="section-header">
                <h3>Danh sách Phản hồi ({filteredFeedbacks.length}/{feedbacks.length})</h3>
              </div>

              {/* Filter and Search */}
              <div className="filter-section">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm theo tên, email, nội dung hoặc địa điểm..."
                    value={feedbackSearchTerm}
                    onChange={(e) => handleFeedbackSearchChange(e.target.value)}
                  />
                </div>
                <div className="filter-box">
                  <select
                    value={feedbackCategoryFilter}
                    onChange={(e) => handleFeedbackCategoryFilterChange(e.target.value)}
                  >
                    <option value="">Tất cả loại</option>
                    <option value="suggestion">Đề xuất</option>
                    <option value="issue">Vấn đề</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                {(feedbackSearchTerm || feedbackCategoryFilter) && (
                  <button 
                    className="btn-clear-filter"
                    onClick={() => {
                      setFeedbackSearchTerm('');
                      setFeedbackCategoryFilter('');
                      setFeedbackPage(1);
                    }}
                  >
                    ✕ Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="feedback-list">
                {filteredFeedbacks.length === 0 ? (
                  <p className="empty-state">
                    {feedbacks.length === 0 ? 'Chưa có phản hồi nào.' : 'Không tìm thấy phản hồi phù hợp.'}
                  </p>
                ) : (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Địa điểm</th>
                          <th>Người gửi</th>
                          <th>Email</th>
                          <th>Loại</th>
                          <th>Nội dung</th>
                          <th>Ảnh</th>
                          <th>Ngày gửi</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedFeedbacks.map((feedback) => (
                        <tr key={feedback.id}>
                          <td>{feedback.id}</td>
                          <td>{feedback.site_name}</td>
                          <td>{feedback.name || 'Ẩn danh'}</td>
                          <td>{feedback.email || 'N/A'}</td>
                          <td>{feedback.category}</td>
                          <td title={feedback.message}>
                            {feedback.message.length > 50 
                              ? feedback.message.substring(0, 50) + '...' 
                              : feedback.message}
                          </td>
                          <td>
                            {feedback.image ? (
                              <a href={feedback.image} target="_blank" rel="noopener noreferrer">
                                📎
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>{new Date(feedback.created).toLocaleDateString('vi-VN')}</td>
                          <td className="actions">
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteFeedback(feedback.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {feedbackTotalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="btn-page"
                        onClick={() => setFeedbackPage(1)}
                        disabled={feedbackPage === 1}
                      >
                        ⏮️ Đầu
                      </button>
                      <button
                        className="btn-page"
                        onClick={() => setFeedbackPage(feedbackPage - 1)}
                        disabled={feedbackPage === 1}
                      >
                        ◀️ Trước
                      </button>
                      <span className="page-info">
                        Trang {feedbackPage} / {feedbackTotalPages}
                      </span>
                      <button
                        className="btn-page"
                        onClick={() => setFeedbackPage(feedbackPage + 1)}
                        disabled={feedbackPage === feedbackTotalPages}
                      >
                        Sau ▶️
                      </button>
                      <button
                        className="btn-page"
                        onClick={() => setFeedbackPage(feedbackTotalPages)}
                        disabled={feedbackPage === feedbackTotalPages}
                      >
                        Cuối ⏭️
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-management">
              <div className="section-header">
                <h3>⚙️ Cài đặt Hệ thống</h3>
              </div>

              <div className="settings-content">
                <div className="setting-card">
                  <h4>📧 Email nhận phản hồi</h4>
                  <p className="setting-description">
                    Tất cả phản hồi từ người dùng sẽ được gửi đến địa chỉ email này
                  </p>
                  
                  <form onSubmit={handleUpdateFeedbackEmail} className="email-form">
                    <div className="form-group">
                      <label>Email hiện tại:</label>
                      <div className="current-email">{feedbackEmail || 'Chưa cài đặt'}</div>
                    </div>
                    
                    <div className="form-group">
                      <label>Email mới:</label>
                      <input
                        type="email"
                        value={newFeedbackEmail}
                        onChange={(e) => setNewFeedbackEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    
                    <button type="submit" className="btn-primary">
                      💾 Cập nhật Email
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .management-dashboard {
          width: 100%;
        }

        .management-dashboard .modal-tabs-container {
          margin-bottom: 20px;
        }
        
        .management-dashboard .modal-tab-button:hover {
          color: #26C6DA;
          background: rgba(38, 198, 218, 0.05);
        }
        
        .management-dashboard .modal-tab-button.active {
          color: #26C6DA;
          border-bottom-color: #26C6DA;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0;
          color: #34495e;
        }

        .quiz-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .quiz-form h4 {
          margin-top: 0;
          color: #2c3e50;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #34495e;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn-primary, .btn-secondary, .btn-edit, .btn-delete {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        th {
          background: #34495e;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 500;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #ecf0f1;
        }

        tbody tr:hover {
          background: #f8f9fa;
        }

        .correct-answer {
          font-weight: bold;
          color: #27ae60;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn-edit, .btn-delete {
          padding: 6px 12px;
          font-size: 16px;
        }

        .btn-edit {
          background: #f39c12;
        }

        .btn-edit:hover {
          background: #e67e22;
        }

        .btn-delete {
          background: #e74c3c;
        }

        .btn-delete:hover {
          background: #c0392b;
        }

        .loading, .empty-state {
          text-align: center;
          padding: 40px;
          color: #7f8c8d;
        }

        .settings-management {
          max-width: 800px;
        }

        .settings-content {
          margin-top: 20px;
        }

        .setting-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .setting-card h4 {
          margin: 0 0 8px 0;
          color: #2c3e50;
          font-size: 18px;
        }

        .setting-description {
          color: #7f8c8d;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .email-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .email-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .email-form label {
          font-weight: 500;
          color: #2c3e50;
          font-size: 14px;
        }

        .current-email {
          padding: 10px;
          background: #ecf0f1;
          border-radius: 4px;
          color: #34495e;
          font-family: monospace;
        }

        .email-form input[type="email"] {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .email-form input[type="email"]:focus {
          outline: none;
          border-color: #3498db;
        }

        .email-form .btn-primary {
          align-self: flex-start;
        }

        .filter-section {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .search-box {
          flex: 1;
        }

        .search-box input {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .search-box input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .filter-box {
          min-width: 200px;
        }

        .filter-box select {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .filter-box select:focus {
          outline: none;
          border-color: #3498db;
        }

        .btn-clear-filter {
          padding: 10px 16px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .btn-clear-filter:hover {
          background: #c0392b;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 24px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .btn-page {
          padding: 8px 16px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          color: #2c3e50;
        }

        .btn-page:hover:not(:disabled) {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .btn-page:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-info {
          padding: 8px 16px;
          font-weight: 500;
          color: #2c3e50;
          min-width: 120px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .filter-section {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-box {
            min-width: auto;
          }

          .pagination {
            flex-wrap: wrap;
            gap: 8px;
          }

          .btn-page {
            padding: 6px 12px;
            font-size: 13px;
          }

          .page-info {
            width: 100%;
            order: -1;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
}
