# Requirements Manager — CLAUDE.md

Desktop-приложение для управления требованиями к информационным системам.

## Стек

- **Electron 28** + **React 18** + **TypeScript** + **Vite 5**
- **better-sqlite3** — локальная SQLite БД
- Inline-стили + CSS-переменные (тема light/dark через `data-theme` на `<html>`)
- IPC: `contextBridge` → `preload.ts` → `ipcMain` → `database.ts`

## Запуск

```bash
npm run dev   # tsc (electron) → Vite + electron-wait.js параллельно
```

`electron-wait.js` — HTTP-поллинг `127.0.0.1:5173` каждые 500 мс, запускает Electron как только Vite готов. Используется вместо `wait-on` (зависает на этой машине из-за IPv6/IPv4 конфликта).  
Vite слушает на `host: '127.0.0.1'` (явно), Electron загружает `http://127.0.0.1:5173`.

## Иерархия данных

```
ИС  (Информационная система)
└── МД  (Модуль)
    └── БФ  (Функциональный блок)
        └── ФТ  (Функциональное требование)
    БФ  (прямо к ИС, без модуля)
```

Тип в БД: `'is' | 'mod' | 'bf' | 'ft'` — поле `type` в таблице `requirements`.

## Сущности и таблицы (SQLite)

| Таблица | Описание |
|---|---|
| `requirements` | Все узлы иерархии (ИС/МД/БФ/ФТ), мягкое удаление `is_deleted` |
| `requirement_versions` | История изменений каждого требования |
| `remarks` | Замечания к ФТ (`ft_id`) |
| `approvals` | Согласования ФТ (`ft_id`) |
| `users` | Пользователи (имя + роль admin/user) |
| `system_remarks` | Замечания к системе в целом (`is_id`), с опциональной привязкой к МД/БФ |
| `_schema_ver` | Версия схемы БД |

### system_remarks

```typescript
interface SystemRemark {
  id: number; is_id: number; title: string; description: string
  module_id: number | null   // привязка к МД или БФ (опционально)
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  author: string; created_at: string; updated_at: string
}
```

## Версионирование схемы (`_schema_ver`)

Текущая версия: **4**

- `ver < 3` → пересоздание всех таблиц (ломающая миграция)
- `ver < 4` → добавлена таблица `system_remarks`

Логика в `electron/database.ts → initSchema()`.

## Структура UI

```
App
├── ISSidebar (левая панель, 240px)
│   └── список ИС + кнопки "Создать ИС", настройки, тема
├── Toolbar (52px, top bar)
│   ├── Вкладки ИС: [Функциональная архитектура] [Замечания (N)]
│   │   — только в режиме "Дерево" при выбранной ИС
│   └── [Дерево | Таблица]  Экспорт: [EXCEL] [WORD] [PDF]
└── Main area
    ├── ISMainContent (дерево: МД → БФ → ФТ + вкладка Замечания)
    ├── TableView (таблица всех записей, статистика в строке фильтров)
    ├── RequirementForm (правая панель создания, 500px)
    └── DetailPanel (правая панель свойств выбранного узла)
```

### Состояние вкладок ИС

`isTab: ISTab` (`'architecture' | 'remarks'`) живёт в `App` и передаётся в:
- `Toolbar` — для рендера активной вкладки
- `ISMainContent` — для переключения контента

`systemRemarks` тоже хранятся в `App`, перезагружаются при смене `selectedISId`.

### DetailPanel

Показывает свойства выбранного элемента. Для ФТ — три вкладки: **Инфо / Замечания / Согласования**. Для ИС/МД/БФ — только инфо (без вкладок).

## Ключевые файлы

| Файл | Роль |
|---|---|
| `electron/main.ts` | Electron entry, IPC handlers |
| `electron/preload.ts` | contextBridge (`window.api`) |
| `electron/database.ts` | SQLite, схема, CRUD |
| `electron/export.ts` | Экспорт Excel/Word/PDF |
| `src/App.tsx` | Корневой компонент, вся навигация и layout |
| `src/types/index.ts` | Все TS-типы и константы (цвета, метки) |
| `src/components/Toolbar.tsx` | Top bar с вкладками ИС и экспортом |
| `src/components/ISMainContent` | (в App.tsx) Дерево МД/БФ/ФТ + Замечания |
| `src/components/SystemRemarksTab.tsx` | CRUD замечаний к системе |
| `src/components/DetailPanel.tsx` | Панель свойств / истории / согласований |
| `src/components/TableView.tsx` | Таблица всех требований с фильтрами |
| `src/hooks/useRequirements.ts` | Загрузка и мутации requirements |
| `src/hooks/useUsers.ts` | Загрузка пользователей |
| `electron-wait.js` | HTTP-поллинг: ждёт Vite, потом запускает Electron |
| `vite.config.ts` | `host: '127.0.0.1'`, `port: 5173`, `strictPort: true` |

## IPC каналы

| Канал | Описание |
|---|---|
| `req:list/get/create/update/delete/versions/generateId` | CRUD требований |
| `remark:list/create/update/delete` | Замечания к ФТ |
| `approval:list/create/update/lastStatus` | Согласования ФТ |
| `user:list/create/update/delete` | Пользователи |
| `system-remark:list/create/update/delete` | Замечания к ИС |
| `export:excel/word/pdf` | Экспорт через диалог сохранения |
