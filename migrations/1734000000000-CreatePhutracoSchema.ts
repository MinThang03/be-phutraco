import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhutracoSchema1734000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "phutraco"`);

    // Create articles table
    await queryRunner.query(`
      CREATE TABLE "phutraco"."articles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL UNIQUE,
        "excerpt" text,
        "content" text NOT NULL,
        "thumbnail_url" character varying(500),
        "author_id" integer NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_articles_id" PRIMARY KEY ("id")
      );
    `);

    // Create images table
    await queryRunner.query(`
      CREATE TABLE "phutraco"."images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "filename" character varying(255) NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size" bigint NOT NULL,
        "path" character varying(500) NOT NULL,
        "url" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_images_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "phutraco"."images"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "phutraco"."articles"`);

    // Drop schema
    await queryRunner.query(`DROP SCHEMA IF EXISTS "phutraco"`);
  }
}
