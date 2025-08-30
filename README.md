# SaaS Attendance System

A backend SaaS application for employee attendance system with multi-tenant architecture using NestJS, Prisma, Redis, and PostgreSQL.

## Main Features

- ✅ **Multi-tenant Architecture**: Each company has separate data
- ✅ **Authentication & Authorization**: JWT-based authentication with role-based access control
- ✅ **User Management**: User management with SUPER_ADMIN, COMPANY_ADMIN, EMPLOYEE roles
- ✅ **Company Management**: Company management and tenant-specific settings
- ✅ **Attendance Tracking**: Attendance recording with location and photo features
- ✅ **Leave Management**: Leave and permission request system
- ✅ **Overtime Management**: Overtime requests with approval workflow
- ✅ **Document Management**: Company document management
- ✅ **Shift & Schedule Management**: Work shift system and scheduling
- ✅ **Subscription Management**: SaaS subscription system with various plans
- ✅ **Redis Caching**: Cache for optimal performance
- ✅ **Rate Limiting**: Protection from abuse
- ✅ **File Upload**: Upload attendance photos and documents
- ✅ **Swagger Documentation**: Complete API documentation

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with Passport
- **Package Manager**: Bun
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL
- Redis

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd nest-saas-attendance
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with database configuration and JWT secret:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/attendance_saas?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="24h"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   PORT=3000
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   bunx prisma generate

   # Run database migrations
   bunx prisma db push

   # (Optional) Seed database with initial data
   bunx prisma db seed
   ```

5. **Start application**
   ```bash
   # Development mode
   bun run start:dev

   # Production mode
   bun run build
   bun run start:prod
   ```

Application will run at `http://localhost:3000`

## API Documentation

Swagger documentation available at: `http://localhost:3000/api/docs`

## Authentication

Application uses JWT authentication with 3 main roles:

- **SUPER_ADMIN**: SaaS platform admin (access to all tenants)
- **COMPANY_ADMIN**: Company admin (access to own tenant)
- **EMPLOYEE**: Employee (limited access)

### Login Flow

1. POST `/api/auth/login` with email and password
2. Receive access token and refresh token
3. Include access token in header `Authorization: Bearer <token>`
4. Use refresh token to get new access token before expired

## Database Schema

### Core Entities

- **User**: System users with role-based access
- **Company**: Main tenant for multi-tenant
- **Plan**: SaaS service packages
- **Subscription**: Company subscription to specific plan
- **Attendance**: Employee attendance data
- **LeaveRequest**: Leave/permission requests
- **OvertimeRequest**: Overtime requests
- **Document**: Company documents
- **Shift**: Work shift configuration
- **UserSchedule**: Employee scheduling per shift
- **Announcement**: Company announcements

### Relationships

```
Company (1) ──── (N) User
Company (1) ──── (1) Subscription
Company (1) ──── (N) Plan (via Subscription)
Company (1) ──── (N) OfficeLocation
Company (1) ──── (N) Shift
User (1) ──── (N) Attendance
User (1) ──── (N) LeaveRequest
User (1) ──── (N) OvertimeRequest
Shift (1) ──── (N) UserSchedule
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Users Management
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Companies Management
- `GET /api/companies` - Get all companies (SUPER_ADMIN only)
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create new company
- `PATCH /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/check-in` - Clock in
- `POST /api/attendance/check-out` - Clock out
- `GET /api/attendance/:id` - Get attendance by ID

### Leave Management
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Create leave request
- `PATCH /api/leaves/:id` - Update leave request
- `PATCH /api/leaves/:id/approve` - Approve leave request
- `PATCH /api/leaves/:id/reject` - Reject leave request

### Subscription Management
- `GET /api/subscriptions` - Get subscriptions (SUPER_ADMIN only)
- `POST /api/subscriptions` - Create subscription
- `PATCH /api/subscriptions/:id` - Update subscription

## Multi-tenant Security

- **Tenant Isolation**: Each company's data is isolated with middleware
- **Access Control**: Role-based permissions for each endpoint
- **Company Validation**: Active subscription validation for each tenant
- **Data Filtering**: Automatic filtering based on company ID

## File Upload

Application supports file upload for:
- **Attendance Photos**: Employee attendance photos
- **Document Files**: Company documents
- **Face Recognition**: Employee face reference photos

Files are stored in `./uploads` directory with unique names.

## Caching Strategy

Redis is used for:
- **User Sessions**: Cache user data for optimal performance
- **Refresh Tokens**: Refresh token storage with TTL
- **Rate Limiting**: Rate limiting implementation per user/IP
- **Company Settings**: Cache company settings

## Development

### Project Structure

```
src/
├── common/                 # Shared decorators, constants
├── config/                 # Configuration files
├── dto/                    # Data Transfer Objects
├── guards/                 # Authentication & authorization guards
├── interfaces/             # TypeScript interfaces
├── middleware/             # Custom middleware
├── modules/                # Feature modules
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── companies/         # Company management
│   ├── attendance/        # Attendance tracking
│   ├── leaves/            # Leave management
│   ├── subscriptions/     # Subscription management
│   └── ...
├── services/              # Shared services (Prisma, Redis, Cache)
└── main.ts                # Application entry point
```

### Available Scripts

```bash
# Development
bun run start:dev          # Start with hot reload
bun run start:debug        # Start with debugger

# Production
bun run build              # Build application
bun run start:prod         # Start production build

# Database
bunx prisma studio         # Open Prisma Studio
bunx prisma generate       # Generate Prisma client
bunx prisma db push        # Push schema to database
bunx prisma db migrate     # Create migration
bunx prisma db seed        # Seed database

# Testing
bun run test               # Run unit tests
bun run test:e2e           # Run e2e tests
bun run test:cov           # Run tests with coverage
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |
| `PORT` | Application port | `3000` |
| `UPLOAD_DEST` | Upload destination directory | `./uploads` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

📋 Demo Accounts:
Super Admin: superadmin@saas-attendance.com / admin123
Company Admin: admin@demo.com / admin123
Employee: john@demo.com / admin123
Employee: jane@demo.com / admin123
Employee: bob@demo.com / admin123

## License

This project is licensed under the MIT License.