const sql = require('mssql');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const path = require('path');
const { getPool } = require('./database');

// File-based storage paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');

class DataService {
    constructor() {
        this.useDatabase = false;
        this.pool = null;
    }

    async initialize() {
        try {
            this.pool = getPool();
            this.useDatabase = this.pool !== null && this.pool.connected;
            if (!this.useDatabase && this.pool) {
                // Pool exists but not connected, don't use it
                this.pool = null;
            }
        } catch (error) {
            console.log('Database not available, using file storage');
            this.useDatabase = false;
            this.pool = null;
        }

        if (!this.useDatabase) {
            // Ensure data directory exists for file storage
            fs.ensureDirSync(path.dirname(USERS_FILE));
            fs.ensureDirSync(path.dirname(TASKS_FILE));
        }
    }

    // User methods
    async createUser(username, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (this.useDatabase) {
            const request = this.pool.request();
            const result = await request
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('password', sql.NVarChar, hashedPassword)
                .query('INSERT INTO Users (username, email, password) OUTPUT INSERTED.* VALUES (@username, @email, @password)');
            
            return result.recordset[0];
        } else {
            // File-based storage
            const users = await this.loadUsersFromFile();
            const newUser = {
                id: Date.now(),
                username,
                email,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            await this.saveUsersToFile(users);
            return newUser;
        }
    }

    async getUserByUsername(username) {
        if (this.useDatabase) {
            const request = this.pool.request();
            const result = await request
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM Users WHERE username = @username');
            
            return result.recordset[0];
        } else {
            const users = await this.loadUsersFromFile();
            return users.find(user => user.username === username);
        }
    }

    async getUserByEmail(email) {
        if (this.useDatabase) {
            const request = this.pool.request();
            const result = await request
                .input('email', sql.NVarChar, email)
                .query('SELECT * FROM Users WHERE email = @email');
            
            return result.recordset[0];
        } else {
            const users = await this.loadUsersFromFile();
            return users.find(user => user.email === email);
        }
    }

    async getUserById(id) {
        if (this.useDatabase) {
            const request = this.pool.request();
            const result = await request
                .input('id', sql.Int, id)
                .query('SELECT * FROM Users WHERE id = @id');
            
            return result.recordset[0];
        } else {
            const users = await this.loadUsersFromFile();
            return users.find(user => user.id === parseInt(id));
        }
    }

    async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Task methods
    async getUserTasks(userId) {
        if (this.useDatabase) {
            const request = this.pool.request();
            const result = await request
                .input('userId', sql.Int, userId)
                .query('SELECT * FROM Tasks WHERE userId = @userId ORDER BY createdAt DESC');
            
            return result.recordset.map(task => ({
                ...task,
                dependencies: task.dependencies ? JSON.parse(task.dependencies) : []
            }));
        } else {
            const tasks = await this.loadTasksFromFile();
            return tasks.filter(task => task.userId === parseInt(userId));
        }
    }

    async createTask(userId, taskData) {
        const { title, duration, priority, dependencies = [] } = taskData;

        if (this.useDatabase) {
            const request = this.pool.request();
            const result = await request
                .input('userId', sql.Int, userId)
                .input('title', sql.NVarChar, title)
                .input('duration', sql.Int, duration)
                .input('priority', sql.NVarChar, priority)
                .input('dependencies', sql.NVarChar, JSON.stringify(dependencies))
                .query(`INSERT INTO Tasks (userId, title, duration, priority, dependencies) 
                       OUTPUT INSERTED.* VALUES (@userId, @title, @duration, @priority, @dependencies)`);
            
            const task = result.recordset[0];
            return {
                ...task,
                dependencies: task.dependencies ? JSON.parse(task.dependencies) : []
            };
        } else {
            const tasks = await this.loadTasksFromFile();
            const newTask = {
                id: Date.now() + Math.random(),
                userId: parseInt(userId),
                title: title.trim(),
                duration: parseInt(duration),
                priority,
                dependencies,
                completed: false,
                createdAt: new Date().toISOString()
            };
            tasks.push(newTask);
            await this.saveTasksToFile(tasks);
            return newTask;
        }
    }

    async updateTask(userId, taskId, updates) {
        if (this.useDatabase) {
            const request = this.pool.request();
            
            // Build dynamic query based on updates
            const setParts = [];
            if (updates.title !== undefined) {
                request.input('title', sql.NVarChar, updates.title);
                setParts.push('title = @title');
            }
            if (updates.duration !== undefined) {
                request.input('duration', sql.Int, updates.duration);
                setParts.push('duration = @duration');
            }
            if (updates.priority !== undefined) {
                request.input('priority', sql.NVarChar, updates.priority);
                setParts.push('priority = @priority');
            }
            if (updates.dependencies !== undefined) {
                request.input('dependencies', sql.NVarChar, JSON.stringify(updates.dependencies));
                setParts.push('dependencies = @dependencies');
            }
            if (updates.completed !== undefined) {
                request.input('completed', sql.Bit, updates.completed);
                setParts.push('completed = @completed');
            }

            request.input('taskId', sql.Int, taskId);
            request.input('userId', sql.Int, userId);

            const query = `UPDATE Tasks SET ${setParts.join(', ')} 
                          OUTPUT INSERTED.* 
                          WHERE id = @taskId AND userId = @userId`;
            
            const result = await request.query(query);
            
            if (result.recordset.length === 0) {
                throw new Error('Task not found or access denied');
            }

            const task = result.recordset[0];
            return {
                ...task,
                dependencies: task.dependencies ? JSON.parse(task.dependencies) : []
            };
        } else {
            const tasks = await this.loadTasksFromFile();
            const taskIndex = tasks.findIndex(t => t.id == taskId && t.userId === parseInt(userId));
            
            if (taskIndex === -1) {
                throw new Error('Task not found or access denied');
            }

            tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
            await this.saveTasksToFile(tasks);
            return tasks[taskIndex];
        }
    }

    async deleteTask(userId, taskId) {
        if (this.useDatabase) {
            const request = this.pool.request();
            const result = await request
                .input('taskId', sql.Int, taskId)
                .input('userId', sql.Int, userId)
                .query('DELETE FROM Tasks WHERE id = @taskId AND userId = @userId');
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Task not found or access denied');
            }
        } else {
            const tasks = await this.loadTasksFromFile();
            const filteredTasks = tasks.filter(t => !(t.id == taskId && t.userId === parseInt(userId)));
            
            if (filteredTasks.length === tasks.length) {
                throw new Error('Task not found or access denied');
            }

            // Remove dependencies on this task
            filteredTasks.forEach(task => {
                if (task.dependencies) {
                    task.dependencies = task.dependencies.filter(depId => depId != taskId);
                }
            });

            await this.saveTasksToFile(filteredTasks);
        }
    }

    // File storage helpers
    async loadUsersFromFile() {
        try {
            if (await fs.pathExists(USERS_FILE)) {
                return await fs.readJson(USERS_FILE);
            }
            return [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    async saveUsersToFile(users) {
        try {
            await fs.writeJson(USERS_FILE, users, { spaces: 2 });
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    async loadTasksFromFile() {
        try {
            if (await fs.pathExists(TASKS_FILE)) {
                return await fs.readJson(TASKS_FILE);
            }
            return [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    async saveTasksToFile(tasks) {
        try {
            await fs.writeJson(TASKS_FILE, tasks, { spaces: 2 });
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }
}

module.exports = new DataService();