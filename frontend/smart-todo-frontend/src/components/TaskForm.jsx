import { useState } from 'react';

const TaskForm = ({ tasks, onCreateTask }) => {
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    priority: '',
    dependencies: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDependenciesChange = (e) => {
    const selectedDeps = Array.from(e.target.selectedOptions, option => parseFloat(option.value));
    setFormData(prev => ({
      ...prev,
      dependencies: selectedDeps
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.duration || !formData.priority) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: formData.title.trim(),
        duration: parseInt(formData.duration),
        priority: formData.priority,
        dependencies: formData.dependencies
      });
      
      setFormData({
        title: '',
        duration: '',
        priority: '',
        dependencies: []
      });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTasks = tasks.filter(task => !task.completed);

  return (
    <section className="task-creation">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            id="task-title"
            name="title"
            placeholder="Task title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-duration">Duration (minutes)</label>
            <input
              type="number"
              id="task-duration"
              name="duration"
              placeholder="30"
              min="1"
              value={formData.duration}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              required
            >
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="task-dependencies">Dependencies (optional)</label>
          <select
            id="task-dependencies"
            name="dependencies"
            multiple
            value={formData.dependencies.map(String)}
            onChange={handleDependenciesChange}
          >
            {availableTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <small>Hold Ctrl/Cmd to select multiple tasks</small>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </button>
      </form>
    </section>
  );
};

export default TaskForm;