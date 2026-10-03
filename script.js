/**
 * Personal Finance Tracker Logic
 * Vanilla JavaScript (ES6+)
 */

// Category Options for Expense vs Income
const CATEGORIES = {
    expense: [
        { label: '🍔 Food & Dining', val: 'Food & Dining', emoji: '🍔' },
        { label: '🚗 Transportation', val: 'Transportation', emoji: '🚗' },
        { label: '⚡ Utilities & Bills', val: 'Utilities & Bills', emoji: '⚡' },
        { label: '🏠 Housing & Rent', val: 'Housing & Rent', emoji: '🏠' },
        { label: '🛍️ Shopping', val: 'Shopping', emoji: '🛍️' },
        { label: '🎬 Entertainment', val: 'Entertainment', emoji: '🎬' },
        { label: '🏥 Health & Fitness', val: 'Health & Fitness', emoji: '🏥' },
        { label: '📦 Other Expense', val: 'Other Expense', emoji: '📦' }
    ],
    income: [
        { label: '💼 Salary & Wages', val: 'Salary & Wages', emoji: '💼' },
        { label: '🚀 Freelance & Side Hustle', val: 'Freelance & Side Hustle', emoji: '🚀' },
        { label: '📈 Investments & Dividends', val: 'Investments & Dividends', emoji: '📈' },
        { label: '🏢 Business Revenue', val: 'Business Revenue', emoji: '🏢' },
        { label: '🎁 Gifts & Grants', val: 'Gifts & Grants', emoji: '🎁' },
        { label: '💰 Other Income', val: 'Other Income', emoji: '💰' }
    ]
};

// Emoji Lookup Helper
function getEmoji(type, categoryName) {
    const list = CATEGORIES[type] || [];
    const found = list.find(c => c.val === categoryName);
    return found ? found.emoji : (type === 'income' ? '💵' : '💸');
}

// Starter Sample Data if local storage is completely empty
const DEFAULT_SAMPLE_TRANSACTIONS = [
    { id: '101', type: 'income', title: 'Monthly Salary', amount: 65000, category: 'Salary & Wages', date: '2026-10-01' },
    { id: '102', type: 'income', title: 'Freelance Project', amount: 12500, category: 'Freelance & Side Hustle', date: '2026-10-02' },
    { id: '103', type: 'expense', title: 'Apartment Rent', amount: 20000, category: 'Housing & Rent', date: '2026-10-01' },
    { id: '104', type: 'expense', title: 'Supermarket Groceries', amount: 3400, category: 'Food & Dining', date: '2026-10-02' },
    { id: '105', type: 'expense', title: 'Internet & Electricity', amount: 2200, category: 'Utilities & Bills', date: '2026-10-03' }
];

// App State
let transactions = JSON.parse(localStorage.getItem('finance_tracker_data'));
if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    transactions = DEFAULT_SAMPLE_TRANSACTIONS;
    localStorage.setItem('finance_tracker_data', JSON.stringify(transactions));
}

let activeTab = 'expense'; // Breakdown view tab ('expense' or 'income')

// DOM Elements
const financeForm = document.getElementById('finance-form');
const transactionIdInput = document.getElementById('transaction-id');
const transactionTypeInput = document.getElementById('transaction-type');
const transactionTitleInput = document.getElementById('transaction-title');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionCategoryInput = document.getElementById('transaction-category');
const transactionDateInput = document.getElementById('transaction-date');

const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Stats Elements
const netBalanceEl = document.getElementById('net-balance');
const balanceStatusEl = document.getElementById('balance-status');
const totalIncomeEl = document.getElementById('total-income');
const incomeCountEl = document.getElementById('income-count');
const totalExpenseEl = document.getElementById('total-expense');
const expenseCountEl = document.getElementById('expense-count');
const savingsRateEl = document.getElementById('savings-rate');

// Breakdown & Filter Elements
const tabExpenseBtn = document.getElementById('tab-expense');
const tabIncomeBtn = document.getElementById('tab-income');
const categorySummaryList = document.getElementById('category-summary-list');

const filterTypeInput = document.getElementById('filter-type');
const filterCategoryInput = document.getElementById('filter-category');
const filterDateInput = document.getElementById('filter-date');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

