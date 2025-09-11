# Backend – Fullstack Technical Test

## Deskripsi

Backend ini dibangun menggunakan:

- **Node.js 18 + Express.js + TypeScript**
- **MySQL** dengan **Sequelize ORM**
- **Redis** untuk cache & refresh token
- **JWT** untuk autentikasi
- **RBAC** (Role-Based Access Control: admin & user)
- **Audit Log** untuk semua perubahan data
- **Export CSV** untuk data user besar
- **Validasi input** dengan Joi
- **Rate Limiting** & Logging (Winston)
- **Docker & Docker-Compose** untuk development environment

## Fitur

1. **Autentikasi & Otorisasi**
   - Login: `/api/auth/login`
   - Refresh Token: `/api/auth/refresh`
   - Logout: `/api/auth/logout`
   - JWT + Refresh Token (disimpan di Redis)
   - Audit log untuk login & logout

2. **User Management**
   - CRUD User (admin only)
   - Update profil (user sendiri)
   - Export CSV
   - Pagination, filter, sort
   - Soft delete
   - Audit log untuk setiap create, update, delete

3. **Audit Log**
   - Semua CREATE / UPDATE / DELETE dicatat di tabel `audit_logs`

4. **Keamanan**
   - Input validation (Joi)
   - Rate limiting (max 100 requests / 10 menit per IP)
   - Logging requestId (Winston)

## Prasyarat

- Node.js v18
- npm / yarn
- Docker & Docker Compose
- MySQL & Redis (via Docker atau lokal)

## Setup Project

1. **Clone repository**

```bash
git clone <REPO_URL>
cd backend
Install dependencies

bash
Salin kode
npm install
Buat file environment .env

env
Salin kode
PORT=3000

# MySQL
DB_HOST=mysql
DB_NAME=testdb
DB_USER=user
DB_PASSWORD=password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=supersecret
Jalankan Docker (MySQL + Redis)

bash
Salin kode
docker-compose up -d
Jalankan migration & seeder

bash
Salin kode
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
Jalankan backend (development)

bash
Salin kode
npm run dev
Server akan berjalan di: http://localhost:3000

Health check: http://localhost:3000/health → { "status": "OK" }

Build & production

bash
Salin kode
npm run build
npm start
Endpoint API
Auth
Endpoint	Method	Body	Role	Keterangan
/api/auth/login	POST	{ username, password }	Semua	Login, return access + refresh token
/api/auth/refresh	POST	{ refreshToken }	Semua	Refresh token, rotate refresh
/api/auth/logout	POST	-	Authenticated	Hapus refresh token, audit log

Users
Endpoint	Method	Body	Role	Keterangan
/api/users	GET	-	admin	List users (pagination, filter, sort, cache Redis)
/api/users/:id	GET	-	admin/user	Detail user (cache Redis)
/api/users	POST	{ name, username, password, confirm_password, role }	admin	Create user + audit log
/api/users/:id	PUT	{ name, username, role }	admin/user	Update user + audit log
/api/users/:id/password	PUT	{ password, confirm_password }	admin/user	Update password
/api/users/:id	DELETE	{ confirm_password }	admin	Soft delete user
/api/users/export	GET	-	admin	Export CSV users

Testing
Unit & integration test:

bash
Salin kode
npm run test
Coverage minimal 80%

Pastikan Redis & MySQL aktif saat testing

Code Quality
ESLint + Prettier

Struktur folder modular: controllers, services, models, middleware, utils, validators

Docker
Dockerfile sudah tersedia

docker-compose.yml jalankan backend + MySQL + Redis

Port backend: 3000

bash
Salin kode
docker-compose up -d
Database
Tables: users, audit_logs

Seeder: 2 admin + 2 user (dummy)

Soft delete: deleted_at pada users

Audit log otomatis untuk semua perubahan data

Export CSV mendukung data besar

Notes
Refresh token di-rotate setiap pemakaian

Redis TTL: 60 detik untuk cache list & detail user

Semua perubahan data dicatat di audit_logs

Export CSV mendukung data besar
```
