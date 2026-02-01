-- CreateEnum
CREATE TABLE "images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL UNIQUE,
    "thumbnail_path" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "hash" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "image_metadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image_id" INTEGER NOT NULL,
    "exif_make" TEXT,
    "exif_model" TEXT,
    "exif_iso" INTEGER,
    "exif_aperture" REAL,
    "exif_exposure_time" TEXT,
    "gps_latitude" REAL,
    "gps_longitude" REAL,
    "gps_altitude" REAL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "image_metadata_image_id_key" UNIQUE("image_id")
);

-- CreateTable
CREATE TABLE "image_tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "image_tags_image_id_idx" ON "image_tags"("image_id");

-- CreateIndex
CREATE INDEX "image_tags_tag_idx" ON "image_tags"("tag");

-- 创建FTS5虚拟表用于全文搜索
CREATE VIRTUAL TABLE "images_fts" USING fts5(
    "filename",
    "description",
    content="images",
    content_rowid="id",
    tokenize='porter unicode61'
);

-- 创建触发器，当images表更新时自动更新FTS表
CREATE TRIGGER "images_fts_insert" AFTER INSERT ON "images" BEGIN
    INSERT INTO "images_fts"(rowid, filename, description)
    VALUES (NEW.id, NEW.filename, NULL);
END;

CREATE TRIGGER "images_fts_delete" AFTER DELETE ON "images" BEGIN
    DELETE FROM "images_fts" WHERE rowid = OLD.id;
END;

CREATE TRIGGER "images_fts_update" AFTER UPDATE ON "images" BEGIN
    DELETE FROM "images_fts" WHERE rowid = OLD.id;
    INSERT INTO "images_fts"(rowid, filename, description)
    VALUES (NEW.id, NEW.filename, NULL);
END;

-- 添加外键约束
CREATE INDEX "image_metadata_image_id_idx" ON "image_metadata"("image_id");

-- Foreign Key
CREATE TABLE "image_metadata_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image_id" INTEGER NOT NULL,
    "exif_make" TEXT,
    "exif_model" TEXT,
    "exif_iso" INTEGER,
    "exif_aperture" REAL,
    "exif_exposure_time" TEXT,
    "gps_latitude" REAL,
    "gps_longitude" REAL,
    "gps_altitude" REAL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "image_metadata_image_id_key" UNIQUE("image_id"),
    FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "image_metadata_new" SELECT * FROM "image_metadata";
DROP TABLE "image_metadata";
ALTER TABLE "image_metadata_new" RENAME TO "image_metadata";

-- Foreign Key
CREATE TABLE "image_tags_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "image_tags_new" SELECT * FROM "image_tags";
DROP TABLE "image_tags";
ALTER TABLE "image_tags_new" RENAME TO "image_tags";

-- 重新创建索引
CREATE INDEX "image_tags_image_id_idx" ON "image_tags"("image_id");
CREATE INDEX "image_tags_tag_idx" ON "image_tags"("tag");