const transactionListEl = document.getElementById('transaction-list');
const emptyStateEl = document.getElementById('empty-state');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setTodayDate();
    updateCategoryOptions();

    // Event Listeners
    transactionTypeInput.addEventListener('change', () => {
        updateCategoryOptions();
    });

    financeForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);

    tabExpenseBtn.addEventListener('click', () => switchTab('expense'));
    tabIncomeBtn.addEventListener('click', () => switchTab('income'));

    filterTypeInput.addEventListener('change', () => {
        updateFilterCategoryOptions();
        renderTransactions();
    });
    filterCategoryInput.addEventListener('change', renderTransactions);
    filterDateInput.addEventListener('change', renderTransactions);
    resetFiltersBtn.addEventListener('click', resetFilters);

    updateFilterCategoryOptions();
    render();
});

// Set default date input to today
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    transactionDateInput.value = today;
}

// Update form category options based on chosen type (Expense vs Income)
function updateCategoryOptions() {
    const selectedType = transactionTypeInput.value;
    const catList = CATEGORIES[selectedType] || [];

    transactionCategoryInput.innerHTML = catList.map(c => 
        `<option value="${c.val}">${c.label}</option>`
    ).join('');
}

// Populate filter category select based on chosen type filter
function updateFilterCategoryOptions() {
    const selectedTypeFilter = filterTypeInput.value;
    let availableCategories = [];

    if (selectedTypeFilter === 'income') {
        availableCategories = CATEGORIES.income.map(c => c.val);
    } else if (selectedTypeFilter === 'expense') {
        availableCategories = CATEGORIES.expense.map(c => c.val);
    } else {
        // All categories
        availableCategories = [
            ...CATEGORIES.expense.map(c => c.val),
            ...CATEGORIES.income.map(c => c.val)
        ];
    }

    // Deduplicate
    const uniqueCats = Array.from(new Set(availableCategories));

    filterCategoryInput.innerHTML = `
        <option value="all">All Categories</option>
        ${uniqueCats.map(c => `<option value="${c}">${c}</option>`).join('')}
    `;
}

// Save transactions to LocalStorage
function saveData() {
    localStorage.setItem('finance_tracker_data', JSON.stringify(transactions));
}

// Main Render Controller
function render() {
    renderStats();
    renderCategoryBreakdown();
    renderTransactions();
}

// Form Submission (Add or Edit)
function handleFormSubmit(e) {
    e.preventDefault();

    const id = transactionIdInput.value;
    const type = transactionTypeInput.value;
    const title = transactionTitleInput.value.trim();
    const amount = parseFloat(transactionAmountInput.value);
    const category = transactionCategoryInput.value;
    const date = transactionDateInput.value;

    if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
        alert('Please fill in all fields with valid details.');
        return;
    }

    if (id) {
        // Edit existing transaction
        transactions = transactions.map(item => {
            if (item.id === id) {
                return { id, type, title, amount, category, date };
            }
            return item;
        });
    } else {
        // Add new transaction
        const newTransaction = {
            id: Date.now().toString(),
            type,
            title,
            amount,
            category,
            date
        };
        transactions.unshift(newTransaction);
    }

    saveData();
    resetForm();
    updateFilterCategoryOptions();
    render();
}

// Edit Mode setup
function editTransaction(id) {
    const item = transactions.find(t => t.id === id);
    if (!item) return;

    transactionIdInput.value = item.id;
    transactionTypeInput.value = item.type;
    updateCategoryOptions();

    transactionTitleInput.value = item.title;
    transactionAmountInput.value = item.amount;
    transactionCategoryInput.value = item.category;
    transactionDateInput.value = item.date;

    formTitle.textContent = 'Edit Transaction';
    formSubtitle.textContent = 'Modify transaction details';
    submitBtn.querySelector('span').textContent = 'Update Transaction';
    cancelBtn.classList.remove('hidden');

    financeForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Delete Transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);

        if (transactionIdInput.value === id) {
            resetForm();
        }

        saveData();
        render();
    }
}

// Reset Form to Default State
function resetForm() {
    financeForm.reset();
    transactionIdInput.value = '';
    transactionTypeInput.value = 'expense';
    updateCategoryOptions();
    setTodayDate();

    formTitle.textContent = 'Add Transaction';
    formSubtitle.textContent = 'Enter income or expense details';
    submitBtn.querySelector('span').textContent = 'Add Transaction';
    cancelBtn.classList.add('hidden');
}

