import React, { useState, useEffect } from 'react';
import { generateShareLink, getShareLinkUrl, getCollectionShareLinks, revokeShareLink } from '../utils/shareLinks';
import type { PersonalizedRoadmap } from '../types';
import './ShareCollectionModal.css';

interface ShareCollectionModalProps {
  isOpen: boolean;
  collectionId: string;
  collectionName: string;
  roadmap: PersonalizedRoadmap;
  onClose: () => void;
  sharedBy?: string;
}

export function ShareCollectionModal({
  isOpen,
  collectionId,
  collectionName,
  roadmap,
  onClose,
  sharedBy = 'Anonymous'
}: ShareCollectionModalProps) {
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [expiration, setExpiration] = useState<'24h' | '7d' | 'permanent'>('24h');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  useEffect(() => {
    if (isOpen) {
      const links = getCollectionShareLinks(collectionId);
      setShareLinks(links);
    }
  }, [isOpen, collectionId]);

  const handleCreateShareLink = () => {
    const expirationHours = expiration === '24h' ? 24 : expiration === '7d' ? 168 : undefined;
    const shareLink = generateShareLink(collectionId, { expirationHours, isPublic: true, allowEdit: false });
    setShareLinks([...shareLinks, shareLink]);
    setActiveTab('manage');
  };

  const handleCopyLink = (token: string, linkId: string) => {
    const url = getShareLinkUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeLink = (linkId: string) => {
    if (revokeShareLink(linkId)) {
      setShareLinks(shareLinks.filter(l => l.id !== linkId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Share "{collectionName}"</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="share-modal-tabs">
          <button className={`tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            Create Share Link
          </button>
          <button className={`tab ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
            Manage Links ({shareLinks.length})
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="share-modal-create">
            <div className="form-group">
              <label>Link Expiration</label>
              <div className="expiration-options">
                <label><input type="radio" value="24h" checked={expiration === '24h'} onChange={e => setExpiration(e.target.value as any)} /> 24 Hours</label>
                <label><input type="radio" value="7d" checked={expiration === '7d'} onChange={e => setExpiration(e.target.value as any)} /> 7 Days</label>
                <label><input type="radio" value="permanent" checked={expiration === 'permanent'} onChange={e => setExpiration(e.target.value as any)} /> Permanent</label>
              </div>
            </div>
            <button className="btn-primary btn-create-link" onClick={handleCreateShareLink}>Generate Share Link</button>
          </div>
        ) : (
          <div className="share-modal-manage">
            {shareLinks.length === 0 ? (
              <p className="no-links">No share links created yet</p>
            ) : (
              <div className="share-links-list">
                {shareLinks.map(link => (
                  <div key={link.id} className="share-link-item">
                    <div className="link-info">
                      <code>{link.token}</code>
                      <span className="meta-item">👁️ {link.viewCount} views</span>
                    </div>
                    <button className={`btn-action ${copiedId === link.id ? 'copied' : ''}`} onClick={() => handleCopyLink(link.token, link.id)}>
                      {copiedId === link.id ? '✓ Copied' : 'Copy'}
                    </button>
                    <button className="btn-action btn-revoke" onClick={() => handleRevokeLink(link.id)}>Revoke</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
