import { useState } from 'react';

interface Suggestion {
  id: string;
  title: string;
  type: 'YouTube' | 'LeetCode' | 'Docs' | 'Community';
  url: string;
  user: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionFeedback?: string;
}

export function ResourceSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: '1',
      title: 'Advanced DSA Techniques',
      type: 'YouTube',
      url: 'https://youtube.com/watch?v=xyz',
      user: 'john@example.com',
      createdAt: '2024-06-05',
      status: 'pending'
    },
    {
      id: '2',
      title: 'System Design Interview Guide',
      type: 'Docs',
      url: 'https://docs.example.com/sd',
      user: 'jane@example.com',
      createdAt: '2024-06-04',
      status: 'approved'
    },
    {
      id: '3',
      title: 'Graph Algorithm Playlist',
      type: 'YouTube',
      url: 'https://youtube.com/watch?v=abc',
      user: 'bob@example.com',
      createdAt: '2024-06-03',
      status: 'rejected',
      rejectionFeedback: 'Duplicate of existing resource'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState('');
  const [requestingInfoId, setRequestingInfoId] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState('');

  const filteredSuggestions = suggestions.filter(s =>
    !filterStatus || s.status === filterStatus
  );

  const handleApprove = (id: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'approved' } : s
    ));
  };

  const handleReject = (id: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id
        ? {
          ...s,
          status: 'rejected',
          rejectionFeedback: 'This suggestion does not meet our criteria.'
        }
        : s
    ));
  };

  const handleRequestInfo = (id: string) => {
    if (!infoMessage) {
      alert('Please enter a message');
      return;
    }
    // In a real app, this would send a notification to the user
    alert(`Information request sent to user for suggestion ${id}`);
    setRequestingInfoId(null);
    setInfoMessage('');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Filter by Status</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filterStatus === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({suggestions.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pending ({suggestions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filterStatus === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Approved ({suggestions.filter(s => s.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Rejected ({suggestions.filter(s => s.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Suggestions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Submitted</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSuggestions.map(suggestion => (
                <tr key={suggestion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{suggestion.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{suggestion.url}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {suggestion.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{suggestion.user}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{suggestion.createdAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(suggestion.status)}`}>
                      {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {suggestion.status === 'pending' ? (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleApprove(suggestion.id)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(suggestion.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setRequestingInfoId(suggestion.id)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                        >
                          Ask Info
                        </button>
                      </div>
                    ) : suggestion.status === 'rejected' ? (
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Feedback:</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.rejectionFeedback}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Added to Resources</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSuggestions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No suggestions found
          </div>
        )}
      </div>

      {/* Request Info Modal */}
      {requestingInfoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Request More Information</h3>
            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setRequestingInfoId(null);
                  setInfoMessage('');
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestInfo(requestingInfoId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