// Calculate and render Dashboard Stats Overview
function renderStats() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;

    // Render Net Balance
    netBalanceEl.textContent = formatCurrency(netBalance);
    if (netBalance >= 0) {
        netBalanceEl.className = 'stat-value income-color';
        balanceStatusEl.textContent = 'Positive Net Worth';
    } else {
        netBalanceEl.className = 'stat-value expense-color';
        balanceStatusEl.textContent = 'Deficit Spending';
    }

    // Render Totals
    totalIncomeEl.textContent = '+' + formatCurrency(totalIncome);
    incomeCountEl.textContent = `${incomeCount} deposit${incomeCount === 1 ? '' : 's'}`;

    totalExpenseEl.textContent = '-' + formatCurrency(totalExpense);
    expenseCountEl.textContent = `${expenseCount} payment${expenseCount === 1 ? '' : 's'}`;

    // Savings Rate
    let savingsRate = 0;
    if (totalIncome > 0) {
        savingsRate = Math.max(0, ((netBalance / totalIncome) * 100)).toFixed(1);
    }
    savingsRateEl.textContent = `${savingsRate}%`;
}

// Switch Category Breakdown Tab (Expenses vs Income)
function switchTab(tab) {
    activeTab = tab;
    if (tab === 'expense') {
        tabExpenseBtn.classList.add('active');
        tabIncomeBtn.classList.remove('active');
    } else {
        tabIncomeBtn.classList.add('active');
        tabExpenseBtn.classList.remove('active');
    }
    renderCategoryBreakdown();
}

// Render Category Progress Bars
function renderCategoryBreakdown() {
    const relevantTransactions = transactions.filter(t => t.type === activeTab);
    const groupTotal = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (relevantTransactions.length === 0 || groupTotal === 0) {
        categorySummaryList.innerHTML = `<p class="subtitle" style="text-align:center; padding: 16px;">No ${activeTab} data logged yet</p>`;
        return;
    }

    // Aggregate by category
    const catTotals = {};
    relevantTransactions.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });

    const categories = Object.keys(catTotals);
    const barFillClass = activeTab === 'income' ? 'bar-fill-income' : 'bar-fill-expense';

    categorySummaryList.innerHTML = categories.map(cat => {
        const catAmount = catTotals[cat];
        const percentage = ((catAmount / groupTotal) * 100).toFixed(1);
        const emoji = getEmoji(activeTab, cat);

        return `
            <div class="category-summary-item">
                <div class="category-info">
                    <span class="category-name">
                        <span>${emoji}</span> ${cat}
                    </span>
                    <span>${formatCurrency(catAmount)} (${percentage}%)</span>
                </div>
                <div class="category-bar-bg">
                    <div class="category-bar-fill ${barFillClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Transactions List with Filters Applied
function renderTransactions() {
    const typeFilter = filterTypeInput.value;
    const catFilter = filterCategoryInput.value;
    const dateFilter = filterDateInput.value;

    const filtered = transactions.filter(t => {
        const typeMatch = (typeFilter === 'all' || t.type === typeFilter);
        const catMatch = (catFilter === 'all' || t.category === catFilter);
        const dateMatch = (!dateFilter || t.date === dateFilter);
        return typeMatch && catMatch && dateMatch;
    });

    if (filtered.length === 0) {
        transactionListEl.innerHTML = '';
        emptyStateEl.classList.remove('hidden');
        return;
    }

    emptyStateEl.classList.add('hidden');

    transactionListEl.innerHTML = filtered.map(t => {
        const isIncome = t.type === 'income';
        const emoji = getEmoji(t.type, t.category);
        const formattedDate = formatDate(t.date);
        const sign = isIncome ? '+' : '-';
        const amountClass = isIncome ? 'amount-income' : 'amount-expense';
        const badgeMetaClass = isIncome ? 'meta-income' : 'meta-expense';

        return `
            <div class="transaction-item">
                <div class="transaction-left">
                    <div class="type-badge ${t.type}">${emoji}</div>
                    <div class="transaction-details">
                        <h4>${escapeHTML(t.title)}</h4>
                        <div class="transaction-meta">
                            <span class="meta-badge ${badgeMetaClass}">${t.category}</span>
                            <span>📅 ${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${amountClass}">
                        ${sign}${formatCurrency(t.amount)}
                    </div>
                    <div class="transaction-actions">
                        <button class="btn btn-icon btn-edit" onclick="editTransaction('${t.id}')" title="Edit">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-icon btn-delete" onclick="deleteTransaction('${t.id}')" title="Delete">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Clear all filter inputs
function resetFilters() {
    filterTypeInput.value = 'all';
    updateFilterCategoryOptions();
    filterCategoryInput.value = 'all';
    filterDateInput.value = '';
    renderTransactions();
}

// Currency Formatting Helper (₹)
function formatCurrency(amount) {
    return '₹' + Math.abs(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Date Formatting Helper
function formatDate(dateStr) {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// XSS Sanitizer Helper
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
