import { useState, useEffect } from 'react';
import { getLeaderboard, getXPLeaderboard, getApiUrl, getUserProfile } from '../services/api';

interface LeaderboardEntry {
  rank: number;
  user_name: string;
  display_name?: string;
  avatar?: string | null;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score_percentage: number;
  total_time: number;
  average_time: number;
}

interface XPLeaderboardEntry {
  rank: number;
  user_name: string;
  display_name: string;
  avatar: string | null;
  total_xp: number;
  level: number;
  joined_at: string;
}

interface LeaderboardProps {
  siteId?: string;
}

export function Leaderboard({ siteId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [xpLeaderboard, setXpLeaderboard] = useState<XPLeaderboardEntry[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isXPMode = !siteId; // Nếu không có siteId thì hiển thị XP leaderboard

  // Helper to get full avatar URL
  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    
    // For localhost development, use direct API port
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:8000${avatar}`;
      }
    }
    
    // For Cloudflare tunnel
    const baseUrl = getApiUrl();
    return `${baseUrl}${avatar}`;
  };

  useEffect(() => {
    loadLeaderboard();
  }, [siteId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // Always load quiz attempts leaderboard (not XP-based)
      const data = await getLeaderboard(siteId);
      setLeaderboard(data);
      
      // Load avatars for all users
      const avatarMap: Record<string, string | null> = {};
      await Promise.all(
        data.map(async (entry: LeaderboardEntry) => {
          try {
            const profile = await getUserProfile(entry.user_name);
            avatarMap[entry.user_name] = profile.avatar;
          } catch (err) {
            console.error(`Failed to load avatar for ${entry.user_name}:`, err);
            avatarMap[entry.user_name] = null;
          }
        })
      );
      setAvatars(avatarMap);
      setError('');
    } catch (err) {
      setError('Không thể tải bảng xếp hạng');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}p${secs}s`;
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const renderStyles = () => (
    <style>{`
      .leaderboard-container {
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .leaderboard-container h3 {
        margin: 0 0 20px 0;
        color: #2c3e50;
        text-align: center;
        font-size: 24px;
      }

      .leaderboard-table {
        overflow-x: auto;
      }

      .leaderboard-table table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }

      .leaderboard-table th {
        background: #34495e;
        color: white;
        padding: 12px 8px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .leaderboard-table td {
        padding: 10px 8px;
        border-bottom: 1px solid #ecf0f1;
        font-size: 14px;
      }

      .leaderboard-table tbody tr:hover {
        background: #f8f9fa;
      }

      .leaderboard-table tbody tr.top-three {
        background: linear-gradient(to right, #fff8dc, #ffffff);
      }

      .leaderboard-table tbody tr.top-three:hover {
        background: linear-gradient(to right, #fff4c4, #f8f9fa);
      }

      .leaderboard-loading,
      .leaderboard-error,
      .leaderboard-empty {
        text-align: center;
        padding: 40px;
        color: #7f8c8d;
      }

      .leaderboard-error {
        color: #e74c3c;
      }

      @media (max-width: 768px) {
        .leaderboard-table table {
          font-size: 12px;
        }

        .leaderboard-table th,
        .leaderboard-table td {
          padding: 8px 4px;
        }
      }
    `}</style>
  );

  if (loading) {
    return <div className="leaderboard-loading">Đang tải bảng xếp hạng...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">{error}</div>;
  }

  if (leaderboard.length === 0) {
    return <div className="leaderboard-empty">Chưa có dữ liệu xếp hạng.</div>;
  }

  // Render Quiz Attempts Leaderboard
  return (
    <div className="leaderboard-container">
      <h3>🏆 Bảng xếp hạng</h3>
      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Hạng</th>
              <th>Tên học sinh</th>
              <th style={{ textAlign: 'center' }}>Số câu</th>
              <th style={{ textAlign: 'center' }}>Đúng</th>
              <th style={{ textAlign: 'center' }}>Điểm (%)</th>
              <th style={{ textAlign: 'center' }}>Tổng TG</th>
              <th style={{ textAlign: 'center' }}>TB/câu</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.user_name} className={entry.rank <= 3 ? 'top-three' : ''}>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {getMedalEmoji(entry.rank)}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {avatars[entry.user_name] ? (
                      <img 
                        src={getAvatarUrl(avatars[entry.user_name]) || undefined}
                        alt="Avatar"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #ddd',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        border: '2px solid #ddd',
                        flexShrink: 0
                      }}>
                        {entry.user_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontWeight: entry.rank <= 3 ? 'bold' : 'normal' }}>
                      {entry.user_name}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>{entry.total_questions}</td>
                <td style={{ textAlign: 'center', color: '#27ae60', fontWeight: 'bold' }}>
                  {entry.correct_answers}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: entry.score_percentage >= 80 ? '#27ae60' : entry.score_percentage >= 50 ? '#f39c12' : '#e74c3c' }}>
                  {entry.score_percentage}%
                </td>
                <td style={{ textAlign: 'center' }}>{formatTime(entry.total_time)}</td>
                <td style={{ textAlign: 'center' }}>{entry.average_time.toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderStyles()}
    </div>
  );
}
