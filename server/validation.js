class Validator {
    static validateLogin(login) {
        return login.length >= 5;
    }
    
    static validateName(name) {
        return /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ\s]+$/u.test(name);
    }
    
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static validatePassword(password) {
        return password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /\d/.test(password);
    }
    
    static validatePhone(phone) {
        return /^\d+$/.test(phone);
    }
    
    static validateBirthdate(birthdate) {
        if (!birthdate) return true;
        
        const birthDate = new Date(birthdate);
        const now = new Date();
        return birthDate <= now;
    }
    
    static validateAll(data) {
        const errors = [];
        
        if (!this.validateLogin(data.login)) {
            errors.push('Логін повинен містити мінімум 5 символів');
        }
        
        if (!this.validateName(data.name)) {
            errors.push('Ім\'я повинно містити тільки літери');
        }
        
        if (!this.validateEmail(data.email)) {
            errors.push('Введіть коректну email адресу');
        }
        
        if (!this.validatePassword(data.password)) {
            errors.push('Пароль повинен містити мінімум 8 символів, хоча б одну велику літеру та цифру');
        }
        
        if (!this.validatePhone(data.phone)) {
            errors.push('Номер телефону повинен містити тільки цифри');
        }
        
        if (!this.validateBirthdate(data.birthdate)) {
            errors.push('Дата народження не може бути у майбутньому');
        }
        
        return errors;
    }
}

module.exports = Validator;