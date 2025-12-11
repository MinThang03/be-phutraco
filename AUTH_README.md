# Authentication System Documentation

## 📋 Overview

Hệ thống xác thực JWT 2-token được xây dựng theo chuẩn bảo mật 2025 cho ứng dụng Phutraco Holding.

## 🏗️ Architecture

### Two-Token System

#### 1. **Access Token**
- **Thời hạn**: 15 phút
- **Lưu trữ**: Memory (React Context)
- **Payload**: 
  ```json
  {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "admin",
    "iat": 1234567890,
    "exp": 1234567890
  }
  ```
- **Sử dụng**: Gửi trong header `Authorization: Bearer <access_token>` cho mỗi request

#### 2. **Refresh Token**
- **Thời hạn**: 30 ngày
- **Lưu trữ**: httpOnly Cookie
- **Cookie options**:
  - `httpOnly`: true (không thể đọc bằng JavaScript)
  - `secure`: true (chỉ gửi qua HTTPS trong production)
  - `sameSite`: strict (chống CSRF)
  - `maxAge`: 30 days

## 🔐 Security Features

### 1. Token Rotation
- Mỗi lần refresh → tạo refresh token mới
- Vô hiệu hóa refresh token cũ ngay lập tức
- Ngăn chặn token replay attacks

### 2. Session Management
Mỗi session lưu trữ:
- `user_id`: ID của user
- `refresh_token_hash`: Hash của refresh token (bcrypt)
- `user_agent`: Browser/device fingerprint
- `ip_address`: IP address của client
- `expires_at`: Thời điểm hết hạn
- `created_at`: Thời điểm tạo

### 3. Password Security
- **Algorithm**: bcrypt
- **Salt rounds**: 12
- Mật khẩu không bao giờ được lưu dạng plaintext

### 4. Auto Cleanup
- Scheduled task chạy mỗi 6 giờ
- Xóa các expired sessions từ database
- Giữ database clean và tối ưu performance

## 📡 API Endpoints

### Authentication Routes

#### 1. Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response (201)**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

**Validation**:
- Email phải unique
- Password tối thiểu 8 ký tự

---

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  }
}
```

**Cookie Set**:
```
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/
```

---

#### 3. Refresh Token
```http
POST /auth/refresh
Cookie: refreshToken=<refresh_token>
```

**Response (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: 
- Cũng set cookie `refreshToken` mới (token rotation)
- Refresh token cũ bị vô hiệu hóa

---

#### 4. Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

**Actions**:
- Xóa session hiện tại từ database
- Clear refresh token cookie

---

#### 5. Logout All Devices
```http
POST /auth/logout-all
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "message": "Logged out from all devices successfully"
}
```

**Actions**:
- Xóa TẤT CẢ sessions của user từ database
- Clear refresh token cookie

---

#### 6. Get Current User
```http
POST /auth/me
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

## 🔒 Protected Routes

### Articles Management
```http
POST /api/articles          # Tạo bài viết mới
PUT /api/articles/:id       # Cập nhật bài viết
DELETE /api/articles/:id    # Xóa bài viết
```

**Protected by**: `@UseGuards(JwtAuthGuard)`

**Required**: `Authorization: Bearer <access_token>`

### Public Routes
```http
GET /api/articles           # Lấy danh sách bài viết
GET /api/articles/:id       # Lấy chi tiết bài viết
GET /api/articles/slug/:slug # Lấy bài viết theo slug
```

## 🔄 Authentication Flow

### 1. Login Flow
```
Client                          Server                      Database
  |                               |                             |
  |---(1) POST /auth/login------->|                             |
  |    email + password           |                             |
  |                               |---(2) Validate password---->|
  |                               |<---user data----------------|
  |                               |                             |
  |                               |---(3) Generate tokens------>|
  |                               |     - Access Token (15m)    |
  |                               |     - Refresh Token (30d)   |
  |                               |                             |
  |                               |---(4) Hash refresh token--->|
  |                               |<---session created----------|
  |                               |                             |
  |<--(5) Response----------------|                             |
  |    accessToken (JSON)         |                             |
  |    + Set-Cookie refreshToken  |                             |
```

