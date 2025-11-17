const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const Validator = require('./validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Registration endpoint
app.post('/register', (req, res) => {
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

        // Server-side validation
        const errors = Validator.validateAll(data);

        if (errors.length === 0) {
            // Here you would typically save to database
            // For this example, we'll just return success
            
            res.json({
                success: true,
                message: 'Реєстрація успішна! Дані пройшли валідацію.',
                data: {
                    login: data.login,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    birthdate: data.birthdate
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Знайдено помилки у формі:',
                errors: errors
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутрішня помилка сервера'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});