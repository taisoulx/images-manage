use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::fs;

pub fn get_database_path() -> PathBuf {
    // 在开发模式下，使用项目根目录的 dev.db
    // 在生产模式下，使用应用数据目录
    if cfg!(debug_assertions) {
        // 开发模式：使用项目根目录
        let mut path = std::env::current_exe().unwrap();
        // 在 Tauri 开发模式下，可执行文件在 src-tauri/target/debug 下
        // 需要向上查找项目根目录（包含 dev.db 的地方）
        for _ in 0..5 {
            path.pop();
        }
        path.push("dev.db");
        path
    } else {
        // 生产模式：使用应用数据目录
        let mut path = std::env::current_exe().unwrap();
        path.pop();
        path.push("dev.db");
        path
    }
}

// 重新导出配置模块的函数
pub use crate::config::get_images_dir;

/// 确保图片存储目录存在
pub fn ensure_images_dir() -> Result<(), String> {
    let images_dir = get_images_dir();
    if !images_dir.exists() {
        fs::create_dir_all(&images_dir)
            .map_err(|e| format!("创建图片目录失败: {}", e))?;
    }
    Ok(())
}

/// 根据哈希值生成图片存储路径
pub fn get_image_storage_path(hash: &str, extension: &str) -> PathBuf {
    let mut path = get_images_dir();
    // 使用哈希的前两位作为子目录，避免单个目录文件过多
    let prefix = &hash[..hash.len().min(2)];
    path.push(prefix);
    path.push(format!("{}{}", hash, extension));
    path
}

pub fn get_connection() -> SqliteResult<Connection> {
    let db_path = get_database_path();

    // 如果数据库不存在，创建它
    if !db_path.exists() {
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).ok();
        }
    }

    Connection::open(&db_path)
}

pub fn init_database() -> SqliteResult<()> {
    let conn = get_connection()?;

    // 创建 images 表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS images (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            thumbnail_path TEXT,
            size INTEGER NOT NULL DEFAULT 0,
            hash TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // 创建 image_metadata 表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS image_metadata (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL,
            exif_make TEXT,
            exif_model TEXT,
            exif_iso INTEGER,
            exif_aperture REAL,
            exif_exposure_time TEXT,
            gps_latitude REAL,
            gps_longitude REAL,
            gps_altitude REAL,
            description TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT image_metadata_image_id_key UNIQUE(image_id),
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 创建 image_tags 表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS image_tags (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL,
            tag TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS image_tags_image_id_idx ON image_tags(image_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS image_tags_tag_idx ON image_tags(tag)",
        [],
    )?;

    // 删除旧的 FTS 表和触发器（如果存在）
    let _ = conn.execute("DROP TRIGGER IF EXISTS images_fts_insert", []);
    let _ = conn.execute("DROP TRIGGER IF EXISTS images_fts_delete", []);
    let _ = conn.execute("DROP TRIGGER IF EXISTS images_fts_update", []);
    let _ = conn.execute("DROP TABLE IF EXISTS images_fts", []);

    // 创建 FTS5 全文搜索表
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS images_fts USING fts5(
            filename,
            description
        )",
        [],
    )?;

    // 重新填充 FTS 表
    conn.execute(
        "INSERT INTO images_fts(rowid, filename, description)
        SELECT id, filename, COALESCE(description, '') FROM images",
        [],
    )?;

    // 创建 FTS 触发器
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS images_fts_insert AFTER INSERT ON images BEGIN
            INSERT INTO images_fts(rowid, filename, description)
            VALUES (NEW.id, NEW.filename, COALESCE(NEW.description, ''));
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS images_fts_delete AFTER DELETE ON images BEGIN
            DELETE FROM images_fts WHERE rowid = OLD.id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS images_fts_update AFTER UPDATE ON images BEGIN
            DELETE FROM images_fts WHERE rowid = OLD.id;
            INSERT INTO images_fts(rowid, filename, description)
            VALUES (NEW.id, NEW.filename, COALESCE(NEW.description, ''));
        END",
        [],
    )?;

    Ok(())
}

#[derive(Debug)]
pub struct ImageRecord {
    pub id: i32,
    pub filename: String,
    pub path: String,
    pub thumbnail_path: Option<String>,
    pub size: i64,
    #[allow(dead_code)]
    pub hash: String,
    pub description: Option<String>,
    pub created_at: String,
}

pub fn insert_image(
    filename: &str,
    path: &str,
    size: i64,
    hash: &str,
) -> SqliteResult<i32> {
    let conn = get_connection()?;

    // 使用 datetime('now') 为 updated_at 提供当前时间
    conn.execute(
        "INSERT INTO images (filename, path, size, hash, updated_at) VALUES (?1, ?2, ?3, ?4, datetime('now'))",
        &[filename, path, &size.to_string(), hash],
    )?;

    Ok(conn.last_insert_rowid() as i32)
}

pub fn get_all_images() -> SqliteResult<Vec<ImageRecord>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, filename, path, thumbnail_path, size, hash, description, created_at
         FROM images
         ORDER BY created_at DESC"
    )?;

    let images = stmt.query_map([], |row| {
        Ok(ImageRecord {
            id: row.get(0)?,
            filename: row.get(1)?,
            path: row.get(2)?,
            thumbnail_path: row.get(3)?,
            size: row.get(4)?,
            hash: row.get(5)?,
            description: row.get(6)?,
            created_at: row.get(7)?,
        })
    })?;

    images.collect()
}

pub fn image_exists_by_hash(hash: &str) -> SqliteResult<bool> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM images WHERE hash = ?1")?;

    let count: i64 = stmt.query_row([hash], |row| row.get(0))?;
    Ok(count > 0)
}

/// 使用 FTS5 搜索图片
pub fn search_images(query: &str) -> SqliteResult<Vec<ImageRecord>> {
    let conn = get_connection()?;

    // 使用简单的 LIKE 搜索替代 FTS，避免兼容性问题
    let mut stmt = conn.prepare(
        "SELECT id, filename, path, thumbnail_path, size, hash, description, created_at
         FROM images
         WHERE filename LIKE ?1 OR description LIKE ?1
         ORDER BY created_at DESC"
    )?;

    let search_pattern = format!("%{}%", query);

    let images = stmt.query_map([&search_pattern], |row| {
        Ok(ImageRecord {
            id: row.get(0)?,
            filename: row.get(1)?,
            path: row.get(2)?,
            thumbnail_path: row.get(3)?,
            size: row.get(4)?,
            hash: row.get(5)?,
            description: row.get(6)?,
            created_at: row.get(7)?,
        })
    })?;

    images.collect()
}
