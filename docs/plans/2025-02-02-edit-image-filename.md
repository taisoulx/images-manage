# Edit Image Filename Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the ability to edit image filenames (without changing the file extension) in both desktop application and mobile H5 interface.

**Architecture:** Extend existing `update_image_info` Tauri command and API endpoint to support filename updates, add filename input field in UI components, implement duplicate filename checking with user-friendly error messages.

**Tech Stack:** Tauri 2 Commands, Rust std::fs for file operations, React 19, TypeScript, Fastify API endpoints, SQLite database

---

## Task 1: Extend Backend Tauri Command

**Files:**
- Modify: `src-tauri/src/commands.rs:309-328`

**Step 1: Update the command signature to accept filename parameter**

```rust
/// 更新图片信息
#[command]
pub fn update_image_info(id: i32, filename: Option<String>, description: Option<String>) -> Result<(), String> {
    use rusqlite::params;
    use crate::database::get_connection;
    use std::path::Path;

    let conn = get_connection()
        .map_err(|e| format!("获取数据库连接失败: {}", e))?;

    // 获取当前图片信息
    let current_image = get_image_by_id(id)?;

    // 处理文件名更新
    if let Some(new_filename) = filename {
        // 验证文件名不为空
        if new_filename.trim().is_empty() {
            return Err("文件名不能为空".to_string());
        }

        // 获取文件扩展名
        let old_path = Path::new(&current_image.path);
        let extension = old_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg");

        // 构建新文件名（保留扩展名）
        let new_filename_with_ext = if new_filename.contains('.') {
            // 如果用户输入包含扩展名，提取不含扩展名的部分并加上原扩展名
            let name_without_ext = new_filename.rsplit_once('.').map(|(name, _)| name).unwrap_or(&new_filename);
            format!("{}.{}", name_without_ext, extension)
        } else {
            format!("{}.{}", new_filename.trim(), extension)
        };

        // 检查文件名是否已存在（排除当前图片）
        let existing = conn.prepare(
            "SELECT id FROM images WHERE filename = ?1 AND id != ?2"
        ).map_err(|e| format!("准备查询失败: {}", e))?;

        let exists = existing.exists(params![&new_filename_with_ext, id])
            .map_err(|e| format!("检查文件名是否存在失败: {}", e))?;

        if exists {
            return Err(format!("文件名 '{}' 已存在，请使用其他名称", new_filename_with_ext));
        }

        // 重命名文件
        if old_path.exists() {
            let new_path = old_path.with_file_name(&new_filename_with_ext);
            fs::rename(&old_path, &new_path)
                .map_err(|e| format!("重命名文件失败: {}", e))?;

            // 更新数据库
            conn.execute(
                "UPDATE images SET filename = ?1, path = ?2, updated_at = datetime('now') WHERE id = ?3",
                params![&new_filename_with_ext, new_path.to_str().unwrap(), id],
            ).map_err(|e| format!("更新文件名失败: {}", e))?;
        }
    }

    // 处理描述更新
    if let Some(desc) = description {
        let desc_value = desc.trim().is_empty().then_some("").as_deref();

        conn.execute(
            "UPDATE images SET description = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![desc_value, id],
        ).map_err(|e| format!("更新描述失败: {}", e))?;
    }

    Ok(())
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS (TypeScript check, but we need to rebuild Rust)

**Step 3: Rebuild Rust code**

Run: `cd src-tauri && cargo build`
Expected: SUCCESS

**Step 4: Commit**

```bash
git add src-tauri/src/commands.rs
git commit -m "feat: extend update_image_info to support filename changes with duplicate checking"
```

---

## Task 2: Update Desktop UI - ImageDetailDialog

**Files:**
- Modify: `src/components/ImageDetailDialog.tsx:11-63, 132-176`

**Step 1: Add filename state and split filename from extension**

Replace the existing state and add filename handling:

```typescript
export function ImageDetailDialog({ image, isOpen, onClose, onUpdate }: ImageDetailDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [filename, setFilename] = useState('')  // 新增
  const [extension, setExtension] = useState('')  // 新增
  const [filenameError, setFilenameError] = useState('')  // 新增
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen && image) {
      setMounted(true)
      loadImage()
      setDescription(image.description || '')

      // 新增：分割文件名和扩展名
      const lastDotIndex = image.filename.lastIndexOf('.')
      if (lastDotIndex > 0) {
        setFilename(image.filename.substring(0, lastDotIndex))
        setExtension(image.filename.substring(lastDotIndex))
      } else {
        setFilename(image.filename)
        setExtension('')
      }
      setFilenameError('')  // 重置错误
    } else {
      setMounted(false)
      setImageUrl(null)
    }
  }, [isOpen, image])

  const handleSave = async () => {
    if (!image) return

    // 验证文件名
    if (!filename.trim()) {
      setFilenameError('文件名不能为空')
      return
    }

    try {
      setSaving(true)
      await invoke('update_image_info', {
        id: image.id,
        filename: filename.trim(),  // 发送不含扩展名的文件名
        description: description || null
      })
      onUpdate?.()
      onClose()
    } catch (err: any) {
      console.error('保存失败:', err)
      // 显示后端返回的错误信息
      setFilenameError(err.toString() || '保存失败')
    } finally {
      setSaving(false)
    }
  }
