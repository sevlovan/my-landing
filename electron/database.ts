import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'requirements.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`CREATE TABLE IF NOT EXISTS _schema_ver (ver INTEGER NOT NULL DEFAULT 0)`)
  const verRow = db.prepare('SELECT ver FROM _schema_ver LIMIT 1').get() as { ver: number } | undefined
  const ver = verRow?.ver ?? 0

  if (ver < 3) {
    db.exec(`
      DROP TABLE IF EXISTS approvals;
      DROP TABLE IF EXISTS remarks;
      DROP TABLE IF EXISTS requirement_versions;
      DROP TABLE IF EXISTS requirements;
      DELETE FROM _schema_ver;
      INSERT INTO _schema_ver (ver) VALUES (3);
    `)
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      full_description TEXT DEFAULT '',
      type TEXT NOT NULL CHECK(type IN ('is','mod','bf','ft')),
      parent_id INTEGER REFERENCES requirements(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','rejected','in_review','rework')),
      cenn TEXT DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS requirement_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      full_description TEXT DEFAULT '',
      type TEXT NOT NULL,
      parent_id INTEGER,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      cenn TEXT DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      changed_by TEXT NOT NULL DEFAULT '',
      change_comment TEXT DEFAULT '',
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS remarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ft_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      num_remark TEXT NOT NULL DEFAULT '',
      text_remark TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_work','closed')),
      author TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ft_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'in_review' CHECK(status IN ('in_review','approved','rework','rejected')),
      comment TEXT DEFAULT '',
      changed_by TEXT NOT NULL DEFAULT '',
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_remarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      is_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      module_id INTEGER REFERENCES requirements(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
      author TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_req_parent ON requirements(parent_id);
    CREATE INDEX IF NOT EXISTS idx_req_type ON requirements(type);
    CREATE INDEX IF NOT EXISTS idx_ver_req ON requirement_versions(requirement_id);
    CREATE INDEX IF NOT EXISTS idx_rem_ft ON remarks(ft_id);
    CREATE INDEX IF NOT EXISTS idx_appr_ft ON approvals(ft_id);
    CREATE INDEX IF NOT EXISTS idx_srem_is ON system_remarks(is_id);
  `)

  if (ver < 4) {
    db.prepare('UPDATE _schema_ver SET ver = 4').run()
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      is_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      tz TEXT NOT NULL DEFAULT '',
      n_izm INTEGER,
      date_utv TEXT,
      prich_vn_izm TEXT NOT NULL DEFAULT '',
      noch INTEGER,
      net INTEGER,
      name_et TEXT NOT NULL DEFAULT '',
      type_work TEXT NOT NULL DEFAULT '',
      ist_fin TEXT NOT NULL DEFAULT '',
      cost REAL,
      komm TEXT NOT NULL DEFAULT '',
      status_form_vr TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contracts_is ON contracts(is_id);
  `)

  if (ver < 5) {
    db.prepare('UPDATE _schema_ver SET ver = 5').run()
  }

  if (ver < 6) {
    db.exec(`ALTER TABLE requirements ADD COLUMN contract_id INTEGER`)
    db.prepare('UPDATE _schema_ver SET ver = 6').run()
  }

  if (ver < 7) {
    db.exec(`
      ALTER TABLE requirements ADD COLUMN vendor TEXT NOT NULL DEFAULT '';
      ALTER TABLE requirements ADD COLUMN product TEXT NOT NULL DEFAULT '';
    `)
    db.prepare('UPDATE _schema_ver SET ver = 7').run()
  }

  if (ver < 8) {
    db.exec(`ALTER TABLE requirements ADD COLUMN is_phase TEXT NOT NULL DEFAULT ''`)
    db.prepare('UPDATE _schema_ver SET ver = 8').run()
  }

  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (userCount === 0) {
    db.prepare('INSERT INTO users (name, role) VALUES (?, ?)').run('Владимир Степанов', 'admin')
  }
}

export interface Requirement {
  id: number
  req_id: string
  title: string
  description: string
  full_description: string
  type: 'is' | 'bf' | 'ft'
  parent_id: number | null
  priority: 'high' | 'medium' | 'low'
  status: 'draft' | 'approved' | 'rejected' | 'in_review' | 'rework'
  cenn: string
  author: string
  contract_id: number | null
  created_at: string
  updated_at: string
}

export interface RequirementVersion {
  id: number
  requirement_id: number
  version: number
  title: string
  description: string
  full_description: string
  type: string
  parent_id: number | null
  priority: string
  status: string
  cenn: string
  author: string
  changed_by: string
  change_comment: string
  changed_at: string
}

export interface Remark {
  id: number
  ft_id: number
  num_remark: string
  text_remark: string
  status: 'open' | 'in_work' | 'closed'
  author: string
  created_at: string
}

export interface Approval {
  id: number
  ft_id: number
  status: 'in_review' | 'approved' | 'rework' | 'rejected'
  comment: string
  changed_by: string
  changed_at: string
}

export interface User {
  id: number
  name: string
  role: 'admin' | 'user'
  created_at: string
}

export interface SystemRemark {
  id: number
  is_id: number
  title: string
  description: string
  module_id: number | null
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  author: string
  created_at: string
  updated_at: string
}

export function listRequirements(): Requirement[] {
  return getDb().prepare(
    `SELECT * FROM requirements WHERE is_deleted = 0 ORDER BY type, req_id`
  ).all() as Requirement[]
}

export function getRequirement(id: number): Requirement | undefined {
  return getDb().prepare(
    'SELECT * FROM requirements WHERE id = ? AND is_deleted = 0'
  ).get(id) as Requirement | undefined
}

export function createRequirement(
  data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>
): Requirement {
  const database = getDb()
  const now = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO requirements
      (req_id, title, description, full_description, type, parent_id, priority, status, cenn, author, created_at, updated_at)
    VALUES
      (@req_id, @title, @description, @full_description, @type, @parent_id, @priority, @status, @cenn, @author, @created_at, @updated_at)
  `).run({
    req_id: data.req_id,
    title: data.title,
    description: data.description ?? '',
    full_description: data.full_description ?? '',
    type: data.type,
    parent_id: data.parent_id ?? null,
    priority: data.priority ?? 'medium',
    status: data.status ?? 'draft',
    cenn: data.cenn ?? '',
    author: data.author ?? '',
    created_at: now,
    updated_at: now,
  })
  const req = getRequirement(result.lastInsertRowid as number)!
  saveVersion(req, data.author || 'система', 'Создание записи')
  return req
}

export function updateRequirement(
  id: number,
  data: Partial<Omit<Requirement, 'id' | 'created_at'>>,
  changedBy: string,
  changeComment = ''
): Requirement {
  const database = getDb()
  const now = new Date().toISOString()
  const allowed = ['title', 'description', 'full_description', 'priority', 'status', 'cenn', 'author', 'parent_id', 'contract_id', 'vendor', 'product', 'is_phase']
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  if (Object.keys(filtered).length === 0) return getRequirement(id)!
  const fields = Object.keys(filtered).map(k => `${k} = @${k}`).join(', ')
  database.prepare(`UPDATE requirements SET ${fields}, updated_at = @updated_at WHERE id = @id`)
    .run({ ...filtered, updated_at: now, id })
  const req = getRequirement(id)!
  saveVersion(req, changedBy, changeComment)
  return req
}

export function deleteRequirement(id: number): void {
  getDb().prepare('UPDATE requirements SET is_deleted = 1 WHERE id = ?').run(id)
}

export function getVersions(requirementId: number): RequirementVersion[] {
  return getDb().prepare(
    'SELECT * FROM requirement_versions WHERE requirement_id = ? ORDER BY version DESC'
  ).all(requirementId) as RequirementVersion[]
}

function saveVersion(req: Requirement, changedBy: string, changeComment: string) {
  const database = getDb()
  const lastVer = database.prepare(
    'SELECT MAX(version) as v FROM requirement_versions WHERE requirement_id = ?'
  ).get(req.id) as { v: number | null }
  const version = (lastVer.v ?? 0) + 1
  database.prepare(`
    INSERT INTO requirement_versions
      (requirement_id, version, title, description, full_description, type, parent_id,
       priority, status, cenn, author, changed_by, change_comment)
    VALUES
      (@requirement_id, @version, @title, @description, @full_description, @type, @parent_id,
       @priority, @status, @cenn, @author, @changed_by, @change_comment)
  `).run({
    requirement_id: req.id,
    version,
    title: req.title,
    description: req.description ?? '',
    full_description: req.full_description ?? '',
    type: req.type,
    parent_id: req.parent_id,
    priority: req.priority,
    status: req.status,
    cenn: req.cenn ?? '',
    author: req.author ?? '',
    changed_by: changedBy,
    change_comment: changeComment,
  })
}

export function generateReqId(type: 'is' | 'mod' | 'bf' | 'ft', parentId?: number | null): string {
  const database = getDb()

  if (type === 'is') {
    const count = (database.prepare(
      `SELECT COUNT(*) as c FROM requirements WHERE type = 'is' AND is_deleted = 0`
    ).get() as { c: number }).c
    return `ИС-${String(count + 1).padStart(3, '0')}`
  }

  if (type === 'mod') {
    let isNum = '1'
    if (parentId) {
      const parent = database.prepare('SELECT req_id FROM requirements WHERE id = ?').get(parentId) as { req_id: string } | undefined
      if (parent) isNum = parent.req_id.replace('ИС-', '').replace(/^0+/, '') || '1'
    }
    const count = (database.prepare(
      `SELECT COUNT(*) as c FROM requirements WHERE type = 'mod' AND parent_id = ? AND is_deleted = 0`
    ).get(parentId ?? 0) as { c: number }).c
    return `МД-${isNum}.${String(count + 1).padStart(2, '0')}`
  }

  if (type === 'bf') {
    let isNum = '1'
    if (parentId) {
      const parent = database.prepare('SELECT req_id, type, parent_id FROM requirements WHERE id = ?').get(parentId) as { req_id: string; type: string; parent_id: number | null } | undefined
      if (parent?.type === 'is') {
        isNum = parent.req_id.replace('ИС-', '').replace(/^0+/, '') || '1'
      } else if (parent?.type === 'mod' && parent.parent_id) {
        const grandParent = database.prepare('SELECT req_id FROM requirements WHERE id = ?').get(parent.parent_id) as { req_id: string } | undefined
        if (grandParent) isNum = grandParent.req_id.replace('ИС-', '').replace(/^0+/, '') || '1'
      }
    }
    const count = (database.prepare(
      `SELECT COUNT(*) as c FROM requirements WHERE type = 'bf' AND is_deleted = 0`
    ).get() as { c: number }).c
    return `БФ-${isNum}.${String(count + 1).padStart(2, '0')}`
  }

  // ft
  let isNum = '1'
  if (parentId) {
    const bf = database.prepare('SELECT req_id, type, parent_id FROM requirements WHERE id = ?').get(parentId) as { req_id: string; type: string; parent_id: number | null } | undefined
    if (bf?.parent_id) {
      const bfParent = database.prepare('SELECT req_id, type, parent_id FROM requirements WHERE id = ?').get(bf.parent_id) as { req_id: string; type: string; parent_id: number | null } | undefined
      if (bfParent?.type === 'is') {
        isNum = bfParent.req_id.replace('ИС-', '').replace(/^0+/, '') || '1'
      } else if (bfParent?.type === 'mod' && bfParent.parent_id) {
        const isRec = database.prepare('SELECT req_id FROM requirements WHERE id = ?').get(bfParent.parent_id) as { req_id: string } | undefined
        if (isRec) isNum = isRec.req_id.replace('ИС-', '').replace(/^0+/, '') || '1'
      }
    }
  }
  const count = (database.prepare(
    `SELECT COUNT(*) as c FROM requirements WHERE type = 'ft' AND is_deleted = 0`
  ).get() as { c: number }).c
  return `ФТ-${isNum}.${String(count + 1).padStart(3, '0')}`
}

// --- Remarks ---
export function listRemarks(ftId: number): Remark[] {
  return getDb().prepare('SELECT * FROM remarks WHERE ft_id = ? ORDER BY id').all(ftId) as Remark[]
}

export function createRemark(data: Omit<Remark, 'id' | 'created_at'>): Remark {
  const database = getDb()
  const now = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO remarks (ft_id, num_remark, text_remark, status, author, created_at)
    VALUES (@ft_id, @num_remark, @text_remark, @status, @author, @created_at)
  `).run({ ...data, created_at: now })
  return database.prepare('SELECT * FROM remarks WHERE id = ?').get(result.lastInsertRowid) as Remark
}

