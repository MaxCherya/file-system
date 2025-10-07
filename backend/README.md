## 📂 Directory Endpoints

- **GET `/dirs`** → list children of a directory (`?path=/...` or `?parent_id=...`, with sort options like `?sort=name|size|mtime&order=asc|desc`)
- **POST `/dirs`** → create new directory (with name + optional permissions, under parent)
- **PATCH `/dirs/{id}`** → rename or move directory
- **DELETE `/dirs/{id}`** → move directory to Trash

---

## 📄 File Endpoints

- **GET `/files/{id}`** → get file metadata + content
- **POST `/files`** → create a new file (name, content, parent, permissions)
- **PATCH `/files/{id}`** → update content, rename, or move file
- **DELETE `/files/{id}`** → move file to Trash

---

## 🗑 Trash Bin Endpoints

- **GET `/trash`** → list all trashed items (files + dirs, with metadata)
- **POST `/trash/{id}/restore`** → restore item to original or new parent
- **DELETE `/trash/{id}/purge`** → permanently delete

---

## 🔎 Search Endpoints

- **GET `/search`** → search files/dirs by name or content (`?q=term&in=name|content|both`)

---