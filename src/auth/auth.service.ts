import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserSession } from './user-session.entity';
import { User } from '../users/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  async hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(refreshToken, 12);
  }

  async validateRefreshToken(
    plainToken: string,
    hashedToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainToken, hashedToken);
  }

  async createSession(
    userId: string,
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<UserSession> {
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const session = this.sessionRepository.create({
      userId,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return this.sessionRepository.save(session);
  }

  async findSessionByToken(
    userId: string,
    refreshToken: string,
  ): Promise<UserSession | null> {
    const sessions = await this.sessionRepository.find({
      where: { userId },
    });

    for (const session of sessions) {
      const isValid = await this.validateRefreshToken(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isValid) {
        return session;
      }
    }

    return null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async register(email: string, password: string, name: string): Promise<User> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await this.hashPassword(password);
    return this.usersService.create({ email, passwordHash, name });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await this.validatePassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return user;
  }

  async login(
    email: string,
    password: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.findSessionByToken(payload.sub, refreshToken);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (new Date() > session.expiresAt) {
      await this.deleteSession(session.id);
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Token rotation: delete old session
    await this.deleteSession(session.id);

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Create new session
    await this.createSession(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const session = await this.findSessionByToken(userId, refreshToken);
    if (session) {
      await this.deleteSession(session.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.deleteAllUserSessions(userId);
  }
}
