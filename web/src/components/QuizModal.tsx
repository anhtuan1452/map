import React from 'react';

const QuizModal: React.FC<{ open: boolean; onClose: () => void; quiz: any[] }> = ({ open, onClose, quiz }) => {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});

  if (!open) return null;

  const q = quiz[index];

  const select = (choiceIndex: number) => {
    setAnswers({ ...answers, [q.id]: choiceIndex });
  };

  const next = () => {
    if (index < quiz.length - 1) setIndex(index + 1);
    else onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>📝 Quiz</h2>
          <button onClick={onClose} className="modal-close-button" style={{ fontSize: '24px' }}>
            ✕
          </button>
        </div>
        <div className="modal-content">
          <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 'bold' }}>{q.question}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {q.choices.map((c: string, i: number) => (
              <li 
                key={i} 
                style={{ 
                  cursor: 'pointer', 
                  margin: '12px 0',
                  padding: '12px 16px',
                  border: '2px solid',
                  borderColor: answers[q.id] === i ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: answers[q.id] === i ? '#eff6ff' : 'white',
                  transition: 'all 0.2s'
                }} 
                onClick={() => select(i)}
                onMouseEnter={(e) => {
                  if (answers[q.id] !== i) {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (answers[q.id] !== i) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {answers[q.id] === i ? '✅ ' : ''}{c}
              </li>
            ))}
          </ul>
          <button 
            onClick={next}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            {index < quiz.length - 1 ? 'Tiếp theo' : 'Hoàn thành'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
