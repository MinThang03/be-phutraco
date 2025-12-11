# Dashboard ICS Backend - Image Management System

## Overview

This NestJS backend application provides a complete image management system with automatic database migrations for the dashboard schema.

## Features

- ✅ **Automatic Migrations**: Migrations run automatically when the application starts (`npm start`)
- ✅ **Image Upload**: Upload images with validation (JPEG, PNG, GIF, WebP)
- ✅ **Image Download**: Serve images with proper content types and caching
- ✅ **Image Management**: List, view info, and delete images
- ✅ **Database Schema**: Images stored in `dashboard.images` table in PostgreSQL
- ✅ **File Storage**: Images stored locally in `uploads/` directory
- ✅ **CORS Enabled**: Cross-origin requests supported

## Database Setup

The application uses the `dashboard` schema in PostgreSQL (Supabase). The migration automatically:
- Creates the `dashboard` schema if it doesn't exist
- Creates the `images` table with all necessary columns and indices

### Images Table Structure

```sql
CREATE TABLE dashboard.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  path VARCHAR(500) NOT NULL,
  url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Upload Image
- **POST** `/api/images/upload`
- **Body**: FormData with `image` field
- **Response**: Image metadata object

### Get All Images
- **GET** `/api/images?page=1&limit=10`
- **Response**: Paginated list of images

### Download Image
- **GET** `/api/images/:filename`
- **Response**: Image file with proper headers

### Get Image Info
- **GET** `/api/images/info/:id`
- **Response**: Image metadata

### Delete Image
- **DELETE** `/api/images/:id`
- **Response**: Success message

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` (if needed)
   - Update database credentials in `.env`

3. **Start the application:**
   ```bash
   npm start
   ```
   
   This will:
   - Build the application
   - Run database migrations automatically
   - Start the server on port 3005

## Development

### Available Scripts

- `npm start` - Build and start the application (runs migrations)
- `npm run start:dev` - Start in development mode with watch
- `npm run build` - Build the application
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run migrations manually
- `npm run migration:revert` - Revert last migration

### Testing

Access the test interface at: http://localhost:3005/public/image-test.html

This provides a web interface to:
- Upload images
- View uploaded images
- Delete images
- Test all API endpoints

## File Structure

```
src/
├── images/
│   ├── image.entity.ts      # TypeORM entity for images table
│   ├── image.service.ts     # Business logic for image operations
│   ├── image.controller.ts  # API endpoints
│   └── image.module.ts      # NestJS module configuration
├── config/
│   └── database.config.ts   # Database configuration
├── app.module.ts            # Main application module
└── main.ts                  # Application bootstrap

migrations/
└── 1727520000000-CreateImagesTable.ts  # Database migration

public/
└── image-test.html          # Test interface
```

## Configuration

### Environment Variables

- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password  
- `DB_NAME` - Database name
- `PORT` - Application port (default: 3005)

### Upload Limits

- Maximum file size: 5MB
- Allowed formats: JPEG, PNG, GIF, WebP
- Files stored in: `./uploads/` directory

## Usage Example

### Upload an image:
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:3005/api/images/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Image uploaded:', data);
  // Access image at: http://localhost:3005/api/images/[filename]
});
```

### Get all images:
```javascript
fetch('http://localhost:3005/api/images')
.then(response => response.json())
.then(data => {
  console.log('Images:', data.data);
});
```

## Notes

- Images are stored both in the database (metadata) and file system (actual files)
- The system uses UUIDs for image IDs
- Images are served with caching headers for performance
- The application automatically creates the uploads directory if it doesn't exist
- Migrations run automatically on application startup (no manual intervention needed)