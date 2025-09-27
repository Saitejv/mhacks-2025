const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001; // Changed port to 8001
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');

const argon2 = require('argon2');
const User = require('./models/User');
const Task= require('./models/Task');
const session = require('express-session');

const SESSION_MAX_AGE = 60 * 60 * 1000

let sessionConfig = {
    name: 'sessionId',
    secret: "maanas is gay",
    cookie: {
        maxAge: SESSION_MAX_AGE,
        secure: process.env.RENDER ? true : false,
        httpOnly: false,
    },
    resave: false,
    saveUninitialized: false,
    rolling: true,
}

const cors_options = {
    origin: "localhost:3000",
    credentials: true,
}

// Middleware
app.use(cors(cors_options));
app.use(bodyParser.json());
app.use(session(sessionConfig));
app.set('trust proxy', 1);

// Register route
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        const hashedPassword = await argon2.hash(password);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        // Set session
        req.session.userId = user.username;
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Set session
        req.session.userId = user.username;
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie(sessionConfig.name);
        res.json({ message: 'Logout successful' });
    });
});

// Route to check if a user is logged in
app.get('/api/current-user', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ loggedIn: true, username: req.session.userId });
    } else {
        res.json({ loggedIn: false });
    }
});

const Task = require('./models/Task');

const isTaskBlocked = (task, allTasks) => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return task.dependencies.some(depId => {
        const dependency = allTasks.find(t => t._id.toString() === depId.toString());
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
    const priorityScores = { high: 10, medium: 5, low: 1 };
    const scoredTasks = eligibleTasks.map(task => {
        let score = 0;
        score += priorityScores[task.priority] || 1;
        const timeUtilization = task.duration / availableMinutes;
        score += timeUtilization * 5;
        const daysSinceCreated = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        score += Math.min(daysSinceCreated * 0.1, 2);
        return { task, score };
    });

    scoredTasks.sort((a, b) => b.score - a.score);

    return {
        recommended: scoredTasks[0]?.task || null,
        alternatives: scoredTasks.slice(1, 4).map(item => item.task)
    };
};

// Helper to load tasks from MongoDB model instead of JSON
const loadTasks = async () => {
    return await Task.find({});
};

// Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({});
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

        const newTask = new Task({
            title: title.trim(),
            duration: parseInt(duration),
            priority,
            dependencies,
            completed: false,
            createdAt: new Date().toISOString()
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const updates = req.body;

        const updatedTask = await Task.findByIdAndUpdate(taskId, updates, { new: true });
        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const deletedTask = await Task.findByIdAndDelete(taskId);
        if (!deletedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Remove this task from other tasks' dependencies
        await Task.updateMany(
            { dependencies: taskId },
            { $pull: { dependencies: taskId } }
        );
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

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeSampleData();
});