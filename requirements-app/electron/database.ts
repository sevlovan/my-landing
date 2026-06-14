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
  db.exec(`
    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL CHECK(type IN ('epic','feature','story')),
      parent_id INTEGER REFERENCES requirements(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','rejected','in_review')),
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
      type TEXT NOT NULL,
      parent_id INTEGER,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      author TEXT NOT NULL,
      changed_by TEXT NOT NULL DEFAULT '',
      change_comment TEXT DEFAULT '',
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_req_parent ON requirements(parent_id);
    CREATE INDEX IF NOT EXISTS idx_req_type ON requirements(type);
    CREATE INDEX IF NOT EXISTS idx_ver_req ON requirement_versions(requirement_id);
  `)
}

export interface Requirement {
  id: number
  req_id: string
  title: string
  description: string
  type: 'epic' | 'feature' | 'story'
  parent_id: number | null
  priority: 'high' | 'medium' | 'low'
  status: 'draft' | 'approved' | 'rejected' | 'in_review'
  author: string
  created_at: string
  updated_at: string
}

export interface RequirementVersion {
  id: number
  requirement_id: number
  version: number
  title: string
  description: string
  type: string
  parent_id: number | null
  priority: string
  status: string
  author: string
  changed_by: string
  change_comment: string
  changed_at: string
}

export function listRequirements(): Requirement[] {
  return getDb().prepare(`
    SELECT * FROM requirements WHERE is_deleted = 0 ORDER BY type, req_id
  `).all() as Requirement[]
}

export function getRequirement(id: number): Requirement | undefined {
  return getDb().prepare('SELECT * FROM requirements WHERE id = ? AND is_deleted = 0').get(id) as Requirement | undefined
}

export function createRequirement(data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>): Requirement {
  const db = getDb()
  const now = new Date().toISOString()

  const result = db.prepare(`
    INSERT INTO requirements (req_id, title, description, type, parent_id, priority, status, author, created_at, updated_at)
    VALUES (@req_id, @title, @description, @type, @parent_id, @priority, @status, @author, @created_at, @updated_at)
  `).run({ ...data, created_at: now, updated_at: now })

  const req = getRequirement(result.lastInsertRowid as number)!
  saveVersion(req, 'system', 'Initial creation')
  return req
}

export function updateRequirement(
  id: number,
  data: Partial<Omit<Requirement, 'id' | 'created_at'>>,
  changedBy: string,
  changeComment = ''
): Requirement {
  const db = getDb()
  const now = new Date().toISOString()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE requirements SET ${fields}, updated_at = @updated_at WHERE id = @id`)
    .run({ ...data, updated_at: now, id })

  const req = getRequirement(id)!
  saveVersion(req, changedBy, changeComment)
  return req
}

export function deleteRequirement(id: number): void {
  getDb().prepare('UPDATE requirements SET is_deleted = 1 WHERE id = ?').run(id)
}

export function getVersions(requirementId: number): RequirementVersion[] {
  return getDb().prepare(`
    SELECT * FROM requirement_versions WHERE requirement_id = ? ORDER BY version DESC
  `).all(requirementId) as RequirementVersion[]
}

function saveVersion(req: Requirement, changedBy: string, changeComment: string) {
  const db = getDb()
  const lastVersion = db.prepare(
    'SELECT MAX(version) as v FROM requirement_versions WHERE requirement_id = ?'
  ).get(req.id) as { v: number | null }
  const version = (lastVersion.v ?? 0) + 1

  db.prepare(`
    INSERT INTO requirement_versions
      (requirement_id, version, title, description, type, parent_id, priority, status, author, changed_by, change_comment)
    VALUES
      (@requirement_id, @version, @title, @description, @type, @parent_id, @priority, @status, @author, @changed_by, @change_comment)
  `).run({
    requirement_id: req.id,
    version,
    title: req.title,
    description: req.description,
    type: req.type,
    parent_id: req.parent_id,
    priority: req.priority,
    status: req.status,
    author: req.author,
    changed_by: changedBy,
    change_comment: changeComment,
  })
}

export function generateReqId(type: 'epic' | 'feature' | 'story'): string {
  const db = getDb()
  const prefix = type === 'epic' ? 'EP' : type === 'feature' ? 'FT' : 'ST'
  const count = (db.prepare(`SELECT COUNT(*) as c FROM requirements WHERE type = ?`).get(type) as { c: number }).c
  return `${prefix}-${String(count + 1).padStart(4, '0')}`
}
