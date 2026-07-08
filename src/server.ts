import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Complaint, UserAccount } from './types.ts';
import { getAllComplaints, saveComplaint, getAllUsers, getUserByEmail, saveUser, deleteComplaint, deleteUser } from './db.ts';

const app = express();
const port = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-secret';
const AUTH_TOKEN_EXPIRY = '2h';
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth attempts, please try again later.',
});

app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(apiLimiter);

const sanitizeUser = (user: UserAccount) => ({
  email: user.email,
  phoneNumber: user.phoneNumber,
  name: user.name,
  studentId: user.studentId,
  role: user.role,
});

const verifyPassword = (plain: string, hashed: string) => bcrypt.compareSync(plain, hashed);
const signToken = (user: UserAccount) => jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: AUTH_TOKEN_EXPIRY });

declare global {
  namespace Express {
    interface Request {
      user?: { email: string; role: UserAccount['role'] };
    }
  }
}

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = (req.headers.authorization || '').toString();
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authorization required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err || typeof payload !== 'object' || payload === null) {
      return res.status(403).json({ error: 'Invalid or expired authorization token.' });
    }

    const { email, role } = payload as { email?: string; role?: UserAccount['role'] };
    if (!email || !role) {
      return res.status(403).json({ error: 'Invalid token payload.' });
    }

    req.user = { email, role };
    next();
  });
};

