import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import {  Trash2, Loader2, AlertCircle, User, AlertTriangle } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  budget: number;
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  client: {
    _id: string;
    name: string;
    avatar?: string;
  };
  designer?: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ProjectsPage() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // ← Added error state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    setError(null); // Clear previous error
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      // CORRECT ENDPOINT — matches your backend route
      const axiosResponse = await apiRequest('get', `/projects/admin?${params}`, token);
      const data = axiosResponse.data;

      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
        setPagination(data.pagination || null);
        setCurrentPage(page);
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError(err.message || 'Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;

    setDeletingId(deleteModal);
    try {
      const token = await getToken();
      if (!token) return;

      const axiosResponse = await apiRequest('delete', `/projects/${deleteModal}`, token);
      const data = axiosResponse.data;

      if (data.success) {
        setDeleteModal(null);
        fetchProjects(currentPage);
      } else {
        alert(data.error || 'Failed to delete project');
      }
    } catch (err) {
      alert('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    const label = status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // If there's an error, show friendly message instead of crashing
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Error loading projects</p>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => fetchProjects(currentPage)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Projects Management</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No projects found</p>
            <p className="text-gray-500 mt-2">Projects will appear here once clients post them.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Project</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Designer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Budget</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Created</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project._id} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">{project.title}</p>
                          <p className="text-sm text-gray-600 truncate max-w-xs mt-1">{project.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <span className="text-gray-900">{project.client.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {project.designer ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="text-gray-900">{project.designer.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-gray-900">
                        KSh {project.budget.toLocaleString()}
                      </td>
                      <td className="px-6 py-5">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-5 text-gray-600">{formatDate(project.createdAt)}</td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => setDeleteModal(project._id)}
                          disabled={deletingId === project._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          {deletingId === project._id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
                  {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} projects
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchProjects(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchProjects(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Project</h2>
            <p className="text-gray-600 mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === deleteModal}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deletingId === deleteModal && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}