export function updateRemark(id: number, data: Partial<Pick<Remark, 'status' | 'text_remark' | 'num_remark'>>): void {
  const database = getDb()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  if (fields) database.prepare(`UPDATE remarks SET ${fields} WHERE id = @id`).run({ ...data, id })
}

export function deleteRemark(id: number): void {
  getDb().prepare('DELETE FROM remarks WHERE id = ?').run(id)
}

// --- Approvals ---
export function listApprovals(ftId: number): Approval[] {
  return getDb().prepare('SELECT * FROM approvals WHERE ft_id = ? ORDER BY id DESC').all(ftId) as Approval[]
}

export function createApproval(data: Omit<Approval, 'id' | 'changed_at'>): Approval {
  const database = getDb()
  const now = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO approvals (ft_id, status, comment, changed_by, changed_at)
    VALUES (@ft_id, @status, @comment, @changed_by, @changed_at)
  `).run({ ...data, changed_at: now })

  // Sync requirement status
  const statusMap: Record<string, string> = {
    approved: 'approved', rework: 'rework', rejected: 'rejected', in_review: 'in_review',
  }
  database.prepare('UPDATE requirements SET status = ? WHERE id = ?').run(
    statusMap[data.status] ?? 'in_review', data.ft_id
  )

  return database.prepare('SELECT * FROM approvals WHERE id = ?').get(result.lastInsertRowid) as Approval
}

export function getLastApproval(ftId: number): Approval | undefined {
  return getDb().prepare(
    'SELECT * FROM approvals WHERE ft_id = ? ORDER BY id DESC LIMIT 1'
  ).get(ftId) as Approval | undefined
}

export function updateApproval(id: number, data: Partial<Pick<Approval, 'status' | 'comment' | 'changed_by'>>): void {
  const database = getDb()
  const now = new Date().toISOString()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  if (!fields) return
  database.prepare(`UPDATE approvals SET ${fields}, changed_at = @changed_at WHERE id = @id`)
    .run({ ...data, changed_at: now, id })
  if (data.status) {
    const row = database.prepare('SELECT ft_id FROM approvals WHERE id = ?').get(id) as { ft_id: number } | undefined
    if (row) {
      const latest = database.prepare('SELECT id FROM approvals WHERE ft_id = ? ORDER BY id DESC LIMIT 1').get(row.ft_id) as { id: number } | undefined
      if (latest?.id === id) {
        database.prepare('UPDATE requirements SET status = ? WHERE id = ?').run(data.status, row.ft_id)
      }
    }
  }
}

// --- Users ---
export function listUsers(): User[] {
  return getDb().prepare('SELECT * FROM users ORDER BY role DESC, name').all() as User[]
}

export function createUser(data: Pick<User, 'name' | 'role'>): User {
  const database = getDb()
  const result = database.prepare('INSERT INTO users (name, role) VALUES (?, ?)').run(data.name, data.role)
  return database.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User
}

export function updateUser(id: number, data: Partial<Pick<User, 'name' | 'role'>>): void {
  const database = getDb()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  if (fields) database.prepare(`UPDATE users SET ${fields} WHERE id = @id`).run({ ...data, id })
}

export function deleteUser(id: number): void {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
}

// --- Contracts ---
export interface Contract {
  id: number
  is_id: number
  tz: string
  n_izm: number | null
  date_utv: string | null
  prich_vn_izm: string
  noch: number | null
  net: number | null
  name_et: string
  type_work: string
  ist_fin: string
  cost: number | null
  komm: string
  status_form_vr: string
  created_at: string
  updated_at: string
}

export function listContracts(isId: number): Contract[] {
  return getDb().prepare('SELECT * FROM contracts WHERE is_id = ? ORDER BY id').all(isId) as Contract[]
}

export function createContract(data: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Contract {
  const database = getDb()
  const now = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO contracts (is_id, tz, n_izm, date_utv, prich_vn_izm, noch, net, name_et, type_work, ist_fin, cost, komm, status_form_vr, created_at, updated_at)
    VALUES (@is_id, @tz, @n_izm, @date_utv, @prich_vn_izm, @noch, @net, @name_et, @type_work, @ist_fin, @cost, @komm, @status_form_vr, @created_at, @updated_at)
  `).run({ ...data, created_at: now, updated_at: now })
  return database.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid) as Contract
}

