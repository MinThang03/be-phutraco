import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleSessionCleanup() {
    this.logger.log('Starting expired sessions cleanup...');
    try {
      await this.authService.cleanupExpiredSessions();
      this.logger.log('Expired sessions cleanup completed successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error);
    }
  }

  // Also run cleanup every 6 hours for more frequent cleaning
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleFrequentCleanup() {
    this.logger.debug('Running frequent session cleanup...');
    try {
      await this.authService.cleanupExpiredSessions();
      this.logger.debug('Frequent cleanup completed');
    } catch (error) {
      this.logger.error('Frequent cleanup failed', error);
    }
  }
}
