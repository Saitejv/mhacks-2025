const sql = require('mssql');

// Database configuration
const dbConfig = {
    // For this demo, we'll use a local SQL Server setup
    // In production, this would be environment variables
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'SmartTodo',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
    options: {
        encrypt: false, // For local development
        enableArithAbort: true,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

const initializeDatabase = async () => {
    try {
        // Create connection pool
        pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        
        console.log('Connected to SQL Server');
        
        // Create tables if they don't exist
        await createTables();
        
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error);
        // Fallback to file-based storage if SQL Server is not available
        console.log('Falling back to file-based storage...');
        return null;
    }
};

const createTables = async () => {
    try {
        // Create Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username NVARCHAR(50) UNIQUE NOT NULL,
                email NVARCHAR(100) UNIQUE NOT NULL,
                password NVARCHAR(255) NOT NULL,
                createdAt DATETIME DEFAULT GETDATE()
            )
        `);

        // Create Tasks table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' AND xtype='U')
            CREATE TABLE Tasks (
                id INT IDENTITY(1,1) PRIMARY KEY,
                userId INT NOT NULL,
                title NVARCHAR(255) NOT NULL,
                duration INT NOT NULL,
                priority NVARCHAR(20) NOT NULL,
                dependencies NVARCHAR(MAX), -- JSON string
                completed BIT DEFAULT 0,
                createdAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        console.log('Database tables created/verified');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
};

const getPool = () => {
    return pool && pool.connected ? pool : null;
};

const closeDatabase = async () => {
    if (pool) {
        await pool.close();
    }
};

module.exports = {
    initializeDatabase,
    getPool,
    closeDatabase,
    dbConfig
};