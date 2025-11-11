import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        translation: {
          nav: {
            home: 'Trang chủ',
            map: 'Bản đồ',
            about: 'Giới thiệu',
            contact: 'Liên hệ',
            management: 'Quản lý',
            logout: 'Đăng xuất',
          },
          drawer: {
            tabs: {
              intro: 'Giới thiệu',
              conduct: 'Quy tắc',
              status: 'Bảo tồn',
              quiz: 'Trắc nghiệm',
              gamification: 'Thành tích',
            },
            close: 'Đóng',
          },
          conservation: {
            critical: 'Nguy cấp',
            watch: 'Cần quan tâm',
            good: 'Tốt',
          },
          conduct: {
            dos: 'Nên làm',
            donts: 'Không nên làm',
            lawTitle: 'Căn cứ pháp lý',
          },
          game: {
            xp: 'Kinh nghiệm',
            level: 'Cấp độ',
            badges: 'Huy hiệu',
            rank: 'Xếp hạng',
            weeklyLeaderboard: 'Bảng xếp hạng tuần',
          },
          quiz: {
            start: 'Bắt đầu',
            submit: 'Nộp bài',
            correct: 'Chính xác!',
            incorrect: 'Sai rồi!',
            completed: 'Đã hoàn thành',
            timeLeft: 'Thời gian còn lại',
          },
          feedback: {
            title: 'Góp ý',
            name: 'Họ tên',
            email: 'Email',
            category: 'Loại',
            message: 'Nội dung',
            submit: 'Gửi',
            success: 'Gửi thành công!',
          },
        },
      },
      en: {
        translation: {
          nav: {
            home: 'Home',
            map: 'Map',
            about: 'About',
            contact: 'Contact',
            management: 'Management',
            logout: 'Logout',
          },
          drawer: {
            tabs: {
              intro: 'Introduction',
              conduct: 'Rules',
              status: 'Conservation',
              quiz: 'Quiz',
              gamification: 'Achievements',
            },
            close: 'Close',
          },
          conservation: {
            critical: 'Critical',
            watch: 'Watch',
            good: 'Good',
          },
          conduct: {
            dos: 'Do',
            donts: "Don't",
            lawTitle: 'Legal Basis',
          },
          game: {
            xp: 'Experience',
            level: 'Level',
            badges: 'Badges',
            rank: 'Rank',
            weeklyLeaderboard: 'Weekly Leaderboard',
          },
          quiz: {
            start: 'Start',
            submit: 'Submit',
            correct: 'Correct!',
            incorrect: 'Incorrect!',
            completed: 'Completed',
            timeLeft: 'Time left',
          },
          feedback: {
            title: 'Feedback',
            name: 'Name',
            email: 'Email',
            category: 'Category',
            message: 'Message',
            submit: 'Submit',
            success: 'Sent successfully!',
          },
        },
      },
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
