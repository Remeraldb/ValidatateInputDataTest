const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = 'your-secret-key-here';
const USERS_FILE = path.join(__dirname, 'users.json');
const AUTH_LOG_FILE = path.join(__dirname, 'auth.log');

class AuthService {
    static async initialize() {
        // Create admin user if it doesn't exist
        await this.createAdminUser();
    }

    static async createAdminUser() {
        const usersData = this.loadUsers();
        
        // Check if admin user already exists
        const adminExists = usersData.users.find(u => u.email === 'admin@system.com');
        
        if (!adminExists) {
            const hashedPassword = await this.hashPassword('admin123');
            const adminUser = {
                id: 'admin-001',
                login: 'admin',
                name: 'System Administrator',
                email: 'admin@system.com',
                password: hashedPassword,
                phone: '+380000000000',
                birthdate: '2000-01-01',
                role: 'admin',
                createdAt: new Date().toISOString()
            };

            usersData.users.push(adminUser);
            this.saveUsers(usersData);
            console.log('🔐 Admin user created: admin@system.com / admin123');
        }
    }

    static generateToken(userId, role = 'user') {
        return jwt.sign(
            { userId, role, timestamp: Date.now() },
            JWT_SECRET,
            { expiresIn: '2m' }
        );
    }

    static verifyToken(token, clientInfo = {}) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            this.logFailedTokenAttempt(token, error.message, clientInfo);
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

    static logFailedTokenAttempt(token, reason, clientInfo = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'TOKEN_VALIDATION_FAILED',
            tokenPreview: token ? token.substring(0, 20) + '...' : 'missing',
            reason: reason,
            clientInfo: {
                ip: clientInfo.ip || 'unknown',
                userAgent: clientInfo.userAgent || 'unknown',
                endpoint: clientInfo.endpoint || 'unknown'
            },
            severity: this.getSeverityLevel(reason)
        };
        
        console.log('🚨 НЕВДАЛА СПРОБА ВАЛІДАЦІЇ ТОКЕНУ:', logEntry);
        
        // Записуємо в файл логів
        this.writeToAuthLog(logEntry);
    }

    static logSuccessfulTokenValidation(token, clientInfo = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'TOKEN_VALIDATION_SUCCESS',
            tokenPreview: token ? token.substring(0, 20) + '...' : 'unknown',
            clientInfo: {
                ip: clientInfo.ip || 'unknown',
                userAgent: clientInfo.userAgent || 'unknown',
                endpoint: clientInfo.endpoint || 'unknown'
            }
        };
        
        console.log('✅ УСПІШНА ВАЛІДАЦІЯ ТОКЕНУ:', logEntry);
        
        // Записуємо в файл логів
        this.writeToAuthLog(logEntry);
    }

    static logAuthenticationAttempt(email, success, reason = '') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            email: email,
            reason: reason,
            clientInfo: {
                ip: 'unknown',
                userAgent: 'unknown'
            }
        };
        
        console.log(success ? '🔑 УСПІШНИЙ ВХІД' : '❌ НЕВДАЛА СПРОБА ВХОДУ:', logEntry);
        this.writeToAuthLog(logEntry);
    }

    static getSeverityLevel(reason) {
        if (reason.includes('expired')) return 'HIGH';
        if (reason.includes('invalid') || reason.includes('malformed')) return 'MEDIUM';
        return 'LOW';
    }

    static writeToAuthLog(logEntry) {
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(AUTH_LOG_FILE, logLine, 'utf8');
        } catch (error) {
            console.error('Помилка запису в лог:', error);
        }
    }

    static getAuthLogs(limit = 50) {
        try {
            if (!fs.existsSync(AUTH_LOG_FILE)) {
                return [];
            }
            
            const logData = fs.readFileSync(AUTH_LOG_FILE, 'utf8');
            const lines = logData.trim().split('\n').filter(line => line);
            const logs = lines.map(line => JSON.parse(line));
            
            return logs.slice(-limit).reverse(); // Останні записи першими
        } catch (error) {
            console.error('Помилка читання логів:', error);
            return [];
        }
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
            createdAt: new Date().toISOString(),
            role: 'user'
        };

        usersData.users.push(newUser);
        this.saveUsers(usersData);

        return newUser;
    }

    static async authenticateUser(email, password) {
        // Check regular users first
        const usersData = this.loadUsers();
        const user = usersData.users.find(u => u.email === email);

        if (user) {
            const isPasswordValid = await this.comparePassword(password, user.password);
            if (isPasswordValid) {
                this.logAuthenticationAttempt(email, true);
                return user;
            } else {
                this.logAuthenticationAttempt(email, false, 'Невірний пароль');
                throw new Error('Невірний пароль');
            }
        }

        // If no user found
        this.logAuthenticationAttempt(email, false, 'Користувача не знайдено');
        throw new Error('Користувача не знайдено');
    }

    static getUserById(userId) {
        const usersData = this.loadUsers();
        return usersData.users.find(u => u.id === userId);
    }

    static isAdmin(user) {
        return user && user.role === 'admin';
    }
}

// Initialize admin user when module loads
AuthService.initialize().catch(console.error);

module.exports = AuthService;