
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api/transactions';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const money = (amount) =>
  new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  }).format(amount);

function formatTransaction(item) {
  return {
    ...item,
    id: item._id,
    date: new Date(item.date).toISOString().slice(0, 10),
    amount: Number(item.amount),
    icon: item.type === 'income' ? '💗' : '🌸',
  };
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Load the saved monthly budget from this browser.
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const savedBudget = localStorage.getItem('bloomMonthlyBudget');
    return savedBudget ? Number(savedBudget) : 10000;
  });

  const [budgetInput, setBudgetInput] = useState(() => {
    const savedBudget = localStorage.getItem('bloomMonthlyBudget');
    return savedBudget || '10000';
  });

  const [showBudgetEditor, setShowBudgetEditor] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'Food & drinks',
    amount: '',
    type: 'expense',
    date: getLocalDateKey(new Date()),
  });

  // Load transactions from MongoDB.
  useEffect(() => {
    async function loadTransactions() {
      try {
        setError('');

        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Could not load transactions.');
        }

        setTransactions(data.transactions.map(formatTransaction));
      } catch {
        setError(
          'Could not connect to Bloom Finance. Make sure the backend is running.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  // Automatically dismiss notifications.
  useEffect(() => {
    if (!notification) return undefined;

    const timeout = window.setTimeout(() => {
      setNotification(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [notification]);

  // Calculate income, expenses, and balance.
  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  // Calculate actual daily expenses for the current week.
  const chartValues = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const mondayOffset = (today.getDay() + 6) % 7;

    startOfWeek.setDate(today.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const dailyExpenses = WEEKDAYS.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);

      const dateKey = getLocalDateKey(date);

      const total = transactions
        .filter(
          (item) => item.type === 'expense' && item.date === dateKey
        )
        .reduce((sum, item) => sum + item.amount, 0);

      return { day, total };
    });

    const highestExpense = Math.max(
      ...dailyExpenses.map((item) => item.total),
      0
    );

    return dailyExpenses.map((item) => ({
      ...item,
      value: highestExpense > 0
        ? (item.total / highestExpense) * 100
        : 0,
    }));
  }, [transactions]);

  const filteredTransactions = transactions.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const expenseCategories = [
    'Food & drinks',
    'Transport',
    'Shopping',
    'Bills',
    'Education',
    'Entertainment',
    'Health',
    'Personal',
    'Other',
  ];

  const incomeCategories = [
    'Salary',
    'Freelance',
    'Business',
    'Gift',
    'Investment',
    'Extra income',
    'Other income',
  ];

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Save a new monthly budget.
  function saveBudget(event) {
    event.preventDefault();

    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setNotification({
        type: 'error',
        title: 'Invalid budget',
        message: 'Please enter a budget greater than zero.',
      });
      return;
    }

    setMonthlyBudget(amount);
    localStorage.setItem('bloomMonthlyBudget', String(amount));
    setShowBudgetEditor(false);

    setNotification({
      type: 'success',
      title: 'Budget updated! 💗',
      message: `Your monthly budget is ${money(amount)}.`,
    });
  }

  // Save a transaction to MongoDB.
  async function handleAddTransaction(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0) {
      setNotification({
        type: 'error',
        title: 'A little detail is missing',
        message: 'Please enter a name and a valid amount.',
      });
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          amount,
          type: form.type,
          category: form.category,
          date: form.date,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not save transaction.');
      }

      const newTransaction = formatTransaction(data.transaction);

      setTransactions((current) => [newTransaction, ...current]);

      setNotification({
        type: 'success',
        title: 'Transaction saved! ♡',
        message: `${newTransaction.name} · ${money(newTransaction.amount)}`,
      });

      setForm({
        name: '',
        category: 'Food & drinks',
        amount: '',
        type: 'expense',
        date: getLocalDateKey(new Date()),
      });

      setShowForm(false);
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Oops, something went wrong',
        message: err.message || 'Could not save your transaction.',
      });
    } finally {
      setSaving(false);
    }
  }

  // Delete a transaction from MongoDB.
  async function deleteTransaction(id) {
    const confirmed = window.confirm(
      'Would you like to delete this transaction?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not delete transaction.');
      }

      setTransactions((current) =>
        current.filter((item) => item.id !== id)
      );

      setNotification({
        type: 'success',
        title: 'Transaction removed',
        message: 'Your spending chart has been updated. 🌸',
      });
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Could not delete transaction',
        message: err.message || 'Please try again.',
      });
    }
  }

  // Calculate budget progress.
  const budgetRemaining = monthlyBudget - totals.expenses;
  const budgetProgress = monthlyBudget > 0
    ? Math.min((totals.expenses / monthlyBudget) * 100, 100)
    : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home">
          <span className="brand-icon">✿</span>
          <span>Bloom Finance</span>
        </a>

        <p className="sidebar-label">YOUR SPACE</p>

        <nav className="sidebar-nav">
          <a className="nav-item active" href="#home">
            <span>⌂</span> Overview
          </a>
          <a className="nav-item" href="#transactions">
            <span>↕</span> Transactions
          </a>
          <a className="nav-item" href="#budgets">
            <span>♡</span> Budgets
          </a>
          <a className="nav-item" href="#insights">
            <span>✧</span> Insights
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-decoration">🌙</div>
          <p className="sidebar-quote">
            Small steps today,
            <br />
            brighter tomorrows.
          </p>
          <span className="sidebar-heart">Made with ♡</span>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR PERSONAL MONEY SPACE</p>
            <h1>Good day, beautiful! <span>✦</span></h1>
            <p className="muted">
              A little clarity with your money goes a long way.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            + Add transaction
          </button>
        </header>

        {error && (
          <div className="panel" role="alert">
            <p>{error}</p>
            <button
              className="outline-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        <section className="summary-grid">
          <article className="summary-card balance-card">
            <div className="summary-top">
              <span>Total balance</span>
              <span className="summary-icon">💜</span>
            </div>
            <h2>{money(totals.balance)}</h2>
            <p>Your income minus expenses</p>
          </article>

          <article className="summary-card income-card">
            <div className="summary-top">
              <span>Total income</span>
              <span className="summary-icon">↗</span>
            </div>
            <h2>{money(totals.income)}</h2>
            <p className="positive-text">Money coming in ♡</p>
          </article>

          <article className="summary-card expense-card">
            <div className="summary-top">
              <span>Total expenses</span>
              <span className="summary-icon">↘</span>
            </div>
            <h2>{money(totals.expenses)}</h2>
            <p>Money going out</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel chart-panel" id="insights">
            <div className="panel-heading">
              <div>
                <h3>Your spending rhythm</h3>
                <p className="muted">Your actual expenses this week</p>
              </div>
              <span className="soft-badge">This week ✨</span>
            </div>

            <div className="chart">
              {chartValues.map((item) => (
                <div className="chart-column" key={item.day}>
                  <div className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{ height: `${item.value}%` }}
                      title={`${item.day}: ${money(item.total)} in expenses`}
                    />
                  </div>
                  <span>{item.day}</span>
                </div>
              ))}
            </div>

            <p className="chart-note">
              <span>✦</span> Your daily spending, updated as you bloom.
            </p>
          </article>

          <article className="panel budget-panel" id="budgets">
            <div className="panel-heading">
              <div>
                <h3>Monthly budget</h3>
                <p className="muted">Keep your goals in sight.</p>
              </div>
              <span className="budget-icon">🌷</span>
            </div>

            <div className="budget-amount">
              <strong>{money(Math.max(budgetRemaining, 0))}</strong>
              <span>left to spend</span>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${budgetProgress}%` }}
              />
            </div>

            <div className="budget-details">
              <span>Spent: {money(totals.expenses)}</span>
              <span>Goal: {money(monthlyBudget)}</span>
            </div>

            <p className="budget-message">
              {totals.expenses > monthlyBudget
                ? 'You are over your budget. Take a moment to review your spending. 💗'
                : budgetProgress >= 80
                  ? 'You are getting close to your budget limit. Spend mindfully. 🌸'
                  : 'Every thoughtful choice helps you bloom. 💗'}
            </p>

            <button
              className="outline-button"
              onClick={() => {
                setBudgetInput(String(monthlyBudget));
                setShowBudgetEditor((current) => !current);
              }}
            >
              {showBudgetEditor ? 'Cancel' : '✎ Change budget'}
            </button>

            {showBudgetEditor && (
              <form className="budget-form" onSubmit={saveBudget}>
                <label htmlFor="monthlyBudget">Your monthly budget (ETB)</label>
                <input
                  id="monthlyBudget"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={budgetInput}
                  onChange={(event) => setBudgetInput(event.target.value)}
                  placeholder="Enter your budget"
                  required
                />
                <button className="primary-button" type="submit">
                  Save budget ♡
                </button>
              </form>
            )}
          </article>
        </section>

        <section className="panel transactions-panel" id="transactions">
          <div className="panel-heading">
            <div>
              <h3>Recent transactions</h3>
              <p className="muted">Your latest money movements.</p>
            </div>

            <button
              className="outline-button"
              onClick={() => setShowForm(true)}
            >
              + Add transaction
            </button>
          </div>

          <div className="transaction-filters">
            {['all', 'income', 'expense'].map((item) => (
              <button
                key={item}
                className={`filter-button ${filter === item ? 'selected' : ''}`}
                onClick={() => setFilter(item)}
              >
                {item === 'all'
                  ? 'All'
                  : item === 'income'
                    ? 'Income'
                    : 'Expenses'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">
              <span>🌸</span>
              <h3>Loading your transactions...</h3>
              <p>Your money space is getting ready.</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <span>🌸</span>
              <h3>No transactions here yet</h3>
              <p>Add a transaction to start tracking your money.</p>
            </div>
          ) : (
            filteredTransactions.map((item) => (
              <div className="transaction-row" key={item.id}>
                <div className="transaction-icon">{item.icon}</div>

                <div className="transaction-name">
                  <strong>{item.name}</strong>
                  <p>{item.category} · {item.date}</p>
                </div>

                <strong
                  className={`amount ${
                    item.type === 'income'
                      ? 'income-amount'
                      : 'expense-amount'
                  }`}
                >
                  {item.type === 'income' ? '+' : '−'} {money(item.amount)}
                </strong>

                <button
                  className="delete-button"
                  onClick={() => deleteTransaction(item.id)}
                  aria-label={`Delete ${item.name}`}
                  title="Delete transaction"
                >
                  🗑
                </button>
              </div>
            ))
          )}

          <div className="transaction-footer">
            Showing {filteredTransactions.length} transaction(s)
          </div>
        </section>

        <footer className="app-footer">
          Made for your brighter financial future <span>♡</span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">A LITTLE MONEY UPDATE</p>
                <h2 id="transaction-modal-title">Add a transaction ♡</h2>
                <p className="muted">
                  Every little detail helps you understand your money.
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTransaction}>
              <label htmlFor="type">Transaction type</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={form.type === 'expense' ? 'type-active' : ''}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      type: 'expense',
                      category: 'Food & drinks',
                    }))
                  }
                >
                  − Expense
                </button>
                <button
                  type="button"
                  className={form.type === 'income' ? 'type-active' : ''}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      type: 'income',
                      category: 'Salary',
                    }))
                  }
                >
                  + Income
                </button>
              </div>

              <label htmlFor="name">Transaction name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="e.g. Lunch, salary, bus fare"
                required
                autoFocus
              />

              <label htmlFor="amount">Amount (ETB)</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
              />

              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleInputChange}
              >
                {(form.type === 'income'
                  ? incomeCategories
                  : expenseCategories
                ).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleInputChange}
                required
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save transaction ♡'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {notification && (
        <div
          className={`toast-notification ${
            notification.type === 'success' ? 'toast-success' : 'toast-error'
          }`}
          role={notification.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          <div className="toast-icon">
            {notification.type === 'success' ? '✓' : '♡'}
          </div>

          <div className="toast-content">
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
          </div>

          <button
            className="toast-close"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
