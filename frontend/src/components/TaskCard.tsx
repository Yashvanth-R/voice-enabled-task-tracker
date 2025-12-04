import { Task } from '../types';
import { Calendar, Mic, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const priorityColors = {
  Low: 'bg-gray-100 text-gray-800',
  Medium: 'bg-blue-100 text-blue-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800'
};

const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
        <div className="flex items-center gap-1 ml-2">
          {task.createdVia === 'voice' && (
            <div title="Created via voice">
              <Mic className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.dueDate), 'MMM dd, yyyy')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