export function updateContract(
  id: number,
  data: Partial<Omit<Contract, 'id' | 'is_id' | 'created_at' | 'updated_at'>>
): void {
  const database = getDb()
  const now = new Date().toISOString()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  if (fields) database.prepare(`UPDATE contracts SET ${fields}, updated_at = @updated_at WHERE id = @id`).run({ ...data, updated_at: now, id })
}

export function deleteContract(id: number): void {
  getDb().prepare('DELETE FROM contracts WHERE id = ?').run(id)
}

// --- System Remarks ---
export function listSystemRemarks(isId: number): SystemRemark[] {
  return getDb().prepare('SELECT * FROM system_remarks WHERE is_id = ? ORDER BY id DESC').all(isId) as SystemRemark[]
}

export function createSystemRemark(data: Omit<SystemRemark, 'id' | 'created_at' | 'updated_at'>): SystemRemark {
  const database = getDb()
  const now = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO system_remarks (is_id, title, description, module_id, priority, status, author, created_at, updated_at)
    VALUES (@is_id, @title, @description, @module_id, @priority, @status, @author, @created_at, @updated_at)
  `).run({ ...data, created_at: now, updated_at: now })
  return database.prepare('SELECT * FROM system_remarks WHERE id = ?').get(result.lastInsertRowid) as SystemRemark
}

export function updateSystemRemark(
  id: number,
  data: Partial<Pick<SystemRemark, 'title' | 'description' | 'module_id' | 'priority' | 'status' | 'author'>>
): void {
  const database = getDb()
  const now = new Date().toISOString()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  if (fields) database.prepare(`UPDATE system_remarks SET ${fields}, updated_at = @updated_at WHERE id = @id`).run({ ...data, updated_at: now, id })
}

export function deleteSystemRemark(id: number): void {
  getDb().prepare('DELETE FROM system_remarks WHERE id = ?').run(id)
}
