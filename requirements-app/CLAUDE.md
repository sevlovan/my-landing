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
ИС  (Информационная система)   req_id: ИС-001
└── МД  (Модуль)               req_id: МД-1.01
    └── БФ  (Функциональный блок)  req_id: БФ-1.01
        └── ФТ  (Функциональное требование)  req_id: ФТ-1.001
```

БФ может крепиться напрямую к ИС (без модуля).

## Структура файлов

```
requirements-app/
├── electron/
│   ├── database.ts      # SQL схема, CRUD, генерация ID
│   ├── main.ts          # IPC обработчики (мост фронт↔бэкенд)
│   ├── preload.ts       # window.api.* — API для фронта
│   └── export.ts        # Экспорт Excel / Word / PDF
├── src/
│   ├── App.tsx          # Главный layout: левая панель ИС + контент
│   ├── types/index.ts   # Все TypeScript типы и константы
│   ├── hooks/
│   │   └── useRequirements.ts  # React hook для работы с данными
│   └── components/
│       ├── RequirementForm.tsx  # Форма создания/редактирования
│       ├── DetailPanel.tsx      # Правая панель: просмотр + вкладки
│       ├── TableView.tsx        # Табличный вид с фильтрами
│       ├── Toolbar.tsx          # Верхняя панель + экспорт
│       ├── HistoryPanel.tsx     # Модал истории изменений
│       └── Badge.tsx            # Цветные метки типов/статусов
└── start.bat            # Запуск двойным кликом (Windows)
```

## База данных

**Расположение:** `C:\Users\<user>\AppData\Roaming\requirements-manager\requirements.db`

**Просмотр:** DB Browser for SQLite (sqlitebrowser.org)

### Таблицы

```sql
requirements          -- все записи (ИС/МД/БФ/ФТ)
requirement_versions  -- история изменений каждой записи
remarks               -- замечания к ФТ
approvals             -- решения по согласованию ФТ
_schema_ver           -- версия схемы (текущая: 3)
```

### Типы и статусы

```typescript
type RequirementType = 'is' | 'mod' | 'bf' | 'ft'
type Status = 'draft' | 'in_review' | 'approved' | 'rework' | 'rejected'
type Priority = 'high' | 'medium' | 'low'
```

## IPC архитектура

```
React (window.api.req.create())
  → preload.ts (ipcRenderer.invoke)
  → main.ts (ipcMain.handle)
  → database.ts (SQL)
```

Все методы API объявлены в `src/types/index.ts` в блоке `declare global { interface Window { api: ... } }`.

## Как добавить новое поле

1. **Поднять версию схемы** в `electron/database.ts`:
   - Изменить `ver < 3` на `ver < 4` в `initSchema()`
   - Добавить поле в `CREATE TABLE requirements`
   - Добавить поле в `INSERT` и `UPDATE` запросы

2. **Добавить в тип** `src/types/index.ts` → интерфейс `Requirement`

3. **Добавить в форму** `src/components/RequirementForm.tsx`:
   - Добавить `useState` для нового поля
   - Добавить поле в JSX форму
   - Включить поле в вызов `onSave()`

4. **Показать в деталях** `src/components/DetailPanel.tsx` → `InfoTab` → `MetaGrid`

## Как добавить новый тип записи

1. Добавить в `RequirementType` в `src/types/index.ts`
2. Добавить метку, цвет в `TYPE_LABELS`, `TYPE_COLORS`, `TYPE_LONG_LABELS`
3. Обновить `CHECK(type IN (...))` в `database.ts` (поднять версию схемы)
4. Обновить `generateReqId()` в `database.ts`
5. Добавить в `RequirementForm.tsx` опцию в select и правила родителя
6. Обновить `App.tsx` для отображения в дереве

## Миграция схемы БД

При изменении структуры БД — поднять версию в `initSchema()`:

```typescript
if (ver < 4) {          // новая версия
  db.exec(`
    DROP TABLE IF EXISTS approvals;
    DROP TABLE IF EXISTS remarks;
    DROP TABLE IF EXISTS requirement_versions;
    DROP TABLE IF EXISTS requirements;
    DELETE FROM _schema_ver;
    INSERT INTO _schema_ver (ver) VALUES (4);
  `)
}
// затем CREATE TABLE с новой структурой
```

⚠️ Это удаляет все данные — только для разработки. В продакшене нужен ALTER TABLE.

## Git workflow

```bash
git checkout claude/busy-lamport-IUg94   # рабочая ветка
git add .
git commit -m "описание изменений"
git push
```

Репозиторий: `github.com/sevlovan/my-landing`

## Известные особенности

- После `npm install` обязательно запустить `npx electron-rebuild -f -w better-sqlite3` — иначе SQLite не работает (несовместимость версий Node)
- DevTools отключены в `electron/main.ts` (закомментирована строка `openDevTools`)
- Экспорт в PDF использует `jspdf` + `jspdf-autotable` (кириллица может отображаться некорректно)
- Все стили — инлайн через `style={}`, без CSS модулей
