import api, { getApiUrl } from '../lib/api';

// Re-export getApiUrl for backward compatibility
export { getApiUrl };

export async function fetchSites() {
  const res = await api.get('/api/heritage/sites/');
  return res.data;
}

export async function addSite(siteData: any) {
  const res = await api.post('/api/heritage/sites/', siteData);
  return res.data;
}

export async function deleteSite(siteId: string) {
  const res = await api.delete(`/api/heritage/sites/${siteId}/`);
  return res.data;
}

export async function updateSite(siteId: string, siteData: any) {
  const res = await api.put(`/api/heritage/sites/${siteId}/update/`, siteData);
  return res.data;
}

export async function postFeedback(payload: any) {
  const config = payload instanceof FormData 
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {};
  const res = await api.post('/api/heritage/feedback/', payload, config);
  return res.data;
}

// Quiz API endpoints
export async function getQuizzesBySite(siteId: string) {
  const res = await api.get(`/api/heritage/quizzes/?site_id=${siteId}`);
  return res.data;
}

export async function checkQuizAttempts(userName: string, siteId?: string) {
  const params = new URLSearchParams({ user_name: userName });
  if (siteId) params.append('site_id', siteId);
  const res = await api.get(`/api/heritage/quizzes/check_attempts/?${params}`);
  return res.data;
}

export async function getAllQuizzes() {
  const res = await api.get('/api/heritage/quizzes/');
  return res.data;
}

export async function createQuiz(quizData: any) {
  const res = await api.post('/api/heritage/quizzes/', quizData);
  return res.data;
}

export async function updateQuiz(quizId: number, quizData: any) {
  const res = await api.put(`/api/heritage/quizzes/${quizId}/`, quizData);
  return res.data;
}

export async function deleteQuiz(quizId: number) {
  const res = await api.delete(`/api/heritage/quizzes/${quizId}/`);
  return res.data;
}

export async function submitQuizAnswer(quizId: number, userName: string, userAnswer: string, startedAt: string) {
  const res = await api.post(`/api/heritage/quizzes/${quizId}/submit_answer/`, {
    user_name: userName,
    user_answer: userAnswer,
    started_at: startedAt
  });
  return res.data;
}

// Leaderboard API
export async function getLeaderboard(siteId?: string) {
  const url = siteId 
    ? `/api/heritage/quiz-attempts/leaderboard/?site_id=${siteId}`
    : '/api/heritage/quiz-attempts/leaderboard/';
  const res = await api.get(url);
  return res.data;
}

// XP-based Leaderboard API
export async function fetchLeaderboard(siteId?: string) {
  const url = siteId 
    ? `/api/heritage/quiz-attempts/leaderboard/?site_id=${siteId}`
    : '/api/heritage/quiz-attempts/leaderboard/';
  const res = await api.get(url);
  return res.data;
}

// Feedback API endpoints
export async function getAllFeedback() {
  const res = await api.get('/api/heritage/feedbacks/');
  return res.data;
}

export async function deleteFeedback(feedbackId: number) {
  const res = await api.delete(`/api/heritage/feedbacks/${feedbackId}/`);
  return res.data;
}

// Quiz Attempts API endpoints
export async function getQuizAttempts(quizId?: number) {
  const url = quizId 
    ? `/api/heritage/quiz-attempts/?quiz_id=${quizId}`
    : '/api/heritage/quiz-attempts/';
  const res = await api.get(url);
  return res.data;
}

// Battle API endpoints
export async function getBattles() {
  const res = await api.get('/api/heritage/battles/');
  return res.data;
}

export async function getBattle(battleId: number) {
  const res = await api.get(`/api/heritage/battles/${battleId}/`);
  return res.data;
}

export async function createBattle(battleData: any) {
  const res = await api.post('/api/heritage/battles/create_battle/', battleData);
  return res.data;
}

export async function startBattle(battleId: number) {
  const res = await api.post(`/api/heritage/battles/${battleId}/start_battle/`);
  return res.data;
}

export async function endBattle(battleId: number) {
  const token = localStorage.getItem('authToken');
  const res = await api.post(`/api/heritage/battles/${battleId}/end_battle/`, {}, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.data;
}

export async function getBattleLiveLeaderboard(battleId: number) {
  const res = await api.get(`/api/heritage/battles/${battleId}/live_leaderboard/`);
  return res.data;
}

export async function getBattleMyProgress(battleId: number, userName: string) {
  const res = await api.get(`/api/heritage/battles/${battleId}/my_progress/?user_name=${userName}`);
  return res.data;
}

export async function getBattleCurrentQuestionStatus(battleId: number) {
  const res = await api.get(`/api/heritage/battles/${battleId}/current_question_status/`);
  return res.data;
}

export async function submitBattleAnswer(battleId: number, answerData: any) {
  const res = await api.post(`/api/heritage/battles/${battleId}/submit_answer/`, answerData);
  return res.data;
}

// User Profile API endpoints
export async function getUserProfile(userName: string) {
  const res = await api.get(`/api/heritage/user/profile/?user_name=${userName}`);
  return res.data;
}

export async function updateUserProfile(userName: string, profileData: any) {
  // Handle FormData separately - don't spread it
  if (profileData instanceof FormData) {
    profileData.append('user_name', userName);
    const res = await api.post(`/api/heritage/user/profile/`, profileData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
  
  // Handle regular JSON data
  const res = await api.post(`/api/heritage/user/profile/`, {
    user_name: userName,
    ...profileData
  });
  return res.data;
}

export async function uploadAvatar(userName: string, avatarFile: File) {
  const formData = new FormData();
  formData.append('user_name', userName);
  formData.append('avatar', avatarFile);
  
  const res = await api.post('/api/heritage/user/profile/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function getAchievementsList() {
  const res = await api.get('/api/heritage/achievements/');
  return res.data;
}

// XP-based Leaderboard API (updated for user profiles)
export async function getXPLeaderboard() {
  const res = await api.get('/api/heritage/leaderboard/');
  return res.data;
}

// User Management API endpoints
export async function updateEmail(email: string) {
  const res = await api.post('/api/heritage/user/update-email/', { email });
  return res.data;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const res = await api.post('/api/heritage/user/change-password/', {
    old_password: oldPassword,
    new_password: newPassword
  });
  return res.data;
}

export async function updateSchoolClass(schoolName: string, className: string) {
  const res = await api.post('/api/heritage/user/update-school-class/', {
    school_name: schoolName,
    class_name: className
  });
  return res.data;
}

// System Settings API endpoints
export async function updateFeedbackEmail(feedbackEmail: string) {
  const res = await api.post('/api/heritage/settings/feedback-email/', {
    feedback_email: feedbackEmail
  });
  return res.data;
}

export async function getSystemSettings() {
  const res = await api.get('/api/heritage/settings/');
  return res.data;
}

