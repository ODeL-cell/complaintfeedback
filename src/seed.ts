import bcrypt from 'bcryptjs';
import { Complaint, ComplaintCategory, ComplaintStatus, UserAccount } from './types.ts';

export const DEFAULT_USERS: UserAccount[] = [
  {
    email: 'd.mutunga@student.mut.ac.ke',
    phoneNumber: '+254 712 111 222',
    name: 'Dennis Mutunga',
    studentId: 'CT201-4402-2023',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'student'
  },
  {
    email: 'm.cherotich@student.mut.ac.ke',
    phoneNumber: '+254 722 333 444',
    name: 'Mercy Cherotich',
    studentId: 'FI102-1205-2025',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'student'
  },
  {
    email: 'admin@mut.ac.ke',
    phoneNumber: '+254 700 000 000',
    name: 'Super Admin',
    studentId: 'MUT-ADM-001',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  }
];

export const DEFAULT_COMPLAINTS: Complaint[] = [
  {
    id: '1',
    category: 'academic',
    title: 'Exam Timetabling Conflict',
    description: 'The Department of Computer Science has scheduled the "Distributed Systems" exam at the exact same hour as the "Distributed Algorithms" electives exams on Monday of week 2.',
    isAnonymous: false,
    studentName: 'Dennis Mutunga',
    studentId: 'CT201-4402-2023',
    email: 'd.mutunga@student.mut.ac.ke',
    createdAt: '2026-06-12 09:15',
    referenceNumber: 'MUT-2026-A109',
    status: 'Resolved',
    urgency: 'high',
    isPublished: true,
    updates: [
      {
        id: 'u11',
        date: '2026-06-12 11:30',
        message: 'Complaint logged. Forwarding to the Academic Dean and Department timetabling officer.',
        status: 'Pending'
      },
      {
        id: 'u12',
        date: '2026-06-13 14:00',
        message: 'Investigation initiated. We have confirmed the collision in classrooms allocation.',
        status: 'Under Investigation'
      },
      {
        id: 'u13',
        date: '2026-06-14 10:00',
        message: 'Timetabling resolved. Distributed Algorithms is rescheduled to Wednesday at 2:00 PM in Lecture Hall Block B.',
        status: 'Resolved'
      }
    ]
  },
  {
    id: '2',
    category: 'environmental',
    title: 'Hostel Block C Washroom Drainage Breakdown',
    description: 'The third floor boys washroom drainage in Hostel C is blocked, causing water overflows into the hallways on the east wing of the block.',
    isAnonymous: true,
    createdAt: '2026-06-14 16:45',
    referenceNumber: 'MUT-2026-C044',
    status: 'Under Investigation',
    urgency: 'high',
    isPublished: true,
    updates: [
      {
        id: 'u21',
        date: '2026-06-14 17:30',
        message: 'Environmental and sanitation officer dispatched to survey Block C plumbing channels.',
        status: 'Pending'
      },
      {
        id: 'u22',
        date: '2026-06-15 08:30',
        message: 'Plumbing specialists requested. Replacement drain components ordered from central logistics.',
        status: 'Under Investigation'
      }
    ]
  },
  {
    id: '3',
    category: 'financial',
    title: 'HELB Disbursement Registration Delay',
    description: 'I applied and was successfully allocated bursary/HELB support. However, my MUT student portal invoice still reflects negative feedback and an outstanding balance, blocking exam card printouts.',
    isAnonymous: false,
    studentName: 'Mercy Cherotich',
    studentId: 'FI102-1205-2025',
    email: 'm.cherotich@student.mut.ac.ke',
    createdAt: '2026-06-16 11:02',
    referenceNumber: 'MUT-2026-B320',
    status: 'Pending',
    urgency: 'medium',
    updates: [
      {
        id: 'u31',
        date: '2026-06-16 11:30',
        message: 'Complaint queued. Academic finance manager notified for portal reconciliation.',
        status: 'Pending'
      }
    ]
  }
];
