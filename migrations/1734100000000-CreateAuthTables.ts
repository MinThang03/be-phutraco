import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1734100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "phutraco"."users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL UNIQUE,
        "password_hash" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "role" character varying(20) NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      );
    `);

    // Create index on email for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "phutraco"."users" ("email");
    `);

    // Create user_sessions table
    await queryRunner.query(`
      CREATE TABLE "phutraco"."user_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" text NOT NULL,
        "user_agent" text,
        "ip_address" character varying(45),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_sessions_user_id" FOREIGN KEY ("user_id") 
          REFERENCES "phutraco"."users"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_user_id" ON "phutraco"."user_sessions" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_expires_at" ON "phutraco"."user_sessions" ("expires_at");
    `);

    // Insert default admin user (password: admin@123456)
    // Password hash generated with bcrypt salt rounds 12
    await queryRunner.query(`
      INSERT INTO "phutraco"."users" ("email", "password_hash", "name", "role")
      VALUES ('admin@phutraco.vn', '$2b$12$/KmmL6e8QzrnJpS.l7GPQuH8Xo/fuqyCRNGGEhVuTTti.TdskwBzi', 'Admin Phutraco', 'admin')
      ON CONFLICT ("email") DO UPDATE SET "password_hash" = '$2b$12$/KmmL6e8QzrnJpS.l7GPQuH8Xo/fuqyCRNGGEhVuTTti.TdskwBzi';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "phutraco"."IDX_user_sessions_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "phutraco"."IDX_user_sessions_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "phutraco"."IDX_users_email"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "phutraco"."user_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "phutraco"."users"`);
  }
}
