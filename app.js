// Task Management System
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.initializeEventListeners();
        this.renderTasks();
        this.updateDependencyOptions();
    }

    // Task Data Model
    createTask(title, duration, priority, dependencies = []) {
        const task = {
            id: Date.now() + Math.random(),
            title: title.trim(),
            duration: parseInt(duration),
            priority: priority,
            dependencies: dependencies,
            completed: false,
            createdAt: new Date().toISOString()
        };
        return task;
    }

    // Local Storage Management
    saveTasks() {
        localStorage.setItem('smartTodoTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const stored = localStorage.getItem('smartTodoTasks');
        return stored ? JSON.parse(stored) : [];
    }

    // Task Operations
    addTask(title, duration, priority, dependencies = []) {
        const task = this.createTask(title, duration, priority, dependencies);
        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateDependencyOptions();
        return task;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        // Remove this task from other tasks' dependencies
        this.tasks.forEach(task => {
            task.dependencies = task.dependencies.filter(depId => depId !== taskId);
        });
        this.saveTasks();
        this.renderTasks();
        this.updateDependencyOptions();
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Task Status Analysis
    isTaskBlocked(task) {
        if (task.completed) return false;
        return task.dependencies.some(depId => {
            const dependency = this.tasks.find(t => t.id === depId);
            return dependency && !dependency.completed;
        });
    }

    isTaskAvailable(task) {
        return !task.completed && !this.isTaskBlocked(task);
    }

    getTaskStatus(task) {
        if (task.completed) return 'completed';
        if (this.isTaskBlocked(task)) return 'blocked';
        return 'available';
    }

    // Recommendation Engine
    getRecommendations(availableMinutes) {
        // Filter available tasks that fit within time constraint
        const eligibleTasks = this.tasks.filter(task => 
            this.isTaskAvailable(task) && task.duration <= availableMinutes
        );

        if (eligibleTasks.length === 0) {
            return { recommended: null, alternatives: [] };
        }

        // Scoring algorithm considering priority and urgency
        const scoredTasks = eligibleTasks.map(task => {
            let score = 0;
            
            // Priority scoring (High: 10, Medium: 5, Low: 1)
            const priorityScores = { high: 10, medium: 5, low: 1 };
            score += priorityScores[task.priority] || 1;
            
            // Duration efficiency (prefer tasks that use available time well)
            const timeUtilization = task.duration / availableMinutes;
            score += timeUtilization * 5;
            
            // Slight preference for older tasks
            const daysSinceCreated = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            score += Math.min(daysSinceCreated * 0.1, 2);

            return { task, score };
        });

        // Sort by score (descending)
        scoredTasks.sort((a, b) => b.score - a.score);

        return {
            recommended: scoredTasks[0]?.task || null,
            alternatives: scoredTasks.slice(1, 4).map(item => item.task)
        };
    }

    // UI Event Listeners
    initializeEventListeners() {
        // Task form submission
        const taskForm = document.getElementById('task-form');
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskFormSubmit();
        });

        // Recommendation request
        const getRecommendationBtn = document.getElementById('get-recommendation');
        getRecommendationBtn.addEventListener('click', () => {
            this.handleRecommendationRequest();
        });

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.dataset.filter);
            });
        });

        // Enter key on time input
        const availableTimeInput = document.getElementById('available-time');
        availableTimeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleRecommendationRequest();
            }
        });
    }

    handleTaskFormSubmit() {
        const title = document.getElementById('task-title').value;
        const duration = document.getElementById('task-duration').value;
        const priority = document.getElementById('task-priority').value;
        const dependencySelect = document.getElementById('task-dependencies');
        const dependencies = Array.from(dependencySelect.selectedOptions).map(option => parseFloat(option.value));

        if (title && duration && priority) {
            this.addTask(title, duration, priority, dependencies);
            document.getElementById('task-form').reset();
        }
    }

    handleRecommendationRequest() {
        const availableTime = parseInt(document.getElementById('available-time').value);
        if (!availableTime || availableTime <= 0) {
            alert('Please enter a valid time in minutes');
            return;
        }

        const recommendations = this.getRecommendations(availableTime);
        this.renderRecommendations(recommendations, availableTime);
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    // UI Rendering
    renderTasks() {
        const container = document.getElementById('tasks-container');
        let filteredTasks = this.tasks;

        // Apply current filter
        switch (this.currentFilter) {
            case 'available':
                filteredTasks = this.tasks.filter(task => this.isTaskAvailable(task));
                break;
            case 'blocked':
                filteredTasks = this.tasks.filter(task => this.isTaskBlocked(task));
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.completed);
                break;
        }

        if (filteredTasks.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
    }

    renderTask(task) {
        const status = this.getTaskStatus(task);
        const dependencies = this.getTaskDependencyNames(task);
        
        return `
            <div class="task-item ${status}">
                <div class="task-header">
                    <div>
                        <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                        <div class="task-chips">
                            <span class="chip chip-duration">${task.duration} min</span>
                            <span class="chip chip-priority ${task.priority}">${task.priority.toUpperCase()}</span>
                            <span class="chip chip-status ${status}">${status.toUpperCase()}</span>
                        </div>
                        ${dependencies.length > 0 ? `
                            <div class="task-dependencies">
                                <strong>Depends on:</strong> ${dependencies.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="task-actions">
                        ${!task.completed ? `
                            <button class="btn btn-small btn-success" onclick="taskManager.toggleTaskCompletion(${task.id})">
                                Complete
                            </button>
                        ` : `
                            <button class="btn btn-small" onclick="taskManager.toggleTaskCompletion(${task.id})">
                                Undo
                            </button>
                        `}
                        <button class="btn btn-small btn-danger" onclick="taskManager.deleteTask(${task.id})">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        const messages = {
            all: 'No tasks yet. Add your first task above!',
            available: 'No available tasks. Create some tasks or complete dependencies.',
            blocked: 'No blocked tasks. Great job keeping things unblocked!',
            completed: 'No completed tasks yet. Start completing some tasks!'
        };

        return `
            <div class="empty-state">
                <h3>Nothing here</h3>
                <p>${messages[this.currentFilter]}</p>
            </div>
        `;
    }

    renderRecommendations(recommendations, availableTime) {
        const panel = document.getElementById('recommendation-panel');
        const recommendedContainer = document.getElementById('recommended-task');
        const alternativesContainer = document.getElementById('alternative-tasks');

        if (!recommendations.recommended) {
            recommendedContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks available</h3>
                    <p>No tasks can be completed in ${availableTime} minutes. Try increasing your available time or add shorter tasks.</p>
                </div>
            `;
            alternativesContainer.style.display = 'none';
        } else {
            recommendedContainer.innerHTML = `
                <div class="recommendation-title">Perfect Match!</div>
                ${this.renderTask(recommendations.recommended)}
            `;

            if (recommendations.alternatives.length > 0) {
                alternativesContainer.innerHTML = `
                    <h3>Other Options</h3>
                    ${recommendations.alternatives.map(task => this.renderTask(task)).join('')}
                `;
                alternativesContainer.style.display = 'block';
            } else {
                alternativesContainer.style.display = 'none';
            }
        }

        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth' });
    }

    updateDependencyOptions() {
        const select = document.getElementById('task-dependencies');
        const availableTasks = this.tasks.filter(task => !task.completed);
        
        select.innerHTML = availableTasks.map(task => 
            `<option value="${task.id}">${task.title}</option>`
        ).join('');
    }

    getTaskDependencyNames(task) {
        return task.dependencies.map(depId => {
            const dependency = this.tasks.find(t => t.id === depId);
            return dependency ? dependency.title : 'Unknown';
        });
    }
}

// Initialize the application
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});

// Add some sample data for demo purposes (only if no existing tasks)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (taskManager.tasks.length === 0) {
            // Add some sample tasks for demonstration
            taskManager.addTask('Review project requirements', 15, 'high', []);
            taskManager.addTask('Set up development environment', 30, 'high', []);
            taskManager.addTask('Create wireframes', 45, 'medium', []);
            taskManager.addTask('Write documentation', 60, 'low', []);
            
            // Add a task with dependencies
            const task1 = taskManager.tasks.find(t => t.title === 'Review project requirements');
            const task2 = taskManager.tasks.find(t => t.title === 'Set up development environment');
            if (task1 && task2) {
                taskManager.addTask('Start coding', 120, 'high', [task1.id, task2.id]);
            }
        }
    }, 100);
});