```

**Step 2: Update the file info section to show editable filename**

Replace the filename display section (around line 133-137):

```tsx
              {/* 文件名 - 可编辑 */}
              <div>
                <label className="text-sm text-muted-foreground">文件名</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => {
                      setFilename(e.target.value)
                      setFilenameError('')  // 清除错误
                    }}
                    placeholder="输入文件名"
                    className={`flex-1 px-3 py-2 bg-background border rounded-lg focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all input-focus-effect ${
                      filenameError ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {extension && (
                    <span className="px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
                      {extension}
                    </span>
                  )}
                </div>
                {filenameError && (
                  <p className="text-destructive text-xs mt-1">{filenameError}</p>
                )}
              </div>
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/ImageDetailDialog.tsx
git commit -m "feat: add editable filename field in desktop image detail dialog"
```

---

## Task 3: Update API Server for Mobile H5

**Files:**
- Modify: `src/server/index.ts:168-177`

**Step 1: Update PUT endpoint to support filename**

Replace the existing update endpoint:

```typescript
// API 端点：更新图片信息
fastify.put('/api/images/:id', async (request: any, _reply: any) => {
  const database = getDb()
  const { id } = request.params
  const { description, filename } = request.body

  // 获取当前图片信息
  const currentImage = database.prepare('SELECT id, filename, path FROM images WHERE id = ?').get(id) as any

  if (!currentImage) {
    return { success: false, error: 'Image not found' }
  }

  let finalFilename = currentImage.filename
  let finalPath = currentImage.path

  // 处理文件名更新
  if (filename && filename.trim()) {
    const { renameSync } = await import('fs')
    const { dirname, extname } = await import('path')

    const oldPath = currentImage.path
    const oldExtension = extname(oldPath)
    const newFilename = filename.trim() + oldExtension
    const newPath = join(dirname(oldPath), newFilename)

    // 检查文件名是否已存在
    const existing = database.prepare(
      'SELECT id FROM images WHERE filename = ?1 AND id != ?2'
    ).get(newFilename, id) as any

    if (existing) {
      return { success: false, error: `文件名 '${newFilename}' 已存在` }
    }

    // 重命名文件
    try {
      renameSync(oldPath, newPath)
      finalFilename = newFilename
      finalPath = newPath
    } catch (e: any) {
      return { success: false, error: `重命名文件失败: ${e.message}` }
    }
  }

  // 更新数据库
  database.prepare(
    'UPDATE images SET filename = ?, path = ?, description = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(finalFilename, finalPath, description || null, id)

  return { success: true, filename: finalFilename }
})
```

**Step 2: Commit**

```bash
git add src/server/index.ts
git commit -m "feat: add filename support to API update endpoint"
```

---

## Task 4: Update Mobile H5 UI - MobileGallery

**Files:**
- Modify: `src/pages/MobileGallery.tsx:20-24, 75-107, 242-304`

**Step 1: Add filename state and handlers**

Add new state variables after existing state:

```typescript
  const [hasMore, setHasMore] = useState(true)
  const [editingDescription, setEditingDescription] = useState(false)
  const [editingFilename, setEditingFilename] = useState(false)  // 新增
  const [newDescription, setNewDescription] = useState('')
  const [newFilename, setNewFilename] = useState('')  // 新增
  const [filenameError, setFilenameError] = useState('')  // 新增
  const [savingDescription, setSavingDescription] = useState(false)
  const [savingFilename, setSavingFilename] = useState(false)  // 新增
```

**Step 2: Update handleSaveDescription to handle filename as well**

Replace the existing save handler:

```typescript
  const handleSaveDescription = async () => {
    if (!selectedImage) return

    setSavingDescription(true)
    try {
      const response = await fetch(`${serverUrl}/api/images/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存失败')
      }

      setImages(prev =>
        prev.map(img =>
          img.id === selectedImage.id
            ? { ...img, description: newDescription || undefined }
            : img
        )
      )
      setSelectedImage({ ...selectedImage, description: newDescription || undefined })
      setEditingDescription(false)

      // 显示成功提示
      alert('描述已保存')
    } catch (error: any) {
      alert(error.message || '保存失败，请重试')
    } finally {
      setSavingDescription(false)
    }
  }

  // 新增：保存文件名
  const handleSaveFilename = async () => {
    if (!selectedImage) return

    if (!newFilename.trim()) {
      setFilenameError('文件名不能为空')
      return
    }

    setSavingFilename(true)
    setFilenameError('')
    try {
      const response = await fetch(`${serverUrl}/api/images/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: newFilename }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存失败')
      }

      const result = await response.json()
      const oldExtension = selectedImage.filename.substring(selectedImage.filename.lastIndexOf('.'))
      const newFilenameWithExt = newFilename.trim() + oldExtension

      setImages(prev =>
        prev.map(img =>
          img.id === selectedImage.id
            ? { ...img, filename: result.filename || newFilenameWithExt }
            : img
        )
      )
      setSelectedImage({ ...selectedImage, filename: result.filename || newFilenameWithExt })
      setEditingFilename(false)

      // 显示成功提示
      alert('文件名已保存')
    } catch (error: any) {
      setFilenameError(error.message || '保存失败，请重试')
    } finally {
      setSavingFilename(false)
    }
  }
```

**Step 3: Update the bottom info section to include filename editing**

Replace the bottom info section (around line 242-304):

```tsx
            {/* 底部信息 */}
            <div className="flex-shrink-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="space-y-3">
                {/* 文件名 - 可编辑 */}
                <div>
                  {editingFilename ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFilename}
                          onChange={(e) => {
                            setNewFilename(e.target.value)
                            setFilenameError('')
                          }}
                          placeholder="输入文件名"
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-gold"
                          disabled={savingFilename}
                        />
                        <span className="px-3 py-2 bg-white/10 text-white/60 rounded-xl text-sm flex items-center">
                          {selectedImage.filename.substring(selectedImage.filename.lastIndexOf('.'))}
                        </span>
                      </div>
                      {filenameError && (
                        <p className="text-red-400 text-xs">{filenameError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveFilename}
                          disabled={savingFilename}
                          className="flex-1 px-4 py-2 bg-gold text-background rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {savingFilename ? (
                            <>
                              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                              保存中...
                            </>
                          ) : (
                            '保存'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingFilename(false)
                            setFilenameError('')
                          }}
                          disabled={savingFilename}
                          className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingFilename(true)
                        setNewFilename(selectedImage.filename.substring(0, selectedImage.filename.lastIndexOf('.')))
                        setFilenameError('')
                      }}
                      className="p-3 bg-white/5 rounded-xl cursor-pointer"
                    >
                      <p className="text-sm text-white">{selectedImage.filename}</p>
                      <p className="text-xs text-white/40">点击编辑文件名</p>
                    </div>
                  )}
                </div>

                {/* 文件信息 */}
                <div>
                  <p className="text-xs text-white/60">
                    {formatFileSize(selectedImage.size)} · {formatDate(selectedImage.created_at)}
                  </p>
                </div>

                {/* 描述 - 可编辑 */}
                {editingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="添加描述..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-gold"
                      rows={2}
                      disabled={savingDescription}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDescription}
                        disabled={savingDescription}
                        className="flex-1 px-4 py-2 bg-gold text-background rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {savingDescription ? (
                          <>
                            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            保存中...
                          </>
                        ) : (
                          '保存'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(false)
                          setNewDescription(selectedImage.description || '')
                        }}
                        disabled={savingDescription}
                        className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setEditingDescription(true)
                      setNewDescription(selectedImage.description || '')
                    }}
                    className="p-3 bg-white/5 rounded-xl cursor-pointer"
                  >
                    <p className="text-sm text-white">
                      {selectedImage.description || (
                        <span className="text-white/40">点击添加描述...</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/MobileGallery.tsx
git commit -m "feat: add editable filename field in mobile H5 gallery"
```

---

## Task 5: Testing

**Step 1: Start the desktop application**

Run: `npm run tauri:dev`

**Step 2: Test desktop filename editing**

1. Navigate to Gallery
2. Click edit button on any image
3. Modify filename (without extension)
4. Click save
5. Verify:
   - Filename is updated in database
   - File is renamed on disk
   - Error message shown when duplicate filename entered
   - Extension is preserved

**Step 3: Test mobile H5 filename editing**

1. Open mobile view at `http://localhost:3000`
2. Navigate to Gallery
3. Click on any image
4. Click on filename to edit
5. Modify filename
6. Click save
7. Verify same behaviors as desktop

**Step 4: Test error cases**

1. Try empty filename - should show error
2. Try duplicate filename - should show error
3. Try special characters - should work

**Step 5: Final commit**

```bash
git add .
git commit -m "test: verify filename editing functionality works correctly"
```

---

## Testing Checklist

- [ ] Desktop: Can edit filename without extension
- [ ] Desktop: Extension is preserved
- [ ] Desktop: Duplicate filename shows error
- [ ] Desktop: Empty filename shows error
- [ ] Desktop: File is renamed on disk
- [ ] Mobile H5: Can edit filename without extension
- [ ] Mobile H5: Extension is preserved
- [ ] Mobile H5: Duplicate filename shows error
- [ ] Mobile H5: Empty filename shows error
- [ ] Mobile H5: File is renamed on disk
- [ ] Both: Image reload shows updated filename
