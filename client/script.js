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
        document.getElementById('closePopup').addEventListener('click', () => this.hideError());
        document.getElementById('confirmError').addEventListener('click', () => this.hideError());
        
        // Success popup
        document.getElementById('closeSuccessPopup').addEventListener('click', () => this.hideSuccess());
        document.getElementById('confirmSuccess').addEventListener('click', () => this.hideSuccess());
        
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

// Form handling
document.getElementById('registrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const validationResult = validateForm();
    
    if (validationResult.isValid) {
        await submitForm();
    } else {
        // Show popup with all errors ONLY when register button is pressed
        popupManager.showError(
            'Будь ласка, виправте наступні помилки:', 
            validationResult.errors
        );
        
        // Highlight problematic fields
        highlightErrorFields(validationResult.fieldErrors);
    }
});

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
    if (!/^\d+$/.test(phone)) {
        errors.push('Номер телефону повинен містити тільки цифри');
        fieldErrors.phone = 'Номер телефону повинен містити тільки цифри';
        showError('phoneError', 'Номер телефону повинен містити тільки цифри');
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

function highlightErrorFields(fieldErrors) {
    // Remove previous highlights
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('field-error');
    });
    
    // Add highlights to problematic fields
    Object.keys(fieldErrors).forEach(fieldName => {
        const input = document.getElementById(fieldName);
        if (input) {
            input.classList.add('field-error');
            
            // Scroll to the first error field
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
    errorElement.textContent = message;
    
    const inputId = elementId.replace('Error', '');
    document.getElementById(inputId).classList.add('error-field');
}

async function submitForm() {
    const formData = {
        login: document.getElementById('login').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
        birthdate: document.getElementById('birthdate').value
    };

    try {
        // Show loading state
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
            
            // Clear all errors on success
            document.querySelectorAll('.error').forEach(error => error.textContent = '');
            document.querySelectorAll('input').forEach(input => {
                input.classList.remove('error-field', 'field-error');
            });
        } else {
            popupManager.showError(
                result.message,
                result.errors || []
            );
        }
    } catch (error) {
        popupManager.showError('Помилка з\'єднання з сервером. Спробуйте ще раз.');
    } finally {
        // Reset button state
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Зареєструватися';
        submitBtn.disabled = false;
    }
}

// Real-time validation WITHOUT popups - only inline errors
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', function() {
        validateSingleField(this.id);
    });
    
    // Clear error when user starts typing
    input.addEventListener('input', function() {
        const errorElement = document.getElementById(this.id + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
        }
        this.classList.remove('error-field', 'field-error');
    });
});

function validateSingleField(fieldId) {
    const value = document.getElementById(fieldId).value;
    const errorElement = document.getElementById(fieldId + 'Error');
    
    // Clear previous error
    if (errorElement) {
        errorElement.textContent = '';
    }
    document.getElementById(fieldId).classList.remove('error-field');
    
    switch(fieldId) {
        case 'login':
            if (value.length > 0 && value.length < 5) {
                showError('loginError', 'Логін повинен містити мінімум 5 символів');
                return false;
            }
            break;
            
        case 'name':
            if (value.length > 0 && !/^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ\s]+$/.test(value)) {
                showError('nameError', 'Ім\'я повинно містити тільки літери');
                return false;
            }
            break;
            
        case 'email':
            if (value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                showError('emailError', 'Введіть коректну email адресу');
                return false;
            }
            break;
            
        case 'password':
            if (value.length > 0 && value.length < 8) {
                showError('passwordError', 'Пароль повинен містити мінімум 8 символів');
                return false;
            } else if (value.length >= 8 && !/(?=.*[A-Z])(?=.*\d)/.test(value)) {
                showError('passwordError', 'Пароль повинен містити хоча б одну велику літеру та цифру');
                return false;
            }
            break;
            
        case 'phone':
            if (value.length > 0 && !/^\d+$/.test(value)) {
                showError('phoneError', 'Номер телефону повинен містити тільки цифри');
                return false;
            }
            break;
            
        case 'birthdate':
            if (value) {
                const birthDate = new Date(value);
                const today = new Date();
                if (birthDate > today) {
                    showError('birthdateError', 'Дата народження не може бути у майбутньому');
                    return false;
                }
            }
            break;
    }
    
    return true;
}

// Utility function to clear specific error
function clearError(errorElementId, inputId) {
    const errorElement = document.getElementById(errorElementId);
    const inputElement = document.getElementById(inputId);
    
    if (errorElement) errorElement.textContent = '';
    if (inputElement) inputElement.classList.remove('error-field', 'field-error');
}