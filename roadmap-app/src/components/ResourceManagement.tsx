import { useState } from 'react';

interface Resource {
  id: string;
  module: string;
  type: 'YouTube' | 'LeetCode' | 'Docs' | 'Community';
  url: string;
  title: string;
  description: string;
  createdAt: string;
  featured: boolean;
  approved: boolean;
}

interface ResourceForm {
  module: string;
  type: 'YouTube' | 'LeetCode' | 'Docs' | 'Community';
  url: string;
  title: string;
  description: string;
}

const initialFormState: ResourceForm = {
  module: '',
  type: 'YouTube',
  url: '',
  title: '',
  description: ''
};

export function ResourceManagement() {
  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      module: 'Data Structures',
      type: 'YouTube',
      url: 'https://youtube.com/watch?v=RBSGKlAvoiM',
      title: 'DSA Complete Course',
      description: 'Comprehensive data structures course',
      createdAt: '2024-01-15',
      featured: true,
      approved: true
    },
    {
      id: '2',
      module: 'Algorithms',
      type: 'LeetCode',
      url: 'https://leetcode.com',
      title: 'LeetCode Premium',
      description: 'Practice problems',
      createdAt: '2024-01-20',
      featured: false,
      approved: true
    }
  ]);

  const [form, setForm] = useState<ResourceForm>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());

  const modules = Array.from(new Set(resources.map(r => r.module)));
  const types = ['YouTube', 'LeetCode', 'Docs', 'Community'];

  // Filter resources
  const filteredResources = resources.filter(r => {
    const matchesModule = !filterModule || r.module === filterModule;
    const matchesType = !filterType || r.type === filterType;
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesType && matchesSearch;
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddResource = () => {
    if (!form.title || !form.url || !form.module) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      // Update existing resource
      setResources(prev => prev.map(r =>
        r.id === editingId
          ? { ...r, ...form, id: r.id }
          : r
      ));
      setEditingId(null);
    } else {
      // Add new resource
      const newResource: Resource = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toISOString().split('T')[0],
        featured: false,
        approved: false
      };
      setResources(prev => [newResource, ...prev]);
    }
    setForm(initialFormState);
  };

  const handleEdit = (resource: Resource) => {
    setForm({
      module: resource.module,
      type: resource.type,
      url: resource.url,
      title: resource.title,
      description: resource.description
    });
    setEditingId(resource.id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setResources(prev => prev.filter(r => r.id !== id));
      setSelectedResources(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedResources(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleBulkApprove = () => {
    setResources(prev => prev.map(r =>
      selectedResources.has(r.id) ? { ...r, approved: true } : r
    ));
    setSelectedResources(new Set());
  };

  const handleBulkFeature = () => {
    setResources(prev => prev.map(r =>
      selectedResources.has(r.id) ? { ...r, featured: true } : r
    ));
    setSelectedResources(new Set());
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedResources.size} resource(s)?`)) {
      setResources(prev => prev.filter(r => !selectedResources.has(r.id)));
      setSelectedResources(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {editingId ? 'Edit Resource' : 'Create New Resource'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Module *
            </label>
            <input
              type="text"
              name="module"
              value={form.module}
              onChange={handleFormChange}
              placeholder="e.g., Data Structures"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type *
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleFormChange}
              placeholder="Resource title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL *
            </label>
            <input
              type="url"
              name="url"
              value={form.url}
              onChange={handleFormChange}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Optional description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleAddResource}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {editingId ? 'Update Resource' : 'Add Resource'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(initialFormState);
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Filters & Search</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by title/url
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Module
            </label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modules</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedResources.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
            {selectedResources.size} resource(s) selected
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Approve
            </button>
            <button
              onClick={handleBulkFeature}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              Feature
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Resources Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedResources.size === filteredResources.length && filteredResources.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedResources(new Set(filteredResources.map(r => r.id)));
                      } else {
                        setSelectedResources(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Module</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredResources.map(resource => (
                <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedResources.has(resource.id)}
                      onChange={() => handleToggleSelect(resource.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{resource.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{resource.url}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{resource.module}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {resource.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {resource.approved && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Approved
                        </span>
                      )}
                      {resource.featured && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{resource.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
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
        {filteredResources.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No resources found
          </div>
        )}
      </div>
    </div>
  );
}
