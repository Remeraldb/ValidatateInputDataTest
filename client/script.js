class PopupManager {
    constructor() {
        this.errorPopup = document.getElementById('errorPopup');
        this.successPopup = document.getElementById('successPopup');
        this.popupMessage = document.getElementById('popupMessage');
        this.successMessage = document.getElementById('successMessage');
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Error popup
        if (document.getElementById('closePopup')) {
            document.getElementById('closePopup').addEventListener('click', () => this.hideError());
        }
        if (document.getElementById('confirmError')) {
            document.getElementById('confirmError').addEventListener('click', () => this.hideError());
        }
        
        // Success popup
        if (document.getElementById('closeSuccessPopup')) {
            document.getElementById('closeSuccessPopup').addEventListener('click', () => this.hideSuccess());
        }
        if (document.getElementById('confirmSuccess')) {
            document.getElementById('confirmSuccess').addEventListener('click', () => this.hideSuccess());
        }
        
        // Close popup when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.errorPopup) this.hideError();
            if (e.target === this.successPopup) this.hideSuccess();
        });
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideError();
                this.hideSuccess();
            }
        });
    }
    
    showError(message, errors = []) {
        if (errors.length > 0) {
            this.popupMessage.innerHTML = `
                <div class="error-list">
                    <p><strong>${message}</strong></p>
                    <ul>
                        ${errors.map(error => `<li>• ${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            this.popupMessage.textContent = message;
        }
        this.errorPopup.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successPopup.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    hideError() {
        this.errorPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    hideSuccess() {
        this.successPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Initialize popup manager
const popupManager = new PopupManager();

// Token management
class TokenManager {
    static getToken() {
        return localStorage.getItem('authToken');
    }

    static setToken(token) {
        localStorage.setItem('authToken', token);
    }

    static removeToken() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
    }

    static isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;
        
        // Check if token is expired
        const tokenData = this.decodeToken(token);
        if (!tokenData || !tokenData.exp) return false;
        
        // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
        return tokenData.exp * 1000 > Date.now();
    }

    static decodeToken(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (error) {
            return null;
        }
    }

    static getTokenExpiry() {
        const token = this.getToken();
        if (!token) return null;
        
        const tokenData = this.decodeToken(token);
        return tokenData ? tokenData.exp * 1000 : null;
    }

    static getTimeUntilExpiry() {
        const expiry = this.getTokenExpiry();
        if (!expiry) return 0;
        return Math.max(0, expiry - Date.now());
    }

    static isAdmin() {
        const token = this.getToken();
        if (!token) return false;
        
        const tokenData = this.decodeToken(token);
        return tokenData && tokenData.role === 'admin';
    }
}

// Registration form handling
if (document.getElementById('registrationForm')) {
    document.getElementById('registrationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const validationResult = validateForm();
        
        if (validationResult.isValid) {
            await submitRegistration();
        } else {
            popupManager.showError('Будь ласка, виправте наступні помилки:', validationResult.errors);
            highlightErrorFields(validationResult.fieldErrors);
        }
    });
}

// Login form handling
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitLogin();
    });

    // Only show token info if user is actually logged in with valid token
    if (TokenManager.isLoggedIn()) {
        document.getElementById('tokenInfo').style.display = 'block';
        const tokenData = TokenManager.decodeToken(TokenManager.getToken());
        const timeLeft = TokenManager.getTimeUntilExpiry();
        
        document.getElementById('tokenData').innerHTML = `
            <p><strong>Токен:</strong> ${TokenManager.getToken().substring(0, 20)}...</p>
            <p><strong>User ID:</strong> ${tokenData.userId}</p>
            <p><strong>Видано:</strong> ${new Date(tokenData.iat * 1000).toLocaleString()}</p>
            <p><strong>Дійсний до:</strong> ${new Date(tokenData.exp * 1000).toLocaleString()}</p>
            <p><strong>Залишилось:</strong> ${Math.floor(timeLeft / 1000)} секунд</p>
        `;
    } else {
        // Remove expired token
        TokenManager.removeToken();
        document.getElementById('tokenInfo').style.display = 'none';
    }
}

// Profile page functionality
if (document.getElementById('userProfile')) {
    // Load user profile when page loads
    document.addEventListener('DOMContentLoaded', function() {
        loadUserProfile();
    });

    // Verify token button
    if (document.getElementById('verifyToken')) {
        document.getElementById('verifyToken').addEventListener('click', verifyToken);
    }

    // Refresh page button
    if (document.getElementById('refreshPage')) {
        document.getElementById('refreshPage').addEventListener('click', function() {
            location.reload();
        });
    }

    // Logout button
    if (document.getElementById('logout')) {
        document.getElementById('logout').addEventListener('click', logout);
    }

    // Update token timer every second
    setInterval(updateTokenTimer, 1000);
}

