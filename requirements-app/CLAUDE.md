# СУИД — Реестр функциональных требований

Десктопное приложение на Electron + React + TypeScript + SQLite для управления функциональными требованиями информационных систем Газпром.

## Стек

- **Electron 28** — десктопная оболочка (Windows)
- **React 18 + TypeScript** — фронтенд
- **Vite** — сборка фронтенда
- **better-sqlite3** — локальная SQLite база данных
- **Node.js 20 LTS** — требуется для сборки нативных модулей

## Запуск

```bash
npm install
npx electron-rebuild -f -w better-sqlite3   # обязательно после npm install
npm run dev                                  # запуск в режиме разработки
```

На Windows — двойной клик по `start.bat`.

## Иерархия данных

```
ИС  (Информационная система)       req_id: ИС-001
└── МД  (Модуль)                   req_id: МД-1.01
    └── БФ  (Функциональный блок)  req_id: БФ-1.01
        └── ФТ  (Функциональное требование)  req_id: ФТ-1.001
```

БФ может крепиться напрямую к ИС (без модуля).

Помимо дерева ИС/МД/БФ/ФТ, у каждой ИС есть **связанные сущности** — отдельные вкладки на панели детали:
- **Замечания к системе** (`system_remarks`) — замечания к работе ИС в целом с привязкой к МД/БФ
- (планируются: Договора, Интеграции)

## Структура файлов

```
requirements-app/
├── electron/
│   ├── database.ts      # SQL схема (v4), CRUD, генерация ID
│   ├── main.ts          # IPC обработчики (мост фронт↔бэкенд)
│   ├── preload.ts       # window.api.* — API для фронта
│   └── export.ts        # Экспорт Excel / Word / PDF
├── src/
│   ├── App.tsx          # Главный layout: сайдбар ИС + контент; тема; AdminPanel
│   ├── index.css        # CSS-переменные, тема dark/light
│   ├── types/index.ts   # Все TypeScript типы и константы
│   ├── hooks/
│   │   ├── useRequirements.ts  # React hook для работы с требованиями
│   │   └── useUsers.ts         # React hook для списка пользователей
│   └── components/
│       ├── RequirementForm.tsx  # Форма создания/редактирования
│       ├── DetailPanel.tsx      # Правая панель: просмотр + вкладки
│       ├── TableView.tsx        # Табличный вид с фильтрами
│       ├── Toolbar.tsx          # Верхняя панель + экспорт
│       ├── HistoryPanel.tsx     # Модал истории изменений
│       ├── Badge.tsx            # Цветные метки типов/статусов
│       ├── UserSelect.tsx       # Выпадающий список ФИО пользователей
│       └── AdminPanel.tsx       # Модальная панель управления пользователями
└── start.bat            # Запуск двойным кликом (Windows)
```

## База данных

**Расположение:** `C:\Users\<user>\AppData\Roaming\requirements-manager\requirements.db`

**Просмотр:** DB Browser for SQLite (sqlitebrowser.org)

**Текущая версия схемы: 4**

### Таблицы

```sql
requirements          -- все записи (ИС/МД/БФ/ФТ)
requirement_versions  -- история изменений каждой записи
remarks               -- замечания к ФТ (ft_id → requirements)
approvals             -- решения по согласованию ФТ (ft_id → requirements)
users                 -- пользователи системы (ФИО + роль)
system_remarks        -- замечания к ИС (is_id → requirements)
_schema_ver           -- версия схемы (текущая: 4)
```

### Схема system_remarks

```sql
CREATE TABLE system_remarks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  is_id      INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  module_id  INTEGER REFERENCES requirements(id) ON DELETE SET NULL,  -- МД или БФ
  priority   TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
  status     TEXT NOT NULL DEFAULT 'open'
             CHECK(status IN ('open','in_progress','resolved','closed')),
  author     TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)
```

### Схема users

```sql
CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)
-- При первом запуске автоматически создаётся: Владимир Степанов (admin)
```

### Типы и статусы

```typescript
type RequirementType = 'is' | 'mod' | 'bf' | 'ft'
type Status          = 'draft' | 'in_review' | 'approved' | 'rework' | 'rejected'
type Priority        = 'high' | 'medium' | 'low'

// Статусы замечания к системе
type SystemRemarkStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
```

## IPC архитектура

```
React (window.api.req.create())
  → preload.ts (ipcRenderer.invoke)
  → main.ts (ipcMain.handle)
  → database.ts (SQL)
```

Все методы API объявлены в `src/types/index.ts` в блоке `declare global { interface Window { api: ... } }`.

### Полный список IPC-каналов

| Канал | Назначение |
|---|---|
| `req:list/get/create/update/delete/versions/generateId` | CRUD требований + история |
| `remark:list/create/update/delete` | Замечания к ФТ |
| `approval:list/create/update/lastStatus` | Согласование ФТ |
| `user:list/create/update/delete` | Управление пользователями |
| `system-remark:list/create/update/delete` | Замечания к ИС |
| `export:excel/word/pdf` | Экспорт |

