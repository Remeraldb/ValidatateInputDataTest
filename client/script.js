document.getElementById('registrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (validateForm()) {
        await submitForm();
    }
});

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
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            showServerResponse(result.message, 'success');
            // Clear form
            document.getElementById('registrationForm').reset();
        } else {
            showServerResponse(result.message + ': ' + result.errors.join(', '), 'error');
        }
    } catch (error) {
        showServerResponse('Помилка з\'єднання з сервером', 'error');
    }
}

function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error').forEach(error => error.textContent = '');
    document.querySelectorAll('input').forEach(input => input.classList.remove('error-field'));
    
    // Login validation
    const login = document.getElementById('login').value;
    if (login.length < 5) {
        showError('loginError', 'Логін повинен містити мінімум 5 символів');
        isValid = false;
    }
    
    // Name validation
    const name = document.getElementById('name').value;
    if (!/^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ\s]+$/.test(name)) {
        showError('nameError', 'Ім\'я повинно містити тільки літери');
        isValid = false;
    }
    
    // Email validation
    const email = document.getElementById('email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('emailError', 'Введіть коректну email адресу');
        isValid = false;
    }
    
    // Password validation
    const password = document.getElementById('password').value;
    if (password.length < 8) {
        showError('passwordError', 'Пароль повинен містити мінімум 8 символів');
        isValid = false;
    } else if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showError('passwordError', 'Пароль повинен містити хоча б одну велику літеру та цифру');
        isValid = false;
    }
    
    // Phone validation
    const phone = document.getElementById('phone').value;
    if (!/^\d+$/.test(phone)) {
        showError('phoneError', 'Номер телефону повинен містити тільки цифри');
        isValid = false;
    }
    
    // Birthdate validation
    const birthdate = document.getElementById('birthdate').value;
    const birthDate = new Date(birthdate);
    const today = new Date();
    if (birthdate && birthDate > today) {
        showError('birthdateError', 'Дата народження не може бути у майбутньому');
        isValid = false;
    }
    
    return isValid;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    
    const inputId = elementId.replace('Error', '');
    document.getElementById(inputId).classList.add('error-field');
}

function showServerResponse(message, type) {
    const responseElement = document.getElementById('serverResponse');
    responseElement.textContent = message;
    responseElement.className = type === 'success' ? 'success' : 'error-response';
}

// Real-time validation
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', function() {
        validateField(this.id);
    });
});

function validateField(fieldId) {
    const value = document.getElementById(fieldId).value;
    
    switch(fieldId) {
        case 'login':
            if (value.length > 0 && value.length < 5) {
                showError('loginError', 'Логін повинен містити мінімум 5 символів');
            } else {
                clearError('loginError', 'login');
            }
            break;
            
        case 'name':
            if (value.length > 0 && !/^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ\s]+$/.test(value)) {
                showError('nameError', 'Ім\'я повинно містити тільки літери');
            } else {
                clearError('nameError', 'name');
            }
            break;
            
        case 'email':
            if (value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                showError('emailError', 'Введіть коректну email адресу');
            } else {
                clearError('emailError', 'email');
            }
            break;
            
        case 'password':
            if (value.length > 0 && value.length < 8) {
                showError('passwordError', 'Пароль повинен містити мінімум 8 символів');
            } else if (value.length >= 8 && !/(?=.*[A-Z])(?=.*\d)/.test(value)) {
                showError('passwordError', 'Пароль повинен містити хоча б одну велику літеру та цифру');
            } else {
                clearError('passwordError', 'password');
            }
            break;
            
        case 'phone':
            if (value.length > 0 && !/^\d+$/.test(value)) {
                showError('phoneError', 'Номер телефону повинен містити тільки цифри');
            } else {
                clearError('phoneError', 'phone');
            }
            break;
            
        case 'birthdate':
            if (value) {
                const birthDate = new Date(value);
                const today = new Date();
                if (birthDate > today) {
                    showError('birthdateError', 'Дата народження не може бути у майбутньому');
                } else {
                    clearError('birthdateError', 'birthdate');
                }
            }
            break;
    }
}

function clearError(errorElementId, inputId) {
    document.getElementById(errorElementId).textContent = '';
    document.getElementById(inputId).classList.remove('error-field');
}