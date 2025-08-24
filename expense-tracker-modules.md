# Advanced Expense Tracker: Complete Module Implementation

## 1. Storage Module (LocalStorage Integration)

```javascript
const StorageModule = (function() {
    const STORAGE_KEYS = {
        TRANSACTIONS: 'expense_tracker_transactions',
        BUDGET: 'expense_tracker_budget',
        THEME: 'expense_tracker_theme',
        CATEGORIES: 'expense_tracker_categories'
    };

    // Private methods
    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    function loadData(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Load error:', error);
            return defaultValue;
        }
    }

    // Public API
    return {
        saveTransactions(transactions) {
            return saveData(STORAGE_KEYS.TRANSACTIONS, transactions);
        },

        loadTransactions() {
            return loadData(STORAGE_KEYS.TRANSACTIONS, []);
        },

        saveBudget(budget) {
            return saveData(STORAGE_KEYS.BUDGET, budget);
        },

        loadBudget() {
            return loadData(STORAGE_KEYS.BUDGET, { monthly: 2000, categories: {} });
        },

        saveTheme(theme) {
            return saveData(STORAGE_KEYS.THEME, theme);
        },

        loadTheme() {
            return loadData(STORAGE_KEYS.THEME, 'light');
        },

        clearAllData() {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    };
})();
```

## 2. Theme Module (Dark/Light Mode)

```javascript
const ThemeModule = (function() {
    let currentTheme = 'light';
    
    const themes = {
        light: {
            '--primary-bg': '#ffffff',
            '--secondary-bg': '#f8f9fa',
            '--text-primary': '#333333',
            '--text-secondary': '#666666',
            '--border-color': '#e9ecef',
            '--shadow': '0 2px 10px rgba(0,0,0,0.1)'
        },
        dark: {
            '--primary-bg': '#1a1a1a',
            '--secondary-bg': '#2d2d2d',
            '--text-primary': '#ffffff',
            '--text-secondary': '#cccccc',
            '--border-color': '#444444',
            '--shadow': '0 2px 10px rgba(0,0,0,0.3)'
        }
    };

    function applyTheme(themeName) {
        const theme = themes[themeName];
        const root = document.documentElement;
        
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
        
        document.body.classList.toggle('dark-theme', themeName === 'dark');
        currentTheme = themeName;
        StorageModule.saveTheme(themeName);
    }

    function createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.innerHTML = `
            <span class="theme-icon sun">☀️</span>
            <span class="theme-icon moon">🌙</span>
        `;
        
        button.addEventListener('click', () => {
            toggleTheme();
        });
        
        return button;
    }

    function toggleTheme() {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        updateToggleButton();
    }

    function updateToggleButton() {
        const button = document.querySelector('.theme-toggle');
        if (button) {
            button.classList.toggle('dark', currentTheme === 'dark');
        }
    }

    return {
        init() {
            const savedTheme = StorageModule.loadTheme();
            applyTheme(savedTheme);
            
            // Add toggle button to header
            const header = document.querySelector('.header');
            if (header) {
                header.appendChild(createToggleButton());
            }
        },

        toggle: toggleTheme,
        getCurrentTheme: () => currentTheme,
        setTheme: applyTheme
    };
})();
```

## 3. Chart Module (Category-wise Spending)

```javascript
const ChartModule = (function() {
    let chartInstance = null;
    
    function createDonutChart(canvas, data) {
        // Using Chart.js (include via CDN: https://cdn.jsdelivr.net/npm/chart.js)
        const ctx = canvas.getContext('2d');
        
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
        
        return chartInstance;
    }

    function createBarChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Monthly Spending',
                    data: data.values,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        return chartInstance;
    }

    return {
        renderCategoryChart(containerId, transactions) {
            const canvas = document.getElementById(containerId);
            if (!canvas) return;
            
            const categoryData = this.processCategoryData(transactions);
            return createDonutChart(canvas, categoryData);
        },

        renderTrendChart(containerId, transactions) {
            const canvas = document.getElementById(containerId);
            if (!canvas) return;
            
            const trendData = this.processTrendData(transactions);
            return createBarChart(canvas, trendData);
        },

        processCategoryData(transactions) {
            const categoryTotals = {};
            
            transactions
                .filter(t => t.type === 'expense')
                .forEach(transaction => {
                    const category = transaction.category || 'Other';
                    categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
                });
            
            return {
                labels: Object.keys(categoryTotals),
                values: Object.values(categoryTotals)
            };
        },

        processTrendData(transactions) {
            const monthlyTotals = {};
            const currentDate = new Date();
            
            // Get last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                monthlyTotals[monthKey] = 0;
            }
            
            transactions
                .filter(t => t.type === 'expense')
                .forEach(transaction => {
                    const date = new Date(transaction.date);
                    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                    
                    if (monthlyTotals.hasOwnProperty(monthKey)) {
                        monthlyTotals[monthKey] += Math.abs(transaction.amount);
                    }
                });
            
            return {
                labels: Object.keys(monthlyTotals),
                values: Object.values(monthlyTotals)
            };
        }
    };
})();
```

