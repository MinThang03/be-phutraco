import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Image } from '../images/image.entity';
import { Article } from 'src/articles/articles.entity';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: +configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true, // Enable auto-run migrations on app startup
  synchronize: false, // Use migrations instead of sync
  ssl: {
    rejectUnauthorized: false, // For Supabase connection
  },
  logging: process.env.NODE_ENV === 'development',
});
