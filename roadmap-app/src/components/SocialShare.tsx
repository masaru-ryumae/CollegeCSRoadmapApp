import React, { useState } from 'react';

interface SocialShareProps {
  achievement?: {
    name: string;
    icon: string;
    description: string;
  };
  project?: {
    name: string;
    difficulty: string;
    hours: number;
    modules: number;
  };
  onShare?: (platforms: string[]) => void;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  achievement,
  project,
  onShare
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    { id: 'twitter', name: 'Twitter', icon: '𝕏', color: '#000000' },
    { id: 'facebook', name: 'Facebook', icon: '👍', color: '#1877F2' }
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) return;

    setIsSharing(true);
    try {
      // Call backend API to share
      const response = await fetch('/api/v1/social/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          achievement,
          project,
          customMessage
        })
      });

      if (response.ok) {
        setIsOpen(false);
        setSelectedPlatforms([]);
        setCustomMessage('');
        onShare?.(selectedPlatforms);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getDefaultMessage = () => {
    if (achievement) {
      return `${achievement.icon} I just earned the "${achievement.name}" badge! ${achievement.description} #LearningJourney`;
    }
    if (project) {
      return `🎉 Just completed my "${project.name}" project! Spent ${project.hours} hours mastering ${project.modules} modules. #CodingSkills`;
    }
    return '';
  };

  return (
    <div className="social-share">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="share-trigger"
        style={{
          padding: '10px 16px',
          backgroundColor: '#2E75B6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500
        }}
      >
        📤 Share Achievement
      </button>

      {isOpen && (
        <div
          className="share-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="share-content"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
              Share Your Achievement 🎉
            </h2>

            {/* Message Preview */}
            <div
              className="message-preview"
              style={{
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e0e0e0'
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Preview:
              </p>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              >
                {customMessage || getDefaultMessage()}
              </p>
            </div>

            {/* Custom Message Input */}
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Customize your message..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'inherit',
                marginBottom: '20px',
                resize: 'vertical'
              }}
            />

            {/* Platform Selection */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ marginTop: 0, marginBottom: '12px', fontWeight: 500 }}>
                Select platforms:
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px'
                }}
              >
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    style={{
                      padding: '12px',
                      border: selectedPlatforms.includes(platform.id)
                        ? `2px solid ${platform.color}`
                        : '2px solid #ddd',
                      backgroundColor: selectedPlatforms.includes(platform.id)
                        ? `${platform.color}15`
                        : 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                      {platform.icon}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>
                      {platform.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Character Count */}
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '20px' }}>
              {(customMessage || getDefaultMessage()).length} characters
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={selectedPlatforms.length === 0 || isSharing}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedPlatforms.length === 0 ? '#ccc' : '#2E75B6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedPlatforms.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {isSharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialShare;
