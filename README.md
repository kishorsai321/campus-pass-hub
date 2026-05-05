# Campus Pass - Event Booking System

A full-stack web application for university event management and ticketing.

## 🚀 Features
- **MySQL Database**: All booking records and event data are stored in a relational database.
- **OTP Verification**: Secure login/booking process using a one-time password (mocked for demo).
- **AI Support Bot**: Built with Google Gemini API to assist students with queries.
- **Interactive Maps**: Shows event venues using Google Maps.
- **Admin Dashboard**: Create, Update, and Delete events; track all booking records.
- **Stripe Integration**: Ready for payment processing (running in Demo/Test mode).

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: MySQL.
- **AI**: Google Generative AI (Gemini).

## 📋 Prerequisites
1. **Node.js** installed on your system.
2. **MySQL Server** (XAMPP, WAMP, or MySQL Installer).
3. **VS Code** for development.

## ⚙️ Local Setup Instructions

### 1. Database Setup
1. Open your MySQL client (e.g., PHPMyAdmin or MySQL Workbench).
2. Create a new database named `campus_pass_db`.
3. Import the `setup.sql` file provided in the root directory.

### 2. Environment Variables
Create a `.env` file in the root directory and add your credentials:
```env
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="your_mysql_password"
DB_NAME="campus_pass_db"
DB_PORT=3306

GEMINI_API_KEY="your_google_ai_key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

### 3. Install & Run
1. Open the project folder in VS Code.
2. Open terminal and run:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

## 🎓 College Project Presentation Notes
- **Preview Environment**: This online preview doesn't have a live MySQL server running. The app automatically enters **"Demo Mode"** when it detects the server is offline. This is perfect for showing the UI and functionality without complex setup.
- **Local Presentation**: To show real MySQL storage during your presentation, you **must** run the project locally on your laptop using VS Code and XAMPP/WAMP.
- **PowerShell Fix**: If you see an error like `cannot be loaded because running scripts is disabled`, run this command in a **PowerShell as Administrator**:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- **Payment**: Real payments are disabled; use Stripe's test card (4242...) if needed.
