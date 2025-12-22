import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticlesEnTable1735000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create articles_en table (English articles)
    await queryRunner.query(`
      CREATE TABLE "phutraco"."articles_en" (
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
        CONSTRAINT "PK_articles_en_id" PRIMARY KEY ("id")
      );
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_articles_en_slug" ON "phutraco"."articles_en" ("slug");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_articles_en_status" ON "phutraco"."articles_en" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_articles_en_author_id" ON "phutraco"."articles_en" ("author_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "phutraco"."articles_en"`);
  }
}
