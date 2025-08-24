// Application state and data
let transactions = [];
let monthlyBudget = 2000;
let editingTransactionId = null;
let deleteTransactionId = null;

// Categories data
const categories = {
    income: ["Salary", "Freelance", "Investment", "Business", "Other Income"],
    expense: ["Food", "Transportation", "Entertainment", "Bills", "Shopping", "Healthcare", "Education", "Rent", "Other Expenses"]
};

// Sample data for demonstration
const sampleTransactions = [
    {
        id: 1,
        description: "Salary",
        amount: 5000,
        type: "income",
        category: "Salary",
        date: "2025-08-01"
    },
    {
        id: 2,
        description: "Groceries",
        amount: 120,
        type: "expense", 
        category: "Food",
        date: "2025-08-15"
    },
    {
        id: 3,
        description: "Gas Bill",
        amount: 85,
        type: "expense",
        category: "Bills", 
        date: "2025-08-10"
    }
];

// Global modal functions (required for HTML onclick handlers)
window.openTransactionModal = function() {
    const modal = document.getElementById('transactionModal');
    if (modal) {
        modal.classList.remove('hidden');
        const descriptionInput = document.getElementById('description');
        if (descriptionInput) {
            setTimeout(() => descriptionInput.focus(), 100);
        }
    }
};

window.closeTransactionModal = function() {
    const modal = document.getElementById('transactionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    const form = document.getElementById('transactionForm');
    if (form) {
        form.reset();
    }
    
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = getCurrentDate();
    }
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Add Transaction';
    }
    
    editingTransactionId = null;
    updateCategoryOptions();
};

window.openBudgetModal = function() {
    const budgetAmountInput = document.getElementById('budgetAmount');
    if (budgetAmountInput) {
        budgetAmountInput.value = monthlyBudget;
    }
    
    const modal = document.getElementById('budgetModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (budgetAmountInput) {
            setTimeout(() => budgetAmountInput.focus(), 100);
        }
    }
};

window.closeBudgetModal = function() {
    const modal = document.getElementById('budgetModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    const form = document.getElementById('budgetForm');
    if (form) {
        form.reset();
    }
};

window.openDeleteModal = function() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
};

window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    deleteTransactionId = null;
};

window.editTransaction = function(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    editingTransactionId = id;
    
    // Populate form with transaction data
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const categorySelect = document.getElementById('category');
    const typeRadio = document.querySelector(`input[name="type"][value="${transaction.type}"]`);
    
    if (descriptionInput) descriptionInput.value = transaction.description;
    if (amountInput) amountInput.value = transaction.amount;
    if (dateInput) dateInput.value = transaction.date;
    if (typeRadio) typeRadio.checked = true;
    
    // Update category options and select correct category
    updateCategoryOptions();
    if (categorySelect) categorySelect.value = transaction.category;
    
    // Update modal title
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Transaction';
    }
    
    window.openTransactionModal();
};

window.deleteTransaction = function(id) {
    deleteTransactionId = id;
    window.openDeleteModal();
};

window.confirmDelete = function() {
    if (deleteTransactionId) {
        transactions = transactions.filter(t => t.id !== deleteTransactionId);
        deleteTransactionId = null;
        updateAllDisplays();
        window.closeDeleteModal();
        showFeedback('Transaction deleted successfully!');
    }
};

window.updateCategoryOptions = function() {
    const selectedTypeElement = document.querySelector('input[name="type"]:checked');
    const selectedType = selectedTypeElement ? selectedTypeElement.value : 'expense';
    const categorySelect = document.getElementById('category');
    
    if (!categorySelect) return;
    
    categorySelect.innerHTML = '';
    
    const relevantCategories = categories[selectedType] || categories.expense;
    
    relevantCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Load sample data
    transactions = [...sampleTransactions];
    
    // Set current date
    updateCurrentDate();
    
    // Initialize form date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = getCurrentDate();
    }
    
    // Initialize category options
    updateCategoryOptions();
    
    // Initialize category filter
    initializeCategoryFilter();
    
    // Update all displays
    updateAllDisplays();
    
    // Set up event listeners
    setupEventListeners();
});

// Event listeners setup
function setupEventListeners() {
    // Transaction form submission
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
    
    // Budget form submission
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetSubmit);
    }
    
    // Search input - multiple event types for better compatibility
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterTransactions, 300));
        searchInput.addEventListener('keyup', debounce(filterTransactions, 300));
        searchInput.addEventListener('change', filterTransactions);
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterTransactions);
    }
    
    // Modal click outside to close - improved event handling
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Type radio button listeners
    const typeRadios = document.querySelectorAll('input[name="type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', updateCategoryOptions);
    });
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function closeAllModals() {
    window.closeTransactionModal();
    window.closeBudgetModal();
    window.closeDeleteModal();
}

// Utility functions
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function updateCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(Math.abs(amount));
}

function generateId() {
    return Math.max(0, ...transactions.map(t => t.id)) + 1;
}