## 4. Filter Module (Advanced Filtering)

```javascript
const FilterModule = (function() {
    let activeFilters = {
        dateRange: null,
        categories: [],
        amountRange: null,
        type: 'all'
    };

    function createFilterUI() {
        return `
            <div class="filter-container">
                <div class="filter-group">
                    <label>Date Range:</label>
                    <input type="date" id="filter-date-from" class="filter-input">
                    <input type="date" id="filter-date-to" class="filter-input">
                </div>
                
                <div class="filter-group">
                    <label>Category:</label>
                    <select id="filter-category" class="filter-input" multiple>
                        <option value="">All Categories</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label>Amount Range:</label>
                    <input type="number" id="filter-amount-min" placeholder="Min" class="filter-input">
                    <input type="number" id="filter-amount-max" placeholder="Max" class="filter-input">
                </div>
                
                <div class="filter-group">
                    <label>Type:</label>
                    <select id="filter-type" class="filter-input">
                        <option value="all">All</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                
                <div class="filter-actions">
                    <button id="apply-filters" class="btn btn-primary">Apply Filters</button>
                    <button id="clear-filters" class="btn btn-secondary">Clear</button>
                </div>
            </div>
        `;
    }

    function applyFilters(transactions) {
        return transactions.filter(transaction => {
            // Date range filter
            if (activeFilters.dateRange) {
                const transactionDate = new Date(transaction.date);
                const { from, to } = activeFilters.dateRange;
                
                if (from && transactionDate < new Date(from)) return false;
                if (to && transactionDate > new Date(to)) return false;
            }
            
            // Category filter
            if (activeFilters.categories.length > 0) {
                if (!activeFilters.categories.includes(transaction.category)) return false;
            }
            
            // Amount range filter
            if (activeFilters.amountRange) {
                const amount = Math.abs(transaction.amount);
                const { min, max } = activeFilters.amountRange;
                
                if (min !== null && amount < min) return false;
                if (max !== null && amount > max) return false;
            }
            
            // Type filter
            if (activeFilters.type !== 'all') {
                if (transaction.type !== activeFilters.type) return false;
            }
            
            return true;
        });
    }

    function bindFilterEvents() {
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            updateActiveFilters();
            const event = new CustomEvent('filtersApplied', { detail: activeFilters });
            document.dispatchEvent(event);
        });

        document.getElementById('clear-filters')?.addEventListener('click', () => {
            clearAllFilters();
            const event = new CustomEvent('filtersCleared');
            document.dispatchEvent(event);
        });
    }

    function updateActiveFilters() {
        const dateFrom = document.getElementById('filter-date-from')?.value;
        const dateTo = document.getElementById('filter-date-to')?.value;
        
        activeFilters = {
            dateRange: (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : null,
            categories: Array.from(document.getElementById('filter-category')?.selectedOptions || [])
                .map(option => option.value).filter(Boolean),
            amountRange: (() => {
                const min = parseFloat(document.getElementById('filter-amount-min')?.value);
                const max = parseFloat(document.getElementById('filter-amount-max')?.value);
                return (min || max) ? { 
                    min: isNaN(min) ? null : min, 
                    max: isNaN(max) ? null : max 
                } : null;
            })(),
            type: document.getElementById('filter-type')?.value || 'all'
        };
    }

    function clearAllFilters() {
        activeFilters = {
            dateRange: null,
            categories: [],
            amountRange: null,
            type: 'all'
        };
        
        // Clear UI
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-amount-min').value = '';
        document.getElementById('filter-amount-max').value = '';
        document.getElementById('filter-type').value = 'all';
    }

    return {
        init(container) {
            container.innerHTML = createFilterUI();
            bindFilterEvents();
        },

        applyToTransactions: applyFilters,
        getActiveFilters: () => ({ ...activeFilters }),
        clearFilters: clearAllFilters
    };
})();
```

## 5. Export Module (CSV/PDF Export)