// Update token timer display
function updateTokenTimer() {
    const tokenTimer = document.getElementById('tokenTimer');
    const tokenTimeLeft = document.getElementById('tokenTimeLeft');
    
    if (tokenTimer && tokenTimeLeft && TokenManager.isLoggedIn()) {
        const timeLeft = TokenManager.getTimeUntilExpiry();
        const secondsLeft = Math.floor(timeLeft / 1000);
        
        if (secondsLeft > 0) {
            tokenTimer.style.display = 'block';
            tokenTimeLeft.textContent = secondsLeft;
            
            // Change color when less than 30 seconds
            if (secondsLeft < 30) {
                tokenTimer.style.background = '#f8d7da';
                tokenTimer.style.borderColor = '#f5c6cb';
                tokenTimer.style.color = '#721c24';
            } else {
                tokenTimer.style.background = '#fff3cd';
                tokenTimer.style.borderColor = '#ffeaa7';
                tokenTimer.style.color = '#856404';
            }
        } else {
            tokenTimer.style.display = 'none';
            TokenManager.removeToken();
            // Reload to show login prompt
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    } else {
        if (tokenTimer) tokenTimer.style.display = 'none';
    }
}

// Registration functions
function validateForm() {
    let isValid = true;
    const errors = [];
    const fieldErrors = {};
    
    // Clear previous errors
    document.querySelectorAll('.error').forEach(error => error.textContent = '');
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('error-field', 'field-error');
    });
    
    // Login validation
    const login = document.getElementById('login').value;
    if (login.length < 5) {
        errors.push('Логін повинен містити мінімум 5 символів');
        fieldErrors.login = 'Логін повинен містити мінімум 5 символів';
        showError('loginError', 'Логін повинен містити мінімум 5 символів');
        isValid = false;
    }
    
    // Name validation
    const name = document.getElementById('name').value;
    if (!/^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ\s]+$/.test(name)) {
        errors.push('Ім\'я повинно містити тільки літери');
        fieldErrors.name = 'Ім\'я повинно містити тільки літери';
        showError('nameError', 'Ім\'я повинно містити тільки літери');
        isValid = false;
    }
    
    // Email validation
    const email = document.getElementById('email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Введіть коректну email адресу');
        fieldErrors.email = 'Введіть коректну email адресу';
        showError('emailError', 'Введіть коректну email адресу');
        isValid = false;
    }
    
    // Password validation
    const password = document.getElementById('password').value;
    if (password.length < 8) {
        errors.push('Пароль повинен містити мінімум 8 символів');
        fieldErrors.password = 'Пароль повинен містити мінімум 8 символів';
        showError('passwordError', 'Пароль повинен містити мінімум 8 символів');
        isValid = false;
    } else if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.push('Пароль повинен містити хоча б одну велику літеру та цифру');
        fieldErrors.password = 'Пароль повинен містити хоча б одну велику літеру та цифру';
        showError('passwordError', 'Пароль повинен містити хоча б одну велику літеру та цифру');
        isValid = false;
    }
    
    // Phone validation
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^(\+?38)?(0\d{9})$/;
    const cleanPhone = phone.replace(/\s+/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
        errors.push('Номер телефону повинен бути у форматі: +380XXXXXXXXX або 0XXXXXXXXX');
        fieldErrors.phone = 'Номер телефону повинен бути у форматі: +380XXXXXXXXX або 0XXXXXXXXX';
        showError('phoneError', 'Номер телефону повинен бути у форматі: +380XXXXXXXXX або 0XXXXXXXXX');
        isValid = false;
    }
    
    // Birthdate validation
    const birthdate = document.getElementById('birthdate').value;
    const birthDate = new Date(birthdate);
    const today = new Date();
    if (birthdate && birthDate > today) {
        errors.push('Дата народження не може бути у майбутньому');
        fieldErrors.birthdate = 'Дата народження не може бути у майбутньому';
        showError('birthdateError', 'Дата народження не може бути у майбутньому');
        isValid = false;
    }
    
    return {
        isValid,
        errors,
        fieldErrors
    };
}

async function submitRegistration() {
    const formData = {
        login: document.getElementById('login').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
        birthdate: document.getElementById('birthdate').value
    };

    try {
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Обробка...';
        submitBtn.disabled = true;

        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            popupManager.showSuccess(result.message);
            document.getElementById('registrationForm').reset();
            
            document.querySelectorAll('.error').forEach(error => error.textContent = '');
            document.querySelectorAll('input').forEach(input => {
                input.classList.remove('error-field', 'field-error');
            });
        } else {
            popupManager.showError(result.message, result.errors || []);
        }
    } catch (error) {
        popupManager.showError('Помилка з\'єднання з сервером. Спробуйте ще раз.');
    } finally {
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Зареєструватися';
        submitBtn.disabled = false;
    }
}

// Login functions
async function submitLogin() {
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Вхід...';
        submitBtn.disabled = true;

        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            TokenManager.setToken(result.token);
            // Store user info for admin checks
            if (result.user.role) {
                localStorage.setItem('userRole', result.user.role);
            }
            localStorage.setItem('userEmail', result.user.email);
            
            popupManager.showSuccess('Успішний вхід! Перенаправлення...');
            
            // Redirect to appropriate page based on role
            setTimeout(() => {
                if (result.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'profile.html';
                }
            }, 2000);
        } else {
            popupManager.showError(result.message);
        }
    } catch (error) {
        popupManager.showError('Помилка з\'єднання з сервером. Спробуйте ще раз.');
    } finally {
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Увійти';
        submitBtn.disabled = false;
    }
}

