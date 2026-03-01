
# Intelligent Coding Agent - Modules

This folder contains two standalone modules extracted from the Intelligent Coding Agent project.

---

## 📦 Module 1: Database Management System

### Description
A PostgreSQL database management module with async SQLAlchemy ORM for efficient data handling.

### Features
- Async database connections (SQLAlchemy + asyncpg)
- User model with role-based access
- Automatic session management
- Migration-ready schema

### Key Files
```
backend/app/core/
├── database.py      ← Async engine, session maker, Base class
├── config.py        ← Database URL configuration
└── __init__.py

backend/app/models/
├── user.py          ← User model (id, email, password_hash, role, etc.)
└── __init__.py
```

### Database Schema
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Technologies
- **PostgreSQL** - Relational database
- **SQLAlchemy 2.0** - Async ORM
- **asyncpg** - PostgreSQL async driver
- **Pydantic** - Settings management

---

## 🔐 Module 2: Authentication System

### Description
Complete JWT-based authentication system with user registration, login, and token management.

### Features
- User Registration with password validation
- JWT Access & Refresh tokens
- Password hashing (bcrypt)
- Role-based authorization (USER/ADMIN)
- Token refresh mechanism

### Key Files
```
backend/app/api/
├── auth.py          ← Register, Login, Refresh endpoints
├── deps.py          ← Auth dependencies (get_current_user)
└── __init__.py

backend/app/services/
├── auth_service.py  ← User creation, authentication logic
└── __init__.py

backend/app/schemas/
├── auth.py          ← Request/Response models
└── __init__.py

backend/app/core/
└── security.py      ← JWT creation, password hashing
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/auth/register` | Create new user account |
| POST   | `/api/v1/auth/login`    | Login and receive JWT tokens |
| POST   | `/api/v1/auth/refresh`  | Refresh access token |

### Technologies
- **FastAPI** - Web framework
- **python-jose** - JWT tokens
- **passlib + bcrypt** - Password hashing
- **Pydantic** - Request validation

---

## 🚀 Quick Start

### 1. Start PostgreSQL Database
```bash
docker run -d --name auth-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=auth_module \
  -p 5432:5432 \
  postgres:15
```

### 2. Setup Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Run server
python -m uvicorn app.main:app --reload
```

### 3. Setup Frontend
```bash
cd frontend

npm install
npm run dev
```

### 4. Test the API
```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📁 Module 3: Code Repository Management

### Description
A robust system for managing code repositories, allowing users to create, import, and organize codebases.

### Features
- **Repository Management**: Create, list, and delete repositories.
- **GitHub Import**: Import public GitHub repositories directly.
- **Background Processing**: Handles long-running clone/index operations.
- **File Management**: Upload, list, read, and delete files.

### Key Files
```
backend/app/api/
├── repository.py    ← Repository endpoints
└── files.py         ← File management endpoints

backend/app/services/
└── file_service.py  ← Core file logic

backend/app/models/
└── file.py          ← File/Repository models
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/repo` | List repositories |
| POST   | `/api/v1/repo` | Create repository |
| POST   | `/api/v1/repo/import` | Import GitHub repo |
| POST   | `/api/v1/files/upload` | Upload file |

---

## 📁 Frontend Pages

| Route      | Description           |
|------------|----------------------|
| `/login`   | User login form      |
| `/register`| User registration form |

---

## Author

Built as part of the Intelligent Coding Agent project.
