# 🏦 Matir Bank - Visual Savings Ecosystem

Matir Bank is a comprehensive digital financial platform designed to empower rural communities through visual savings tracking, cooperative lending, direct-to-market commerce, and bulk procurement.

## 🌟 Key Features

### 1. Visual Savings Ecosystem
- **Visual Goals**: Users can create specific savings goals (e.g., "Buy Tractor", "Seeds") and track progress visually.
- **Transaction Tracking**: Visual indicators for deposits and withdrawals.
- **Account Types**: Support for Savings and Current accounts.

### 2. Digital Samity (Lending Circles)
- **Group Management**: Users can form or join "Samity" groups for collective financial growth.
- **Micro-lending**: Manage loans within the group with configurable interest rates and policies.
- **Member Roles**: Leader and Member roles with specific permissions.

### 3. Direct-to-Market Linkage (Marketplace)
- **Agro-E-Commerce**: Farmers can list produce directly for buyers, eliminating middlemen.
- **Order Management**: Track orders and sales in real-time.
- **Inventory Control**: Manage stock levels for products.

### 4. Cooperative Bulk Procurement ("Sammilito Kroy")
- **Demand Pooling**: Users can join forces to place bulk orders for supplies (fertilizers, seeds, etc.).
- **Master Orders**: Aggregate individual requests into single large orders to negotiate better wholesale prices.
- **Supplier Management**: Connect with verified suppliers.

### 5. Dynamic Reputation System
- **Credit Scoring**: A dynamic score calculated based on:
  - Savings consistency (40%)
  - Loan repayment history (40%)
  - Marketplace activity (20%)
- **Credit Tiers**: Higher scores unlock better loan terms and higher limits.

## 🛠️ Technology Stack

- **Frontend**: 
  - React.js (v18)
  - React Router (for navigation)
  - Axios (for API communication)
  - CSS3 (Custom styling)
- **Backend**: 
  - Native PHP (v8+)
  - RESTful API Architecture
- **Database**: 
  - MySQL (Relational Data Model)

## 📂 Project Structure

```
Matir-Bank/
├── backend/                 # PHP API Backend
│   ├── api/                 # API Endpoints
│   │   ├── accounts.php     # Account management
│   │   ├── auth.php         # Authentication (Login/Register)
│   │   ├── bulk.php         # Bulk procurement logic
│   │   ├── samity.php       # Group lending logic
│   │   └── ...
│   ├── config.php           # Database configuration
│   └── cors_headers.php     # CORS settings
├── database/                # Database Scripts
│   ├── schema.sql           # Database structure and tables
│   └── seed.sql             # Initial demo data
├── frontend/                # React Frontend Application
│   ├── src/
│   │   ├── components/      # UI Components (Navbar, Sections)
│   │   ├── api.js           # API integration service
│   │   ├── App.js           # Main application logic
│   │   └── ...
│   └── package.json         # Frontend dependencies
└── README.md                # Project Documentation
```

## 🚀 Setup & Installation

### Prerequisites
- PHP 8.0 or higher
- MySQL Database
- Node.js & npm (for frontend)

### 1. Database Setup
1. Create a MySQL database named `matir_bank`.
2. Import the schema:
   ```bash
   mysql -u root -p matir_bank < database/schema.sql
   ```
3. (Optional) Import seed data:
   ```bash
   mysql -u root -p matir_bank < database/seed.sql
   ```

### 2. Backend Setup
1. Navigate to the backend directory.
2. Configure database credentials in `backend/config.php` if they differ from default:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'matir_bank');
   ```
3. Start the PHP development server:
   ```bash
   cd backend
   php -S localhost:8000
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
4. Access the application at `http://localhost:3000`.

## 🔐 Authentication
The system uses a database-backed authentication system.
- **Register**: Create a new account with Username, Password, and Full Name.
- **Login**: Access your dashboard using your credentials.
- **Session**: User sessions are persisted using local storage.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register.php` | Register a new user |
| POST | `/api/login.php` | Authenticate user |
| GET | `/api/accounts.php` | Get user accounts |
| GET | `/api/samity.php` | Get group/samity data |
| GET | `/api/products.php` | Get marketplace products |
| GET | `/api/reputation.php` | Get user credit score |

---
*Created for Matir Bank Project*
