import { Task } from '../types';
import TaskCard from './TaskCard';

interface TaskListProps {
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  color: 'blue' | 'yellow' | 'green';
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  green: 'bg-green-50 border-green-200'
};

const headerColors = {
  blue: 'text-blue-900 bg-blue-100',
  yellow: 'text-yellow-900 bg-yellow-100',
  green: 'text-green-900 bg-green-100'
};

const TaskList = ({ title, tasks, onEditTask, color }: TaskListProps) => {
  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} p-4`}>
      <div className={`${headerColors[color]} rounded-lg px-4 py-2 mb-4`}>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm opacity-75">{tasks.length} tasks</p>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task)} />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