// Profile functions
async function loadUserProfile() {
    const token = TokenManager.getToken();
    
    if (!token || !TokenManager.isLoggedIn()) {
        document.getElementById('userProfile').innerHTML = `
            <div class="error-message">
                <p>Ви не авторизовані або токен закінчився. Будь ласка, <a href="login.html">увійдіть</a> в систему.</p>
            </div>
        `;
        return;
    }

    try {
        console.log('Loading profile with token:', token.substring(0, 20) + '...');
        
        const response = await fetch('http://localhost:3000/api/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Profile response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Profile result:', result);
        
        if (result.success) {
            document.getElementById('userProfile').innerHTML = `
                <div class="profile-card">
                    <h3>Інформація про користувача</h3>
                    <div class="profile-field">
                        <label>ID:</label>
                        <span>${result.user.id}</span>
                    </div>
                    <div class="profile-field">
                        <label>Логін:</label>
                        <span>${result.user.login}</span>
                    </div>
                    <div class="profile-field">
                        <label>Ім'я:</label>
                        <span>${result.user.name}</span>
                    </div>
                    <div class="profile-field">
                        <label>Email:</label>
                        <span>${result.user.email}</span>
                    </div>
                    <div class="profile-field">
                        <label>Телефон:</label>
                        <span>${result.user.phone || 'Не вказано'}</span>
                    </div>
                    <div class="profile-field">
                        <label>Дата народження:</label>
                        <span>${result.user.birthdate ? new Date(result.user.birthdate).toLocaleDateString('uk-UA') : 'Не вказано'}</span>
                    </div>
                    <div class="profile-field">
                        <label>Дата реєстрації:</label>
                        <span>${new Date(result.user.createdAt).toLocaleString('uk-UA')}</span>
                    </div>
                    <div class="profile-field">
                        <label>Роль:</label>
                        <span>${result.user.role === 'admin' ? '👑 Адміністратор' : '👤 Користувач'}</span>
                    </div>
                </div>
            `;
            
            // Show admin link if user is admin
            if (result.user.role === 'admin') {
                const navigationSection = document.querySelector('.navigation-section');
                if (navigationSection) {
                    const adminLink = document.createElement('div');
                    adminLink.className = 'admin-link';
                    adminLink.innerHTML = `<a href="admin.html" style="color: #dc3545; font-weight: bold;">👑 Адмін панель</a>`;
                    navigationSection.prepend(adminLink);
                }
            }
        } else {
            throw new Error(result.message || 'Помилка завантаження профілю');
        }
    } catch (error) {
        console.error('Profile loading error:', error);
        document.getElementById('userProfile').innerHTML = `
            <div class="error-message">
                <p>Помилка завантаження профілю: ${error.message}</p>
                <p>Спробуйте оновити сторінку або увійти знову.</p>
            </div>
        `;
        
        // If it's an authentication error, remove token
        if (error.message.includes('401') || error.message.includes('403')) {
            TokenManager.removeToken();
        }
    }
}

async function verifyToken() {
    const token = TokenManager.getToken();
    
    if (!token || !TokenManager.isLoggedIn()) {
        popupManager.showError('Токен не знайдено або закінчився');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/verify-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('tokenStatus').style.display = 'block';
            const tokenData = TokenManager.decodeToken(token);
            const timeLeft = TokenManager.getTimeUntilExpiry();
            
            document.getElementById('tokenData').innerHTML = `
                <p><strong>Статус:</strong> <span style="color: green;">Дійсний</span></p>
                <p><strong>User ID:</strong> ${result.user.userId}</p>
                <p><strong>Видано:</strong> ${new Date(tokenData.iat * 1000).toLocaleString('uk-UA')}</p>
                <p><strong>Дійсний до:</strong> ${new Date(tokenData.exp * 1000).toLocaleString('uk-UA')}</p>
                <p><strong>Залишилось:</strong> ${Math.floor(timeLeft / 1000)} секунд</p>
            `;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        popupManager.showError('Помилка перевірки токена: ' + error.message);
        TokenManager.removeToken();
    }
}

function logout() {
    TokenManager.removeToken();
    window.location.href = 'login.html';
}

// Utility functions
function highlightErrorFields(fieldErrors) {
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('field-error');
    });
    
    Object.keys(fieldErrors).forEach(fieldName => {
        const input = document.getElementById(fieldName);
        if (input) {
            input.classList.add('field-error');
            if (Object.keys(fieldErrors)[0] === fieldName) {
                input.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    });
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
    
    const inputId = elementId.replace('Error', '');
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.classList.add('error-field');
    }
}

// Phone input formatting
if (document.getElementById('phone')) {
    document.getElementById('phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('38') && value.length > 2) {
            value = '+' + value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6, 9) + ' ' + value.substring(9, 12);
        } else if (value.startsWith('0') && value.length > 1) {
            value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6, 9) + ' ' + value.substring(9, 12);
        }
        
        e.target.value = value;
    });
}