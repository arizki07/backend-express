# Backend – Fullstack Technical Test

## 📜 Deskripsi Proyek
Proyek backend ini adalah sebuah **RESTful API** yang dibangun menggunakan **Node.js 18**, **Express.js**, dan **TypeScript**. Proyek ini dilengkapi dengan berbagai fitur penting seperti otentikasi, manajemen pengguna, dan pencatatan audit. Database yang digunakan adalah **MySQL** dengan **Sequelize ORM**, sementara **Redis** digunakan untuk caching dan manajemen *refresh token*. Proyek ini juga sudah dilengkapi dengan konfigurasi **Docker & Docker-Compose** untuk mempermudah proses pengembangan.

---

## ✨ Fitur Utama
- **Autentikasi & Otorisasi**: Menggunakan **JWT** dan **Refresh Token** yang disimpan di Redis. Sistem ini mendukung **RBAC** (Role-Based Access Control) dengan peran **`admin`** dan **`user`**.
- **Manajemen Pengguna**:
  - Operasi **CRUD** (Create, Read, Update, Delete) untuk pengguna (khusus `admin`).
  - Pengguna dapat memperbarui profil mereka sendiri.
  - Fitur **export data pengguna dalam format CSV** yang dioptimalkan untuk data berukuran besar.
  - Implementasi **soft delete** pada data pengguna.
  - Dilengkapi dengan **pagination, filter, dan sorting** untuk daftar pengguna.
- **Audit Log**:
  - Semua perubahan data (`CREATE`, `UPDATE`, `DELETE`) secara otomatis dicatat di tabel **`audit_logs`**.
  - Catatan log juga dibuat untuk setiap aktivitas **login** dan **logout**.
- **Keamanan & Performa**:
  - **Validasi input** menggunakan **Joi** untuk mencegah data yang tidak valid.
  - **Rate Limiting** untuk membatasi permintaan per IP.
  - **Caching** data pengguna di Redis untuk meningkatkan performa.

---

## 🛠️ Prasyarat
Pastikan Anda sudah menginstal aplikasi berikut:
- **Node.js v18** atau versi lebih baru.
- **npm** atau **yarn**.
- **Docker** dan **Docker Compose**.

---

## 🚀 Setup Proyek

### 1. Clone Repositori dan Instal Dependensi
```bash
git clone <REPO_URL>
cd backend
npm install
2. Konfigurasi Environment
Buat file .env di direktori root proyek dan isi dengan konfigurasi berikut:

PORT=3000
# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=db_express
DB_USER=root      
DB_PASSWORD=rizki123       

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
JWT_SECRET=supersecret

3. Jalankan Layanan dengan Docker
Gunakan Docker Compose untuk menjalankan database MySQL dan Redis:

Bash

docker-compose up -d
4. Migrasi dan Seeder Database
Jalankan migrasi database dan seeder untuk mengisi data awal (2 admin dan 2 user):

Bash

npm sequelize-cli db:migrate
npm sequelize-cli db:seed:all

5. Jalankan Aplikasi
Untuk menjalankan server dalam mode pengembangan:
npm run dev
Aplikasi akan berjalan di http://localhost:3000. Anda bisa melakukan health check dengan mengakses http://localhost:3000/health.

6. Build & Produksi
Untuk build dan menjalankan mode produksi:
npm run build
npm start

📄 Endpoint API
Otentikasi
Endpoint	Method	Body	Role	Keterangan
/api/auth/login	POST	{ username, password }	Semua	Login, mengembalikan access token dan refresh token.
/api/auth/refresh	POST	{ refreshToken }	Semua	Memperbarui access token dan merotasi refresh token.
/api/auth/logout	POST	-	Authenticated	Menghapus refresh token dan mencatat di audit log.

Export to Sheets
Users
Endpoint	Method	Body	Role	Keterangan
/api/users	GET	-	admin	Menampilkan daftar pengguna (dengan pagination, filter, dan sorting).
/api/users/:id	GET	-	admin, user	Menampilkan detail pengguna.
/api/users	POST	{ name, username, password, confirm_password, role }	admin	Membuat pengguna baru.
/api/users/:id	PUT	{ name, username, role }	admin, user	Memperbarui detail pengguna.
/api/users/:id/password	PUT	{ password, confirm_password }	admin, user	Memperbarui password pengguna.
/api/users/:id	DELETE	{ confirm_password }	admin	Menghapus pengguna secara soft delete.
/api/users/export	GET	-	admin	Mengekspor data pengguna ke CSV.

Export to Sheets
🧪 Testing
Proyek ini memiliki Unit dan Integration Test. Untuk menjalankannya, pastikan MySQL dan Redis sedang aktif:

Bash

npm run test
Target code coverage minimal adalah 80%.

📁 Struktur Proyek
Struktur folder dirancang secara modular untuk memisahkan fungsi berdasarkan perannya, seperti: controllers, services, models, middleware, utils, dan validators.

📝 Catatan Tambahan
Refresh Token di-rotasi setiap kali digunakan.

Data daftar dan detail pengguna di-cache di Redis dengan TTL (Time-to-Live) 60 detik.

Semua perubahan data (CREATE, UPDATE, DELETE) secara otomatis dicatat di tabel audit_logs.

Fitur export CSV dirancang untuk menangani volume data yang besar secara efisien.
