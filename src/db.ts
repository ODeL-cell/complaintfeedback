import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { Complaint, ComplaintCategory, ComplaintStatus, QuestionnaireAnswers, UserAccount } from './types.ts';
import { DEFAULT_COMPLAINTS, DEFAULT_USERS } from './seed.ts';

const testDbPath = process.env.DB_PATH;
const dbPath = testDbPath
  ? testDbPath
  : path.join(path.resolve(process.cwd(), 'data'), 'portal.db');

if (!testDbPath) {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.prepare(`
  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    isAnonymous INTEGER NOT NULL DEFAULT 1,
    studentName TEXT,
    studentId TEXT,
    email TEXT,
    phoneNumber TEXT,
    createdAt TEXT NOT NULL,
    referenceNumber TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    urgency TEXT NOT NULL,
    updates TEXT NOT NULL,
    isPublished INTEGER NOT NULL DEFAULT 0,
    isAcknowledged INTEGER NOT NULL DEFAULT 0,
    receiveEmails INTEGER NOT NULL DEFAULT 0,
    attachments TEXT,
    questionnaire TEXT,
    isMaster INTEGER NOT NULL DEFAULT 0,
    masterTicketId TEXT
  )
`).run();

const complaintTableInfo = db.prepare(`PRAGMA table_info(complaints)`).all();
const complaintColumns = complaintTableInfo.map((col: any) => col.name);
if (!complaintColumns.includes('attachments')) {
  db.prepare('ALTER TABLE complaints ADD COLUMN attachments TEXT').run();
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    phoneNumber TEXT,
    name TEXT NOT NULL,
    studentId TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL
  )
`).run();

// Note: seeding of default data occurs after helper functions are defined below.

const parseComplaintRow = (row: any): Complaint => ({
  id: row.id,
  category: row.category as ComplaintCategory,
  title: row.title,
  description: row.description,
  isAnonymous: row.isAnonymous === 1,
  studentName: row.studentName ?? undefined,
  studentId: row.studentId ?? undefined,
  email: row.email ?? undefined,
  phoneNumber: row.phoneNumber ?? undefined,
  createdAt: row.createdAt,
  referenceNumber: row.referenceNumber,
  status: row.status as ComplaintStatus,
  urgency: row.urgency as 'low' | 'medium' | 'high',
  updates: row.updates ? JSON.parse(row.updates) : [],
  isPublished: row.isPublished === 1,
  isAcknowledged: row.isAcknowledged === 1,
  receiveEmails: row.receiveEmails === 1,
  questionnaire: row.questionnaire ? JSON.parse(row.questionnaire) : undefined,
  isMaster: row.isMaster === 1,
  masterTicketId: row.masterTicketId ?? undefined,
});

const complaintRowValues = (complaint: Complaint) => ({
  id: complaint.id,
  category: complaint.category,
  title: complaint.title,
  description: complaint.description,
  isAnonymous: complaint.isAnonymous ? 1 : 0,
  studentName: complaint.studentName ?? null,
  studentId: complaint.studentId ?? null,
  email: complaint.email ?? null,
  phoneNumber: complaint.phoneNumber ?? null,
  createdAt: complaint.createdAt,
  referenceNumber: complaint.referenceNumber,
  status: complaint.status,
  urgency: complaint.urgency,
  updates: JSON.stringify(complaint.updates || []),
  isPublished: complaint.isPublished ? 1 : 0,
  isAcknowledged: complaint.isAcknowledged ? 1 : 0,
  receiveEmails: complaint.receiveEmails ? 1 : 0,
  attachments: complaint.attachments ? JSON.stringify(complaint.attachments) : null,
  questionnaire: complaint.questionnaire ? JSON.stringify(complaint.questionnaire) : null,
  isMaster: complaint.isMaster ? 1 : 0,
  masterTicketId: complaint.masterTicketId ?? null,
});

const parseUserRow = (row: any): UserAccount => ({
  email: row.email,
  phoneNumber: row.phoneNumber ?? undefined,
  name: row.name,
  studentId: row.studentId,
  passwordHash: row.passwordHash,
  role: row.role as UserAccount['role'],
});

// Seed defaults if database is empty
const seededComplaints = db.prepare('SELECT COUNT(*) as count FROM complaints').get().count === 0;
const seededUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count === 0;

if (seededComplaints) {
  const insertComplaint = db.prepare(`
    INSERT OR IGNORE INTO complaints (
      id, category, title, description, isAnonymous, studentName, studentId, email, phoneNumber, createdAt, referenceNumber, status, urgency, updates, isPublished, isAcknowledged, receiveEmails, attachments, questionnaire, isMaster, masterTicketId
    ) VALUES (
      @id, @category, @title, @description, @isAnonymous, @studentName, @studentId, @email, @phoneNumber, @createdAt, @referenceNumber, @status, @urgency, @updates, @isPublished, @isAcknowledged, @receiveEmails, @attachments, @questionnaire, @isMaster, @masterTicketId
    )
  `);
  const insertMany = db.transaction((complaints: Complaint[]) => {
    for (const complaint of complaints) {
      insertComplaint.run(complaintRowValues(complaint));
    }
  });
  insertMany(DEFAULT_COMPLAINTS);
}

if (seededUsers) {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, phoneNumber, name, studentId, passwordHash, role)
    VALUES (@email, @phoneNumber, @name, @studentId, @passwordHash, @role)
  `);
  const insertManyUsers = db.transaction((users: UserAccount[]) => {
    for (const user of users) {
      insertUser.run({
        email: user.email.toLowerCase(),
        phoneNumber: user.phoneNumber ?? null,
        name: user.name,
        studentId: user.studentId,
        passwordHash: user.passwordHash,
        role: user.role,
      });
    }
  });
  insertManyUsers(DEFAULT_USERS);
}

