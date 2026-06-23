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

Договор (1) ──► ФТ (многие)  — поле contract_id в requirements
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
| `contracts` | Договоры/состав проекта, привязаны к ИС (`is_id`) |
| `_schema_ver` | Версия схемы БД |

### requirements — дополнительные поля ИС

Поля, актуальные только для записей типа `is`:

| Поле | Тип | Описание |
|---|---|---|
| `vendor` | TEXT | Вендор (поставщик/разработчик) |
| `product` | TEXT | Название продукта |
| `is_phase` | TEXT | Жизненный цикл ИС: `Концепция` / `Реализация` / `Опытная эксплуатация` / `Постоянная эксплуатация` |

> Поле `status` для ИС не используется — вместо него `is_phase`. `status` остаётся актуальным только для ФТ (workflow согласования).

### requirements — поле contract_id

ФТ может быть привязан к договору через `contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL`. Связь один-ко-многим: один договор → много ФТ.

### contracts

```typescript
interface Contract {
  id: number; is_id: number
  tz: string           // ТЗ/Изм./ЗНИ/Протокол ПДК
  n_izm: number | null // Номер изменения
  date_utv: string | null // Дата утверждения (ISO date)
  prich_vn_izm: string // Причина внесения изменений
  noch: number | null  // Номер очереди
  net: number | null   // Номер этапа
  name_et: string      // Наименование этапа
  type_work: string    // Вид работ (comma-separated): Проработка/Создание/Развитие/Тиражирование/Интеграции/Концепция
  ist_fin: string      // Источник финансирования: Инвестпрограмма/ИАУ/ГЭ/Бюджет Д651/Договор ТП
  cost: number | null  // Стоимость
  komm: string         // Комментарий
  status_form_vr: string // Статус ОР: проект не инициирован/в работе/сформирован/утвержден
  created_at: string; updated_at: string
}
```

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

Текущая версия: **8**

| Версия | Изменение |
|---|---|
| `< 3` | Пересоздание всех таблиц (ломающая миграция) |
| `< 4` | Добавлена таблица `system_remarks` |
| `< 5` | Добавлена таблица `contracts` |
| `< 6` | `ALTER TABLE requirements ADD COLUMN contract_id INTEGER` |
| `< 7` | `ADD COLUMN vendor TEXT`, `ADD COLUMN product TEXT` |
| `< 8` | `ADD COLUMN is_phase TEXT` |

Логика в `electron/database.ts → initSchema()`.

## Структура UI

```
App
├── ISSidebar (левая панель, ширина изменяется drag, 160–480px, по умолчанию 240px)
│   └── список ИС + кнопки "Создать ИС", настройки, тема
│   └── правый край — drag handle (col-resize)
├── Toolbar (52px, top bar)
│   ├── Вкладки ИС: [Функциональная архитектура] [Замечания (N)] [Договоры (N)]
│   │   — только в режиме "Дерево" при выбранной ИС
│   └── [Дерево | Таблица]  Экспорт: [EXCEL] [WORD] [PDF]
└── Main area
    ├── ISMainContent (дерево: МД → БФ → ФТ + вкладки Замечания / Договоры)
    ├── TableView (таблица всех записей, статистика в строке фильтров)
    ├── DragHandle (4px col-resize разделитель перед правой панелью)
    ├── RequirementForm (правая панель создания, 500px)
    └── DetailPanel (правая панель свойств, ширина изменяется drag, 300–700px, по умолчанию 440px)
```

### Состояние вкладок ИС

`isTab: ISTab` (`'architecture' | 'remarks' | 'contracts'`) живёт в `App` и передаётся в:
- `Toolbar` — для рендера активной вкладки
- `ISMainContent` — для переключения контента

`systemRemarks` и `contracts` хранятся в `App`, перезагружаются при смене `selectedISId`.

### Resizable panels

В `App` хранятся `sidebarWidth` (240) и `panelWidth` (440). Функция `startResize` вешает глобальные `mousemove`/`mouseup` на `document`, во время перетаскивания `document.body.style.cursor = 'col-resize'` и `userSelect = 'none'`.

### DetailPanel

Показывает свойства выбранного элемента.
- **ФТ** — три вкладки: Описание / Замечания / Согласования. В разделе "Договор" — inline-select для привязки к договору ИС (сохраняется сразу).
- **ИС** — только инфо. Бейдж статуса = `is_phase` (цвет по фазе). Секция "Модули и блоки" **не показывается** — эта информация есть на вкладке ФА.
- **МД/БФ** — только инфо + список дочерних элементов.

### ContractsTab

Карточки договоров ИС. Каждая карточка содержит:
- Основные реквизиты (ТЗ, дата, этап, стоимость, источник финансирования)
- Теги видов работ (чекбоксы при создании)
- Секцию **Функциональные требования** — список ФТ с `contract_id === c.id`

## Ключевые файлы

| Файл | Роль |
|---|---|
| `electron/main.ts` | Electron entry, IPC handlers |
| `electron/preload.ts` | contextBridge (`window.api`) |
| `electron/database.ts` | SQLite, схема, CRUD |
| `electron/export.ts` | Экспорт Excel/Word/PDF |
| `src/App.tsx` | Корневой компонент, layout, resize state, ISMainContent |
| `src/types/index.ts` | Все TS-типы, константы (цвета, метки, IS_PHASES) |
| `src/components/Toolbar.tsx` | Top bar с вкладками ИС и экспортом |
| `src/components/SystemRemarksTab.tsx` | CRUD замечаний к системе |
| `src/components/ContractsTab.tsx` | CRUD договоров + список ФТ по договору |
| `src/components/DetailPanel.tsx` | Панель свойств / истории / согласований |
| `src/components/RequirementForm.tsx` | Форма создания/редактирования (ИС: is_phase вместо status) |
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
| `contract:list/create/update/delete` | Договоры ИС |
| `export:excel/word/pdf` | Экспорт через диалог сохранения |
