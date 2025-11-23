class AdminLogsManager {
    constructor() {
        this.logs = [];
        this.initEventListeners();
        this.loadLogs();
        
        // Auto-refresh logs every 30 seconds
        setInterval(() => {
            this.loadLogs();
        }, 30000);
    }
    
    initEventListeners() {
        const refreshBtn = document.getElementById('refreshLogs');
        const exportBtn = document.getElementById('exportLogs');
        const logTypeFilter = document.getElementById('logTypeFilter');
        const severityFilter = document.getElementById('severityFilter');
        const limitFilter = document.getElementById('limitFilter');

        if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadLogs());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportLogs());
        if (logTypeFilter) logTypeFilter.addEventListener('change', () => this.filterLogs());
        if (severityFilter) severityFilter.addEventListener('change', () => this.filterLogs());
        if (limitFilter) limitFilter.addEventListener('change', () => this.loadLogs());
    }
    
    async loadLogs() {
        const token = localStorage.getItem('authToken');
        const limit = document.getElementById('limitFilter') ? document.getElementById('limitFilter').value : 50;
        
        if (!token) {
            this.showError('Будь ласка, увійдіть в систему для перегляду логів');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/logs?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 403) {
                this.showError('Доступ заборонено. Ця функція тільки для адміністраторів.');
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.logs = result.logs;
                this.displayLogs();
                this.updateStats();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Помилка завантаження логів:', error);
            this.showError(`Помилка завантаження логів: ${error.message}`);
        }
    }
    
    displayLogs() {
        const logsList = document.getElementById('logsList');
        if (!logsList) return;
        
        const typeFilter = document.getElementById('logTypeFilter') ? document.getElementById('logTypeFilter').value : 'all';
        const severityFilter = document.getElementById('severityFilter') ? document.getElementById('severityFilter').value : 'all';
        
        const filteredLogs = this.logs.filter(log => {
            const typeMatch = typeFilter === 'all' || log.type === typeFilter;
            const severityMatch = severityFilter === 'all' || log.severity === severityFilter;
            return typeMatch && severityMatch;
        });
        
        if (filteredLogs.length === 0) {
            logsList.innerHTML = '<div class="no-logs"><p>📭 Немає записів, що відповідають фільтрам</p></div>';
            return;
        }
        
        logsList.innerHTML = filteredLogs.map(log => this.createLogEntry(log)).join('');
    }
    
    createLogEntry(log) {
        const isFailed = log.type.includes('FAILED');
        const isSuccess = log.type.includes('SUCCESS');
        
        let className = 'log-entry';
        if (isFailed) className += ' failed';
        if (isSuccess) className += ' success';
        if (log.severity === 'HIGH') className += ' warning';
        
        const timestamp = new Date(log.timestamp).toLocaleString('uk-UA');
        
        return `
            <div class="${className}">
                <div class="log-header">
                    <span class="log-type" style="background: ${this.getTypeColor(log.type)}; color: white;">
                        ${this.getTypeLabel(log.type)}
                    </span>
                    <span class="log-timestamp">${timestamp}</span>
                </div>
                
                ${log.reason ? `<div class="log-reason">${log.reason}</div>` : ''}
                
                <div class="log-details">
                    ${log.email ? `<div><strong>Email:</strong> ${log.email}</div>` : ''}
                    ${log.tokenPreview ? `<div><strong>Токен:</strong> ${log.tokenPreview}</div>` : ''}
                    ${log.severity ? `<div><strong>Важливість:</strong> ${log.severity}</div>` : ''}
                    ${log.clientInfo ? `
                        <div><strong>IP:</strong> ${log.clientInfo.ip}</div>
                        <div><strong>Endpoint:</strong> ${log.clientInfo.endpoint}</div>
                        <div><strong>User Agent:</strong> ${log.clientInfo.userAgent.substring(0, 50)}...</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    getTypeColor(type) {
        const colors = {
            'TOKEN_VALIDATION_FAILED': '#dc3545',
            'TOKEN_VALIDATION_SUCCESS': '#28a745',
            'LOGIN_FAILED': '#fd7e14',
            'LOGIN_SUCCESS': '#20c997'
        };
        return colors[type] || '#6c757d';
    }
    
    getTypeLabel(type) {
        const labels = {
            'TOKEN_VALIDATION_FAILED': 'Невдала валідація токену',
            'TOKEN_VALIDATION_SUCCESS': 'Успішна валідація токену',
            'LOGIN_FAILED': 'Невдалий вхід',
            'LOGIN_SUCCESS': 'Успішний вхід'
        };
        return labels[type] || type;
    }
    
    updateStats() {
        const total = this.logs.length;
        const success = this.logs.filter(log => log.type.includes('SUCCESS')).length;
        const failed = this.logs.filter(log => log.type.includes('FAILED')).length;
        
        const totalEl = document.getElementById('totalLogs');
        const successEl = document.getElementById('successLogs');
        const failedEl = document.getElementById('failedLogs');
        
        if (totalEl) totalEl.textContent = total;
        if (successEl) successEl.textContent = success;
        if (failedEl) failedEl.textContent = failed;
    }
    
    filterLogs() {
        this.displayLogs();
    }
    
    exportLogs() {
        if (this.logs.length === 0) {
            alert('Немає даних для експорту');
            return;
        }
        
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
    
    showError(message) {
        const logsList = document.getElementById('logsList');
        if (logsList) {
            logsList.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Check if user is admin and update UI accordingly
function checkAdminAccess() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Try to decode token to check role
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') {
            const adminWelcome = document.getElementById('adminWelcome');
            if (adminWelcome) {
                adminWelcome.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error decoding token:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    new AdminLogsManager();
    
    // Add token timer for admin page too
    const updateTokenTimer = () => {
        const tokenTimer = document.getElementById('tokenTimer');
        const tokenTimeLeft = document.getElementById('tokenTimeLeft');
        
        if (tokenTimer && tokenTimeLeft) {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const expiry = payload.exp * 1000;
                    const timeLeft = Math.max(0, expiry - Date.now());
                    const secondsLeft = Math.floor(timeLeft / 1000);
                    
                    if (secondsLeft > 0) {
                        tokenTimer.style.display = 'block';
                        tokenTimeLeft.textContent = secondsLeft;
                        
                        if (secondsLeft < 30) {
                            tokenTimer.style.background = '#f8d7da';
                            tokenTimer.style.borderColor = '#f5c6cb';
                            tokenTimer.style.color = '#721c24';
                        }
                    } else {
                        tokenTimer.style.display = 'none';
                        localStorage.removeItem('authToken');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1000);
                    }
                } catch (error) {
                    tokenTimer.style.display = 'none';
                }
            } else {
                tokenTimer.style.display = 'none';
            }
        }
    };
    
    // Update timer every second
    setInterval(updateTokenTimer, 1000);
    updateTokenTimer();
});