const authorizeRole = (...allowedRoles: UserAccount['role'][]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

const canManageUser = (req: express.Request, targetEmail: string) => {
  const isSelf = req.user?.email.toLowerCase() === targetEmail.toLowerCase();
  return req.user?.role === 'admin' || req.user?.role === 'superadmin' || isSelf;
};

const canModifyComplaint = (req: express.Request, complaint: Complaint) => {
  const isOwner = complaint.email?.toLowerCase() === req.user?.email.toLowerCase();
  return req.user?.role === 'admin' || req.user?.role === 'superadmin' || isOwner;
};

const ALLOWED_ATTACHMENT_MIME = new Set([
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_ATTACHMENT_EXTS = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx'];

const isValidAttachment = (att: any) => {
  if (!att || !att.name) return false;
  const name = String(att.name).toLowerCase();
  const type = (att.type || '').toLowerCase();
  if (ALLOWED_ATTACHMENT_MIME.has(type)) return true;
  return ALLOWED_ATTACHMENT_EXTS.some(ext => name.endsWith(ext));
};

app.get('/', (req, res) => {
  res.send('Welcome to the Complaint Management System API');
});

app.post('/api/auth/register', authLimiter, (req, res) => {
  const incoming = req.body as Partial<UserAccount> & { password?: string };
  const email = incoming.email?.toLowerCase();
  const password = incoming.password;

  if (!email || !incoming.name || !incoming.studentId || !password) {
    return res.status(400).json({ error: 'Missing required registration fields.' });
  }

  if (getUserByEmail(email)) {
    return res.status(409).json({ error: 'A user with that email already exists.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user: UserAccount = {
    email,
    phoneNumber: incoming.phoneNumber,
    name: incoming.name,
    studentId: incoming.studentId,
    passwordHash: hashedPassword,
    role: incoming.role || 'student',
  };

  saveUser(user);
  res.status(201).json(sanitizeUser(user));
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = getUserByEmail(email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/complaints', (req, res) => {
  const complaints = getAllComplaints();
  res.json(complaints);
});

app.get('/api/complaints/:id', (req, res) => {
  const complaint = getAllComplaints().find(c => c.id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  res.json(complaint);
});

app.post('/api/complaints', (req, res) => {
  const incoming: Partial<Complaint> = req.body;
  if (!incoming.title || !incoming.description || !incoming.category) {
    return res.status(400).json({ error: 'Missing required complaint fields.' });
  }

  // Validate attachments if present
  if (incoming.attachments) {
    const invalid = incoming.attachments.filter(a => !isValidAttachment(a) || !a.contentBase64);
    if (invalid.length > 0) {
      return res.status(400).json({ error: 'One or more attachments are invalid or missing content. Allowed types: PNG, JPG, PDF, DOC, DOCX.' });
    }
  }

  const complaint: Complaint = {
    id: uuidv4(),
    category: incoming.category,
    title: incoming.title,
    description: incoming.description,
    isAnonymous: incoming.isAnonymous ?? true,
    studentName: incoming.studentName,
    studentId: incoming.studentId,
    email: incoming.email,
    phoneNumber: incoming.phoneNumber,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    referenceNumber:
      incoming.referenceNumber ||
      `MUT-2026-${(incoming.category || 'S').charAt(0).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
    status: incoming.status || 'Pending',
    urgency: incoming.urgency || 'medium',
    updates:
      incoming.updates || [
        {
          id: `upd-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          message: 'Case successfully received and stored in the complaints database.',
          status: 'Pending',
        },
      ],
    isPublished: incoming.isPublished ?? false,
    isAcknowledged: incoming.isAcknowledged ?? false,
    receiveEmails: incoming.receiveEmails ?? false,
    attachments: incoming.attachments,
    questionnaire: incoming.questionnaire,
    isMaster: incoming.isMaster ?? false,
    masterTicketId: incoming.masterTicketId,
  };

  saveComplaint(complaint);
  res.status(201).json(complaint);
});

app.put('/api/complaints/:id', authenticateToken, (req, res) => {
  const existingComplaint = getAllComplaints().find(c => c.id === req.params.id);
  if (!existingComplaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (!canModifyComplaint(req, existingComplaint)) {
    return res.status(403).json({ error: 'You do not have permission to modify this complaint.' });
  }

  const incoming: Partial<Complaint> = req.body;
  // Validate attachments if present
  if (incoming.attachments) {
    const invalid = incoming.attachments.filter(a => !isValidAttachment(a) || !a.contentBase64);
    if (invalid.length > 0) {
      return res.status(400).json({ error: 'One or more attachments are invalid or missing content. Allowed types: PNG, JPG, PDF, DOC, DOCX.' });
    }
  }

  const updated: Complaint = {
    ...existingComplaint,
    ...incoming,
    id: existingComplaint.id,
    createdAt: existingComplaint.createdAt,
    referenceNumber: existingComplaint.referenceNumber,
    updates: incoming.updates || existingComplaint.updates,
    attachments: incoming.attachments ?? existingComplaint.attachments,
  };
  saveComplaint(updated);
  res.json(updated);
});

app.post('/api/complaints/bulk', authenticateToken, authorizeRole('admin', 'superadmin'), (req, res) => {
  const incoming = req.body as Partial<Complaint>[];
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Request body must be an array of complaints.' });
  }

  // Validate attachments across the batch
  for (const item of incoming) {
    if (item.attachments) {
      const invalid = item.attachments.filter(a => !isValidAttachment(a) || !a.contentBase64);
      if (invalid.length > 0) {
        return res.status(400).json({ error: 'One or more attachments in the batch are invalid or missing content. Allowed types: PNG, JPG, PDF, DOC, DOCX.' });
      }
    }
  }

  const saved = incoming.map(item => {
    const complaint: Complaint = {
      id: item.id || uuidv4(),
      category: item.category || 'suggestions',
      title: item.title || 'Untitled Concern',
      description: item.description || '',
      isAnonymous: item.isAnonymous ?? true,
      studentName: item.studentName,
      studentId: item.studentId,
      email: item.email,
      phoneNumber: item.phoneNumber,
      createdAt: item.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      referenceNumber:
        item.referenceNumber ||
        `MUT-2026-${(item.category || 'S').charAt(0).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
      status: item.status || 'Pending',
      urgency: item.urgency || 'medium',
      updates:
        item.updates || [
          {
            id: `upd-${Date.now()}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            message: 'Case persisted through bulk sync.',
            status: 'Pending',
          },
        ],
      isPublished: item.isPublished ?? false,
      isAcknowledged: item.isAcknowledged ?? false,
      receiveEmails: item.receiveEmails ?? false,
      attachments: item.attachments,
      questionnaire: item.questionnaire,
      isMaster: item.isMaster ?? false,
      masterTicketId: item.masterTicketId,
    };
    saveComplaint(complaint);
    return complaint;
  });

  res.json(saved);
});

app.delete('/api/complaints/:id', authenticateToken, (req, res) => {
  const existingComplaint = getAllComplaints().find(c => c.id === req.params.id);
  if (!existingComplaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (!canModifyComplaint(req, existingComplaint)) {
    return res.status(403).json({ error: 'You do not have permission to delete this complaint.' });
  }

  deleteComplaint(req.params.id);
  res.status(204).end();
});

app.get('/api/users', authenticateToken, authorizeRole('admin', 'superadmin'), (req, res) => {
  const users = getAllUsers().map(sanitizeUser);
  res.json(users);
});

app.get('/api/users/:email', authenticateToken, (req, res) => {
  const targetEmail = req.params.email.toLowerCase();
  if (!canManageUser(req, targetEmail)) {
    return res.status(403).json({ error: 'You do not have permission to access this user.' });
  }

  const user = getUserByEmail(targetEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(sanitizeUser(user));
});

app.post('/api/users', authLimiter, (req, res) => {
  const incoming = req.body as Partial<UserAccount> & { password?: string };
  const email = incoming.email?.toLowerCase();
  const password = incoming.password || incoming.passwordHash;

  if (!email || !incoming.name || !incoming.studentId || !password) {
    return res.status(400).json({ error: 'Missing required user fields.' });
  }

  if (getUserByEmail(email)) {
    return res.status(409).json({ error: 'A user with that email already exists.' });
  }

  const user: UserAccount = {
    email,
    phoneNumber: incoming.phoneNumber,
    name: incoming.name,
    studentId: incoming.studentId,
    passwordHash: bcrypt.hashSync(password, 10),
    role: incoming.role || 'student',
  };

  saveUser(user);
  res.status(201).json(sanitizeUser(user));
});

app.post('/api/users/bulk', authenticateToken, authorizeRole('admin', 'superadmin'), (req, res) => {
  const incoming = req.body as Partial<UserAccount>[];
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Request body must be an array of users.' });
  }

  const saved = incoming.map(item => {
    const password = item.passwordHash || 'password123';
    const user: UserAccount = {
      email: item.email!.toLowerCase(),
      phoneNumber: item.phoneNumber,
      name: item.name || 'Unnamed User',
      studentId: item.studentId || 'UNKNOWN',
      passwordHash: bcrypt.hashSync(password, 10),
      role: item.role || 'student',
    };
    saveUser(user);
    return sanitizeUser(user);
  });
  res.json(saved);
});

app.put('/api/users/:email', authenticateToken, (req, res) => {
  const targetEmail = req.params.email.toLowerCase();
  if (!canManageUser(req, targetEmail)) {
    return res.status(403).json({ error: 'You do not have permission to update this user.' });
  }

  const existingUser = getUserByEmail(targetEmail);
  if (!existingUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const incoming = req.body as Partial<UserAccount> & { password?: string };
  const updatedUser: UserAccount = {
    ...existingUser,
    ...incoming,
    email: existingUser.email,
    passwordHash: incoming.password || incoming.passwordHash
      ? bcrypt.hashSync(incoming.password || incoming.passwordHash!, 10)
      : existingUser.passwordHash,
  };

  saveUser(updatedUser);
  res.json(sanitizeUser(updatedUser));
});

app.delete('/api/users/:email', authenticateToken, (req, res) => {
  const targetEmail = req.params.email.toLowerCase();
  if (!canManageUser(req, targetEmail)) {
    return res.status(403).json({ error: 'You do not have permission to delete this user.' });
  }

  const existingUser = getUserByEmail(targetEmail);
  if (!existingUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  deleteUser(targetEmail);
  res.status(204).end();
});

app.use(express.static(path.resolve(process.cwd(), 'dist')));

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export { app };
