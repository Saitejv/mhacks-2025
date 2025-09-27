import { useState, useEffect } from 'react';
import { taskService } from './services/api';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import RecommendationPanel from './components/RecommendationPanel';
import TimeInput from './components/TimeInput';
import Sidebar from './components/Sidebar';
import TaskHierarchy from './components/TaskHierarchy';
import './App.css';

function App() {
  // data + loading
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ui state
  const [currentPage, setCurrentPage] = useState('choose-tasks'); // choose-tasks, add-task, hierarchy
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isSignedIn, setIsSignedIn] = useState(false);

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

  // CRUD handlers
  const handleCreateTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prevTasks => [...prevTasks, newTask]);
      setCurrentPage('choose-tasks');
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

  // helpers
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

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="app layout">
      <aside className="sidebar">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isSignedIn={isSignedIn}
          onSignInToggle={() => setIsSignedIn(prev => !prev)}
        />
      </aside>

      <main className="main-content">
        <div className="container">
          <header className="app-header">
            <h1>Smart To-Do</h1>
            <p className="subtitle">Intelligent task management with time-based recommendations</p>
          </header>

          {error && <div className="error-message">{error}</div>}

          <TimeInput onGetRecommendation={taskService.getRecommendations} />
          <RecommendationPanel />

          {currentPage === 'add-task' && (
            <section>
              <h2>Add Task</h2>
              <TaskForm tasks={tasks} onCreateTask={handleCreateTask} />
            </section>
          )}

          {currentPage === 'choose-tasks' && (
            <section>
              <h2>Tasks</h2>
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
            </section>
          )}

          {currentPage === 'hierarchy' && (
            <section>
              <h2>Task Hierarchy</h2>
              <TaskHierarchy tasks={tasks} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;