// Transaction management
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const typeElement = document.querySelector('input[name="type"]:checked');
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
    // Validation
    if (!description || !amount || !typeElement || !category || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    if (amount <= 0) {
        alert('Amount must be greater than 0');
        return;
    }
    
    const transaction = {
        id: editingTransactionId || generateId(),
        description: description,
        amount: amount,
        type: typeElement.value,
        category: category,
        date: date
    };
    
    if (editingTransactionId) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = transaction;
        }
        editingTransactionId = null;
    } else {
        // Add new transaction
        transactions.push(transaction);
    }
    
    updateAllDisplays();
    window.closeTransactionModal();
    showFeedback('Transaction saved successfully!');
}

// Budget management
function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const budgetAmount = parseFloat(document.getElementById('budgetAmount').value);
    
    if (!budgetAmount || budgetAmount <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    
    monthlyBudget = budgetAmount;
    updateAllDisplays();
    window.closeBudgetModal();
    showFeedback('Budget updated successfully!');
}

// Display updates
function updateAllDisplays() {
    updateBalanceDisplay();
    updateTransactionList();
    updateMonthlyReport();
    updateBudgetProgress();
}

function updateBalanceDisplay() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    // Update balance display
    const balanceElement = document.getElementById('balanceAmount');
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(balance);
        balanceElement.className = `balance-amount ${balance >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Update totals
    const totalIncomeElement = document.getElementById('totalIncome');
    const totalExpensesElement = document.getElementById('totalExpenses');
    
    if (totalIncomeElement) totalIncomeElement.textContent = formatCurrency(totalIncome);
    if (totalExpensesElement) totalExpensesElement.textContent = formatCurrency(totalExpenses);
}

function updateTransactionList() {
    const container = document.getElementById('transactionList');
    if (!container) return;
    
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const categoryFilterValue = categoryFilter ? categoryFilter.value : '';
    
    let filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = !searchTerm || 
            transaction.description.toLowerCase().includes(searchTerm) ||
            transaction.category.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilterValue || transaction.category === categoryFilterValue;
        return matchesSearch && matchesCategory;
    });
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = '<div class="empty-state">No transactions found</div>';
        return;
    }
    
    container.innerHTML = filteredTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-meta">
                    ${escapeHtml(transaction.category)} • ${new Date(transaction.date).toLocaleDateString()}
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn btn--sm btn--secondary" onclick="editTransaction(${transaction.id})">
                    Edit
                </button>
                <button class="btn btn--sm btn--outline" onclick="deleteTransaction(${transaction.id})">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateMonthlyReport() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyNet = monthlyIncome - monthlyExpenses;
    
    const monthlyIncomeElement = document.getElementById('monthlyIncome');
    const monthlyExpensesElement = document.getElementById('monthlyExpenses');
    const monthlyNetElement = document.getElementById('monthlyNet');
    
    if (monthlyIncomeElement) monthlyIncomeElement.textContent = formatCurrency(monthlyIncome);
    if (monthlyExpensesElement) monthlyExpensesElement.textContent = formatCurrency(monthlyExpenses);
    
    if (monthlyNetElement) {
        monthlyNetElement.textContent = formatCurrency(monthlyNet);
        monthlyNetElement.className = `value ${monthlyNet >= 0 ? 'income' : 'expense'}`;
    }
    
    // Update category breakdown
    updateCategoryBreakdown(monthlyTransactions);
}

function updateCategoryBreakdown(monthlyTransactions) {
    const expensesByCategory = {};
    
    monthlyTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });
    
    const sortedCategories = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Top 5 categories
    
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;
    
    if (sortedCategories.length === 0) {
        container.innerHTML = '<div class="empty-state">No expenses this month</div>';
        return;
    }
    
    container.innerHTML = sortedCategories.map(([category, amount]) => `
        <div class="category-item">
            <span class="category-name">${escapeHtml(category)}</span>
            <span class="category-amount">${formatCurrency(amount)}</span>
        </div>
    `).join('');
}

function updateBudgetProgress() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' && 
                   transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    const progressPercentage = (monthlyExpenses / monthlyBudget) * 100;
    const progressFill = document.getElementById('budgetProgress');
    
    if (progressFill) {
        progressFill.style.width = `${Math.min(progressPercentage, 100)}%`;
        progressFill.className = `progress-fill ${progressPercentage > 100 ? 'over-budget' : ''}`;
    }
    
    const budgetUsedElement = document.getElementById('budgetUsed');
    const budgetTotalElement = document.getElementById('budgetTotal');
    
    if (budgetUsedElement) budgetUsedElement.textContent = formatCurrency(monthlyExpenses);
    if (budgetTotalElement) budgetTotalElement.textContent = formatCurrency(monthlyBudget);
}

function initializeCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const allCategories = [...categories.income, ...categories.expense];
    
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Filtering and search
function filterTransactions() {
    updateTransactionList();
}

// Feedback system
function showFeedback(message) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.feedback-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create a simple feedback notification
    const notification = document.createElement('div');
    notification.className = 'feedback-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-success);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation keyframes if they don't exist
    if (!document.querySelector('#feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}