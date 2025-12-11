require('dotenv').config();
const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function updateAdminPassword() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const newHash = '$2b$12$/KmmL6e8QzrnJpS.l7GPQuH8Xo/fuqyCRNGGEhVuTTti.TdskwBzi';
    
    const result = await dataSource.query(
      `UPDATE phutraco.users SET password_hash = $1 WHERE email = $2`,
      [newHash, 'admin@phutraco.vn']
    );
    
    console.log('Password hash updated successfully');
    console.log('Affected rows:', result[1]);

    // Verify
    const user = await dataSource.query(
      `SELECT email, name, role FROM phutraco.users WHERE email = $1`,
      ['admin@phutraco.vn']
    );
    console.log('Admin user:', user[0]);

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateAdminPassword();
