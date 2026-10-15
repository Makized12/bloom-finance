# 🌸 Bloom Finance

A full-stack personal finance tracker built with **React, Node.js, Express, and MongoDB**. Bloom Finance helps users record income and expenses, monitor their balance, visualize spending, and manage a monthly budget through a beautiful purple-and-pink dashboard.

## ✨ Features

- 💰 **Financial Overview** — View your balance, total income, and expenses.
- 📝 **Transaction Management** — Add and delete income and expense transactions.
- 📊 **Weekly Spending Chart** — Visualize your spending activity.
- 🌷 **Customizable Budget** — Set a monthly budget and monitor your spending progress.
- 🔔 **Feedback Notifications** — Receive notifications when actions succeed or need attention.
- ☁️ **MongoDB Database** — Store transactions in a database.
- 🎨 **Responsive Dashboard** — Enjoy a modern interface with a purple-and-pink theme.

## 🛠️ Technologies Used

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB

**Development Tools**
- Git
- GitHub
- Visual Studio Code

## 📁 Project Structure

```text
personal-finance-tracker/
├── backend/
│   ├── .gitignore
│   ├── Transaction.js
│   ├── transactionRoutes.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- A MongoDB database, such as MongoDB Atlas
- Git

### Set Up the Backend

Open a terminal and navigate to the backend folder:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and add your own MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

Replace the example connection string with your own private MongoDB URI. Never commit your `.env` file or share your database credentials publicly.

Start the backend:

```bash
npm start
```

The backend runs at `http://localhost:5000`.

### Set Up the Frontend

Open a separate terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local address displayed by Vite in your browser, usually `http://localhost:5173`.

Keep both terminals running while using the application.

## 🔐 Security

- Store database credentials in environment variables.
- Keep `.env` files out of Git and GitHub.
- Never publish passwords, API keys, or database connection strings.

## 🚀 Future Improvements

- Expense breakdown by category
- Monthly financial reports
- Data visualization enhancements
- Exportable transaction reports
- Deployment for online access

## 👩‍💻 Author

**Mahlet Zena**

Full-Stack Development | React | Node.js | Express | MongoDB

## 📄 License

No license has been specified yet. All rights are reserved by default unless a license is added to this repository.
