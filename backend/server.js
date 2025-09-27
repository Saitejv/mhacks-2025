const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

// Import new modules
const { initializeDatabase } = require('./database');
const { authenticateToken, generateToken } = require('./auth');
const dataService = require('./dataService');

const app = express();
const PORT = process.env.PORT || 8001; // Changed port to 8001
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database and data service
const initializeServices = async () => {
    await initializeDatabase();
    await dataService.initialize();
};

// Authentication Routes

// User registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await dataService.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const existingEmail = await dataService.getUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Create user
        const user = await dataService.createUser(username, email, password);
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// User login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const user = await dataService.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isValidPassword = await dataService.validatePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Get current user info (protected)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await dataService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

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

// Get all tasks for the authenticated user
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await dataService.getUserTasks(req.user.id);
        res.json(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        res.status(500).json({ error: 'Failed to load tasks' });
    }
});

// Create a new task for the authenticated user
app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { title, duration, priority, dependencies = [] } = req.body;
        
        if (!title || !duration || !priority) {
            return res.status(400).json({ error: 'Title, duration, and priority are required' });
        }

        const newTask = await dataService.createTask(req.user.id, {
            title,
            duration,
            priority,
            dependencies
        });

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update a task for the authenticated user
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const updates = req.body;
        
        const updatedTask = await dataService.updateTask(req.user.id, taskId, updates);
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        if (error.message === 'Task not found or access denied') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update task' });
        }
    }
});

// Delete a task for the authenticated user
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        
        await dataService.deleteTask(req.user.id, taskId);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        if (error.message === 'Task not found or access denied') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    }
});

// Get recommendations for the authenticated user
app.post('/api/recommendations', authenticateToken, async (req, res) => {
    try {
        const { availableMinutes } = req.body;
        
        if (!availableMinutes || availableMinutes <= 0) {
            return res.status(400).json({ error: 'Valid available minutes required' });
        }
        
        const tasks = await dataService.getUserTasks(req.user.id);
        const recommendations = getRecommendations(availableMinutes, tasks);
        
        res.json(recommendations);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeServices();
    console.log('Services initialized');
});