## Компоненты

### DetailPanel — вкладки по типу записи

| Тип | Вкладки |
|---|---|
| ИС | Информация \| Замечания (system_remarks) |
| МД, БФ | Только информация (без вкладок) |
| ФТ | Описание \| Замечания (remarks) \| Согласование |

### UserSelect

Универсальный `<select>` с пользователями из таблицы `users`. Поддерживает legacy-значения (если сохранённое ФИО не найдено в списке — показывается как дополнительная опция).

```tsx
<UserSelect value={author} onChange={setAuthor} users={users} placeholder="выберите автора" style={inputStyle} />
```

### AdminPanel

Модальная панель управления пользователями. Открывается кнопкой шестерёнки внизу сайдбара. Позволяет добавлять, редактировать, удалять пользователей и назначать роли (admin/user).

### useUsers

Hook для загрузки пользователей. Используется в `App.tsx`, передаёт `users` через пропсы в `DetailPanel` и `RequirementForm`.

## Темизация

Тема переключается кнопкой луны/солнца внизу сайдбара. Хранится в `localStorage`.

```typescript
// App.tsx
document.documentElement.setAttribute('data-theme', theme)  // 'light' | 'dark'
```

Все цвета — через CSS-переменные в `src/index.css`:

```css
:root {
  --card-bg: #ffffff;
  --item-selected: #e8eaf6;
  --item-hover: #f1f5f9;
  --gray-50 … --gray-900, --navy, --navy-dark, ...
}
[data-theme="dark"] {
  --card-bg: #1e293b;
  --item-selected: #334155;
  --item-hover: #253347;
  /* переопределение всех серых + navy */
}
```

Инлайн-стили компонентов используют переменные через `var(--card-bg)` и т.д., жёстко прописанные цвета (#ffffff, white) недопустимы.

## Поля по типу записи

| Поле | ИС | МД | БФ | ФТ |
|---|---|---|---|---|
| Название | ✓ | ✓ | ✓ | ✓ |
| Описание | ✓ | ✓ | ✓ | ✓ |
| Полное описание | — | — | — | ✓ |
| Ценность / Обоснование | — | — | — | ✓ |
| Функциональный заказчик | ✓ | — | — | — |
| Автор | — | — | — | ✓ |
| Приоритет | — | — | — | ✓ |
| Статус | ✓ | ✓ | ✓ | ✓ |

## Миграция схемы БД

Схема версионируется через `_schema_ver`. Текущая логика в `initSchema()`:

```typescript
if (ver < 3) {
  // Полный сброс (DROP + CREATE) — только для dev, удаляет данные
  db.exec(`DROP TABLE IF EXISTS approvals; ... INSERT INTO _schema_ver VALUES (3)`)
}

// Далее — CREATE TABLE IF NOT EXISTS для всех таблиц (идемпотентно)
db.exec(`CREATE TABLE IF NOT EXISTS requirements (...); ... CREATE TABLE IF NOT EXISTS system_remarks (...)`)

if (ver < 4) {
  // Аддитивная миграция — только обновляет версию (таблица уже создана выше)
  db.prepare('UPDATE _schema_ver SET ver = 4').run()
}
```

**Для добавления новой таблицы (аддитивно, без потери данных):**
1. Добавить `CREATE TABLE IF NOT EXISTS` в основной `db.exec` блок
2. Добавить `if (ver < N) { UPDATE _schema_ver SET ver = N }` после блока

**Для изменения существующей таблицы:**
- В dev: поднять порог `ver < X` и добавить в блок сброса
- В продакшене: использовать `ALTER TABLE ... ADD COLUMN`

## Как добавить новую связанную сущность к ИС (по образцу system_remarks)

1. **БД:** добавить таблицу с `is_id REFERENCES requirements(id)`, CRUD-функции
2. **IPC:** добавить обработчики в `main.ts` + `preload.ts`
3. **Types:** добавить интерфейс в `src/types/index.ts` + объявить в `Window.api`
4. **DetailPanel:** добавить ключ в тип `Tab`, добавить кнопку вкладки в блок для ИС, добавить рендер компонента в Body

## Git workflow

```bash
git checkout claude/busy-lamport-IUg94   # рабочая ветка
git add .
git commit -m "описание изменений"
git push
```

## Известные особенности

- После `npm install` обязательно запустить `npx electron-rebuild -f -w better-sqlite3` — иначе SQLite не работает (несовместимость версий Node)
- DevTools отключены в `electron/main.ts` (закомментирована строка `openDevTools`)
- Экспорт в PDF использует `jspdf` + `jspdf-autotable` (кириллица может отображаться некорректно)
- Все стили — инлайн через `style={}`, без CSS модулей; CSS-переменные обязательны для поддержки тёмной темы
- Поле `author` для ИС отображается как "Функциональный заказчик"; для МД/БФ скрыто; для ФТ — "Автор"
