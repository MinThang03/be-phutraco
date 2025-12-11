import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { SessionCleanupService } from './session-cleanup.service';
import { UsersModule } from '../users/users.module';
import { UserSession } from './user-session.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([UserSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, SessionCleanupService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
