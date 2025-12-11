import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Image } from './src/images/image.entity';
import { Article } from './src/articles/articles.entity';
import { User } from './src/users/user.entity';
import { UserSession } from './src/auth/user-session.entity';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Image, Article, User, UserSession],
  migrations: ['./migrations/*.ts'],
  ssl: {
    rejectUnauthorized: false,
  },
  logging: false,
});