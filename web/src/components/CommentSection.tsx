import React, { useState, useEffect } from 'react';
import { Camera, Flag, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../services/api';

interface Comment {
  id: number;
  user_name: string;
  content: string;
  images: string[];
  created_at: string;
  updated_at: string;
  is_reported: boolean;
  report_count: number;
  can_delete: boolean;
}

interface CommentSectionProps {
  siteId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ siteId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  // Form state
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState(user?.username || '');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUserName(user.username);
    }
  }, [user]);

  useEffect(() => {
    loadComments();
  }, [siteId, page, startDate, endDate]);

  const loadComments = async () => {
    setLoading(true);
    try {
      let url = `/api/heritage/comments/?site_id=${siteId}&page=${page}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      setComments(data.results || []);
      setTotalPages(data.total_pages || 1);
      setHasNext(data.has_next || false);
      setHasPrevious(data.has_previous || false);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // No files selected
    if (files.length === 0) return;
    
    // Validate max 3 images
    if (files.length + images.length > 3) {
      alert('Tối đa 3 ảnh mỗi bình luận');
      e.target.value = ''; // Reset input
      return;
    }
    
    // Validate each file size (max 10MB)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Ảnh "${file.name}" quá lớn. Kích thước tối đa 10MB`);
        e.target.value = ''; // Reset input
        return;
      }
    }
    
    setImages([...images, ...files]);
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...newPreviews]);
    
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('Vui lòng nhập nội dung bình luận');
      return;
    }
    
    if (!userName.trim()) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('site_id', siteId);
      formData.append('user_name', userName);
      formData.append('content', newComment);
      
      // Upload images if any
      const imageUrls: string[] = [];
      for (const image of images) {
        const imgFormData = new FormData();
        imgFormData.append('image', image);
        
        const uploadResponse = await fetch('/api/heritage/comments/upload-image/', {
          method: 'POST',
          body: imgFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.image_url) {
            imageUrls.push(uploadData.image_url);
          }
        }
      }
      
      formData.append('images', JSON.stringify(imageUrls));
      
      const response = await fetch('/api/heritage/comments/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setNewComment('');
        setImages([]);
        setImagePreview([]);
        alert('✅ Bình luận đã được đăng!');
        loadComments();
      } else {
        const error = await response.json();
        if (response.status === 429) {
          alert(`⏳ ${error.error}`);
        } else {
          alert(`❌ Lỗi: ${error.error || 'Không thể tạo comment'}`);
        }
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Lỗi khi tạo comment');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Xác nhận xóa comment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/heritage/comments/${commentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadComments();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error || 'Không thể xóa comment'}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Lỗi khi xóa comment');
    }
  };

  const handleReport = async (commentId: number) => {
    if (!userName.trim()) {
      alert('Vui lòng nhập tên của bạn');
      return;
    }
    
    if (!confirm('Báo cáo comment này?')) return;
    
    try {
      const response = await fetch(`/api/heritage/comments/${commentId}/report/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_name: userName }),
      });

      if (response.ok) {
        alert('Đã báo cáo comment');
        loadComments();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error || 'Không thể báo cáo'}`);
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert('Lỗi khi báo cáo comment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Development Notice */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex items-start">
          <span className="text-2xl mr-2">🚧</span>
          <div>
            <h4 className="font-bold text-yellow-800">Tính năng đang phát triển</h4>
            <p className="text-sm text-yellow-700">
              Hệ thống bình luận đang được cải thiện. Các bình luận sẽ được kiểm duyệt và có thể bị xóa nếu vi phạm quy định.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 font-semibold"
        >
          <Calendar size={20} />
          Lọc theo ngày
        </button>
        
        {showFilters && (
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
            <span className="self-center">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Xóa
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-gray-800">{comment.user_name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {formatDate(comment.created_at)}
                  </span>
                  {comment.is_reported && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                      Đã báo cáo ({comment.report_count})
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReport(comment.id)}
                    className="text-orange-600 hover:text-orange-700"
                    title="Báo cáo"
                  >
                    <Flag size={18} />
                  </button>
                  
                  {comment.can_delete && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-gray-700 mb-2">{comment.content}</p>
              
              {comment.images && (() => {
                // Handle images field - could be string JSON or array
                let imageUrls: string[] = [];
                try {
                  if (typeof comment.images === 'string') {
                    imageUrls = JSON.parse(comment.images);
                  } else if (Array.isArray(comment.images)) {
                    imageUrls = comment.images;
                  }
                } catch (e) {
                  console.warn('Failed to parse comment images:', e);
                  imageUrls = [];
                }
                
                return imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {imageUrls.map((url, index) => {
                      const fullUrl = url.startsWith('http') ? url : `${getApiUrl()}${url}`;
                      return (
                        <img
                          key={index}
                          src={fullUrl}
                          alt={`Ảnh ${index + 1}`}
                          className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(fullUrl, '_blank')}
                          title="Click để xem ảnh lớn"
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevious}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-gray-700">
            Trang {page} / {totalPages}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasNext}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Viết bình luận</h3>
        
        {/* Hiển thị tên người dùng đang đăng nhập */}
        {userName && (
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
            Đăng bình luận với tên: <span className="font-semibold text-blue-700">{userName}</span>
          </div>
        )}
        
        <textarea
          placeholder="Nội dung bình luận..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
          required
        />
        
        {/* Image Preview */}
        {imagePreview.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {imagePreview.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt="" className="w-20 h-20 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
            <Camera size={20} />
            <span>Thêm ảnh ({images.length}/3) - Tối đa 10MB/ảnh</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              disabled={images.length >= 3}
            />
          </label>
          
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Gửi bình luận
          </button>
        </div>
      </form>
    </div>
  );
};
