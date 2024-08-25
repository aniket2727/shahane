const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

const JWT_SECRET = 'your_jwt_secret'; // Replace with your own secret key

// Configure PostgreSQL client
const pool = new Pool({
    user: 'your_username', // Replace with your PostgreSQL username
    host: 'localhost',
    database: 'task_management', // Replace with your database name
    password: 'your_password', // Replace with your PostgreSQL password
    port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

// Create tables if they don't exist
const createTables = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    priority VARCHAR(50),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id) ON DELETE CASCADE
);
`;

pool.query(createTables)
    .then(() => console.log('Users and Tasks tables created or already exist'))
    .catch(err => console.error('Error creating tables', err));

// Register User
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Check if the username already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Failed to register user.' });
    }
});

// Login User and Generate JWT
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Check if the user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = userCheck.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Compare the password with the hashed password in the database
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ message: 'Login successful!', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Failed to log in.' });
    }
});

// Middleware to Verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// Add Task (Protected Route)
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, description, status, priority, dueDate } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, description, status, priority, due_date, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, status, priority, dueDate, userId]
        );
        res.json({ message: 'Task added successfully!', task: result.rows[0] });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Failed to add task.' });
    }
});

// Delete Task (Protected Route)
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
        if (result.rowCount > 0) {
            res.json({ message: 'Task deleted successfully!' });
        } else {
            res.status(404).json({ message: 'Task not found or you do not have permission to delete it.' });
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Failed to delete task.' });
    }
});

// Update Task (Protected Route)
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `UPDATE tasks
            SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND user_id = $7 RETURNING *`,
            [title, description, status, priority, dueDate, id, userId]
        );
        if (result.rowCount > 0) {
            res.json({ message: 'Task updated successfully!', task: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Task not found or you do not have permission to update it.' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Failed to update task.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
