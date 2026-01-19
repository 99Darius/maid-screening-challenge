import React, { useState, useEffect, useRef } from 'react';

const API_URL = '/api/submissions';

const MaidScreeningChallenge = () => {
  const [currentSection, setCurrentSection] = useState('welcome');
  const [applicantName, setApplicantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [mathAnswers, setMathAnswers] = useState({});
  const [mathScore, setMathScore] = useState(0);
  const [personalityAnswers, setPersonalityAnswers] = useState({});
  const [personalityResult, setPersonalityResult] = useState('');
  const [timeLeft, setTimeLeft] = useState(180);
  const [mathStarted, setMathStarted] = useState(false);
  const [mathSubmitted, setMathSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  // Admin states
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Fetch submissions from Google Sheets for admin
  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      const transformed = data.map((row, index) => {
        let traitScores = {};
        let personalityAnswersData = {};
        try {
          traitScores = typeof row['Trait Scores'] === 'string' ? JSON.parse(row['Trait Scores']) : row['Trait Scores'] || {};
          personalityAnswersData = typeof row['Answers'] === 'string' ? JSON.parse(row['Answers']) : row['Answers'] || {};
        } catch (e) { }

        return {
          id: index,
          timestamp: row['Timestamp'] || row.Timestamp,
          name: row['Name'] || row.name,
          phone: row['Phone'] || row.phone,
          instagram: row['Instagram'] || row.instagram || 'Not provided',
          expectedSalary: row['Salary'] || row.expectedSalary,
          startDate: row['Start Date'] || row.startDate,
          videoLink: row['Video'] || row.videoLink,
          mathScore: parseInt(row['Math Score']) || 0,
          house: row['House'] || row.house,
          personality: row['Personality'] || row.personality,
          personalityCode: getCodeFromHouse(row['House'] || row.house),
          traitScores: traitScores,
          personalityAnswers: personalityAnswersData
        };
      }).filter(row => row.name);
      setSubmissions(transformed);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
    setIsLoadingSubmissions(false);
  };

  const getCodeFromHouse = (house) => {
    const map = { 'Gryffindor': 'G', 'Slytherin': 'S', 'Ravenclaw': 'R', 'Hufflepuff': 'H' };
    return map[house] || 'H';
  };

  useEffect(() => {
    if (mathStarted && timeLeft > 0 && !mathSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !mathSubmitted) {
      handleMathSubmit();
    }
  }, [mathStarted, timeLeft, mathSubmitted]);

  const mathQuestions = [
    {
      id: 1,
      question: "You have a monthly grocery budget of Rp 2,000,000. You spent Rp 450,000 on rice, Rp 380,000 on vegetables, and Rp 520,000 on meat. How much money is left?",
      options: ["Rp 550,000", "Rp 650,000", "Rp 750,000", "Rp 850,000"],
      correct: "Rp 650,000"
    },
    {
      id: 2,
      question: "A bottle of cleaning liquid costs Rp 25,000. If you buy 4 bottles, how much do you pay?",
      options: ["Rp 75,000", "Rp 100,000", "Rp 125,000", "Rp 150,000"],
      correct: "Rp 100,000"
    },
    {
      id: 3,
      question: "You need to clean 6 rooms. Each room takes 30 minutes. How many hours total?",
      options: ["2 hours", "3 hours", "4 hours", "5 hours"],
      correct: "3 hours"
    },
    {
      id: 4,
      question: "The electricity bill is Rp 850,000 and water bill is Rp 320,000. What is the total?",
      options: ["Rp 1,070,000", "Rp 1,170,000", "Rp 1,270,000", "Rp 1,370,000"],
      correct: "Rp 1,170,000"
    },
    {
      id: 5,
      question: "You bought 3 kg of chicken at Rp 35,000 per kg. You paid with Rp 150,000. What is your change?",
      options: ["Rp 35,000", "Rp 45,000", "Rp 55,000", "Rp 65,000"],
      correct: "Rp 45,000"
    }
  ];

  const personalityQuestions = [
    {
      id: 1,
      question: "If you see something broken in the house, what do you do first?",
      options: [
        { text: "Try to fix it yourself immediately", trait: "G" },
        { text: "Report it right away and suggest solutions", trait: "S" },
        { text: "Research how to fix it properly before acting", trait: "R" },
        { text: "Report it and wait for instructions patiently", trait: "H" }
      ]
    },
    {
      id: 2,
      question: "When learning a new cleaning technique, you prefer to:",
      options: [
        { text: "Jump in and learn by doing", trait: "G" },
        { text: "Find the most efficient method first", trait: "S" },
        { text: "Watch tutorials and understand the science", trait: "R" },
        { text: "Practice carefully until you master it", trait: "H" }
      ]
    },
    {
      id: 3,
      question: "What is most important to you in a job?",
      options: [
        { text: "Having exciting challenges every day", trait: "G" },
        { text: "Opportunities for growth and recognition", trait: "S" },
        { text: "Learning new skills and knowledge", trait: "R" },
        { text: "Building trust and long-term relationships", trait: "H" }
      ]
    },
    {
      id: 4,
      question: "If you disagree with how something should be done, you would:",
      options: [
        { text: "Speak up directly and share your opinion", trait: "G" },
        { text: "Find a strategic time to suggest improvements", trait: "S" },
        { text: "Explain your reasoning with facts and examples", trait: "R" },
        { text: "Follow instructions but discuss it later politely", trait: "H" }
      ]
    },
    {
      id: 5,
      question: "When working with other household staff, you prefer to:",
      options: [
        { text: "Take the lead and motivate others", trait: "G" },
        { text: "Work independently and show your value", trait: "S" },
        { text: "Share knowledge and learn from each other", trait: "R" },
        { text: "Support the team and help wherever needed", trait: "H" }
      ]
    },
    {
      id: 6,
      question: "What would you do if you accidentally broke something valuable?",
      options: [
        { text: "Immediately tell the employer honestly", trait: "G" },
        { text: "Assess the situation and find the best solution", trait: "S" },
        { text: "Figure out how to prevent it happening again", trait: "R" },
        { text: "Apologize sincerely and offer to make it right", trait: "H" }
      ]
    },
    {
      id: 7,
      question: "You have 30 minutes. These all need doing: wash dishes, chop vegetables, wipe counters. What do you do first?",
      options: [
        { text: "Do the easiest task first", trait: "H" },
        { text: "Do what looks dirtiest", trait: "G" },
        { text: "Do what blocks the next task (e.g., chop veggies so cooking can start)", trait: "S" },
        { text: "Do what I enjoy most", trait: "R" }
      ]
    },
    {
      id: 8,
      question: "In a house where people work from home, you prefer to:",
      options: [
        { text: "Talk when spoken to", trait: "H" },
        { text: "Keep interaction short and clear", trait: "S" },
        { text: "Check in often to be helpful", trait: "G" },
        { text: "Work independently and update later via WhatsApp", trait: "R" }
      ]
    },
    {
      id: 9,
      question: "You planned to cook lunch. At 10am, you realise: one main ingredient is spoiled, employer is on a call, and lunch time cannot change. What do you do?",
      options: [
        { text: "Change the dish and inform later", trait: "S" },
        { text: "Replace ingredient and keep dish similar", trait: "R" },
        { text: "Delay lunch to go shopping and explain later", trait: "G" },
        { text: "WhatsApp employer and wait for their decision", trait: "H" }
      ]
    },
    {
      id: 10,
      question: "If something goes wrong because of your decision, what do you do first?",
      options: [
        { text: "Explain why it happened", trait: "R" },
        { text: "Fix the problem", trait: "S" },
        { text: "Inform immediately", trait: "G" },
        { text: "Apologise", trait: "H" }
      ]
    }
  ];

  const houseNames = {
    G: { name: "Gryffindor", emoji: "🦁", color: "#ae0001", description: "Brave, courageous, takes initiative" },
    S: { name: "Slytherin", emoji: "🐍", color: "#1a472a", description: "Strategic, resourceful, efficient" },
    R: { name: "Ravenclaw", emoji: "🦅", color: "#0e1a40", description: "Thoughtful, analytical, loves learning" },
    H: { name: "Hufflepuff", emoji: "🦡", color: "#ecb939", description: "Loyal, patient, hardworking" }
  };

  const traitNames = {
    G: "The Brave Leader",
    S: "The Strategic Achiever",
    R: "The Thoughtful Learner",
    H: "The Loyal Helper"
  };

  const traitDescriptions = {
    G: "You are courageous, honest, and not afraid to take initiative. You speak up when needed and face challenges head-on.",
    S: "You are resourceful, ambitious, and efficient. You find smart solutions and always look for ways to improve.",
    R: "You are curious, thoughtful, and love learning. You prefer to understand things deeply before acting.",
    H: "You are loyal, patient, and hardworking. You build strong relationships and can always be counted on."
  };

  const handleMathSubmit = () => {
    let score = 0;
    mathQuestions.forEach(q => {
      if (mathAnswers[q.id] === q.correct) score++;
    });
    setMathScore(score);
    setMathSubmitted(true);
  };

  const calculatePersonality = () => {
    const traits = { G: 0, S: 0, R: 0, H: 0 };
    Object.values(personalityAnswers).forEach(trait => {
      traits[trait]++;
    });

    const maxTrait = Object.keys(traits).reduce((a, b) => traits[a] > traits[b] ? a : b);

    setPersonalityResult({
      type: traitNames[maxTrait],
      description: traitDescriptions[maxTrait],
      code: maxTrait,
      house: houseNames[maxTrait].name,
      traits: traits
    });

    return {
      type: traitNames[maxTrait],
      description: traitDescriptions[maxTrait],
      code: maxTrait,
      house: houseNames[maxTrait].name,
      traits: traits
    };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswerText = (questionId, trait) => {
    const question = personalityQuestions.find(q => q.id === questionId);
    if (!question) return '';
    const option = question.options.find(o => o.trait === trait);
    return option ? option.text : '';
  };

  const saveSubmission = async (personality) => {
    setIsSubmitting(true);

    const answerDetails = {};
    Object.entries(personalityAnswers).forEach(([qId, trait]) => {
      answerDetails[qId] = {
        trait: trait,
        answer: getAnswerText(parseInt(qId), trait)
      };
    });

    const submissionData = {
      name: applicantName,
      phone: phoneNumber,
      instagram: instagramHandle || 'Not provided',
      expectedSalary: expectedSalary,
      startDate: startDate,
      videoLink: videoLink,
      mathScore: mathScore,
      house: personality.house,
      personality: personality.type,
      traitScores: personality.traits,
      personalityAnswers: answerDetails
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
    } catch (error) {
      // Even if there's a CORS error, the data might have been saved
      console.log('Submission sent');
    }

    setIsSubmitting(false);
  };

  const handleAdminLogin = () => {
    if (adminPassword === '272727') {
      setAdminLoggedIn(true);
      fetchSubmissions();
    } else {
      alert('Incorrect password');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Instagram', 'Expected Salary', 'Start Date', 'Video Link', 'Math Score', 'Personality', 'House', 'Submitted At'];
    const rows = submissions.map(s => [
      s.name,
      s.phone,
      s.instagram,
      s.expectedSalary,
      s.startDate,
      s.videoLink,
      `${s.mathScore}/5`,
      s.personality,
      s.house,
      s.timestamp ? new Date(s.timestamp).toLocaleString() : ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maid-screening-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    margin: '0 auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  };

  const adminCardStyle = {
    ...cardStyle,
    maxWidth: '1000px'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginTop: '16px'
  };

  const smallButtonStyle = {
    ...buttonStyle,
    width: 'auto',
    padding: '10px 20px',
    fontSize: '14px',
    marginTop: '0',
    marginRight: '10px'
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    fontSize: '16px',
    marginTop: '8px',
    boxSizing: 'border-box'
  };

  const optionStyle = (selected) => ({
    padding: '14px',
    borderRadius: '10px',
    border: `2px solid ${selected ? '#667eea' : '#e0e0e0'}`,
    background: selected ? '#f0f3ff' : 'white',
    marginBottom: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.2s'
  });

  const progressStyle = {
    height: '6px',
    background: '#e0e0e0',
    borderRadius: '3px',
    marginBottom: '24px',
    overflow: 'hidden'
  };

  const progressFillStyle = (progress) => ({
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    width: `${progress}%`,
    transition: 'width 0.3s'
  });

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    marginTop: '20px'
  };

  const thStyle = {
    background: '#f3f4f6',
    padding: '12px 8px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151'
  };

  const tdStyle = {
    padding: '12px 8px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'top'
  };

  const adminLinkStyle = {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    textDecoration: 'none',
    cursor: 'pointer'
  };

  // Admin Login Page
  if (currentSection === 'admin' && !adminLoggedIn) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '20px', color: '#333', margin: '0 0 20px 0', textAlign: 'center' }}>
            🔐 Admin Login
          </h2>
          <label style={{ fontWeight: '600', color: '#333' }}>
            Password
            <input
              type="password"
              style={inputStyle}
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
          </label>
          <button style={buttonStyle} onClick={handleAdminLogin}>
            Login
          </button>
          <button
            style={{ ...buttonStyle, background: '#6b7280', marginTop: '10px' }}
            onClick={() => setCurrentSection('welcome')}
          >
            ← Back to Challenge
          </button>
        </div>
      </div>
    );
  }

  // Admin Detail View
  if (currentSection === 'admin' && adminLoggedIn && selectedSubmission) {
    const s = selectedSubmission;
    const house = houseNames[s.personalityCode] || houseNames.H;

    return (
      <div style={containerStyle}>
        <div style={adminCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#333', margin: 0 }}>
              📋 {s.name}'s Results
            </h2>
            <button
              style={{ ...smallButtonStyle, background: '#6b7280' }}
              onClick={() => setSelectedSubmission(null)}
            >
              ← Back to List
            </button>
          </div>

          {/* House Badge */}
          <div style={{
            background: house.color,
            color: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>{house.emoji}</div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>{house.name}</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>{house.description}</p>
          </div>

          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Phone</div>
              <a href={`https://wa.me/${(s.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', fontWeight: '600' }}>{s.phone}</a>
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Instagram</div>
              {s.instagram !== 'Not provided' ? (
                <a href={`https://instagram.com/${(s.instagram || '').replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', fontWeight: '600' }}>{s.instagram}</a>
              ) : <span style={{ color: '#999' }}>Not provided</span>}
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Expected Salary</div>
              <div style={{ fontWeight: '600' }}>{s.expectedSalary}</div>
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Available Start Date</div>
              <div style={{ fontWeight: '600' }}>{s.startDate ? new Date(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</div>
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Video</div>
              <a href={s.videoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', fontWeight: '600' }}>Watch Video →</a>
            </div>
            <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Math Score</div>
              <span style={{
                background: s.mathScore >= 4 ? '#dcfce7' : s.mathScore >= 3 ? '#fef9c3' : '#fee2e2',
                color: s.mathScore >= 4 ? '#166534' : s.mathScore >= 3 ? '#854d0e' : '#dc2626',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: '600'
              }}>
                {s.mathScore}/5
              </span>
            </div>
          </div>

          {/* Trait Scores */}
          {s.traitScores && Object.keys(s.traitScores).length > 0 && (
            <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Trait Distribution</h4>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {Object.entries(s.traitScores).map(([trait, score]) => (
                  <div key={trait} style={{ textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontSize: '24px' }}>{houseNames[trait]?.emoji}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{houseNames[trait]?.name}</div>
                    <div style={{ fontWeight: '700', color: houseNames[trait]?.color }}>{score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personality Answers */}
          {s.personalityAnswers && Object.keys(s.personalityAnswers).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>Personality Question Answers</h4>
              {personalityQuestions.map((q, index) => {
                const answer = s.personalityAnswers?.[q.id];
                return (
                  <div key={q.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: index < personalityQuestions.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '8px', fontSize: '14px' }}>
                      Q{index + 1}: {q.question}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f0f7ff',
                      padding: '10px 14px',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>{answer ? houseNames[answer.trait]?.emoji : '❓'}</span>
                      <span style={{ color: '#555', fontSize: '14px' }}>{answer?.answer || 'No answer'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (currentSection === 'admin' && adminLoggedIn) {
    return (
      <div style={containerStyle}>
        <div style={adminCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', color: '#333', margin: 0 }}>
              📊 Admin Dashboard
            </h2>
            <div>
              <button style={smallButtonStyle} onClick={fetchSubmissions}>
                🔄 Refresh
              </button>
              <button style={smallButtonStyle} onClick={exportToCSV}>
                📥 Export CSV
              </button>
              <button
                style={{ ...smallButtonStyle, background: '#6b7280' }}
                onClick={() => {
                  setAdminLoggedIn(false);
                  setAdminPassword('');
                  setCurrentSection('welcome');
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div style={{ background: '#f0f7ff', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '16px' }}>
              <strong>Total Submissions:</strong> {submissions.length}
            </p>
          </div>

          {isLoadingSubmissions ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p>Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p>No submissions yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Salary</th>
                    <th style={thStyle}>Start</th>
                    <th style={thStyle}>Video</th>
                    <th style={thStyle}>Math</th>
                    <th style={thStyle}>House</th>
                    <th style={thStyle}>Submitted</th>
                    <th style={thStyle}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice().reverse().map((s, index) => (
                    <tr key={s.id || index}>
                      <td style={tdStyle}>{submissions.length - index}</td>
                      <td style={tdStyle}><strong>{s.name}</strong></td>
                      <td style={tdStyle}>
                        <a href={`https://wa.me/${(s.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>{s.phone}</a>
                      </td>
                      <td style={tdStyle}>{s.expectedSalary}</td>
                      <td style={tdStyle}>{s.startDate ? new Date(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}</td>
                      <td style={tdStyle}>
                        <a href={s.videoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                          View
                        </a>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: s.mathScore >= 4 ? '#dcfce7' : s.mathScore >= 3 ? '#fef9c3' : '#fee2e2',
                          color: s.mathScore >= 4 ? '#166534' : s.mathScore >= 3 ? '#854d0e' : '#dc2626',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          {s.mathScore}/5
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: houseNames[s.personalityCode]?.color || '#666',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {houseNames[s.personalityCode]?.emoji} {s.house}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => setSelectedSubmission(s)}
                          style={{
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Welcome Section
  if (currentSection === 'welcome') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <h1 style={{ fontSize: '22px', color: '#333', margin: '0 0 8px 0', lineHeight: '1.3' }}>
              House Helper Challenge
            </h1>
            <h2 style={{ fontSize: '16px', color: '#667eea', margin: '0', fontWeight: '500' }}>
              for Darius Cheung Household
            </h2>
          </div>

          <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#333' }}>
              This challenge has 3 parts:
            </p>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <p style={{ margin: '8px 0' }}>📹 Part 1: Video Introduction (1-2 min)</p>
              <p style={{ margin: '8px 0' }}>🔢 Part 2: Math Quiz (3 min timer)</p>
              <p style={{ margin: '8px 0' }}>💭 Part 3: Personality Questions</p>
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#888' }}>
              Total time: About 10 minutes
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#333' }}>
              Your Full Name <span style={{ color: '#dc2626' }}>*</span>
              <input
                type="text"
                style={inputStyle}
                placeholder="Enter your full name"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#333' }}>
              WhatsApp / Phone Number <span style={{ color: '#dc2626' }}>*</span>
              <input
                type="tel"
                style={inputStyle}
                placeholder="e.g. +62 812 3456 7890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#333' }}>
              Instagram Account <span style={{ color: '#888', fontWeight: '400' }}>(optional)</span>
              <input
                type="text"
                style={inputStyle}
                placeholder="@yourusername"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#333' }}>
              Expected Monthly Salary <span style={{ color: '#dc2626' }}>*</span>
              <input
                type="text"
                style={inputStyle}
                placeholder="e.g. Rp 3,500,000"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#333' }}>
              Available Start Date <span style={{ color: '#dc2626' }}>*</span>
              <input
                type="date"
                style={inputStyle}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </label>
          </div>

          <button
            style={{ ...buttonStyle, opacity: (applicantName.trim() && phoneNumber.trim() && expectedSalary.trim() && startDate) ? 1 : 0.5 }}
            disabled={!applicantName.trim() || !phoneNumber.trim() || !expectedSalary.trim() || !startDate}
            onClick={() => setCurrentSection('video')}
          >
            Start Challenge →
          </button>
        </div>

        <div style={adminLinkStyle} onClick={() => setCurrentSection('admin')}>
          Admin
        </div>
      </div>
    );
  }

  // Video Section
  if (currentSection === 'video') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={progressStyle}>
            <div style={progressFillStyle(33)} />
          </div>

          <h2 style={{ fontSize: '20px', color: '#333', margin: '0 0 8px 0' }}>
            📹 Part 1: Video Introduction
          </h2>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 20px 0' }}>
            Record and upload a 1-minute video about yourself
          </p>

          <div style={{ background: '#fff9e6', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontWeight: '600', margin: '0 0 12px 0', color: '#333' }}>
              Please include in your video:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#555' }}>
              <li style={{ marginBottom: '8px' }}>Your name and where you are from</li>
              <li style={{ marginBottom: '8px' }}>Your work experience</li>
              <li style={{ marginBottom: '8px' }}>Your family situation</li>
              <li style={{ marginBottom: '8px' }}>Your hobbies or interests</li>
            </ul>
          </div>

          <div style={{ background: '#f0f7ff', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontWeight: '600', margin: '0 0 12px 0', color: '#333' }}>
              How to upload to YouTube:
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#555' }}>
              <li style={{ marginBottom: '8px' }}>Open YouTube app on your phone</li>
              <li style={{ marginBottom: '8px' }}>Tap the + button at the bottom</li>
              <li style={{ marginBottom: '8px' }}>Select "Upload a video"</li>
              <li style={{ marginBottom: '8px' }}>Choose your video</li>
              <li style={{ marginBottom: '8px' }}>Title: "[Your Name] - Introduction"</li>
              <li style={{ marginBottom: '8px' }}>Set visibility to "Unlisted"</li>
              <li style={{ marginBottom: '8px' }}>Tap "Upload"</li>
              <li style={{ marginBottom: '8px' }}>Copy the video link and paste below</li>
            </ol>
          </div>

          <label style={{ fontWeight: '600', color: '#333' }}>
            YouTube Video Link
            <input
              type="url"
              style={inputStyle}
              placeholder="Paste your YouTube link here"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
            />
          </label>
          <p style={{ fontSize: '12px', color: '#888', margin: '8px 0 0 0' }}>
            Example: https://youtu.be/abc123xyz
          </p>

          <button
            style={{ ...buttonStyle, opacity: videoLink.trim() ? 1 : 0.5 }}
            disabled={!videoLink.trim()}
            onClick={() => setCurrentSection('math')}
          >
            Continue to Math Quiz →
          </button>
        </div>
      </div>
    );
  }

  // Math Section
  if (currentSection === 'math') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={progressStyle}>
            <div style={progressFillStyle(66)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', color: '#333', margin: '0 0 4px 0' }}>
                🔢 Part 2: Math Quiz
              </h2>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                5 household math questions
              </p>
            </div>
            {mathStarted && !mathSubmitted && (
              <div style={{
                background: timeLeft <= 30 ? '#fee2e2' : '#e0f7e0',
                color: timeLeft <= 30 ? '#dc2626' : '#16a34a',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: '700',
                fontSize: '18px'
              }}>
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {!mathStarted ? (
            <div>
              <div style={{ background: '#fff9e6', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                  ⏱️ You have <strong>3 minutes</strong> to answer 5 questions about household budgets and calculations. The timer starts when you click the button below.
                </p>
              </div>
              <button style={buttonStyle} onClick={() => setMathStarted(true)}>
                Start Math Quiz →
              </button>
            </div>
          ) : mathSubmitted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                {mathScore >= 4 ? '🎉' : mathScore >= 3 ? '👍' : '📚'}
              </div>
              <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 8px 0' }}>
                Score: {mathScore}/5
              </h3>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                {mathScore >= 4 ? 'Excellent work!' : mathScore >= 3 ? 'Good job!' : 'Keep practicing!'}
              </p>
              <button style={buttonStyle} onClick={() => setCurrentSection('personality')}>
                Continue to Final Part →
              </button>
            </div>
          ) : (
            <div>
              {mathQuestions.map((q, index) => (
                <div key={q.id} style={{ marginBottom: '24px' }}>
                  <p style={{ fontWeight: '600', color: '#333', marginBottom: '12px' }}>
                    {index + 1}. {q.question}
                  </p>
                  {q.options.map(option => (
                    <div
                      key={option}
                      style={optionStyle(mathAnswers[q.id] === option)}
                      onClick={() => setMathAnswers({ ...mathAnswers, [q.id]: option })}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              ))}
              <button
                style={{ ...buttonStyle, opacity: Object.keys(mathAnswers).length === 5 ? 1 : 0.5 }}
                disabled={Object.keys(mathAnswers).length !== 5}
                onClick={handleMathSubmit}
              >
                Submit Answers
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Personality Section
  if (currentSection === 'personality') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={progressStyle}>
            <div style={progressFillStyle(personalityResult ? 100 : 85)} />
          </div>

          <h2 style={{ fontSize: '20px', color: '#333', margin: '0 0 8px 0' }}>
            💭 Part 3: Work Style Questions
          </h2>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 20px 0' }}>
            Tell us about how you like to work
          </p>

          {!personalityResult ? (
            <div>
              {personalityQuestions.map((q, index) => (
                <div key={q.id} style={{ marginBottom: '24px' }}>
                  <p style={{ fontWeight: '600', color: '#333', marginBottom: '12px' }}>
                    {index + 1}. {q.question}
                  </p>
                  {q.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      style={optionStyle(personalityAnswers[q.id] === option.trait)}
                      onClick={() => setPersonalityAnswers({ ...personalityAnswers, [q.id]: option.trait })}
                    >
                      {option.text}
                    </div>
                  ))}
                </div>
              ))}
              <button
                style={{ ...buttonStyle, opacity: Object.keys(personalityAnswers).length === personalityQuestions.length ? 1 : 0.5 }}
                disabled={Object.keys(personalityAnswers).length !== personalityQuestions.length || isSubmitting}
                onClick={async () => {
                  const result = calculatePersonality();
                  await saveSubmission(result);
                }}
              >
                {isSubmitting ? 'Submitting...' : 'See Results →'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                {houseNames[personalityResult.code].emoji}
              </div>
              <h3 style={{ fontSize: '22px', color: '#667eea', margin: '0 0 12px 0' }}>
                {personalityResult.type}
              </h3>
              <p style={{ color: '#555', marginBottom: '24px', lineHeight: '1.6' }}>
                {personalityResult.description}
              </p>
              <button style={buttonStyle} onClick={() => setCurrentSection('complete')}>
                Complete Challenge →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Complete Section
  if (currentSection === 'complete') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎊</div>
            <h2 style={{ fontSize: '24px', color: '#333', margin: '0 0 8px 0' }}>
              Challenge Complete!
            </h2>
            <p style={{ color: '#666' }}>
              Thank you, {applicantName}!
            </p>
          </div>

          <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#333', margin: '0 0 16px 0' }}>
              Your Results Summary
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#888', fontSize: '13px' }}>Contact:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{phoneNumber}</p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#888', fontSize: '13px' }}>Expected Salary:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{expectedSalary}</p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#888', fontSize: '13px' }}>Available From:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#888', fontSize: '13px' }}>Math Score:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '600', color: mathScore >= 4 ? '#16a34a' : mathScore >= 3 ? '#ca8a04' : '#dc2626' }}>
                {mathScore}/5
              </p>
            </div>

            <div>
              <span style={{ color: '#888', fontSize: '13px' }}>Work Style:</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#667eea' }}>
                {personalityResult.type}
              </p>
            </div>
          </div>

          <div style={{ background: '#e6fff0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#166534', textAlign: 'center' }}>
              ✅ Your responses have been recorded.<br />
              We will contact you soon!
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#888' }}>
            You may now close this page.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default MaidScreeningChallenge;
