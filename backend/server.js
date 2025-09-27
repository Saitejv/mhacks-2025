const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001; // Changed port to 8001
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory exists
fs.ensureDirSync(path.dirname(TASKS_FILE));

// Helper functions
const loadTasks = async () => {
    try {
        if (await fs.pathExists(TASKS_FILE)) {
            return await fs.readJson(TASKS_FILE);
        }
        return [];
    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
};

const saveTasks = async (tasks) => {
    try {
        await fs.writeJson(TASKS_FILE, tasks, { spaces: 2 });
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
};

const isTaskBlocked = (task, allTasks) => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    
    return task.dependencies.some(depId => {
        const dependency = allTasks.find(t => t.id === depId);
        return dependency && !dependency.completed;
    });
};

const isTaskAvailable = (task, allTasks) => {
    return !task.completed && !isTaskBlocked(task, allTasks);
};

const getRecommendations = (availableMinutes, allTasks) => {
    // Filter available tasks that fit within time constraint
    const eligibleTasks = allTasks.filter(task => 
        isTaskAvailable(task, allTasks) && task.duration <= availableMinutes
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
};

// Routes

// Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await loadTasks();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load tasks' });
    }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, duration, priority, dependencies = [] } = req.body;
        
        if (!title || !duration || !priority) {
            return res.status(400).json({ error: 'Title, duration, and priority are required' });
        }

        const tasks = await loadTasks();
        const newTask = {
            id: Date.now() + Math.random(),
            title: title.trim(),
            duration: parseInt(duration),
            priority: priority,
            dependencies: dependencies,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        await saveTasks(tasks);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const taskId = parseFloat(req.params.id);
        const updates = req.body;
        
        const tasks = await loadTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        await saveTasks(tasks);
        res.json(tasks[taskIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const taskId = parseFloat(req.params.id);
        const tasks = await loadTasks();
        
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        
        if (filteredTasks.length === tasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Remove this task from other tasks' dependencies
        filteredTasks.forEach(task => {
            task.dependencies = task.dependencies.filter(depId => depId !== taskId);
        });
        
        await saveTasks(filteredTasks);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Get recommendations
app.post('/api/recommendations', async (req, res) => {
    try {
        const { availableMinutes } = req.body;
        
        if (!availableMinutes || availableMinutes <= 0) {
            return res.status(400).json({ error: 'Valid available minutes required' });
        }
        
        const tasks = await loadTasks();
        const recommendations = getRecommendations(availableMinutes, tasks);
        
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

// Initialize with sample data if no tasks exist
const initializeSampleData = async () => {
    const tasks = await loadTasks();
    
    if (tasks.length === 0) {
        const sampleTasks = [
            {
                id: Date.now() + 1,
                title: 'Review project requirements',
                duration: 15,
                priority: 'high',
                dependencies: [],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                title: 'Set up development environment',
                duration: 30,
                priority: 'high',
                dependencies: [],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                title: 'Create wireframes',
                duration: 45,
                priority: 'medium',
                dependencies: [],
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 4,
                title: 'Write documentation',
                duration: 60,
                priority: 'low',
                dependencies: [],
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        
        // Add a task with dependencies
        const task1 = sampleTasks[0];
        const task2 = sampleTasks[1];
        sampleTasks.push({
            id: Date.now() + 5,
            title: 'Start coding',
            duration: 120,
            priority: 'high',
            dependencies: [task1.id, task2.id],
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        await saveTasks(sampleTasks);
        console.log('Sample data initialized');
    }
};

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeSampleData();
});