import { useState } from 'react';

const TaskList = ({ 
  tasks, 
  allTasks, 
  currentFilter, 
  onFilterChange, 
  onUpdateTask, 
  onDeleteTask,
  isTaskBlocked,
  isTaskAvailable 
}) => {
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const handleToggleComplete = async (task) => {
    try {
      await onUpdateTask(task.id, { completed: !task.completed });
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setDeletingTaskId(taskId);
      try {
        await onDeleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setDeletingTaskId(null);
      }
    }
  };

  const getTaskStatus = (task) => {
    if (task.completed) return 'completed';
    if (isTaskBlocked(task)) return 'blocked';
    return 'available';
  };

  const getTaskDependencyNames = (task) => {
    if (!task.dependencies || task.dependencies.length === 0) return [];
    
    return task.dependencies
      .map(depId => {
        const dependency = allTasks.find(t => t.id === depId);
        return dependency ? dependency.title : 'Unknown';
      })
      .filter(Boolean);
  };

  const TaskItem = ({ task }) => {
    const status = getTaskStatus(task);
    const dependencies = getTaskDependencyNames(task);
    const isDeleting = deletingTaskId === task.id;

    return (
      <div className={`task-item ${status} ${isDeleting ? 'deleting' : ''}`}>
        <div className="task-header">
          <div className="task-info">
            <h3>{task.title}</h3>
            <div className="task-meta">
              <span className={`priority priority-${task.priority}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              <span className="duration">{task.duration} minutes</span>
              <span className={`status status-${status}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            {dependencies.length > 0 && (
              <div className="dependencies">
                <small>Depends on: {dependencies.join(', ')}</small>
              </div>
            )}
          </div>
          <div className="task-actions">
            <button
              className={`btn btn-complete ${task.completed ? 'completed' : ''}`}
              onClick={() => handleToggleComplete(task)}
              disabled={isDeleting}
            >
              {task.completed ? '✓ Completed' : 'Mark Complete'}
            </button>
            <button
              className="btn btn-delete"
              onClick={() => handleDeleteTask(task.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = () => {
    const messages = {
      all: 'No tasks yet. Add your first task above!',
      available: 'No available tasks. Create some tasks or complete dependencies.',
      blocked: 'No blocked tasks. Great job keeping things unblocked!',
      completed: 'No completed tasks yet. Start completing some tasks!'
    };

    return (
      <div className="empty-state">
        <h3>Nothing here</h3>
        <p>{messages[currentFilter]}</p>
      </div>
    );
  };

  return (
    <section className="task-list">
      <h2>Tasks</h2>
      <div className="task-filters">
        {['all', 'available', 'blocked', 'completed'].map(filter => (
          <button
            key={filter}
            className={`filter-btn ${currentFilter === filter ? 'active' : ''}`}
            onClick={() => onFilterChange(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>
      <div className="tasks-container">
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          tasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </div>
    </section>
  );
};

export default TaskList;