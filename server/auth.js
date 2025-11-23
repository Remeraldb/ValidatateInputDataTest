const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = 'your-secret-key-here';
const USERS_FILE = path.join(__dirname, 'users.json');

class AuthService {
    static generateToken(userId) {
        return jwt.sign(
            { userId, timestamp: Date.now() },
            JWT_SECRET,
            { expiresIn: '2m' } // 2 minutes
        );
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            this.logFailedAttempt(token, error.message);
            throw new Error('Недійсний токен');
        }
    }

    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static logFailedAttempt(token, reason) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            token: token ? token.substring(0, 20) + '...' : 'missing',
            reason: reason,
            ip: 'unknown' // In real app, you'd get this from request
        };
        
        console.log('FAILED TOKEN ATTEMPT:', logEntry);
        
        // Optional: write to file
        const logFile = path.join(__dirname, 'auth.log');
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }

    static loadUsers() {
        try {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { users: [] };
        }
    }

    static saveUsers(usersData) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
    }

    static async registerUser(userData) {
        const usersData = this.loadUsers();
        
        // Check if user already exists
        if (usersData.users.find(u => u.email === userData.email)) {
            throw new Error('Користувач з таким email вже існує');
        }

        const hashedPassword = await this.hashPassword(userData.password);
        
        const newUser = {
            id: Date.now().toString(),
            login: userData.login,
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone,
            birthdate: userData.birthdate,
            createdAt: new Date().toISOString()
        };

        usersData.users.push(newUser);
        this.saveUsers(usersData);

        return newUser;
    }

    static async authenticateUser(email, password) {
        const usersData = this.loadUsers();
        const user = usersData.users.find(u => u.email === email);

        if (!user) {
            throw new Error('Користувача не знайдено');
        }

        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Невірний пароль');
        }

        return user;
    }

    static getUserById(userId) {
        const usersData = this.loadUsers();
        return usersData.users.find(u => u.id === userId);
    }
}

module.exports = AuthService;