### 2. API Request Flow
```
Client                          Server                      Database
  |                               |                             |
  |---(1) GET /api/articles------>|                             |
  |    Authorization: Bearer token|                             |
  |                               |                             |
  |                               |---(2) Validate JWT-------->|
  |                               |     JwtAuthGuard            |
  |                               |<---valid/invalid-----------|
  |                               |                             |
  |<--(3) Response----------------|                             |
  |    200 OK / 401 Unauthorized  |                             |
```

### 3. Token Refresh Flow
```
Client                          Server                      Database
  |                               |                             |
  |---(1) POST /auth/refresh----->|                             |
  |    Cookie: refreshToken       |                             |
  |                               |                             |
  |                               |---(2) Validate & hash------>|
  |                               |<---session found------------|
  |                               |                             |
  |                               |---(3) Delete old session--->|
  |                               |                             |
  |                               |---(4) Generate new tokens-->|
  |                               |                             |
  |                               |---(5) Save new session----->|
  |                               |<---success------------------|
  |                               |                             |
  |<--(6) Response----------------|                             |
  |    new accessToken (JSON)     |                             |
  |    + Set-Cookie new refreshToken |                         |
```

## 💻 Frontend Implementation

### AuthService
Located: `services/auth.service.ts`

**Key Methods**:
- `login(email, password)` - Đăng nhập
- `refresh()` - Làm mới token
- `logout()` - Đăng xuất
- `logoutAll()` - Đăng xuất tất cả
- `getCurrentUser()` - Lấy thông tin user
- `getAccessToken()` - Lấy access token
- `isAuthenticated()` - Kiểm tra trạng thái đăng nhập

### AuthContext
Located: `lib/auth-context.tsx`

**Features**:
- Auto-refresh token every 14 minutes
- Protected route HOC `withAuth()`
- Global authentication state
- Automatic redirect to login on 401

### HTTP Interceptor
Located: `services/articles.service.ts`

**Auto-features**:
- Tự động thêm Authorization header
- Tự động refresh token khi 401
- Retry failed request sau khi refresh
- Redirect to login nếu refresh fail

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3005

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=your-database

# JWT Secrets
JWT_ACCESS_SECRET=your-very-secure-access-secret-key-here
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
```

## 🐛 Troubleshooting

### Problem: 401 Unauthorized on protected routes
**Solution**: 
- Check if access token exists
- Verify JWT_ACCESS_SECRET matches between login and verification
- Check token expiration time

### Problem: Cookies not being sent
**Solution**:
- Ensure `credentials: 'include'` in fetch requests
- Check CORS configuration allows credentials
- Verify frontend URL matches CORS origin

### Problem: Token refresh fails
**Solution**:
- Check refresh token cookie exists
- Verify JWT_REFRESH_SECRET is correct
- Check session exists in database
- Ensure session hasn't expired

### Problem: Auto-refresh not working
**Solution**:
- Check AuthContext is properly wrapped around app
- Verify useEffect interval is running
- Check browser console for errors

## 🔑 Default Admin Account

**Email**: `admin@phutraco.vn`  
**Password**: `admin@123456`

⚠️ **IMPORTANT**: Change this password immediately in production!

## 📝 Best Practices

1. **Never log tokens** in production
2. **Always use HTTPS** in production
3. **Rotate JWT secrets** periodically
4. **Monitor failed login attempts**
5. **Implement rate limiting** on auth endpoints
6. **Use strong passwords** (minimum 8 characters)
7. **Keep dependencies updated**
8. **Backup database** regularly including sessions table

## 🚀 Deployment Checklist

- [ ] Set secure JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS (secure cookies)
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL to production domain
- [ ] Change default admin password
- [ ] Enable database SSL
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up automated backups

## 📞 Support

For issues or questions, contact the development team.
