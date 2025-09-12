<h1>Backend – Fullstack Technical Test</h1>

<h2>📜 Deskripsi Proyek</h2>
<p>Proyek backend ini adalah sebuah <strong>RESTful API</strong> yang dibangun menggunakan <strong>Node.js 18</strong>, <strong>Express.js</strong>, dan <strong>TypeScript</strong>. Proyek ini dilengkapi dengan berbagai fitur penting seperti otentikasi, manajemen pengguna, dan pencatatan audit. Database yang digunakan adalah <strong>MySQL</strong> dengan <strong>Sequelize ORM</strong>, sementara <strong>Redis</strong> digunakan untuk caching dan manajemen <em>refresh token</em>. Proyek ini juga sudah dilengkapi dengan konfigurasi <strong>Docker & Docker-Compose</strong> untuk mempermudah proses pengembangan.</p>

<hr/>

<h2>✨ Fitur Utama</h2>
<ul>
  <li><strong>Autentikasi & Otorisasi</strong>:
    <ul>
      <li>JWT & Refresh Token yang disimpan di Redis.</li>
      <li>Role-Based Access Control (RBAC) dengan peran <code>admin</code> dan <code>user</code>.</li>
    </ul>
  </li>
  <li><strong>Manajemen Pengguna</strong>:
    <ul>
      <li>CRUD (Create, Read, Update, Delete) untuk pengguna (khusus admin).</li>
      <li>Pengguna dapat memperbarui profil mereka sendiri.</li>
      <li>Fitur <strong>export CSV</strong> untuk data pengguna besar.</li>
      <li>Soft delete pada data pengguna.</li>
      <li>Pagination, filter, dan sorting untuk daftar pengguna.</li>
    </ul>
  </li>
  <li><strong>Audit Log</strong>:
    <ul>
      <li>Semua perubahan data (CREATE, UPDATE, DELETE) dicatat di tabel <code>audit_logs</code>.</li>
      <li>Audit log juga dicatat untuk aktivitas login/logout.</li>
    </ul>
  </li>
  <li><strong>Keamanan & Performa</strong>:
    <ul>
      <li>Validasi input menggunakan Joi/Zod.</li>
      <li>Rate limiting: max 100 requests/10 menit per IP.</li>
      <li>Caching data pengguna di Redis dengan TTL 60 detik.</li>
      <li>Logging menggunakan Winston/Pino + requestId.</li>
    </ul>
  </li>
  <li><strong>Dokumentasi API</strong>:
    <ul>
      <li>Swagger/OpenAPI tersedia di <a href="http://localhost:3000/api-docs">http://localhost:3000/api-docs</a></li>
      <li>Menampilkan semua endpoint, request & response schema, dan autentikasi Bearer token.</li>
    </ul>
  </li>
</ul>

<hr/>

<h2>🛠️ Prasyarat</h2>
<ul>
  <li>Node.js v18 atau versi lebih baru.</li>
  <li>npm atau yarn.</li>
  <li>Docker & Docker Compose.</li>
</ul>

<hr/>

<h2>🚀 Setup Proyek</h2>

<h3>1. Clone Repositori & Instal Dependensi</h3>
<pre><code>git clone &lt;https://github.com/arizki07/backend-express.git&gt;
cd backend
npm install
</code></pre>

<h3>2. Konfigurasi Environment</h3>
<p>Buat file <code>.env</code> di root proyek:</p>
<pre><code>PORT=3000
# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=db_express
DB_USER=root
DB_PASSWORD=

# Redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT

JWT_SECRET=supersecret
</code></pre>

<h3>3. Jalankan Layanan dengan Docker</h3>
<pre><code>docker-compose up -d
</code></pre>

<h3>4. Migrasi & Seeder Database</h3>
<p>Isi data awal 2 admin dan 2 user:</p>
<pre><code>npm sequelize-cli db:migrate
npm sequelize-cli db:seed:all
</code></pre>

<h3>5. Jalankan Aplikasi</h3>
<pre><code>npm run dev
</code></pre>
<p>Aplikasi berjalan di <a href="http://localhost:3000">http://localhost:3000</a>. Health check: <a href="http://localhost:3000/health">/health</a></p>

<h3>6. Build & Produksi</h3>
<pre><code>npm run build
npm start
</code></pre>

<hr/>

<h2>📄 Endpoint API</h2>

<h3>Otentikasi</h3>
<table>
  <tr>
    <th>Endpoint</th><th>Method</th><th>Body</th><th>Role</th><th>Keterangan</th>
  </tr>
  <tr>
    <td>/api/auth/login</td><td>POST</td><td>{ username, password }</td><td>Semua</td><td>Login, mengembalikan access token & refresh token</td>
  </tr>
  <tr>
    <td>/api/auth/refresh</td><td>POST</td><td>{ refreshToken }</td><td>Semua</td><td>Perbarui access token & rotasi refresh token</td>
  </tr>
  <tr>
    <td>/api/auth/logout</td><td>POST</td><td>-</td><td>Authenticated</td><td>Hapus refresh token & catat audit log</td>
  </tr>
</table>

<h3>Users</h3>
<table>
  <tr>
    <th>Endpoint</th><th>Method</th><th>Body</th><th>Role</th><th>Keterangan</th>
  </tr>
  <tr>
    <td>/api/users</td><td>GET</td><td>-</td><td>admin</td><td>Daftar pengguna (pagination, filter, sorting)</td>
  </tr>
  <tr>
    <td>/api/users/:id</td><td>GET</td><td>-</td><td>admin, user</td><td>Detail pengguna</td>
  </tr>
  <tr>
    <td>/api/users</td><td>POST</td><td>{ name, username, password, confirm_password, role }</td><td>admin</td><td>Buat pengguna baru</td>
  </tr>
  <tr>
    <td>/api/users/:id</td><td>PUT</td><td>{ name, username, role }</td><td>admin, user</td><td>Update detail pengguna</td>
  </tr>
  <tr>
    <td>/api/users/:id/password</td><td>PUT</td><td>{ password, confirm_password }</td><td>admin, user</td><td>Update password pengguna</td>
  </tr>
  <tr>
    <td>/api/users/:id</td><td>DELETE</td><td>{ confirm_password }</td><td>admin</td><td>Soft delete pengguna</td>
  </tr>
  <tr>
    <td>/api/users/export</td><td>GET</td><td>-</td><td>admin</td><td>Export CSV pengguna</td>
  </tr>
</table>

<h3>Dokumentasi Swagger/OpenAPI</h3>
<p>Semua endpoint bisa diakses di <a href="http://localhost:3000/api-docs">http://localhost:3000/api-docs</a>. Swagger menampilkan schema request/response, parameter, dan autentikasi Bearer token.</p>

<hr/>

<h2>🧪 Testing</h2>
<p>Unit & Integration Test tersedia. Pastikan MySQL & Redis aktif:</p>
<pre><code>npm run test
</code></pre>
<p>Target code coverage minimal 80%</p>

<hr/>

<h2>📁 Struktur Proyek</h2>
<ul>
  <li>controllers</li>
  <li>services</li>
  <li>models</li>
  <li>middleware</li>
  <li>validators</li>
  <li>utils</li>
</ul>

<hr/>

<h2>📝 Catatan Tambahan</h2>
<ul>
  <li>Refresh Token dirotasi setiap digunakan.</li>
  <li>Data pengguna di-cache di Redis dengan TTL 60 detik.</li>
  <li>Semua perubahan data dicatat di tabel <code>audit_logs</code>.</li>
  <li>Fitur export CSV dirancang untuk menangani volume data besar.</li>
</ul>
