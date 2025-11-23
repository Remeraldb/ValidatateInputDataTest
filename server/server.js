const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const Validator = require('./validation');
const AuthService = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/profile.html'));
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Токен доступу не надано'
        });
    }

    try {
        const decoded = AuthService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }
};

// API Routes - FIXED: Use /api prefix to avoid conflicts
app.post('/api/register', async (req, res) => {
    try {
        const { login, name, email, password, phone, birthdate } = req.body;

        const data = {
            login: (login || '').trim(),
            name: (name || '').trim(),
            email: (email || '').trim(),
            password: password || '',
            phone: (phone || '').trim(),
            birthdate: birthdate || ''
        };

        // Validation
        const errors = Validator.validateAll(data);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Помилки валідації',
                errors: errors
            });
        }

        // Register user
        const user = await AuthService.registerUser(data);
        
        res.json({
            success: true,
            message: 'Користувача успішно зареєстровано'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email та пароль обов\'язкові'
            });
        }

        // Authenticate user
        const user = await AuthService.authenticateUser(email, password);
        
        // Generate token
        const token = AuthService.generateToken(user.id);

        res.json({
            success: true,
            message: 'Успішний вхід',
            token: token,
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
});

// FIXED: Changed to /api/profile to avoid conflict with static file serving
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const user = AuthService.getUserById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Користувача не знайдено'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                email: user.email,
                phone: user.phone,
                birthdate: user.birthdate,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Помилка сервера при завантаженні профілю'
        });
    }
});

app.post('/api/verify-token', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Токен дійсний',
        user: req.user
    });
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('API endpoints:');
    console.log('  POST /api/register');
    console.log('  POST /api/login'); 
    console.log('  GET  /api/profile');
    console.log('  POST /api/verify-token');
});