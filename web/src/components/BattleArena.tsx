import React, { useState, useEffect, useRef } from 'react';
import { Swords, Clock, Trophy, Zap, Users, Play, CheckCircle, Award, Star, Home, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  getBattle, 
  getBattleLiveLeaderboard, 
  getBattleCurrentQuestionStatus, 
  submitBattleAnswer,
  endBattle,
  getBattleMyProgress
} from '../services/api';
import { BattleMusic } from './BattleMusic';
import { soundEffects } from '../utils/soundEffects';

interface BattleQuestion {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  site_name: string;
  xp_reward: number;
}

interface BattleParticipant {
  rank: number;
  user_name: string;
  score: number;
  correct_answers: number;
  time_completed: number | null;
  finished: boolean;
}

interface Battle {
  id: number;
  scheduled_start_time: string;
  duration_minutes: number;
  status: 'pending' | 'in_progress' | 'completed';
  questions: number[];
  participants: string[];
  question_details: BattleQuestion[];
}

interface BattleArenaProps {
  battleId: number;
  userName: string;
  onExit: () => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ battleId, userName, onExit }) => {
  const { t } = useTranslation();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [leaderboard, setLeaderboard] = useState<BattleParticipant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [animateQuestion, setAnimateQuestion] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [endingBattle, setEndingBattle] = useState(false);
  const [questionStatus, setQuestionStatus] = useState<{
    question_solved: boolean;
    solved_by: string | null;
    correct_answer: string | null;
  }>({ question_solved: false, solved_by: null, correct_answer: null });
  const timerRef = useRef<number | null>(null);
  const leaderboardRef = useRef<number | null>(null);
  const questionStatusRef = useRef<number | null>(null);

  useEffect(() => {
    loadBattle();
    loadMyProgress(); // Load user's previous answers
    startLeaderboardPolling();
    startQuestionStatusPolling();
    checkAdminStatus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (leaderboardRef.current) clearInterval(leaderboardRef.current);
      if (questionStatusRef.current) clearInterval(questionStatusRef.current);
    };
  }, [battleId]);

  // Debug: Log isAdmin state changes
  useEffect(() => {
    console.log('🔑 isAdmin state updated:', isAdmin);
    console.log('🔑 Battle status:', battle?.status);
  }, [isAdmin, battle?.status]);

  const checkAdminStatus = () => {
    console.log('=== CHECKING ADMIN STATUS ===');
    console.log('All localStorage keys:', Object.keys(localStorage));
    
    // Method 1: Check userRole from localStorage (set during login)
    const userRole = localStorage.getItem('userRole');
    console.log('userRole from localStorage:', userRole);
    
    if (userRole === 'teacher' || userRole === 'super_admin') {
      setIsAdmin(true);
      console.log('✅ Teacher/Admin detected via userRole:', userRole);
      return;
    }

    // Method 2: Decode authToken as fallback
    const authToken = localStorage.getItem('authToken');
    console.log('authToken:', authToken ? 'exists' : 'null');
    
    if (authToken) {
      try {
        const decoded = atob(authToken);
        console.log('Decoded authToken:', decoded);
        const parts = decoded.split(':');
        console.log('Token parts:', parts);
        
        const [username, userId, is_staff, is_superuser] = parts;
        const isAdminUser = is_staff === 'True' || is_superuser === 'True';
        setIsAdmin(isAdminUser);
        console.log('Admin check via token:', { 
          username, 
          userId,
          is_staff, 
          is_superuser, 
          isAdminUser,
          finalResult: isAdminUser 
        });
        return;
      } catch (e) {
        console.error('❌ Token decode error:', e);
      }
    }
    
    console.log('❌ No admin credentials found');
    setIsAdmin(false);
  };

  useEffect(() => {
    if (battle && battle.status === 'in_progress') {
      // Tính thời gian kết thúc battle = scheduled_start_time + duration_minutes
      const startTime = new Date(battle.scheduled_start_time);
      const endTime = new Date(startTime.getTime() + (battle.duration_minutes * 60 * 1000));
      const currentTime = new Date();
      const timeRemaining = Math.max(0, Math.floor((endTime.getTime() - currentTime.getTime()) / 1000));
      
      setTimeLeft(timeRemaining);
      
      // Nếu battle đã hết thời gian, kết thúc ngay
      if (timeRemaining <= 0) {
        handleBattleEnd();
        return;
      }
      
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleBattleEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [battle?.status]);

  // Animate question card on change
  useEffect(() => {
    setAnimateQuestion(true);
    const timeout = setTimeout(() => setAnimateQuestion(false), 400);
    return () => clearTimeout(timeout);
  }, [currentQuestionIndex]);

  const loadBattle = async () => {
    try {
      const data = await getBattle(battleId);
      setBattle(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load battle:', err);
      setLoading(false);
    }
  };

  const loadMyProgress = async () => {
    try {
      const data = await getBattleMyProgress(battleId, userName);
      console.log('Loaded progress:', data);
      setAnswers(data.answers || {});
      setResults(data.results || {});
    } catch (err) {
      console.log('No previous progress or error:', err);
      // User chưa có progress, không sao
    }
  };

  const startLeaderboardPolling = () => {
    loadLeaderboard();
    leaderboardRef.current = window.setInterval(() => {
      loadLeaderboard();
    }, 3000); // Poll every 3 seconds
  };

  const loadLeaderboard = async () => {
    try {
      const data = await getBattleLiveLeaderboard(battleId);
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const startQuestionStatusPolling = () => {
    loadQuestionStatus();
    questionStatusRef.current = window.setInterval(() => {
      loadQuestionStatus();
    }, 1500); // Poll every 1.5 seconds for faster real-time updates
  };

  const loadQuestionStatus = async () => {
    try {
      const data = await getBattleCurrentQuestionStatus(battleId);
      setQuestionStatus(data);
    } catch (err) {
      // console.error('Failed to load question status:', err);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (answers[currentQuestion.id] || questionStatus.question_solved) return; // Already answered or question solved
    setSelectedAnswer(answer);
    if (!questionStartTime) {
      setQuestionStartTime(new Date());
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !battle || questionStatus.question_solved) return;
    const currentQuestion = battle.question_details[currentQuestionIndex];
    const timeTaken = questionStartTime 
      ? Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000)
      : 0;
    setSubmitting(true);
    try {
      const data = await submitBattleAnswer(battleId, {
        user_name: userName,
        quiz_id: currentQuestion.id,
        answer: selectedAnswer,
        time_taken: timeTaken,
      });
      
      if (data) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
        setResults(prev => ({ ...prev, [currentQuestion.id]: data.is_correct }));
        
        // Play sound effect
        if (data.is_correct) {
          soundEffects.playCorrect(); // Cheerful sound for correct answer
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 1200);
        } else {
          soundEffects.playIncorrect(); // Gentle buzz for incorrect answer
        }
        
        // Auto move to next question after 1.5s
        setTimeout(() => {
          if (currentQuestionIndex < battle.question_details.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer('');
            setQuestionStartTime(null);
          } else {
            // All questions answered, show completion screen
            soundEffects.playCelebration(); // Celebration sound
            handleBattleComplete();
          }
        }, 1500);
      } else {
        alert('Lỗi khi gửi câu trả lời');
      }
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      alert(err.response?.data?.error || 'Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBattleEnd = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (leaderboardRef.current) clearInterval(leaderboardRef.current);
    if (questionStatusRef.current) clearInterval(questionStatusRef.current);
    
    // Gọi API để kết thúc battle khi hết giờ
    try {
      console.log('🔵 Attempting to end battle:', battleId);
      console.log('🔑 Auth token:', localStorage.getItem('authToken'));
      const result = await endBattle(battleId);
      console.log('✅ Battle ended successfully:', result);
    } catch (error: any) {
      console.error('❌ Error ending battle:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      // Vẫn hiển thị completion screen dù API lỗi
    }
    
    setShowCompletion(true);
    soundEffects.playCelebration();
  };

  const handleBattleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (leaderboardRef.current) clearInterval(leaderboardRef.current);
    if (questionStatusRef.current) clearInterval(questionStatusRef.current);
    setShowCompletion(true);
  };

  const getNextUnansweredIndex = () => {
    if (!battle) return 0;
    for (let i = 0; i < battle.question_details.length; i++) {
      const questionId = battle.question_details[i].id;
      if (!answers[questionId]) {
        return i;
      }
    }
    return currentQuestionIndex; // All answered, stay at current
  };

  const handleContinueToNext = () => {
    const nextIndex = getNextUnansweredIndex();
    setCurrentQuestionIndex(nextIndex);
    setSelectedAnswer('');
    setQuestionStartTime(null);
  };

  const handleQuestionNavigate = (index: number) => {
    if (!battle) return;
    
    setCurrentQuestionIndex(index);
    
    // Load previous answer if exists
    const questionId = battle.question_details[index].id;
    const previousAnswer = answers[questionId];
    
    if (previousAnswer) {
      setSelectedAnswer(previousAnswer); // Restore selected answer
    } else {
      setSelectedAnswer('');
    }
    
    setQuestionStartTime(null);
  };

  const handleEndBattleNow = async () => {
    if (!isAdmin) return;
    
    if (!confirm('Bạn có chắc muốn kết thúc battle này sớm?')) {
      return;
    }

    setEndingBattle(true);
    try {
      await endBattle(battleId);
      alert('Đã kết thúc battle thành công! Xem kết quả trong danh sách battles.');
      onExit();
    } catch (error: any) {
      console.error('Failed to end battle:', error);
      alert(error.response?.data?.error || 'Lỗi khi kết thúc battle');
    } finally {
      setEndingBattle(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-purple-900 animate-fade-in">
        <div className="text-white text-xl animate-pulse">Đang tải battle...</div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-900 to-orange-900 animate-fade-in">
        <div className="text-white text-xl">Không tìm thấy battle</div>
      </div>
    );
  }

  // Completion Screen
  if (showCompletion) {
    const myScore = leaderboard.find(p => p.user_name === userName);
    const totalQuestions = battle.question_details.length;
    const correctAnswers = myScore?.correct_answers || 0;
    const totalXP = myScore?.score || 0;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 overflow-hidden z-[2000] animate-fade-in flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 max-w-2xl w-full shadow-2xl animate-fade-in-up">
          {/* Completion Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Award className="w-24 h-24 text-yellow-400 animate-bounce" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">🎉 Bạn đã hoàn thành!</h1>
            <p className="text-gray-300">Quiz Battle #{battle.id}</p>
            {isAdmin && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-sm text-yellow-200">
                <p className="font-bold mb-1">📋 Ghi chú cho Giáo viên:</p>
                <p>Battle chỉ dùng để xếp hạng học sinh. Hãy căn cứ vào bảng xếp hạng cuối cùng để cộng điểm thủ công cho từng học sinh.</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">#{myScore?.rank || '-'}</div>
              <div className="text-xs text-gray-300">Hạng</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{correctAnswers}/{totalQuestions}</div>
              <div className="text-xs text-gray-300">Đúng</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <Star className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{accuracy}%</div>
              <div className="text-xs text-gray-300">Độ chính xác</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{totalXP}</div>
              <div className="text-xs text-gray-300">Tổng XP</div>
            </div>
          </div>

          {/* Final Leaderboard */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 max-h-80 overflow-y-auto border border-white/10">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Bảng xếp hạng cuối cùng
            </h3>
            <div className="space-y-2">
              {leaderboard.map((participant) => {
                const isMe = participant.user_name === userName;
                const getRankColor = (rank: number) => {
                  if (rank === 1) return 'from-yellow-500 to-yellow-600';
                  if (rank === 2) return 'from-gray-400 to-gray-500';
                  if (rank === 3) return 'from-orange-600 to-orange-700';
                  return 'from-blue-500 to-blue-600';
                };
                return (
                  <div
                    key={participant.user_name}
                    className={`
                      bg-gradient-to-r ${getRankColor(participant.rank)} p-3 rounded-lg
                      ${isMe ? 'ring-2 ring-white scale-105' : ''}
                      transition-all duration-200
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold text-white">#{participant.rank}</div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {participant.user_name}
                            {isMe && <span className="ml-1">(Bạn)</span>}
                          </div>
                          <div className="text-xs text-white/80">
                            {participant.correct_answers} đúng
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{participant.score} XP</div>
                        {participant.finished && (
                          <div className="text-xs text-white/80">{participant.time_completed}s</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onExit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white py-3 rounded-lg font-bold text-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = battle.question_details[currentQuestionIndex];
  const hasAnswered = answers[currentQuestion?.id];
  const isCorrect = results[currentQuestion?.id];
  const myRank = leaderboard.find(p => p.user_name === userName);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 overflow-y-auto z-[2000] animate-fade-in">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[2100] flex items-center justify-center animate-fade-in">
          <div className="w-full h-full flex flex-wrap items-center justify-center">
            {[...Array(30)].map((_, i) => (
              <span key={i} className="block animate-bounce-slow text-4xl select-none" style={{ color: i % 2 === 0 ? '#FFD700' : '#2563EB', opacity: 0.8 }}>{i % 2 === 0 ? '🎉' : '✨'}</span>
            ))}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/20 p-4 animate-fade-in-down">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Swords className="w-8 h-8 text-yellow-400 animate-spin-slow" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Quiz Battle #{battle.id}</h1>
              <p className="text-sm text-gray-300">{battle.participants.length} người chơi</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
              <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-2xl font-bold text-white font-mono">{formatTime(timeLeft)}</span>
            </div>
            {myRank && (
              <div className="bg-white/10 rounded-lg px-4 py-2 shadow-md">
                <div className="text-xs text-gray-300">Hạng của bạn</div>
                <div className="text-2xl font-bold text-yellow-400 font-mono animate-bounce">#{myRank.rank}</div>
              </div>
            )}
            {isAdmin && battle.status === 'in_progress' && (
              <button
                onClick={handleEndBattleNow}
                disabled={endingBattle}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition font-bold shadow-md flex items-center gap-2"
              >
                <StopCircle className="w-5 h-5" />
                {endingBattle ? 'Đang kết thúc...' : 'Kết thúc Battle'}
              </button>
            )}
            <button
              onClick={onExit}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition font-bold shadow-md"
            >
              Thoát
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Mobile Layout */}
        <div className="block md:hidden space-y-6">
          {/* Question Area */}
          <div className={`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 flex flex-col shadow-xl transition-all duration-500 ${animateQuestion ? 'animate-fade-in-up' : ''}`}>
            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Câu hỏi {currentQuestionIndex + 1}/{battle.question_details.length}</span>
                <span className="text-xs">{currentQuestion?.site_name}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / battle.question_details.length) * 100}%` }}
                />
              </div>
              {/* Question Navigator */}
              <div className="flex gap-2 flex-wrap mb-2">
                {battle.question_details.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  const isCorrectAnswer = isAnswered && results[q.id] === true;
                  const isWrongAnswer = isAnswered && results[q.id] === false;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuestionNavigate(idx)}
                      className={`
                        w-10 h-10 rounded-lg font-bold text-sm transition-all shadow-sm
                        ${isCurrent ? 'ring-2 ring-white scale-110' : ''}
                        ${!isAnswered ? 'bg-white/20 text-gray-300 hover:bg-white/30' : ''}
                        ${isCorrectAnswer ? 'bg-green-500/60 text-white' : ''}
                        ${isWrongAnswer ? 'bg-red-500/60 text-white' : ''}
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              {/* Continue Button */}
              {Object.keys(answers).length > 0 && Object.keys(answers).length < battle.question_details.length && (
                <button
                  onClick={handleContinueToNext}
                  className="w-full mt-2 py-2 bg-yellow-500/30 hover:bg-yellow-500/50 text-yellow-200 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Tiếp tục câu chưa trả lời
                </button>
              )}
            </div>
            {/* Question */}
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-white mb-6 animate-fade-in-up drop-shadow-lg leading-tight">{currentQuestion?.question}</h2>
              {/* Options */}
              <div className="grid grid-cols-1 gap-3 mb-4">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionText = currentQuestion?.[`option_${option.toLowerCase()}` as keyof BattleQuestion];
                  const isSelected = selectedAnswer === option;
                  const showResult = !!hasAnswered || questionStatus.question_solved;
                  const isThisCorrect = showResult && questionStatus.question_solved ? questionStatus.correct_answer === option : (showResult && isCorrect && isSelected);
                  const isThisWrong = showResult && !questionStatus.question_solved && !isCorrect && isSelected;
                  const isCorrectAnswer = questionStatus.question_solved && questionStatus.correct_answer === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={!!hasAnswered || submitting || questionStatus.question_solved}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all duration-200 relative shadow-md
                        ${isSelected && !showResult ? 'bg-blue-500/30 border-blue-400 scale-105 ring-2 ring-blue-300' : 'bg-white/5 border-white/20 hover:bg-white/10'}
                        ${isThisCorrect ? 'bg-green-500/30 border-green-400 ring-2 ring-green-300' : ''}
                        ${isThisWrong ? 'bg-red-500/30 border-red-400 ring-2 ring-red-300' : ''}
                        ${isCorrectAnswer ? 'bg-green-500/40 border-green-400 ring-2 ring-green-300 animate-pulse' : ''}
                        ${hasAnswered || questionStatus.question_solved ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-yellow-400 drop-shadow">{option}</span>
                        <span className="text-white flex-1 text-sm">{optionText}</span>
                        {isThisCorrect && <CheckCircle className="w-5 h-5 text-green-400 animate-bounce" />}
                        {isCorrectAnswer && !isSelected && <CheckCircle className="w-5 h-5 text-green-400 animate-bounce" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Submit Button */}
              {!hasAnswered && !questionStatus.question_solved && (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || submitting}
                  className={`
                    mt-auto py-3 rounded-lg font-bold text-lg transition-all shadow-lg
                    ${selectedAnswer && !submitting
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:scale-105' 
                      : 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
                </button>
              )}
              {/* Result Message */}
              {(hasAnswered || questionStatus.question_solved) && (
                <div className={`
                  mt-auto py-3 rounded-lg text-center font-bold text-lg animate-fade-in-up
                  ${questionStatus.question_solved ? 'bg-green-500/30 text-green-200' : isCorrect ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}
                `}>
                  {questionStatus.question_solved ? (
                    <div className="space-y-1">
                      <div>🎉 Đã được giải đúng bởi {questionStatus.solved_by}!</div>
                      <div className="text-sm">
                        {questionStatus.correct_answer === answers[currentQuestionIndex] ? 'Bạn cũng đúng!' : 'Bạn sai rồi!'}
                        <span className="ml-2 font-bold">+{questionStatus.correct_answer === answers[currentQuestionIndex] ? currentQuestion.xp_reward : 0} XP</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div>{isCorrect ? '🎉 Chính xác!' : '❌ Sai rồi!'}</div>
                      <div className="text-sm">
                        <span className="font-bold">+{isCorrect ? currentQuestion.xp_reward : 0} XP</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Leaderboard */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 overflow-hidden flex flex-col shadow-xl animate-fade-in-right">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
              Bảng xếp hạng
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {leaderboard.map((participant) => {
                const isMe = participant.user_name === userName;
                const getRankColor = (rank: number) => {
                  if (rank === 1) return 'from-yellow-500 to-yellow-600';
                  if (rank === 2) return 'from-gray-400 to-gray-500';
                  if (rank === 3) return 'from-orange-600 to-orange-700';
                  return 'from-blue-500 to-blue-600';
                };
                return (
                  <div
                    key={participant.user_name}
                    className={`
                      bg-gradient-to-r ${getRankColor(participant.rank)} p-3 rounded-lg
                      ${isMe ? 'ring-2 ring-white scale-105' : ''}
                      transition-all duration-200 animate-fade-in-up
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-white drop-shadow">#{participant.rank}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-sm truncate">
                            {participant.user_name}
                            {isMe && <span className="ml-1">(Bạn)</span>}
                          </div>
                          <div className="text-xs text-white/80">
                            {participant.correct_answers} đúng
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white font-mono">{participant.score}</div>
                        <div className="text-xs text-white/80">XP</div>
                      </div>
                    </div>
                    {participant.finished && (
                      <div className="mt-2 text-xs text-white/80 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Hoàn thành: {participant.time_completed}s
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6 md:h-[calc(100vh-100px)]">
          {/* Main Question Area */}
          <div className={`col-span-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 flex flex-col shadow-xl transition-all duration-500 ${animateQuestion ? 'animate-fade-in-up' : ''}`}>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Câu hỏi {currentQuestionIndex + 1}/{battle.question_details.length}</span>
                <span>{currentQuestion?.site_name}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / battle.question_details.length) * 100}%` }}
                />
              </div>
              {/* Question Navigator */}
              <div className="flex gap-2 flex-wrap mb-3">
                {battle.question_details.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  const isCorrectAnswer = isAnswered && results[q.id] === true;
                  const isWrongAnswer = isAnswered && results[q.id] === false;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuestionNavigate(idx)}
                      className={`
                        w-12 h-12 rounded-lg font-bold transition-all shadow-sm
                        ${isCurrent ? 'ring-2 ring-white scale-110' : ''}
                        ${!isAnswered ? 'bg-white/20 text-gray-300 hover:bg-white/30' : ''}
                        ${isCorrectAnswer ? 'bg-green-500/60 text-white' : ''}
                        ${isWrongAnswer ? 'bg-red-500/60 text-white' : ''}
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              {/* Continue Button */}
              {Object.keys(answers).length > 0 && Object.keys(answers).length < battle.question_details.length && (
                <button
                  onClick={handleContinueToNext}
                  className="w-full mt-2 py-2 bg-yellow-500/30 hover:bg-yellow-500/50 text-yellow-200 rounded-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Tiếp tục câu chưa trả lời
                </button>
              )}
            </div>
            {/* Question */}
            <div className="flex-1 flex flex-col">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 animate-fade-in-up drop-shadow-lg">{currentQuestion?.question}</h2>
              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionText = currentQuestion?.[`option_${option.toLowerCase()}` as keyof BattleQuestion];
                  const isSelected = selectedAnswer === option;
                  const showResult = !!hasAnswered || questionStatus.question_solved;
                  const isThisCorrect = showResult && questionStatus.question_solved ? questionStatus.correct_answer === option : (showResult && isCorrect && isSelected);
                  const isThisWrong = showResult && !questionStatus.question_solved && !isCorrect && isSelected;
                  const isCorrectAnswer = questionStatus.question_solved && questionStatus.correct_answer === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={!!hasAnswered || submitting || questionStatus.question_solved}
                      className={`
                        p-6 rounded-xl border-2 text-left transition-all duration-200 relative shadow-md
                        ${isSelected && !showResult ? 'bg-blue-500/30 border-blue-400 scale-105 ring-2 ring-blue-300' : 'bg-white/5 border-white/20 hover:bg-white/10'}
                        ${isThisCorrect ? 'bg-green-500/30 border-green-400 ring-2 ring-green-300' : ''}
                        ${isThisWrong ? 'bg-red-500/30 border-red-400 ring-2 ring-red-300' : ''}
                        ${isCorrectAnswer ? 'bg-green-500/40 border-green-400 ring-2 ring-green-300 animate-pulse' : ''}
                        ${hasAnswered || questionStatus.question_solved ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-yellow-400 drop-shadow">{option}</span>
                        <span className="text-white flex-1 text-lg">{optionText}</span>
                        {isThisCorrect && <CheckCircle className="w-6 h-6 text-green-400 animate-bounce" />}
                        {isCorrectAnswer && !isSelected && <CheckCircle className="w-6 h-6 text-green-400 animate-bounce" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Submit Button */}
              {!hasAnswered && !questionStatus.question_solved && (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || submitting}
                  className={`
                    mt-auto py-4 rounded-xl font-bold text-xl transition-all shadow-lg
                    ${selectedAnswer && !submitting
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:scale-105' 
                      : 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
                </button>
              )}
              {/* Result Message */}
              {(hasAnswered || questionStatus.question_solved) && (
                <div className={`
                  mt-auto py-4 rounded-xl text-center font-bold text-xl animate-fade-in-up
                  ${questionStatus.question_solved ? 'bg-green-500/30 text-green-200' : isCorrect ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}
                `}>
                  {questionStatus.question_solved ? (
                    <>
                      🎉 Đã được giải đúng bởi {questionStatus.solved_by}!
                      {questionStatus.correct_answer === answers[currentQuestionIndex] ? ' Bạn cũng đúng!' : ' Bạn sai rồi!'}
                      <span className="ml-2">+{questionStatus.correct_answer === answers[currentQuestionIndex] ? currentQuestion.xp_reward : 0} XP</span>
                    </>
                  ) : (
                    <>
                      {isCorrect ? '🎉 Chính xác!' : '❌ Sai rồi!'}
                      <span className="ml-2">+{isCorrect ? currentQuestion.xp_reward : 0} XP</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Live Leaderboard */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 overflow-hidden flex flex-col shadow-xl animate-fade-in-right">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
              Bảng xếp hạng trực tiếp
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {leaderboard.map((participant) => {
                const isMe = participant.user_name === userName;
                const getRankColor = (rank: number) => {
                  if (rank === 1) return 'from-yellow-500 to-yellow-600';
                  if (rank === 2) return 'from-gray-400 to-gray-500';
                  if (rank === 3) return 'from-orange-600 to-orange-700';
                  return 'from-blue-500 to-blue-600';
                };
                return (
                  <div
                    key={participant.user_name}
                    className={`
                      bg-gradient-to-r ${getRankColor(participant.rank)} p-4 rounded-lg
                      ${isMe ? 'ring-2 ring-white scale-105' : ''}
                      transition-all duration-200 animate-fade-in-up
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-white drop-shadow">#{participant.rank}</div>
                        <div>
                          <div className="font-bold text-white">
                            {participant.user_name}
                            {isMe && <span className="ml-2 text-xs">(Bạn)</span>}
                          </div>
                          <div className="text-sm text-white/80">
                            {participant.correct_answers} đúng
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white font-mono">{participant.score}</div>
                        <div className="text-xs text-white/80">XP</div>
                      </div>
                    </div>
                    {participant.finished && (
                      <div className="mt-2 text-xs text-white/80 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Hoàn thành: {participant.time_completed}s
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Music */}
      <BattleMusic isPlaying={battle?.status === 'in_progress' && !showCompletion} />
    </div>
  );
};
