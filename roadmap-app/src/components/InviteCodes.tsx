import { useState } from 'react';

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expirationDate: string;
  createdAt: string;
  active: boolean;
}

export function InviteCodes() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([
    {
      id: '1',
      code: 'ROADMAP2024',
      maxUses: 100,
      currentUses: 45,
      expirationDate: '2024-12-31',
      createdAt: '2024-01-15',
      active: true
    },
    {
      id: '2',
      code: 'BETA-TEST',
      maxUses: 50,
      currentUses: 50,
      expirationDate: '2024-06-30',
      createdAt: '2024-01-01',
      active: false
    }
  ]);

  const [bulkCount, setBulkCount] = useState(1);
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [maxUses, setMaxUses] = useState(100);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const generateCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCodes = () => {
    const newCodes: InviteCode[] = [];
    for (let i = 0; i < bulkCount; i++) {
      newCodes.push({
        id: Date.now().toString() + i,
        code: generateCode(),
        maxUses,
        currentUses: 0,
        expirationDate,
        createdAt: new Date().toISOString().split('T')[0],
        active: true
      });
    }
    setInviteCodes(prev => [newCodes[0], ...prev]);
    setBulkCount(1);
  };

  const handleDeactivate = (id: string) => {
    setInviteCodes(prev => prev.map(c =>
      c.id === id ? { ...c, active: false } : c
    ));
  };

  const handleActivate = (id: string) => {
    setInviteCodes(prev => prev.map(c =>
      c.id === id ? { ...c, active: true } : c
    ));
  };

  const handleCopyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invite code?')) {
      setInviteCodes(prev => prev.filter(c => c.id !== id));
    }
  };

  const usagePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const isExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Generate Codes Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Generate New Invite Codes</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Codes
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Uses Per Code
            </label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateCodes}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          Generate Code{bulkCount > 1 ? 's' : ''}
        </button>
      </div>

      {/* Codes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Invite Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Usage</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Expiration</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {inviteCodes.map(code => (
                <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                        {code.code}
                      </code>
                      <button
                        onClick={() => handleCopyToClipboard(code.code)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedCode === code.code ? '✓' : '📋'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {code.currentUses} / {code.maxUses}
                      </p>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            usagePercentage(code.currentUses, code.maxUses) >= 100
                              ? 'bg-red-500'
                              : usagePercentage(code.currentUses, code.maxUses) >= 80
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min(100, usagePercentage(code.currentUses, code.maxUses))}%`
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{code.expirationDate}</p>
                      {isExpired(code.expirationDate) && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Expired</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{code.createdAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      code.active
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {code.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {code.active ? (
                        <button
                          onClick={() => handleDeactivate(code.id)}
                          className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium text-sm"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(code.id)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inviteCodes.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No invite codes yet. Generate one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
