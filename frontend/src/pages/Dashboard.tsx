import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task } from '../types';
import api from '../services/api';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';
import { LogOut, Plus } from 'lucide-react';
import TaskList from '../components/TaskList';
import TaskFormModal from '../components/TaskFormModal';
import VoiceInputModal from '../components/VoiceInputModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    setupSocketListeners();

    return () => {
      socketService.off('task:created');
      socketService.off('task:updated');
      socketService.off('task:deleted');
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('task:created', (task: Task) => {
      setTasks((prev) => [task, ...prev]);
      toast.success('Task created!');
    });

    socketService.on('task:updated', (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
      toast.success('Task updated!');
    });

    socketService.on('task:deleted', ({ id }: { id: number }) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast.success('Task deleted!');
    });
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const todoTasks = tasks.filter((t) => t.status === 'To Do');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Tracker</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.username}!</p>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Voice Input
          </button>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskList
            title="To Do"
            tasks={todoTasks}
            onEditTask={handleEditTask}
            color="blue"
          />
          <TaskList
            title="In Progress"
            tasks={inProgressTasks}
            onEditTask={handleEditTask}
            color="yellow"
          />
          <TaskList
            title="Completed"
            tasks={completedTasks}
            onEditTask={handleEditTask}
            color="green"
          />
        </div>
      </main>

      {isTaskModalOpen && (
        <TaskFormModal
          task={editingTask}
          onClose={handleCloseTaskModal}
          onSuccess={fetchTasks}
        />
      )}

      {isVoiceModalOpen && (
        <VoiceInputModal
          onClose={() => setIsVoiceModalOpen(false)}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
};

export default Dashboard;