```javascript
const ExportModule = (function() {
    
    function exportToCSV(transactions, filename = 'expense_tracker_data.csv') {
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(transaction => [
                transaction.date,
                `"${transaction.description.replace(/"/g, '""')}"`,
                transaction.category,
                transaction.type,
                transaction.amount
            ].join(','))
        ].join('\n');
        
        downloadFile(csvContent, filename, 'text/csv');
    }

    function exportToPDF(transactions, filename = 'expense_tracker_report.pdf') {
        // Using jsPDF library (include via CDN)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Expense Tracker Report', 20, 20);
        
        // Add summary
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        doc.setFontSize(12);
        doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 20, 40);
        doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 20, 50);
        doc.text(`Net Balance: $${(totalIncome - totalExpenses).toFixed(2)}`, 20, 60);
        
        // Add transaction table
        const tableData = transactions.map(t => [
            t.date,
            t.description,
            t.category,
            t.type,
            `$${t.amount.toFixed(2)}`
        ]);
        
        doc.autoTable({
            head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
            body: tableData,
            startY: 80,
            styles: { fontSize: 10 }
        });
        
        doc.save(filename);
    }

    function exportToJSON(transactions, filename = 'expense_tracker_backup.json') {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            transactions: transactions,
            budget: StorageModule.loadBudget()
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        downloadFile(jsonContent, filename, 'application/json');
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function createExportButtons() {
        return `
            <div class="export-container">
                <h3>Export Data</h3>
                <div class="export-buttons">
                    <button id="export-csv" class="btn btn-outline">Export CSV</button>
                    <button id="export-pdf" class="btn btn-outline">Export PDF</button>
                    <button id="export-json" class="btn btn-outline">Backup JSON</button>
                </div>
            </div>
        `;
    }

    function bindExportEvents(transactions) {
        document.getElementById('export-csv')?.addEventListener('click', () => {
            exportToCSV(transactions);
            NotificationModule.show('CSV file downloaded successfully!', 'success');
        });

        document.getElementById('export-pdf')?.addEventListener('click', () => {
            exportToPDF(transactions);
            NotificationModule.show('PDF report generated successfully!', 'success');
        });

        document.getElementById('export-json')?.addEventListener('click', () => {
            exportToJSON(transactions);
            NotificationModule.show('Backup file created successfully!', 'success');
        });
    }

    return {
        init(container, transactions) {
            container.innerHTML = createExportButtons();
            bindExportEvents(transactions);
        },

        csv: exportToCSV,
        pdf: exportToPDF,
        json: exportToJSON
    };
})();
```

## 6. Notification Module (Budget Alerts)

```javascript
const NotificationModule = (function() {
    const notifications = [];
    let notificationContainer = null;

    function createNotificationContainer() {
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        return notificationContainer;
    }

    function createNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        
        notification.innerHTML = `
            <div class="notification__icon">
                ${getIcon(type)}
            </div>
            <div class="notification__content">
                <div class="notification__message">${message}</div>
            </div>
            <button class="notification__close" aria-label="Close">×</button>
        `;

        // Add close functionality
        notification.querySelector('.notification__close').addEventListener('click', () => {
            removeNotification(notification);
        });

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    function getIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    function removeNotification(notification) {
        notification.classList.add('notification--removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    function checkBudgetAlerts(currentExpenses, budget) {
        const monthlyLimit = budget.monthly || 2000;
        const percentage = (currentExpenses / monthlyLimit) * 100;

        if (percentage >= 100) {
            show(`Budget exceeded! You've spent $${currentExpenses.toFixed(2)} of $${monthlyLimit.toFixed(2)}`, 'error');
        } else if (percentage >= 80) {
            show(`Budget warning! You've used ${percentage.toFixed(0)}% of your monthly budget`, 'warning');
        } else if (percentage >= 50) {
            show(`Budget checkpoint: ${percentage.toFixed(0)}% of monthly budget used`, 'info');
        }
    }

    function show(message, type = 'info', duration = 5000) {
        const container = createNotificationContainer();
        const notification = createNotification(message, type, duration);
        
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('notification--visible');
        }, 10);

        return notification;
    }

    return {
        show,
        checkBudgetAlerts,
        success: (message, duration) => show(message, 'success', duration),
        error: (message, duration) => show(message, 'error', duration),
        warning: (message, duration) => show(message, 'warning', duration),
        info: (message, duration) => show(message, 'info', duration)
    };
})();
```

## 7. Modern CSS Animations & Styling

```css
/* Theme Variables */
:root {
    --primary-bg: #ffffff;
    --secondary-bg: #f8f9fa;
    --text-primary: #333333;
    --text-secondary: #666666;
    --border-color: #e9ecef;
    --shadow: 0 2px 10px rgba(0,0,0,0.1);
    --primary-color: #007bff;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Theme */
.dark-theme {
    --primary-bg: #1a1a1a;
    --secondary-bg: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --border-color: #444444;
    --shadow: 0 2px 10px rgba(0,0,0,0.3);
}

/* Smooth Transitions */
* {
    transition: var(--transition);
}

/* Card Hover Effects */
.card {
    background: var(--primary-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
    transform: translateY(0);
    opacity: 1;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Button Animations */
.btn {
    position: relative;
    overflow: hidden;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
}

.btn:hover::before {
    left: 100%;
}

.btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
}

/* Loading Animations */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.loading {
    animation: pulse 1.5s ease-in-out infinite;
}

/* Slide-in Animation */
@keyframes slideInUp {
    from {
        transform: translateY(30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.slide-in {
    animation: slideInUp 0.4s ease-out;
}

/* Theme Toggle Button */
.theme-toggle {
    position: relative;
    width: 60px;
    height: 30px;
    border-radius: 15px;
    border: none;
    background: var(--border-color);
    cursor: pointer;
    overflow: hidden;
}

.theme-toggle::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--primary-color);
    transition: transform 0.3s ease;
}

.theme-toggle.dark::before {
    transform: translateX(30px);
}

.theme-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    transition: opacity 0.3s ease;
}

.theme-icon.sun {
    left: 8px;
    opacity: 1;
}

.theme-icon.moon {
    right: 8px;
    opacity: 0.3;
}

.theme-toggle.dark .theme-icon.sun {
    opacity: 0.3;
}

.theme-toggle.dark .theme-icon.moon {
    opacity: 1;
}

/* Notification Styles */
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
}

.notification {
    display: flex;
    align-items: center;
    background: var(--primary-bg);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 10px;
    box-shadow: var(--shadow);
    border-left: 4px solid var(--primary-color);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification--visible {
    transform: translateX(0);
    opacity: 1;
}

.notification--removing {
    transform: translateX(100%);
    opacity: 0;
}

.notification--success {
    border-left-color: var(--success-color);
}

.notification--error {
    border-left-color: var(--danger-color);
}

.notification--warning {
    border-left-color: var(--warning-color);
}

/* Dashboard Grid Layout */
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
}

@media (min-width: 768px) {
    .dashboard-grid {
        grid-template-columns: repeat(12, 1fr);
    }
    
    .balance-card {
        grid-column: span 12;
    }
    
    .chart-card {
        grid-column: span 6;
    }
    
    .transactions-card {
        grid-column: span 12;
    }
}

/* Input Focus Effects */
.form-input {
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 0.75rem;
    background: var(--primary-bg);
    color: var(--text-primary);
    transition: var(--transition);
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}
```

## 8. Chart Library Recommendations

### Lightweight Options:
1. **Chart.js** (67KB gzipped) - Best balance of features and size[72][78]
2. **Chartist.js** (43KB gzipped) - Ultra-lightweight, SVG-based[75]
3. **ApexCharts** (89KB gzipped) - Modern with great animations[81]

### Implementation Example with Chart.js:
```html
<!-- Include Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Chart containers -->
<div class="chart-container">
    <canvas id="categoryChart"></canvas>
</div>
<div class="chart-container">
    <canvas id="trendChart"></canvas>
</div>
```

## 9. Complete Integration Example

```javascript
// Main Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    const app = {
        init() {
            ThemeModule.init();
            this.loadData();
            this.setupEventListeners();
            this.renderInitialCharts();
            NotificationModule.show('Welcome to your Expense Tracker!', 'success');
        },

        loadData() {
            this.transactions = StorageModule.loadTransactions();
            this.budget = StorageModule.loadBudget();
            this.updateDisplay();
        },

        setupEventListeners() {
            // Filter events
            document.addEventListener('filtersApplied', (e) => {
                this.filteredTransactions = FilterModule.applyToTransactions(this.transactions);
                this.updateDisplay();
                this.updateCharts();
            });

            // Transaction events
            document.addEventListener('transactionAdded', (e) => {
                this.transactions.push(e.detail);
                StorageModule.saveTransactions(this.transactions);
                this.updateDisplay();
                this.updateCharts();
                this.checkBudgetAlerts();
            });
        },

        renderInitialCharts() {
            ChartModule.renderCategoryChart('categoryChart', this.transactions);
            ChartModule.renderTrendChart('trendChart', this.transactions);
        },

        updateCharts() {
            const displayTransactions = this.filteredTransactions || this.transactions;
            ChartModule.renderCategoryChart('categoryChart', displayTransactions);
            ChartModule.renderTrendChart('trendChart', displayTransactions);
        },

        checkBudgetAlerts() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyExpenses = this.transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return t.type === 'expense' && 
                           date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            NotificationModule.checkBudgetAlerts(monthlyExpenses, this.budget);
        },

        updateDisplay() {
            // Update balance, income, expenses display
            // Update transaction list
            // Update budget progress
        }
    };

    // Start the application
    app.init();
});
```

This comprehensive guide provides a professional, modular structure for your expense tracker with all the advanced features you requested. Each module is self-contained, well-documented, and follows modern JavaScript best practices[43][48][50].