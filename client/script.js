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
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static decodeToken(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (error) {
            return null;
        }
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

    // Show token info if user is logged in
    if (TokenManager.isLoggedIn()) {
        document.getElementById('tokenInfo').style.display = 'block';
        const tokenData = TokenManager.decodeToken(TokenManager.getToken());
        document.getElementById('tokenData').innerHTML = `
            <p><strong>Токен:</strong> ${TokenManager.getToken().substring(0, 20)}...</p>
            <p><strong>User ID:</strong> ${tokenData.userId}</p>
            <p><strong>Видано:</strong> ${new Date(tokenData.timestamp).toLocaleString()}</p>
            <p><strong>Дійсний до:</strong> ${new Date(tokenData.timestamp + 120000).toLocaleString()}</p>
        `;
    }
}

// Profile page functionality
if (document.getElementById('userProfile')) {
    // Load user profile
    loadUserProfile();

    // Verify token button
    document.getElementById('verifyToken').addEventListener('click', verifyToken);

    // Logout button
    document.getElementById('logout').addEventListener('click', logout);
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

        const response = await fetch('http://localhost:3000/register', {
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

        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            TokenManager.setToken(result.token);
            popupManager.showSuccess(result.message);
            
            // Redirect to profile after 2 seconds
            setTimeout(() => {
                window.location.href = 'profile.html';
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
    
    if (!token) {
        document.getElementById('userProfile').innerHTML = `
            <div class="error-message">
                <p>Ви не авторизовані. Будь ласка, <a href="login.html">увійдіть</a> в систему.</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('userProfile').innerHTML = `
                <div class="profile-card">
                    <h3>Інформація про користувача</h3>
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
                        <span>${result.user.phone}</span>
                    </div>
                    <div class="profile-field">
                        <label>Дата народження:</label>
                        <span>${new Date(result.user.birthdate).toLocaleDateString()}</span>
                    </div>
                    <div class="profile-field">
                        <label>Дата реєстрації:</label>
                        <span>${new Date(result.user.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            `;
        } else {
            popupManager.showError(result.message);
            TokenManager.removeToken();
        }
    } catch (error) {
        popupManager.showError('Помилка завантаження профілю');
    }
}

async function verifyToken() {
    const token = TokenManager.getToken();
    
    if (!token) {
        popupManager.showError('Токен не знайдено');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/verify-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('tokenStatus').style.display = 'block';
            const tokenData = TokenManager.decodeToken(token);
            document.getElementById('tokenData').innerHTML = `
                <p><strong>Статус:</strong> Дійсний</p>
                <p><strong>User ID:</strong> ${result.user.userId}</p>
                <p><strong>Видано:</strong> ${new Date(tokenData.timestamp).toLocaleString()}</p>
                <p><strong>Дійсний до:</strong> ${new Date(tokenData.timestamp + 120000).toLocaleString()}</p>
                <p><strong>Залишилось:</strong> ${Math.max(0, Math.floor((tokenData.timestamp + 120000 - Date.now()) / 1000))} секунд</p>
            `;
        } else {
            popupManager.showError(result.message);
        }
    } catch (error) {
        popupManager.showError('Помилка перевірки токена');
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