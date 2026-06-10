import React, { useState, useEffect } from 'react';
import { getChallenges, getLeaderboard, submitChallenge, hasSubmittedToChallenge, getChallengeStats } from '../utils/challenges';
import './CommunityChallenge.css';

interface CommunityChallengeProps {
  userId: string;
  userName: string;
}

export function CommunityChallenge({ userId, userName }: CommunityChallengeProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [projectTitle, setProjectTitle] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const allChallenges = getChallenges();
    setChallenges(allChallenges);

    const submittedMap: Record<string, boolean> = {};
    allChallenges.forEach(challenge => {
      submittedMap[challenge.id] = hasSubmittedToChallenge(userId, challenge.id);
    });
    setSubmitted(submittedMap);
  }, [userId]);

  const handleSelectChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
    const board = getLeaderboard(challenge.id, 20);
    setLeaderboard(board);
  };

  const handleSubmitProject = () => {
    if (!selectedChallenge || !projectTitle) return;

    submitChallenge(userId, userName, selectedChallenge.id, `project_${Date.now()}`, projectTitle);
    setSubmitted(prev => ({ ...prev, [selectedChallenge.id]: true }));
    setShowSubmitModal(false);
    setProjectTitle('');
  };

  if (selectedChallenge) {
    return (
      <div className="community-challenge">
        <button className="btn-back" onClick={() => setSelectedChallenge(null)}>Back to Challenges</button>

        <div className="challenge-detail">
          <h2>{selectedChallenge.title}</h2>
          <p>{selectedChallenge.description}</p>

          <div className="detail-meta">
            <span>Participants: {selectedChallenge.participants}</span>
            <span>Prize: ${selectedChallenge.prizePool}</span>
            <span>Difficulty: {selectedChallenge.difficulty}</span>
          </div>

          <div className="rules-section">
            <h3>Rules</h3>
            <ul>
              {selectedChallenge.rules.map((rule: string, i: number) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>

          {!submitted[selectedChallenge.id] ? (
            <button className="btn-submit-challenge" onClick={() => setShowSubmitModal(true)}>
              Submit Your Project
            </button>
          ) : (
            <div className="already-submitted">Already submitted to this challenge</div>
          )}

          <div className="leaderboard">
            <h3>Leaderboard</h3>
            {leaderboard.length === 0 ? (
              <p>No submissions yet</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="leaderboard-row">
                    <span>{entry.rank}</span>
                    <span>{entry.userName}</span>
                    <span>{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showSubmitModal && (
          <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Submit Project</h3>
              <input
                type="text"
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                placeholder="Project title"
                className="input-field"
              />
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleSubmitProject} disabled={!projectTitle}>Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="community-challenge">
      <div className="challenges-header">
        <h2>Community Challenges</h2>
        <p>Pick a challenge and showcase your skills!</p>
      </div>

      <div className="challenges-grid">
        {challenges.map(challenge => (
          <div key={challenge.id} className="challenge-card">
            <h3>{challenge.title}</h3>
            <p>{challenge.description}</p>
            <span className="difficulty">{challenge.difficulty}</span>
            <div className="card-stats">
              <span>{challenge.participants} participants</span>
              <span>${challenge.prizePool} prize</span>
            </div>
            {submitted[challenge.id] && <span className="submitted-badge">Submitted</span>}
            <button className="btn-view" onClick={() => handleSelectChallenge(challenge)}>
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