export const getAllComplaints = (): Complaint[] => {
  return db.prepare('SELECT * FROM complaints ORDER BY createdAt DESC').all().map(parseComplaintRow);
};

export const getComplaintById = (id: string): Complaint | undefined => {
  const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  return row ? parseComplaintRow(row) : undefined;
};

export const saveComplaint = (complaint: Complaint): Complaint => {
  const statement = db.prepare(`
    INSERT INTO complaints (
      id,
      category,
      title,
      description,
      isAnonymous,
      studentName,
      studentId,
      email,
      phoneNumber,
      createdAt,
      referenceNumber,
      status,
      urgency,
      updates,
      isPublished,
      isAcknowledged,
      receiveEmails,
      attachments,
      questionnaire,
      isMaster,
      masterTicketId
    ) VALUES (
      @id,
      @category,
      @title,
      @description,
      @isAnonymous,
      @studentName,
      @studentId,
      @email,
      @phoneNumber,
      @createdAt,
      @referenceNumber,
      @status,
      @urgency,
      @updates,
      @isPublished,
      @isAcknowledged,
      @receiveEmails,
      @attachments,
      @questionnaire,
      @isMaster,
      @masterTicketId
    )
    ON CONFLICT(id) DO UPDATE SET
      category = excluded.category,
      title = excluded.title,
      description = excluded.description,
      isAnonymous = excluded.isAnonymous,
      studentName = excluded.studentName,
      studentId = excluded.studentId,
      email = excluded.email,
      phoneNumber = excluded.phoneNumber,
      createdAt = excluded.createdAt,
      referenceNumber = excluded.referenceNumber,
      status = excluded.status,
      urgency = excluded.urgency,
      updates = excluded.updates,
      isPublished = excluded.isPublished,
      isAcknowledged = excluded.isAcknowledged,
      receiveEmails = excluded.receiveEmails,
      attachments = excluded.attachments,
      questionnaire = excluded.questionnaire,
      isMaster = excluded.isMaster,
      masterTicketId = excluded.masterTicketId;
  `);

  const rowValues = complaintRowValues(complaint);
  statement.run(rowValues);
  return complaint;
};

export const getAllUsers = (): UserAccount[] => {
  return db.prepare('SELECT * FROM users ORDER BY email ASC').all().map(parseUserRow);
};

export const getUserByEmail = (email: string): UserAccount | undefined => {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  return row ? parseUserRow(row) : undefined;
};

export const saveUser = (user: UserAccount): UserAccount => {
  const statement = db.prepare(`
    INSERT INTO users (email, phoneNumber, name, studentId, passwordHash, role)
    VALUES (@email, @phoneNumber, @name, @studentId, @passwordHash, @role)
    ON CONFLICT(email) DO UPDATE SET
      phoneNumber = excluded.phoneNumber,
      name = excluded.name,
      studentId = excluded.studentId,
      passwordHash = excluded.passwordHash,
      role = excluded.role;
  `);

  statement.run({
    email: user.email.toLowerCase(),
    phoneNumber: user.phoneNumber ?? null,
    name: user.name,
    studentId: user.studentId,
    passwordHash: user.passwordHash,
    role: user.role,
  });
  return user;
};

export const deleteComplaint = (id: string): void => {
  db.prepare('DELETE FROM complaints WHERE id = ?').run(id);
};

export const deleteUser = (email: string): void => {
  db.prepare('DELETE FROM users WHERE email = ?').run(email.toLowerCase());
};

if (process.argv.includes('--init') || process.argv[1]?.endsWith('db.ts') || process.argv[1]?.endsWith('db.js')) {
  console.log(`SQLite database initialized at ${dbPath}`);
}
