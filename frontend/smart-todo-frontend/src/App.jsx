import { useState, useEffect } from 'react';
import { taskService } from './services/api';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import RecommendationPanel from './components/RecommendationPanel';
import TimeInput from './components/TimeInput';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await taskService.getTasks();
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prevTasks => [...prevTasks, newTask]);
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, updates);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const getFilteredTasks = () => {
    switch (currentFilter) {
      case 'available':
        return tasks.filter(task => !task.completed && isTaskAvailable(task));
      case 'blocked':
        return tasks.filter(task => !task.completed && isTaskBlocked(task));
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  };

  const isTaskBlocked = (task) => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return task.dependencies.some(depId => {
      const dependency = tasks.find(t => t.id === depId);
      return dependency && !dependency.completed;
    });
  };

  const isTaskAvailable = (task) => {
    return !task.completed && !isTaskBlocked(task);
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1>Smart To-Do</h1>
          <p className="subtitle">Intelligent task management with time-based recommendations</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        <TimeInput onGetRecommendation={taskService.getRecommendations} />

        <RecommendationPanel />

        <TaskForm 
          tasks={tasks}
          onCreateTask={handleCreateTask} 
        />

        <TaskList 
          tasks={getFilteredTasks()}
          allTasks={tasks}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          isTaskBlocked={isTaskBlocked}
          isTaskAvailable={isTaskAvailable}
        />
      </div>
    </div>
  );
}

export default App;
