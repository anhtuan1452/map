import React from 'react';
import { postFeedback } from '../services/api';
import { MessageSquare, Send } from 'lucide-react';

interface FeedbackFormProps {
  siteId: string;
  siteName: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ siteId, siteName }) => {
  const [showForm, setShowForm] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  const submit = async () => {
    if (!message.trim()) {
      alert('Vui lòng nhập nội dung góp ý');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('site_id', siteId);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('category', 'general');
      formData.append('message', message);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      const response = await postFeedback(formData);
      setMessage('');
      setName('');
      setEmail('');
      setSelectedImage(null);
      setShowForm(false);
      alert('✅ Gửi góp ý thành công! Cảm ơn bạn đã đóng góp.');
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 429) {
        const errorData = await e.response.json();
        alert(`⏳ ${errorData.error}`);
      } else {
        alert('❌ Gửi góp ý thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4 mt-4" ref={formRef}>
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
      >
        <MessageSquare size={20} />
        {showForm ? 'Ẩn form góp ý' : 'Góp ý / Báo cáo'}
      </button>

      {showForm && (
        <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded text-sm text-blue-700">
            ℹ️ Bạn có thể gửi góp ý mỗi 5 phút một lần
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên (tùy chọn)
            </label>
            <input 
              type="text"
              placeholder="Nhập họ tên của bạn" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (tùy chọn)
            </label>
            <input 
              type="email"
              placeholder="email@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung góp ý <span className="text-red-500">*</span>
            </label>
            <textarea 
              placeholder={`Nhập góp ý của bạn về ${siteName}...`}
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📷 Đính kèm ảnh (tùy chọn)
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedImage && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Đã chọn: {selectedImage.name}
              </p>
            )}
          </div>

          <button 
            onClick={submit}
            disabled={isSubmitting || !message.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            <Send size={18} />
            {isSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}
          </button>
        </div>
      )}
    </div>
  );
};
