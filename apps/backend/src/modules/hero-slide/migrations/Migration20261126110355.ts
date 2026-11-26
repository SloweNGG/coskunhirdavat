import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261126110355 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "hero_slide" ("id" text not null, "eyebrow" text null, "title" text not null, "accent" text null, "description" text null, "button_text" text null, "button_url" text null, "secondary_button_text" text null, "secondary_button_url" text null, "image_url" text null, "image_style" text check ("image_style" in ('card', 'background')) not null default 'card', "theme" text check ("theme" in ('dark', 'brand', 'light')) not null default 'dark', "show_stamp" boolean not null default false, "duration" integer not null default 6, "is_active" boolean not null default true, "rank" integer not null default 0, "starts_at" timestamptz null, "ends_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "hero_slide_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_hero_slide_deleted_at" ON "hero_slide" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "hero_slide" cascade;`);
  }

}
