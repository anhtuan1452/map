import { useState, useEffect, useRef } from 'react';
import { getQuizzesBySite, submitQuizAnswer, checkQuizAttempts } from '../services/api';
import { useGameStore } from '../store/gameStore';

interface Quiz {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  xp_reward: number;
}

interface QuizAttempt {
  id: number;
  user_answer: string;
  is_correct: boolean;
  correct_answer: string;
  time_taken: number;
  started_at: string;
  completed_at: string;
}

interface QuizComponentProps {
  siteId: string;
  userName?: string;
}

export function QuizComponent({ siteId, userName = 'Anonymous' }: QuizComponentProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<{[key: number]: QuizAttempt}>({});
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadData();
  }, [siteId, userName]);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesData, attemptsData] = await Promise.all([
        getQuizzesBySite(siteId),
        checkQuizAttempts(userName, siteId)
      ]);
      setQuizzes(quizzesData);
      setAttempts(attemptsData);
      setError('');
      
      // Nếu quiz đầu tiên đã làm rồi, hiển thị kết quả
      if (quizzesData.length > 0 && attemptsData[quizzesData[0].id]) {
        const attempt = attemptsData[quizzesData[0].id];
        setSelectedAnswer(attempt.user_answer);
        setIsCorrect(attempt.is_correct);
        setCorrectAnswer(attempt.correct_answer || attempt.user_answer); // Hiển thị đáp án đúng
        setShowResult(true);
        setTimeTaken(attempt.time_taken);
      }
    } catch (err) {
      setError('Không thể tải câu hỏi');
      console.error('Error loading quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    const currentQuiz = quizzes[currentQuizIndex];
    const existingAttempt = attempts[currentQuiz.id];
    
    if (existingAttempt) {
      // Đã làm rồi, hiển thị kết quả cũ
      setSelectedAnswer(existingAttempt.user_answer);
      setIsCorrect(existingAttempt.is_correct);
      setShowResult(true);
      setTimeTaken(existingAttempt.time_taken);
      return;
    }
    
    // Bắt đầu làm bài mới
    if (!startedAt) setStartedAt(new Date().toISOString());
    setSelectedAnswer('');
    setShowResult(false);
    setTimeTaken(0);
    setRunning(true);
    // start live timer
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeTaken(prev => prev + 1);
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      alert('Vui lòng chọn một câu trả lời!');
      return;
    }

    const currentQuiz = quizzes[currentQuizIndex];
    
    // Kiểm tra đã làm chưa
    if (attempts[currentQuiz.id]) {
      alert('Bạn đã làm câu hỏi này rồi!');
      return;
    }

    try {
      const result = await submitQuizAnswer(currentQuiz.id, userName, selectedAnswer, startedAt || new Date().toISOString());
      setIsCorrect(result.is_correct);
      setCorrectAnswer(result.correct_answer || selectedAnswer);
      setShowResult(true);
      setTimeTaken(result.time_taken || 0);
      // stop timer
      setRunning(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Award XP to user profile
      const { addXP, markQuizCompleted, profile, initProfile, awardBadge } = useGameStore.getState();
      
      // Initialize profile if not exists
      if (!profile) {
        initProfile(userName, userName);
      }
      
      // Add XP earned from this quiz
      if (result.xp_earned) {
        addXP(result.xp_earned);
      }
      
      // Mark quiz as completed
      markQuizCompleted(currentQuiz.id.toString());
      
      // Check and award badges
      const updatedProfile = useGameStore.getState().profile;
      if (updatedProfile) {
        // First quiz badge
        if (updatedProfile.completedQuizzes.length === 1) {
          awardBadge({
            id: 'first_steps',
            name: 'Bước Đầu Tiên',
            icon: 'CheckCircle2',
            description: 'Hoàn thành câu đố đầu tiên',
          });
        }
        
        // Quiz Master badge (10 quizzes)
        if (updatedProfile.completedQuizzes.length >= 10) {
          awardBadge({
            id: 'quiz_master',
            name: 'Bậc Thầy Câu Hỏi',
            icon: 'Target',
            description: 'Hoàn thành 10 câu đố',
          });
        }
        
        // Perfect score badge
        if (result.is_correct) {
          // Check if all answers in this site are correct
          const siteQuizIds = quizzes.map(q => q.id);
          const allCorrect = siteQuizIds.every(qid => {
            const attempt = attempts[qid];
            return attempt?.is_correct || (qid === currentQuiz.id && result.is_correct);
          });
          
          if (allCorrect && siteQuizIds.length > 0) {
            awardBadge({
              id: 'perfect_score',
              name: 'Điểm Hoàn Hảo',
              icon: 'Award',
              description: 'Trả lời đúng tất cả câu hỏi trong 1 bài kiểm tra',
            });
          }
        }
        
        // Speed Demon badge (< 10 seconds)
        if (result.time_taken && result.time_taken < 10) {
          awardBadge({
            id: 'speed_demon',
            name: 'Tia Chớp',
            icon: 'Zap',
            description: 'Hoàn thành câu đố trong vòng 10 giây',
          });
        }
      }
      
      // Cập nhật attempts
      setAttempts({
        ...attempts,
        [currentQuiz.id]: result.attempt
      });
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert('Lỗi khi gửi câu trả lời');
      }
    }
  };

  const handleNext = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      const nextQuizIndex = currentQuizIndex + 1;
      setCurrentQuizIndex(nextQuizIndex);
      
  // Reset states
  setSelectedAnswer('');
  setShowResult(false);
  setStartedAt(null);
  setTimeTaken(0);
  setRunning(false);
  if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      
      // Kiểm tra quiz tiếp theo đã làm chưa
      const nextQuiz = quizzes[nextQuizIndex];
      const existingAttempt = attempts[nextQuiz.id];
      if (existingAttempt) {
        setSelectedAnswer(existingAttempt.user_answer);
        setIsCorrect(existingAttempt.is_correct);
        setCorrectAnswer(existingAttempt.correct_answer || existingAttempt.user_answer);
        setShowResult(true);
        setTimeTaken(existingAttempt.time_taken);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuizIndex > 0) {
      const prevQuizIndex = currentQuizIndex - 1;
      setCurrentQuizIndex(prevQuizIndex);
      
  // Reset states
  setSelectedAnswer('');
  setShowResult(false);
  setStartedAt(null);
  setTimeTaken(0);
  setRunning(false);
  if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      
      // Kiểm tra quiz trước đã làm chưa
      const prevQuiz = quizzes[prevQuizIndex];
      const existingAttempt = attempts[prevQuiz.id];
      if (existingAttempt) {
        setSelectedAnswer(existingAttempt.user_answer);
        setIsCorrect(existingAttempt.is_correct);
        setCorrectAnswer(existingAttempt.correct_answer || existingAttempt.user_answer);
        setShowResult(true);
        setTimeTaken(existingAttempt.time_taken);
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuizIndex(0);
  setSelectedAnswer('');
  setShowResult(false);
  setStartedAt(null);
  setTimeTaken(0);
  setRunning(false);
  if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    
    // Kiểm tra quiz đầu tiên đã làm chưa
    if (quizzes.length > 0) {
      const firstQuiz = quizzes[0];
      const existingAttempt = attempts[firstQuiz.id];
      if (existingAttempt) {
        setSelectedAnswer(existingAttempt.user_answer);
        setIsCorrect(existingAttempt.is_correct);
        setCorrectAnswer(existingAttempt.correct_answer || existingAttempt.user_answer);
        setShowResult(true);
        setTimeTaken(existingAttempt.time_taken);
      }
    }
  };

  if (loading) {
    return <div className="quiz-loading">Đang tải câu hỏi...</div>;
  }

  if (error) {
    return <div className="quiz-error">{error}</div>;
  }

  if (quizzes.length === 0) {
    return <div className="quiz-empty">Chưa có câu hỏi nào cho địa điểm này.</div>;
  }

  const currentQuiz = quizzes[currentQuizIndex];
  const currentAttempt = attempts[currentQuiz.id];
  const hasAttempted = !!currentAttempt;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h3>Câu hỏi {currentQuizIndex + 1}/{quizzes.length}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 'bold',
            color: '#fff',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '4px 8px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⭐ {currentQuiz.xp_reward} XP
          </span>
          {running && !hasAttempted && (
            <span style={{ fontSize: '12px', color: '#6c757d' }}>
              ⏱️ {timeTaken}s
            </span>
          )}
        </div>
      </div>

      {/* Only show question and options after Start is pressed or if already attempted */}
      {(running || showResult || hasAttempted) && (
        <>
          <div className="quiz-question">
            <p>{currentQuiz.question}</p>
          </div>

          {hasAttempted && (
            <div style={{ 
              padding: '8px 12px', 
              background: '#e3f2fd', 
              borderRadius: '4px', 
              marginBottom: '10px',
              fontSize: '13px',
              color: '#1976d2'
            }}>
              📋 Bạn đã làm câu hỏi này rồi (xem lại kết quả)
            </div>
          )}

          <div className="quiz-options">
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionText = currentQuiz[`option_${option.toLowerCase()}` as keyof Quiz] as string;
              const isSelected = selectedAnswer === option;
              const isCorrectOption = showResult && option === correctAnswer;
              const isWrongOption = showResult && isSelected && !isCorrect;

              return (
                <button
                  key={option}
                  className={`quiz-option ${isSelected ? 'selected' : ''} ${
                    isCorrectOption ? 'correct' : ''
                  } ${isWrongOption ? 'wrong' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only allow selecting when quiz started (running) or if already attempted (read-only)
                    if (!showResult && !hasAttempted && running) {
                      setSelectedAnswer(option);
                      if (!startedAt) setStartedAt(new Date().toISOString());
                    }
                  }}
                  disabled={showResult || hasAttempted || !running}
                >
                  <span className="option-letter">{option}.</span>
                  <span className="option-text">{optionText}</span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className={`quiz-result ${isCorrect ? 'correct' : 'wrong'}`}>
              {isCorrect ? (
                <>
                  <p>✅ Chính xác! Bạn đã trả lời đúng.</p>
                  {timeTaken > 0 && <p style={{ fontSize: '12px', marginTop: '5px' }}>⏱️ Thời gian: {timeTaken} giây</p>}
                </>
              ) : (
                <>
                  <p>❌ Sai rồi! Đáp án đúng là: {correctAnswer}</p>
                  {timeTaken > 0 && <p style={{ fontSize: '12px', marginTop: '5px' }}>⏱️ Thời gian: {timeTaken} giây</p>}
                </>
              )}
            </div>
          )}
        </>
      )}

      <div className="quiz-actions">
        {!showResult && !hasAttempted ? (
          <>
            {!running ? (
              <button
                className="btn-start"
                onClick={(e) => { e.stopPropagation(); handleStartQuiz(); }}
              >
                ▶ Bắt đầu
              </button>
            ) : (
              <button 
                className="btn-submit" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }} 
                disabled={!selectedAnswer}
              >
                Trả lời
              </button>
            )}
          </>
        ) : (
          <>
            {currentQuizIndex > 0 && (
              <button 
                className="btn-nav" 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                ← Câu trước
              </button>
            )}
            {currentQuizIndex < quizzes.length - 1 ? (
              <button 
                className="btn-nav" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                Câu tiếp →
              </button>
            ) : (
              <button 
                className="btn-nav" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestart();
                }}
              >
                Xem lại từ đầu
              </button>
            )}
          </>
        )}
      </div>

      <style>{`
        .quiz-container {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .quiz-header h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
          font-size: 16px;
        }

        .quiz-question {
          margin-bottom: 20px;
        }

        .quiz-question p {
          font-size: 16px;
          font-weight: 500;
          color: #34495e;
          line-height: 1.5;
        }

        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }

        .quiz-option {
          display: flex;
          align-items: center;
          padding: 12px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .quiz-option:hover:not(:disabled) {
          border-color: #3498db;
          background: #f0f8ff;
        }

        .quiz-option.selected {
          border-color: #3498db;
          background: #e3f2fd;
        }

        .quiz-option.correct {
          border-color: #27ae60;
          background: #d4edda;
        }

        .quiz-option.wrong {
          border-color: #e74c3c;
          background: #f8d7da;
        }

        .quiz-option:disabled {
          cursor: not-allowed;
        }

        .option-letter {
          font-weight: bold;
          margin-right: 10px;
          color: #3498db;
          min-width: 20px;
        }

        .option-text {
          flex: 1;
          color: #2c3e50;
        }

        .quiz-result {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .quiz-result.correct {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .quiz-result.wrong {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .quiz-result p {
          margin: 0;
        }

        .quiz-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-submit,
        .btn-nav,
        .btn-start {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-start {
          background: #27ae60;
          color: white;
          font-size: 16px;
        }

        .btn-start:hover {
          background: #229954;
        }

        .btn-submit {
          background: #3498db;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #2980b9;
        }

        .btn-submit:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .btn-nav {
          background: #95a5a6;
          color: white;
        }

        .btn-nav:hover {
          background: #7f8c8d;
        }

        .quiz-loading,
        .quiz-error,
        .quiz-empty {
          padding: 20px;
          text-align: center;
          color: #7f8c8d;
        }

        .quiz-error {
          color: #e74c3c;
        }
      `}</style>
    </div>
  );
}
