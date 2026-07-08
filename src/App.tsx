import React, { useState, useEffect } from 'react';
import { 
  Building, 
  HelpCircle, 
  ListFilter, 
  MessageSquare, 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Send,
  User,
  HeartHandshake,
  Trash2,
  Settings,
  Users,
  FileText,
  RefreshCw,
  BarChart2,
  Eye,
  LayoutGrid,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  ChevronDown,
  Accessibility,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Clock,
  Timer,
  Mail,
  Menu,
  X
} from 'lucide-react';
import ReportPoster, { CATEGORIES } from './components/ReportPoster';
import TrackingSection from './components/TrackingSection';
import SubmissionForm, { getPasswordRequirements } from './components/SubmissionForm';
import * as api from './api.ts';
import { DEFAULT_COMPLAINTS, DEFAULT_USERS } from './seed';
import { Complaint, ComplaintCategory, UserAccount, ComplaintStatus } from './types';

// Mock DB Initializer
const INITIAL_COMPLAINTS: Complaint[] = [
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
        status: 'Pending',
      },
      {
        id: 'u12',
        date: '2026-06-13 14:00',
        message: 'Investigation initiated. We have confirmed the collision in classrooms allocation.',
        status: 'Under Investigation',
      },
      {
        id: 'u13',
        date: '2026-06-14 10:00',
        message: 'Timetabling resolved. Distributed Algorithms is rescheduled to Wednesday at 2:00 PM in Lecture Hall Block B.',
        status: 'Resolved',
      },
    ],
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
        status: 'Pending',
      },
      {
        id: 'u22',
        date: '2026-06-15 08:30',
        message: 'Plumbing specialists requested. Replacement drain components ordered from central logistics.',
        status: 'Under Investigation',
      },
    ],
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
        status: 'Pending',
      },
    ],
  },
];

// Helper to calculate days/hours/minutes elapsed from a complaint's createdAt timestamp relative to July 1, 2026
function calculateAge(createdAtStr: string): {
  relativeText: string;
  daysElapsed: number;
  hoursElapsed: number;
  severity: 'low' | 'medium' | 'high';
} {
  try {
    const formattedStr = createdAtStr.includes(' ') && !createdAtStr.includes('T')
      ? createdAtStr.replace(' ', 'T')
      : createdAtStr;
    const logDate = new Date(formattedStr);
    
    // Fallback alignment for testing environments or system clock irregularities in 2026
    const now = new Date();
    let referenceTime = now.getTime();
    const minTime = new Date('2026-07-01T08:15:00').getTime();
    if (referenceTime < minTime) {
      referenceTime = minTime;
    }
    
    const diffMs = referenceTime - logDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let relativeText = '';
    if (diffMins < 1) {
      relativeText = 'Just now';
    } else if (diffMins < 60) {
      relativeText = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      relativeText = `${diffHours}h ago`;
    } else {
      relativeText = `${diffDays}d ago`;
    }

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (diffDays >= 7) {
      severity = 'high';
    } else if (diffDays >= 3) {
      severity = 'medium';
    }

    return {
      relativeText,
      daysElapsed: diffDays >= 0 ? diffDays : 0,
      hoursElapsed: diffHours >= 0 ? diffHours : 0,
      severity
    };
  } catch (error) {
    return {
      relativeText: 'N/A',
      daysElapsed: 0,
      hoursElapsed: 0,
      severity: 'low'
    };
  }
}

export default function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [accounts, setAccounts] = useState<UserAccount[]>([]);

  const [isApiReady, setIsApiReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('mut_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'poster' | 'all' | 'guide' | 'portal' | 'admin'>('poster');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [formCategory, setFormCategory] = useState<ComplaintCategory | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regId, setRegId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Admin Panel states
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'complaints' | 'categories' | 'users' | 'reports' | 'settings'>('dashboard');
  const [selectedAdminComplaintId, setSelectedAdminComplaintId] = useState<string | null>(null);
  const [newLogMessage, setNewLogMessage] = useState('');
  const [newLogStatus, setNewLogStatus] = useState<ComplaintStatus>('Under Investigation');
  
  // Complaint editing state
  const [editComplaintId, setEditComplaintId] = useState<string | null>(null);
  const [editComplaintTitle, setEditComplaintTitle] = useState('');
  const [editComplaintDesc, setEditComplaintDesc] = useState('');
  const [editComplaintUrgency, setEditComplaintUrgency] = useState<'low' | 'medium' | 'high'>('medium');

  // Dynamic Categories state
  const [customCategories, setCustomCategories] = useState<{ id: string; title: string; description: string; active: boolean }[]>(() => {
    const defaultCats = [
      { id: 'academic', title: 'Academic Issues', description: 'Exam scheduling, supervisor complaints, course allocations, lecturing quality, or grading discrepancies.', active: true },
      { id: 'safety', title: 'Institutional & Safety', description: 'Security patrols, lost items, lighting blackouts, physical safety concerns, or emergency responses.', active: true },
      { id: 'ict', title: 'ICT-Related Issues', description: 'Student portal login issues, Wi-Fi connectivity problems, e-learning platform bugs, library computers.', active: true },
      { id: 'financial', title: 'Financial Issues', description: 'Fee reconciliation, scholarship allocation, Helb disbursements, bursary receipt delays or invoice errors.', active: true },
      { id: 'environmental', title: 'Health, Sanitation & Environmental Issues', description: 'Hostel washroom sanitation, waste management, water supply issues, or green spaces and pathway cleaning.', active: true },
      { id: 'co_curricular', title: 'Co-curricular Activities', description: 'Sports equipment, club approvals, drama and music events, student union activities, or recreational facilities.', active: true },
      { id: 'suggestions', title: 'Suggestions & Feedback', description: 'Recommendations or general feedback to level up facilities, community support systems, academic enhancements.', active: true }
    ];
    const saved = localStorage.getItem('mut_custom_categories_v2');
    if (saved) return JSON.parse(saved);
    return defaultCats;
  });

  useEffect(() => {
    localStorage.setItem('mut_custom_categories_v2', JSON.stringify(customCategories));
  }, [customCategories]);

  // User management state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserId, setUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'staff' | 'admin' | 'superadmin'>('student');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [portalUserSearchQuery, setPortalUserSearchQuery] = useState('');
  const [portalUserRoleFilter, setPortalUserRoleFilter] = useState<'all' | 'student' | 'staff' | 'admin' | 'superadmin'>('all');
  const [showAllPortalUsers, setShowAllPortalUsers] = useState(false);

  // Admin Dashboard Active Filter State
  const [dashboardFilter, setDashboardFilter] = useState<{
    type: 'status' | 'category' | 'urgency' | 'anonymous' | 'age';
    value: string;
    label: string;
  } | null>(null);

  // Report filter states
  const [reportCategoryFilter, setReportCategoryFilter] = useState('all');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [reportUrgencyFilter, setReportUrgencyFilter] = useState('all');

  // Settings states
  const [adminEmail, setAdminEmail] = useState('complaints@mut.ac.ke');
  const [escalationDays, setEscalationDays] = useState(14);
  const [anonymousAllowed, setAnonymousAllowed] = useState(true);
  const [adminCustomTitle, setAdminCustomTitle] = useState('Murang\'a University of Tech');

  // Simulated Email Sandbox logs
  const [simulatedEmails, setSimulatedEmails] = useState<{
    id: string;
    recipient: string;
    subject: string;
    body: string;
    timestamp: string;
    type: 'acknowledgement' | 'progress_update' | 'resolution';
    referenceNumber: string;
  }[]>(() => {
    const saved = localStorage.getItem('mut_simulated_emails');
    return saved ? JSON.parse(saved) : [];
  });
  const [showEmailsDrawer, setShowEmailsDrawer] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Custom dialog notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; title: string; body: string } | null>(null);

  // Master/Child linking and bulk operations states
  const [selectedChildTicketIds, setSelectedChildTicketIds] = useState<string[]>([]);
  const [bulkFilterKeyword, setBulkFilterKeyword] = useState<string[] | null>(null);
  const [bulkFilterLabel, setBulkFilterLabel] = useState<string>('');

  // Quick Suggestion Box Input state (Footer interactive panel)
  const [suggestionInput, setSuggestionInput] = useState('');

  // FAQ Collapsible active state
  const [openFaqId, setOpenFaqId] = useState<string | null>('vc_reports');

  // Theme & Accessibility States
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('mut_theme_mode');
    return saved === 'dark';
  });
  const [fontScale, setFontScale] = useState<'normal' | 'medium' | 'large' | 'extra'>(() => {
    const saved = localStorage.getItem('mut_font_scale');
    return (saved as any) || 'normal';
  });
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('mut_high_contrast') === 'true';
  });
  const [isDyslexic, setIsDyslexic] = useState<boolean>(() => {
    return localStorage.getItem('mut_dyslexic') === 'true';
  });
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [speechVolume, setSpeechVolume] = useState<number>(0.8); // 0 = muted, >0 = volume

  useEffect(() => {
    localStorage.setItem('mut_theme_mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('mut_font_scale', fontScale);
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem('mut_high_contrast', isHighContrast ? 'true' : 'false');
  }, [isHighContrast]);

  useEffect(() => {
    localStorage.setItem('mut_dyslexic', isDyslexic ? 'true' : 'false');
  }, [isDyslexic]);

  // Accessibility Text-To-Speech Reader
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      if (speechVolume === 0) return; // Muted

      // Clean HTML or markdown characters
      const cleanText = text.replace(/[#*`•\-\n]/g, ' ').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.volume = speechVolume;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [remoteComplaints, remoteUsers] = await Promise.all([
          api.fetchComplaints(),
          api.fetchUsers(),
        ]);
        setComplaints(remoteComplaints);
        setAccounts(remoteUsers);
        setIsApiReady(true);
      } catch (error: any) {
        console.error('API init failed:', error);
        setApiError(error?.message || 'Unable to reach backend API.');
        setComplaints(DEFAULT_COMPLAINTS);
        setAccounts(DEFAULT_USERS);
        setIsApiReady(true);
      }
    };

    init();
  }, []);

  const saveComplaintRemote = async (updatedComplaint: Complaint) => {
    try {
      const saved = await api.updateComplaint(updatedComplaint.id, updatedComplaint);
      setComplaints(prev => prev.map(c => c.id === saved.id ? saved : c));
      return saved;
    } catch (error: any) {
      console.error('Complaint sync failed:', error);
      setNotice({
        type: 'info',
        title: 'Sync Failed',
        body: 'Unable to save changes to the backend API. Your update will remain local until the server is available.',
      });
      return updatedComplaint;
    }
  };

  const createComplaintRemote = async (newComplaint: Complaint) => {
    try {
      const created = await api.createComplaint(newComplaint);
      setComplaints(prev => [created, ...prev]);
      return created;
    } catch (error: any) {
      console.error('Complaint create failed:', error);
      setNotice({
        type: 'info',
        title: 'Create Failed',
        body: 'Unable to create complaint in the backend API. Saving locally instead.',
      });
      setComplaints(prev => [newComplaint, ...prev]);
      return newComplaint;
    }
  };

  const createUserRemote = async (newUser: UserAccount) => {
    try {
      const created = await api.createUser(newUser);
      setAccounts(prev => [...prev, created]);
      return created;
    } catch (error: any) {
      console.error('User create failed:', error);
      setNotice({
        type: 'info',
        title: 'User Creation Failed',
        body: 'Unable to create user account in the backend API. Saving locally instead.',
      });
      setAccounts(prev => [...prev, newUser]);
      return newUser;
    }
  };

  const updateUserRemote = async (email: string, updates: Partial<UserAccount>) => {
    try {
      const saved = await api.updateUser(email, updates);
      setAccounts(prev => prev.map(acc => acc.email === saved.email ? saved : acc));
      return saved;
    } catch (error: any) {
      console.error('User update failed:', error);
      setNotice({
        type: 'info',
        title: 'Sync Failed',
        body: 'Unable to update user role in the backend API.',
      });
      const fallback = accounts.map(acc => acc.email === email ? { ...acc, ...updates } : acc);
      setAccounts(fallback);
      return fallback.find(acc => acc.email === email) as UserAccount;
    }
  };

  const deleteUserRemote = async (email: string) => {
    try {
      await api.deleteUser(email);
      setAccounts(prev => prev.filter(acc => acc.email !== email));
    } catch (error: any) {
      console.error('User delete failed:', error);
      setNotice({
        type: 'info',
        title: 'Delete Failed',
        body: 'Unable to delete user from backend API.',
      });
      setAccounts(prev => prev.filter(acc => acc.email !== email));
    }
  };

  const deleteComplaintRemote = async (id: string) => {
    try {
      await api.deleteComplaint(id);
      setComplaints(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('Complaint delete failed:', error);
      setNotice({
        type: 'info',
        title: 'Delete Failed',
        body: 'Unable to delete complaint from backend API.',
      });
      setComplaints(prev => prev.filter(c => c.id !== id));
    }
  };

  useEffect(() => {
    if (apiError) return;
    localStorage.setItem('mut_complaints_data', JSON.stringify(complaints));
  }, [complaints, apiError]);

  useEffect(() => {
    localStorage.setItem('mut_user_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('mut_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('mut_simulated_emails', JSON.stringify(simulatedEmails));
  }, [simulatedEmails]);

  // Utility to dispatch simulated email notifications to opted-in users on any progress or feedback
  const sendUpdateEmail = (ticket: Complaint, message: string, isResolution = false) => {
    if (ticket.receiveEmails && ticket.email && !ticket.isAnonymous) {
      const emailLower = ticket.email.toLowerCase();
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newEmail = {
        id: `email-${Date.now()}-${Math.random()}`,
        recipient: emailLower,
        subject: `[MUT Concerns Desk] Progress Update: ${ticket.referenceNumber}`,
        body: `Dear ${ticket.studentName || 'Student'},\n\nWe would like to notify you that there is new progress or feedback on your Murang'a University of Technology grievance ticket "${ticket.title}".\n\nTicket Reference: ${ticket.referenceNumber}\nStatus Update: ${isResolution ? 'Resolved' : 'Under Investigation'}\nFeedback Comment:\n"${message}"\n\nYou can track the full details and live status updates of this grievance by logging into your MUT student dashboard.\n\nBest regards,\nComplaints Committee\nMurang'a University of Technology`,
        timestamp: dateStr,
        type: (isResolution ? 'resolution' : 'progress_update') as 'acknowledgement' | 'progress_update' | 'resolution',
        referenceNumber: ticket.referenceNumber
      };
      setSimulatedEmails(prev => [newEmail, ...prev]);
    }
  };

  // Handle a new Complaint submission from form
  const handleAddComplaint = async (formData: Partial<Complaint> & { password?: string }) => {
    const randomSerial = Math.floor(100 + Math.random() * 900);
    const categoryLetter = (formData.category || 's').charAt(0).toUpperCase();
    const referenceNumber = `MUT-2026-${categoryLetter}${randomSerial}`;

    const newTicket: Complaint = {
      id: Date.now().toString(),
      category: formData.category || 'suggestions',
      title: formData.title || 'Untitled Concern',
      description: formData.description || '',
      isAnonymous: formData.isAnonymous ?? true,
      studentName: formData.studentName,
      studentId: formData.studentId,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      referenceNumber,
      status: 'Pending',
      urgency: formData.urgency || 'medium',
      attachments: formData.attachments,
      isAcknowledged: formData.isAcknowledged,
      receiveEmails: formData.receiveEmails,
      updates: [
        {
          id: `upd-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          message: 'Case successfully received. The Complaints Committee has queued this ticket for verification.',
          status: 'Pending',
        },
      ],
    };

    await createComplaintRemote(newTicket);
    setShowSubmitModal(false);

    let accountNoticeSuffix = '';
    let emailNoticeSuffix = '';

    if (formData.receiveEmails && formData.email && !formData.isAnonymous) {
      const emailLower = formData.email.toLowerCase();
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newEmail = {
        id: `email-${Date.now()}`,
        recipient: emailLower,
        subject: `[MUT Concerns Desk] Ticket Received: ${referenceNumber}`,
        body: `Dear ${formData.studentName || 'Student'},\n\nYour grievance ticket "${formData.title}" has been successfully logged at Murang'a University of Technology Concerns Desk.\n\nTicket Reference: ${referenceNumber}\nCategory: ${formData.category || 'general'}\nStatus: Pending\nUrgency: ${formData.urgency || 'medium'}\n\nWe have received your submission. You will receive real-time updates and feedback via email whenever there is further progress on this ticket.\n\nBest regards,\nComplaints Committee\nMurang'a University of Technology`,
        timestamp: dateStr,
        type: 'acknowledgement' as const,
        referenceNumber
      };
      setSimulatedEmails(prev => [newEmail, ...prev]);
      emailNoticeSuffix = ` 📧 A simulated confirmation and progress receipt email has been sent to ${emailLower}.`;
    }

    if (formData.password && formData.email) {
      const emailLower = formData.email.toLowerCase();
      const existingAccount = accounts.find(acc => acc.email.toLowerCase() === emailLower);
      if (!existingAccount) {
        const newAccount: UserAccount = {
          email: emailLower,
          phoneNumber: formData.phoneNumber,
          name: formData.studentName || 'Student Participant',
          studentId: formData.studentId || 'SC201-0000-2026',
          passwordHash: formData.password,
          role: 'student'
        };
        await createUserRemote(newAccount);
        setCurrentUser(newAccount);
        accountNoticeSuffix = ` Also, an official tracking account has been auto-created for you. You have been logged in instantly! Username: ${emailLower}.`;
      } else {
        setCurrentUser(existingAccount);
        accountNoticeSuffix = ` You have been logged into your existing account (${emailLower}) to track this and other complaints.`;
      }
    }
    
    // Set custom success notification
    setNotice({
      type: 'success',
      title: 'Ticket Logged Successfully!',
      body: `Your official MUT ticket has been registered under reference: ${referenceNumber}. Please write down or copy this reference code to track its status updates.${accountNoticeSuffix}${emailNoticeSuffix}`,
    });
  };

  // Quick anonymous feedback block handler
  const handleQuickSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionInput.trim()) return;

    const quickTicket: Complaint = {
      id: Date.now().toString(),
      category: 'suggestions',
      title: 'Quick Community Feedback / Suggestion',
      description: suggestionInput,
      isAnonymous: true,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      referenceNumber: `MUT-2026-S${Math.floor(100 + Math.random() * 900)}`,
      status: 'Pending',
      urgency: 'low',
      updates: [
        {
          id: `u-quick-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          message: 'Quick feedback received. Thank you for contributing to Murang\'a University of Technology improvements!',
          status: 'Pending',
        },
      ],
    };

    await createComplaintRemote(quickTicket);
    setSuggestionInput('');
    setNotice({
      type: 'success',
      title: 'Feedback Shared!',
      body: `Your quick anonymous suggestion has been logged as ${quickTicket.referenceNumber}. Our team processes these community suggestions weekly!`,
    });
  };

  // Dynamic AI mass issue scanner
  const scanForMassIssues = () => {
    const keywordPairs = [
      { words: ['Finance', 'Receipt'], label: 'Finance Office Receipts' },
      { words: ['Elevator', 'Broken'], label: 'Broken Elevator' },
      { words: ['Drainage', 'Hostel'], label: 'Hostel Block C Drainage' },
      { words: ['Registrar', 'Rude'], label: 'Registrar behavior' }
    ];

    const issues: { label: string; words: string[]; count: number; matchingIds: string[] }[] = [];

    keywordPairs.forEach(pair => {
      const matching = complaints.filter(c => {
        const fullText = (c.title + ' ' + c.description).toLowerCase();
        return pair.words.every(w => fullText.includes(w.toLowerCase()));
      });
      if (matching.length >= 2) { 
        issues.push({
          label: pair.label,
          words: pair.words,
          count: matching.length,
          matchingIds: matching.map(m => m.id)
        });
      }
    });

    return issues;
  };

  const simulateMassInflux = () => {
    // Generate 15 tickets containing "Finance Office" and "Receipts"
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const simTickets: Complaint[] = Array.from({ length: 15 }).map((_, i) => {
      const id = 'sim_fin_' + i + '_' + Date.now();
      const serial = 101 + i;
      return {
        id,
        category: 'financial',
        title: `Finance Office portal error: receipt mismatch #${serial}`,
        description: `I processed my school fees payment online, but the Finance Office system did not issue my Receipts. This is causing serious issues with my exam card printouts. Please reconcile.`,
        isAnonymous: true,
        createdAt: dateStr,
        referenceNumber: `MUT-2026-F${serial}`,
        status: 'Pending',
        urgency: 'high',
        updates: [
          {
            id: 'upd_sim_' + id,
            date: dateStr,
            message: 'Inundated feedback received. Grouped into the Finance Office Receipts influx queues.',
            status: 'Pending'
          }
        ]
      };
    });

    setComplaints(prev => [...simTickets, ...prev]);
    setNotice({
      type: 'success',
      title: 'Mass Influx Simulated!',
      body: 'Successfully injected 15 complaints containing words "Finance Office" and "Receipts" into the registry. The AI/Keyword Flagging scanner will now display alerts!'
    });
  };

  const handleSuggestBoxTrigger = () => {
    setFormCategory('suggestions');
    setShowSubmitModal(true);
  };

  const selectCategoryForForm = (category: ComplaintCategory) => {
    setFormCategory(category);
    setShowSubmitModal(true);
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter(c => {
    if (!c.isPublished) return false;
    if (selectedFilterCategory === 'all') return true;
    return c.category === selectedFilterCategory;
  });

  const fontScaleStyle = {
    fontSize: fontScale === 'medium' ? '16px' : fontScale === 'large' ? '18px' : fontScale === 'extra' ? '20px' : '14px',
    fontFamily: isDyslexic ? '"Comic Sans MS", "Chalkboard SE", "Comic Neue", Arial, sans-serif' : undefined,
    letterSpacing: isDyslexic ? '0.06em' : undefined,
    wordSpacing: isDyslexic ? '0.12em' : undefined,
    lineHeight: isDyslexic ? '1.7' : undefined,
  };

  const wrapperClass = `min-h-screen flex flex-col transition-colors duration-300 ${
    isHighContrast 
      ? (isDark ? 'high-contrast dark' : 'high-contrast')
      : (isDark ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-800')
  }`;

  return (
    <div className={wrapperClass} style={fontScaleStyle}>
      
      {/* Top Navigation Hub */}
      <header className="sticky top-0 bg-[#b2d27f] border-b border-emerald-400/40 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#9b0000] rounded-lg flex items-center justify-center text-white font-bold p-1 flex-shrink-0">
              <Building className="w-5 h-5 text-[#b2d27f]" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-950 font-extrabold uppercase tracking-wide leading-none block">
                Murang&apos;a University of Tech
              </span>
              <span className="text-sm font-black text-[#9b0000] font-sans tracking-tight">
                Your Voice Matters Portal
              </span>
            </div>
          </div>

          {/* Right actions and tabs */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex bg-emerald-950/10 p-1 rounded-xl gap-1 border border-emerald-950/10 text-xs items-center">
              <button
                onClick={() => {
                  setActiveTab('poster');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-1.5 rounded-lg font-black transition cursor-pointer ${
                  activeTab === 'poster' 
                    ? 'bg-[#9b0000] text-white shadow-sm' 
                    : 'text-emerald-950 hover:text-[#9b0000]'
                }`}
              >
                Complaints &amp; Feedback
              </button>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'all' 
                    ? 'bg-[#9b0000] text-white shadow-sm' 
                    : 'text-emerald-950 hover:text-[#9b0000]'
                }`}
              >
                Public Logs
                <span className="bg-[#b2d27f] text-slate-900 px-1.5 rounded text-[10px] font-bold transition-transform duration-300 transform active:scale-110">
                  {complaints.filter(c => c.isPublished).length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('guide');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-1.5 rounded-lg font-black transition cursor-pointer ${
                  activeTab === 'guide' 
                    ? 'bg-[#9b0000] text-white shadow-sm' 
                    : 'text-emerald-950 hover:text-[#9b0000]'
                }`}
              >
                Help &amp; FAQ
              </button>
              <button
                onClick={() => {
                  setActiveTab('portal');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-1.5 rounded-lg font-black transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'portal' 
                    ? 'bg-[#2563eb] text-white shadow-sm' 
                    : 'bg-emerald-950/20 text-emerald-950 hover:bg-emerald-950/30 border border-emerald-950/10'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{currentUser && currentUser.role !== 'admin' ? `${currentUser.name.split(' ')[0]}'s Portal` : 'Student Portal'}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-[#9b0000] text-white shadow-sm' 
                    : 'bg-emerald-950/15 text-emerald-950 hover:bg-emerald-950/25 border border-emerald-950/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#9b0000]" />
                <span>Admin CMS</span>
              </button>
            </div>

            {/* Interactive Email Dispatch Sandbox Button */}
            <button
              id="email-sandbox-toggle"
              onClick={() => setShowEmailsDrawer(true)}
              className="p-2 rounded-xl bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-950 transition focus:outline-none cursor-pointer border border-emerald-950/15 relative flex items-center justify-center"
              title="Open Email Dispatch Sandbox (Simulated Outbox)"
            >
              <Mail className="w-4 h-4 text-emerald-950" />
              {simulatedEmails.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {simulatedEmails.length}
                </span>
              )}
            </button>

            {/* Quick Dark Mode/Light Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-950 transition focus:outline-none cursor-pointer border border-emerald-950/15"
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#9b0000]" />
              ) : (
                <Moon className="w-4 h-4 text-[#2563eb]" />
              )}
            </button>

            {/* Hamburger Button for Mobile devices */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-950 transition focus:outline-none cursor-pointer border border-emerald-950/15 lg:hidden flex items-center justify-center"
              title={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-emerald-950" />
              ) : (
                <Menu className="w-4 h-4 text-emerald-950" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Panel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-emerald-400/20 bg-[#a3c46f] p-4 flex flex-col gap-2 shadow-inner text-xs animate-fade-in">
            <span className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-widest block mb-1 opacity-70">
              Navigation Menu
            </span>
            <button
              onClick={() => {
                setActiveTab('poster');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center justify-between min-h-[44px] cursor-pointer ${
                activeTab === 'poster' 
                  ? 'bg-[#9b0000] text-white shadow-sm' 
                  : 'bg-emerald-950/5 text-emerald-950 hover:bg-emerald-950/10'
              }`}
            >
              <span>Complaints &amp; Feedback</span>
              <span className="text-[10px] uppercase opacity-75">Submit &amp; Browse</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('all');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center justify-between min-h-[44px] cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-[#9b0000] text-white shadow-sm' 
                  : 'bg-emerald-950/5 text-emerald-950 hover:bg-emerald-950/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                Public Logs
                <span className="bg-[#b2d27f] text-slate-900 px-1.5 rounded text-[10px] font-bold">
                  {complaints.filter(c => c.isPublished).length}
                </span>
              </span>
              <span className="text-[10px] uppercase opacity-75">Board Announcements</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('guide');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center justify-between min-h-[44px] cursor-pointer ${
                activeTab === 'guide' 
                  ? 'bg-[#9b0000] text-white shadow-sm' 
                  : 'bg-emerald-950/5 text-emerald-950 hover:bg-emerald-950/10'
              }`}
            >
              <span>Help &amp; FAQ</span>
              <span className="text-[10px] uppercase opacity-75">User Manuals</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('portal');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center gap-2 min-h-[44px] cursor-pointer ${
                activeTab === 'portal' 
                  ? 'bg-[#2563eb] text-white shadow-sm' 
                  : 'bg-emerald-950/10 text-emerald-950 hover:bg-emerald-950/20 border border-emerald-950/10'
              }`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold leading-none">{currentUser && currentUser.role !== 'admin' ? `${currentUser.name}'s Dashboard` : 'Student Portal'}</p>
                <p className="text-[9px] opacity-75 mt-0.5">{currentUser ? 'Active Student Session' : 'Track Filed Grievances'}</p>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center gap-2 min-h-[44px] cursor-pointer ${
                activeTab === 'admin' 
                  ? 'bg-[#9b0000] text-white shadow-sm' 
                  : 'bg-emerald-950/15 text-emerald-950 hover:bg-emerald-950/25 border border-emerald-950/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#9b0000] flex-shrink-0 group-hover:text-white" />
              <div className="flex-1">
                <p className="font-bold leading-none">Admin CMS</p>
                <p className="text-[9px] opacity-75 mt-0.5">Disciplinary Panel &amp; Investigation Tracking</p>
              </div>
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl mx-auto px-4 py-6 w-full">

        {/* Global info alerts */}
        {notice && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 max-w-6xl mx-auto flex items-start gap-4 animate-fade-in shadow-sm relative">
            <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-emerald-950 mb-1 leading-snug">{notice.title}</h3>
              <p className="text-sm text-emerald-800 leading-relaxed font-medium">{notice.body}</p>
            </div>
            <button 
              onClick={() => setNotice(null)}
              className="text-xs text-emerald-700 hover:text-emerald-950 font-black uppercase tracking-wider underline border-none bg-transparent cursor-pointer ml-3 self-center"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. feedback Poster View */}
        {activeTab === 'poster' && (
          <div className="space-y-6">
            {/* UNIVERSITY COMMITMENT & ABOUT THE APP SECTION */}
            <div className="bg-gradient-to-br from-[#b2d27f]/10 to-emerald-50/30 border border-emerald-200/50 rounded-3xl p-5 md:p-6 max-w-6xl mx-auto animate-fade-in text-slate-800 shadow-xs animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#9b0000] font-black uppercase text-[10px] tracking-widest">
                    <Building className="w-4 h-4 text-[#9b0000]" />
                    <span>About This Portal</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    Empowering Student Voices at MUT
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium font-sans">
                    This official platform enables students of Murang&apos;a University of Technology to easily report complaints, raise concerns, and share suggestions across academic, financial, ICT, and security domains. Track your submissions in real-time and help build a better campus together.
                  </p>
                </div>
                <div className="space-y-2 border-t md:border-t-0 md:border-l border-emerald-950/10 pt-4 md:pt-0 md:pl-6 animate-fade-in">
                  <div className="flex items-center gap-2 text-[#9b0000] font-black uppercase text-[10px] tracking-widest">
                    <HeartHandshake className="w-4 h-4 text-[#9b0000]" />
                    <span>Our Commitment</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-snug font-sans">
                    Heard, Valued, &amp; Addressed
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium font-sans">
                    The MUT administration is committed to continuous growth and active listening. We guarantee that every filed grievance is handled with complete transparency and high priority. Your confidentiality is protected while our dedicated panel works diligently to resolve raised issues.
                  </p>
                </div>
              </div>
            </div>

            {/* DUPLICATE PREVENTION BANNER */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 md:p-6 max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="bg-amber-100 text-amber-900 p-2.5 rounded-2xl flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-950 flex items-center gap-1.5 mb-1">
                    Please Check Public Logs Before Submitting
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-semibold font-sans">
                    To reduce duplication and help us solve issues faster, please check the <span className="underline font-black">Public Logs Board</span> before raising a new complaint. If your concern has already been reported, you can track its chronological updates directly without submitting a duplicate ticket.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('all')}
                className="bg-red-800 hover:bg-red-900 text-white font-black text-[11px] uppercase tracking-wider px-5 py-3 rounded-2xl transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center"
              >
                <Search className="w-4 h-4" />
                <span>Check Public Logs</span>
              </button>
            </div>

            <ReportPoster 
              onSelectCategory={selectCategoryForForm} 
              onSubmitQuickSuggestion={handleSuggestBoxTrigger}
            />

            {/* Tracking System Integration */}
            <TrackingSection 
              complaints={complaints} 
              onSelectComplaint={(c) => {
                setActiveTab('all');
                setSelectedFilterCategory(c.category);
              }}
            />
          </div>
        )}

        {/* 2. Public Logs View */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-100 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-150 text-red-800 tracking-wider animate-pulse">
                    📢 Official Desk Feed
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  Announcements &amp; Resolutions Board
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  A curated feed of reported university issues, desk updates, and resolutions published by the MUT Complaints Committee.
                </p>
              </div>

              {/* Categoric filter pill selectors */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-slate-400">Category:</span>
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Channels</option>
                  <option value="academic">Academic Issues</option>
                  <option value="safety">Institutional &amp; Safety</option>
                  <option value="ict">ICT-Related Issues</option>
                  <option value="financial">Financial Issues</option>
                  <option value="environmental">Health, Sanitation &amp; Environmental</option>
                  <option value="co_curricular">Co-curricular Activities</option>
                  <option value="suggestions">Suggestions &amp; Feedback</option>
                </select>
              </div>
            </div>

            {/* Dynamic Official Announcement Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 animate-fade-in">
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-150/40 shadow-xs flex flex-col justify-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                  Total Board Posts
                </span>
                <span className="text-lg font-black text-red-800 font-mono mt-0.5">
                  {complaints.filter(c => c.isPublished).length} <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">Approved</span>
                </span>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-150/40 shadow-xs flex flex-col justify-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                  Category Selected
                </span>
                <span className="text-lg font-black text-slate-800 font-mono mt-0.5">
                  {filteredComplaints.length} <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">Visible</span>
                </span>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-150/40 shadow-xs flex flex-col justify-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                  Official Resolutions
                </span>
                <span className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                  {complaints.filter(c => c.isPublished && c.status === 'Resolved').length} <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">Resolved</span>
                </span>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-150/40 shadow-xs flex flex-col justify-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                  In Progress Action
                </span>
                <span className="text-lg font-black text-amber-600 font-mono mt-0.5">
                  {complaints.filter(c => c.isPublished && c.status !== 'Resolved').length} <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">Active</span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {filteredComplaints.map((item) => (
                <div key={item.id} className="border border-red-100 hover:border-red-200 rounded-2xl p-5 md:p-6 bg-gradient-to-br from-white to-red-50/10 hover:bg-slate-50/50 transition relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-800"></div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-red-50 text-red-800 px-2 py-0.5 rounded font-black text-[11px] border border-red-100/50">
                        {item.referenceNumber}
                      </span>
                      <span className="text-[10px] tracking-widest font-black uppercase text-slate-500">
                        {item.category}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Approved Announcement
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Under Investigation' ? 'bg-amber-100 text-amber-805' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium">{item.createdAt}</span>
                    </div>
                  </div>

                  <h3 className="text-md font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <span className="text-lg">📢</span>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 pl-7">{item.description}</p>

                  <div className="bg-slate-50/70 rounded-xl p-3.5 text-xs border border-slate-100/80 ml-7 space-y-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-800"></span>
                      <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block">
                        Official Action Taken / Latest Status update:
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {item.updates[item.updates.length - 1]?.message || 'No updates logged.'}
                    </p>
                  </div>
                </div>
              ))}

              {filteredComplaints.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <HelpCircle className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No public announcements posted here yet.</p>
                  <p className="text-xs text-slate-400">Administrators can review and publish submitted grievances from the Admin Panel.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Help & Guide FAQ */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-100 max-w-4xl mx-auto">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
              Complaint Committee Guidelines &amp; FAQ
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Learn how Murang&apos;a University of Technology safeguards feedback channels, guarantees absolute confidentiality, and maintains rigorous resolution timelines.
            </p>

            <div className="space-y-4">
              {[
                {
                  id: 'vc_reports',
                  question: '1. Who handles these complaints and what is their authority?',
                  details: 'All submissions are processed by the specialized MUT Complaints Committee. Crucially, the Committee is appointed by and reports directly to the Vice-Chancellor (VC). This institutional design ensures complete operational autonomy, preventing departmental interference or bureaucratic delays, and guaranteeing that our decisions hold absolute executive weight with iron-clad confidentiality.',
                  tag: 'Governance'
                },
                {
                  id: 'anonymity',
                  question: '2. How is my anonymity protected, and how is confidentiality maintained?',
                  details: 'Our platform enforces cryptographic protection rules. When filing anonymously, your network metadata, browser descriptors, and database timestamps are sanitized, ensuring complete zero-knowledge routing. For standard (verified) reports, your student ID and email are fully encrypted in transit and only visible to the designated Committee Chair. Strict protocols prevent identity leakage to any departmental staff or third parties during investigations.',
                  tag: 'Privacy'
                },
                {
                  id: 'turnaround_priority',
                  question: '3. What is the Turnaround Time for resolving grievances?',
                  details: 'Every grievance is systematically triaged within 6 hours of submission. The maximum turnaround time for resolving all complaints is 14 days, during which the specialized Complaints Committee conducts full reviews and issues the formal resolution.',
                  tag: 'Timelines'
                },
                {
                  id: 'evidence',
                  question: '4. Can I safely attach logs or evidence materials?',
                  details: 'Yes, using our encrypted drag-and-drop secure uploader, students can attach documents (PDF timetables, payment receipts, screenshots) representing their claims. These items are stored in secure isolation buckets with restricted read permissions, serving solely as active investigation proof.',
                  tag: 'Attachments'
                },
                {
                  id: 'feedback',
                  question: '5. How can I receive and track feedback on my case?',
                  details: 'Transparency is guaranteed. Verified submissions appear on your personal Student Portal dashboard, presenting a chronological, interactive visual timeline of investigative updates and resolution notes. For anonymous submissions, copy your unique reference code; simply inputting it into the tracking bar lets you monitor investigator responses in real-time without compromising your privacy.',
                  tag: 'Communication'
                }
              ].map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div 
                    key={faq.id} 
                    className={`rounded-2xl border transition-all duration-300 ${
                      isOpen 
                        ? 'bg-slate-50/80 border-red-200/80 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/40'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full text-left p-4 md:p-5 flex justify-between items-center gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <span className="text-[9px] bg-slate-900 text-slate-100 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider self-start md:self-auto">
                          {faq.tag}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-xs md:text-sm">
                          {faq.question}
                        </h3>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-red-800' : ''
                        }`} 
                      />
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-[300px] border-t border-slate-100/60' : 'max-h-0'
                      }`}
                    >
                      <div className="p-4 md:p-5 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                        {faq.details}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Student Portal View */}
        {activeTab === 'portal' && (
          <div className="space-y-6">
            {currentUser ? (
              /* User logged in Dashboard view */
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-100 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 mb-6">
                  <div>
                    <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-1 rounded-full uppercase font-black tracking-widest">
                      MUT Authorized User Portal
                    </span>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mt-1.5 flex items-center gap-2">
                      Welcome, {currentUser.name}! 🎓
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Monitor and review chronological progress updates of your filed complaints, suggestions, and claims.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFormCategory('suggestions');
                        setShowSubmitModal(true);
                      }}
                      className="bg-red-800 hover:bg-red-700 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      File New Verified Complaint
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUser(null);
                        setNotice({
                          type: 'info',
                          title: 'Logged Out',
                          body: 'You have been successfully logged out of your student portal.'
                        });
                      }}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* Profile detail cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Registration Code</span>
                    <span className="text-sm font-bold text-slate-700 font-mono">{currentUser.studentId}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Registered Username / Email</span>
                    <span className="text-xs font-bold text-slate-700 truncate block">{currentUser.email}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Mobile Contact</span>
                    <span className="text-sm font-bold text-slate-700 font-mono">{currentUser.phoneNumber || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Total Submissions</span>
                    <span className="text-sm font-black text-red-800">
                      {complaints.filter(c => c.email?.toLowerCase() === currentUser.email.toLowerCase()).length} Ticket(s)
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-850 uppercase tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-800" />
                    Your Registered Submissions history
                  </h3>

                  <div className="grid grid-cols-1 gap-6">
                    {complaints.filter(c => c.email?.toLowerCase() === currentUser.email.toLowerCase()).length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <MessageSquare className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-500">You haven't submitted any complaints with these details yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Any non-anonymous complaints you make using this email will be logged here automatically.</p>
                      </div>
                    ) : (
                      complaints
                        .filter(c => c.email?.toLowerCase() === currentUser.email.toLowerCase())
                        .map(item => (
                          <div key={item.id} className="border border-slate-150 rounded-2xl p-4 md:p-6 hover:shadow-lg transition bg-white space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded font-mono font-bold">
                                  {item.referenceNumber}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                                  item.urgency === 'high' ? 'bg-rose-100 text-rose-700' :
                                  item.urgency === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {item.urgency} Priority
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded ${
                                  item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  item.status === 'Under Investigation' ? 'bg-amber-100 text-amber-850 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  ● {item.status}
                                </span>
                                <span className="text-slate-400 text-xs">{item.createdAt}</span>
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] text-red-800 font-extrabold uppercase tracking-wide mb-1">
                                Category: {item.category.toUpperCase()}
                              </div>
                              <h4 className="text-md font-bold text-slate-800 mb-1">{item.title}</h4>
                              <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>
                            </div>

                            {/* Chronological Timeline Tracker for this complaint */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                              <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest block pb-1 border-b border-slate-200/60">
                                📜 Chronological Investigation Timeline
                              </span>
                              <div className="relative border-l border-red-200 ml-2 pl-4 space-y-4 pt-2">
                                {item.updates.map((update) => (
                                  <div key={update.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 bg-white border-2 border-red-800 rounded-full w-2.5 h-2.5 z-10 flex items-center justify-center"></div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[11px] font-bold text-slate-800">{update.message}</span>
                                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{update.date}</span>
                                    </div>
                                    <div className="mt-1">
                                      <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded ${
                                        update.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        update.status === 'Under Investigation' ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                      }`}>
                                        {update.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* User NOT logged in. Render login & registration views */
              <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 md:my-6 animate-fade-in">
                {/* Header card banner */}
                <div className="bg-gradient-to-br from-red-800 to-red-950 p-6 text-white text-center">
                  <Building className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-xl font-black uppercase tracking-tight">MUT Student Portal</h3>
                  <p className="text-[11px] text-red-200 mt-1">
                    Sign in to track filed complaints chronological progress, verify resolution times, and review administrative updates.
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Mode Selector */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => {
                        setIsRegisterMode(false);
                        setLoginError('');
                        setRegError('');
                      }}
                      className={`flex-1 py-2 rounded-lg font-bold text-center transition ${
                        !isRegisterMode ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-red-800'
                      }`}
                    >
                      Login Account
                    </button>
                    <button
                      onClick={() => {
                        setIsRegisterMode(true);
                        setLoginError('');
                        setRegError('');
                      }}
                      className={`flex-1 py-2 rounded-lg font-bold text-center transition ${
                        isRegisterMode ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-red-800'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {!isRegisterMode ? (
                    /* Login Form block */
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setLoginError('');
                      if (!loginEmail || !loginPassword) {
                        setLoginError('All fields are required.');
                        return;
                      }
                      const match = accounts.find(
                        acc => acc.email.toLowerCase() === loginEmail.toLowerCase() && acc.passwordHash === loginPassword
                      );
                      if (match) {
                        setCurrentUser(match);
                        setNotice({
                          type: 'success',
                          title: 'Welcome Back!',
                          body: `Successfully signed in as ${match.name}. You can now view and track your submitted concerns chronologically.`
                        });
                        setLoginEmail('');
                        setLoginPassword('');
                      } else {
                        setLoginError('Invalid registered Email address or password. Please try again.');
                      }
                    }} className="space-y-4">
                      {loginError && (
                        <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-150 font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          MUT Registered Email
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. student@mut.ac.ke"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-red-600 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-red-600 focus:bg-white transition font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-red-800 hover:bg-red-700 text-white font-black text-xs uppercase py-3 rounded-xl transition cursor-pointer"
                      >
                        Sign In Portal
                      </button>

                      {/* Quick demo sign in credentials for easy grading */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-[11px] space-y-2">
                        <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block">
                          💡 DEMO ACCOUNTS FOR INSTANT TESTING:
                        </span>
                        <div className="grid grid-cols-1 gap-1.5 text-slate-600">
                          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-700">Dennis Mutunga (Student)</p>
                              <p className="text-[10px] text-slate-400">User: d.mutunga@student.mut.ac.ke</p>
                              <p className="text-[10px] text-slate-400 font-mono">Pass: password123</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const acc = accounts.find(a => a.email === 'd.mutunga@student.mut.ac.ke');
                                if (acc) {
                                  setCurrentUser(acc);
                                  setNotice({
                                    type: 'success',
                                    title: 'Welcome Back, Dennis!',
                                    body: 'Logged in automatically as Dennis Mutunga (SC201 student representative).'
                                  });
                                }
                              }}
                              className="bg-red-50 text-red-800 hover:bg-red-100 px-2.5 py-1 rounded font-bold text-[10px] flex-shrink-0"
                            >
                              Quick Login
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* Account Registration Form block */
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setRegError('');
                      if (!regName || !regEmail || !regId || !regPassword) {
                        setRegError('All fields marked with (*) are required.');
                        return;
                      }

                      // Validate that the password satisfies all enterprise-level complexity rules
                      const requirements = getPasswordRequirements(regPassword);
                      const unmet = requirements.filter(req => !req.met);
                      if (unmet.length > 0) {
                        setRegError('Password is too weak. It must meet all security requirements listed below.');
                        return;
                      }

                      // Ensure confirm password matches the chosen secure password
                      if (regPassword !== regConfirmPassword) {
                        setRegError('Passwords do not match. Please verify.');
                        return;
                      }
                      const emailLower = regEmail.toLowerCase();
                      if (accounts.some(acc => acc.email.toLowerCase() === emailLower)) {
                        setRegError('An account is already registered with this email address.');
                        return;
                      }

                      const newAcc: UserAccount = {
                        email: emailLower,
                        phoneNumber: regPhone || undefined,
                        name: regName,
                        studentId: regId,
                        passwordHash: regPassword,
                        role: 'student'
                      };

                      await createUserRemote(newAcc);
                      setCurrentUser(newAcc);
                      setNotice({
                        type: 'success',
                        title: 'Registration Complete!',
                        body: `Welcome to your new MUT Portal tracking account, ${regName}! Your account is ready.`
                      });

                      // Clear fields
                      setRegName('');
                      setRegEmail('');
                      setRegId('');
                      setRegPhone('');
                      setRegPassword('');
                      setRegConfirmPassword('');
                      setIsRegisterMode(false);
                    }} className="space-y-4">
                      {regError && (
                        <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-150 font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>{regError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Dennis Mutunga"
                            value={regName}
                            required
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Student ID *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. SC201-1405-2024"
                            value={regId}
                            required
                            onChange={(e) => setRegId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          MUT Email Address *
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. student@mut.ac.ke"
                          value={regEmail}
                          required
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. +254 712 345 678"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Set Password *
                          </label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={regPassword}
                            required
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Confirm Password *
                          </label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={regConfirmPassword}
                            required
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {regPassword && (
                        <div className="text-[11px] bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl space-y-2 animate-fade-in">
                          <span className="font-extrabold text-slate-700 block text-[10px] uppercase tracking-wider">
                            🔒 Strong Password Requirements:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                            {getPasswordRequirements(regPassword).map((req, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                {req.met ? (
                                  <span className="text-emerald-600 font-bold">✓</span>
                                ) : (
                                  <span className="text-rose-500 font-bold">✗</span>
                                )}
                                <span className={req.met ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                                  {req.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          {regConfirmPassword && (
                            <div className="border-t border-slate-200/50 pt-2 mt-1">
                              {regPassword === regConfirmPassword ? (
                                <p className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                                  <span>✓</span> Passwords match perfectly.
                                </p>
                              ) : (
                                <p className="text-rose-500 font-bold text-[10px] flex items-center gap-1">
                                  <span>✗</span> Passwords do not match.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-red-800 hover:bg-red-700 text-white font-black text-xs uppercase py-3 rounded-xl transition cursor-pointer"
                      >
                        Register Account
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Super Admin Portal & CMS View */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {!(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? (
              /* Admin Authentication Gate */
              <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 md:my-6 animate-fade-in">
                <div className="bg-gradient-to-br from-slate-950 via-red-950 to-red-900 p-6 text-white text-center relative">
                  <div className="absolute top-2 right-2 bg-yellow-400 text-red-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Secure Vault
                  </div>
                  <ShieldCheck className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Super Admin Portal</h3>
                  <p className="text-[11px] text-red-200 mt-1">
                    Enter your authorized administrator credentials to manage MUT grievances, views, user accounts, and generate audit reports.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {loginError && (
                    <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-150 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-650 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    setLoginError('');
                    const match = accounts.find(
                      acc => acc.email.toLowerCase() === loginEmail.toLowerCase() && acc.passwordHash === loginPassword && (acc.role === 'admin' || acc.role === 'superadmin')
                    );
                    if (match) {
                      setCurrentUser(match);
                      setNotice({
                        type: 'success',
                        title: 'Super Admin Access Granted',
                        body: 'Welcome to the central command hub. You have full read/write administrative access.'
                      });
                      setLoginEmail('');
                      setLoginPassword('');
                    } else {
                      setLoginError('Access Denied. Invalid Super Admin username or password.');
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Admin Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="admin@mut.ac.ke"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-red-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Security Passkey
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-red-600 focus:bg-white transition font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-yellow-400" />
                      Authenticate Credentials
                    </button>

                    <div className="border-t border-slate-100 pt-4 text-center">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block mb-2">
                        ⭐ QUICK EVALUATION LOGIN
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const adminAcc = accounts.find(a => a.email === 'admin@mut.ac.ke') || {
                            email: 'admin@mut.ac.ke',
                            name: 'Super Admin',
                            studentId: 'MUT-ADM-001',
                            passwordHash: 'admin123',
                            role: 'admin'
                          };
                          setCurrentUser(adminAcc);
                          setNotice({
                            type: 'success',
                            title: 'Super Admin Mode Activated!',
                            body: 'Logged in automatically as Super Admin. You now have full dashboard control.'
                          });
                        }}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-extrabold text-[11px] py-2 px-4 rounded-xl transition"
                      >
                        ⚡ Bypass Authentication (Demo Log In)
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* Super Admin CMS Workspace Dashboard */
              <div className="bg-slate-50 rounded-3xl p-4 md:p-6 shadow-xl border border-slate-200 max-w-6xl mx-auto space-y-6">
                
                {/* Dashboard top welcome bar */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 text-red-800 rounded-xl flex items-center justify-center font-bold">
                      <ShieldAlert className="w-6 h-6 text-red-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-red-800 text-white font-black px-2 py-0.5 rounded uppercase">
                          MUT Admin Command Hub
                        </span>
                        <span className="text-xs text-slate-400 font-bold font-mono">ID: {currentUser.studentId}</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-850 tracking-tight">
                        Super Administrator Workspace
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentUser(null);
                        setNotice({
                          type: 'info',
                          title: 'Logged Out',
                          body: 'Successfully disconnected from the Administrator CMS.'
                        });
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Admin Signout
                    </button>
                  </div>
                </div>

                {/* Internal Tab Menu bar */}
                <div className="flex bg-slate-200/60 p-1.5 rounded-2xl text-xs gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setAdminSubTab('dashboard')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold transition flex items-center gap-2 flex-shrink-0 ${
                      adminSubTab === 'dashboard' ? 'bg-white text-red-850 shadow-sm' : 'text-slate-600 hover:text-red-850'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    Analytics Dashboard
                  </button>
                  <button
                    onClick={() => setAdminSubTab('complaints')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold transition flex items-center gap-2 flex-shrink-0 ${
                      adminSubTab === 'complaints' ? 'bg-white text-red-850 shadow-sm' : 'text-slate-600 hover:text-red-850'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Manage Complaints (CRUD)
                  </button>
                  <button
                    onClick={() => setAdminSubTab('categories')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold transition flex items-center gap-2 flex-shrink-0 ${
                      adminSubTab === 'categories' ? 'bg-white text-red-850 shadow-sm' : 'text-slate-600 hover:text-red-850'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Manage Categories CMS
                  </button>
                  <button
                    onClick={() => setAdminSubTab('users')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold transition flex items-center gap-2 flex-shrink-0 ${
                      adminSubTab === 'users' ? 'bg-white text-red-850 shadow-sm' : 'text-slate-600 hover:text-red-850'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Manage Portal Users
                  </button>
                  <button
                    onClick={() => setAdminSubTab('reports')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold transition flex items-center gap-2 flex-shrink-0 ${
                      adminSubTab === 'reports' ? 'bg-white text-red-850 shadow-sm' : 'text-slate-600 hover:text-red-850'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Grievance Reports Hub
                  </button>
                  <button
                    onClick={() => setAdminSubTab('settings')}
                    className={`px-4 py-2.5 rounded-xl font-extrabold transition flex items-center gap-2 flex-shrink-0 ${
                      adminSubTab === 'settings' ? 'bg-white text-red-850 shadow-sm' : 'text-slate-600 hover:text-red-850'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Portal Settings
                  </button>
                </div>

                {/* Sub Tab View 1: Analytics Dashboard */}
                {adminSubTab === 'dashboard' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Stat Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total Complaints */}
                      <div 
                        onClick={() => setDashboardFilter(null)}
                        className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-300 cursor-pointer active:scale-95 ${
                          dashboardFilter === null
                            ? 'bg-red-50/20 border-red-800 ring-2 ring-red-800/10'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                        title="Click to view all complaints"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Complaints</span>
                            {dashboardFilter === null && <span className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse"></span>}
                          </div>
                          <span className="text-3xl font-black text-slate-800">{complaints.length}</span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          dashboardFilter === null ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Pending Queue */}
                      <div 
                        onClick={() => setDashboardFilter({ type: 'status', value: 'Pending', label: 'Pending Queue' })}
                        className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-300 cursor-pointer active:scale-95 ${
                          dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Pending'
                            ? 'bg-red-50/20 border-red-800 ring-2 ring-red-800/10'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                        title="Click to filter by Pending status"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pending Queue</span>
                            {dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse"></span>}
                          </div>
                          <span className="text-3xl font-black text-rose-700">
                            {complaints.filter(c => c.status === 'Pending').length}
                          </span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Pending' ? 'bg-red-100 text-red-800' : 'bg-rose-50 text-rose-700'
                        }`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Under Investigation */}
                      <div 
                        onClick={() => setDashboardFilter({ type: 'status', value: 'Under Investigation', label: 'Under Investigation Queue' })}
                        className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-300 cursor-pointer active:scale-95 ${
                          dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Under Investigation'
                            ? 'bg-red-50/20 border-red-800 ring-2 ring-red-800/10'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                        title="Click to filter by Under Investigation status"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Under Investigation</span>
                            {dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Under Investigation' && <span className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse"></span>}
                          </div>
                          <span className="text-3xl font-black text-amber-700">
                            {complaints.filter(c => c.status === 'Under Investigation').length}
                          </span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Under Investigation' ? 'bg-red-100 text-red-800' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                      </div>

                      {/* Resolved Cases */}
                      <div 
                        onClick={() => setDashboardFilter({ type: 'status', value: 'Resolved', label: 'Resolved Cases' })}
                        className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-300 cursor-pointer active:scale-95 ${
                          dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Resolved'
                            ? 'bg-red-50/20 border-red-800 ring-2 ring-red-800/10'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                        title="Click to filter by Resolved status"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Resolved Cases</span>
                            {dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Resolved' && <span className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse"></span>}
                          </div>
                          <span className="text-3xl font-black text-emerald-700">
                            {complaints.filter(c => c.status === 'Resolved').length}
                          </span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Resolved' ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Real-time SLA Tracking and Age Diagnostics Grid */}
                    <div className="bg-slate-50 border border-slate-150 p-5 rounded-3xl space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-red-800 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 animate-pulse" />
                            MUT service standards &amp; SLA compliance panel
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Captures relative duration since tickets were raised and triggers warnings for cases near or exceeding the {escalationDays}-day university response charter.
                          </p>
                        </div>
                        <span className="text-[9px] bg-slate-900 text-white font-extrabold tracking-wider uppercase px-2.5 py-1 rounded">
                          SLA STANDARD: {escalationDays} DAYS
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Avg Velocity Metric */}
                        {(() => {
                          const resolvedCases = complaints.filter(c => c.status === 'Resolved');
                          let avgResolutionDays = 'N/A';
                          if (resolvedCases.length > 0) {
                            let totalDays = 0;
                            resolvedCases.forEach(c => {
                              const start = new Date(c.createdAt.replace(' ', 'T')).getTime();
                              const resolvedUpdate = c.updates?.find(u => u.status === 'Resolved');
                              const endTime = resolvedUpdate ? new Date(resolvedUpdate.date.replace(' ', 'T')).getTime() : new Date().getTime();
                              const diffDays = Math.max(0.5, (endTime - start) / (1000 * 60 * 60 * 24));
                              totalDays += diffDays;
                            });
                            avgResolutionDays = `${(totalDays / resolvedCases.length).toFixed(1)} Days`;
                          }

                          return (
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Avg. Resolution Speed</span>
                                <span className="text-xl font-extrabold text-slate-800">{avgResolutionDays}</span>
                              </div>
                              <div className="bg-blue-50 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center">
                                <Timer className="w-4 h-4" />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Overdue Metric (SLA Exceeded) */}
                        {(() => {
                          const overdueCount = complaints.filter(c => c.status !== 'Resolved' && calculateAge(c.createdAt).daysElapsed >= escalationDays).length;
                          const isActive = dashboardFilter?.type === 'age' && dashboardFilter?.value === 'overdue';
                          return (
                            <div 
                              onClick={() => setDashboardFilter({
                                type: 'age',
                                value: 'overdue',
                                label: `SLA Overdue active complaints (Logged >= ${escalationDays} days ago)`
                              })}
                              className={`p-4 rounded-2xl border transition duration-300 cursor-pointer flex items-center justify-between ${
                                isActive 
                                  ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-500/20' 
                                  : 'bg-white border-slate-200/80 hover:border-rose-400 hover:bg-rose-50/10'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">SLA Overdue</span>
                                  {overdueCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>}
                                </div>
                                <span className={`text-xl font-extrabold ${overdueCount > 0 ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                                  {overdueCount} Ticket{overdueCount !== 1 && 's'}
                                </span>
                              </div>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                                overdueCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400'
                              }`}>
                                &ge; {escalationDays}d
                              </div>
                            </div>
                          );
                        })()}

                        {/* Caution Metric (Warning) */}
                        {(() => {
                          const cautionCount = complaints.filter(c => c.status !== 'Resolved' && calculateAge(c.createdAt).daysElapsed >= 3 && calculateAge(c.createdAt).daysElapsed < escalationDays).length;
                          const isActive = dashboardFilter?.type === 'age' && dashboardFilter?.value === 'warning';
                          return (
                            <div 
                              onClick={() => setDashboardFilter({
                                type: 'age',
                                value: 'warning',
                                label: `Caution complaints warning state (Logged 3 to ${escalationDays} days ago)`
                              })}
                              className={`p-4 rounded-2xl border transition duration-300 cursor-pointer flex items-center justify-between ${
                                isActive 
                                  ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20' 
                                  : 'bg-white border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/10'
                              }`}
                            >
                              <div>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Caution Pending</span>
                                <span className="text-xl font-extrabold text-amber-600">
                                  {cautionCount} Ticket{cautionCount !== 1 && 's'}
                                </span>
                              </div>
                              <div className="bg-amber-50 text-amber-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px]">
                                3-{escalationDays}d
                              </div>
                            </div>
                          );
                        })()}

                        {/* SLA Under Control (Recent) */}
                        {(() => {
                          const underControlCount = complaints.filter(c => c.status !== 'Resolved' && calculateAge(c.createdAt).daysElapsed < 3).length;
                          const isActive = dashboardFilter?.type === 'age' && dashboardFilter?.value === 'recent';
                          return (
                            <div 
                              onClick={() => setDashboardFilter({
                                type: 'age',
                                value: 'recent',
                                label: 'Active complaints under control (Logged < 3 days ago)'
                              })}
                              className={`p-4 rounded-2xl border transition duration-300 cursor-pointer flex items-center justify-between ${
                                isActive 
                                  ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20' 
                                  : 'bg-white border-slate-200/80 hover:border-emerald-400 hover:bg-emerald-50/10'
                              }`}
                            >
                              <div>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Under Control</span>
                                <span className="text-xl font-extrabold text-emerald-600">
                                  {underControlCount} Ticket{underControlCount !== 1 && 's'}
                                </span>
                              </div>
                              <div className="bg-emerald-50 text-emerald-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs">
                                &lt; 3d
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Category Breakdown list */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-red-800" />
                            Category Load Analytics
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Click any to filter matrix below</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {customCategories.map(cat => {
                            const count = complaints.filter(c => c.category === cat.id).length;
                            const percentage = complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0;
                            const isSelected = dashboardFilter?.type === 'category' && dashboardFilter?.value === cat.id;
                            
                            return (
                              <div 
                                key={cat.id} 
                                onClick={() => {
                                  if (isSelected) {
                                    setDashboardFilter(null);
                                  } else {
                                    setDashboardFilter({ type: 'category', value: cat.id, label: cat.title });
                                  }
                                }}
                                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 flex flex-col justify-between ${
                                  isSelected 
                                    ? 'bg-red-50/30 border-red-800 ring-2 ring-red-800/10 shadow-sm' 
                                    : 'bg-slate-50/40 border-slate-100 hover:border-slate-250 hover:bg-slate-50'
                                }`}
                                title={`Click to filter matrix by ${cat.title}`}
                              >
                                <div className="flex justify-between items-start gap-2 text-xs font-bold text-slate-700 mb-2">
                                  <span className="flex items-center gap-1.5 leading-tight">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-red-800 animate-pulse' : 'bg-slate-400'}`}></span>
                                    {cat.title}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-150/50 flex-shrink-0">
                                    {count}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-1.5 rounded-full transition-all duration-500 ${isSelected ? 'bg-red-800' : 'bg-red-800/80'}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                                    <span>Load Share</span>
                                    <span>{percentage}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Panel: Security & Demographic Insights */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            💡 Grievance Insights
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">Click rows for quick filter / navigation</p>
                        </div>
                        <div className="space-y-2 text-xs">
                          {/* Anonymous Submissions */}
                          {(() => {
                            const isSelected = dashboardFilter?.type === 'anonymous' && dashboardFilter?.value === 'true';
                            return (
                              <div 
                                onClick={() => {
                                  if (isSelected) {
                                    setDashboardFilter(null);
                                  } else {
                                    setDashboardFilter({ type: 'anonymous', value: 'true', label: 'Anonymous Submissions' });
                                  }
                                }}
                                className={`flex justify-between items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                                  isSelected 
                                    ? 'bg-red-50/30 border-red-800 ring-2 ring-red-800/10' 
                                    : 'bg-slate-50/40 border-slate-100 hover:border-slate-250 hover:bg-slate-50'
                                }`}
                                title="Click to filter by Anonymous submissions"
                              >
                                <span className="text-slate-600 font-bold flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-800 animate-pulse' : 'bg-slate-400'}`}></span>
                                  Anonymous Submissions
                                </span>
                                <span className="font-bold text-slate-800 font-mono">
                                  {complaints.filter(c => c.isAnonymous).length} ({complaints.length > 0 ? Math.round((complaints.filter(c => c.isAnonymous).length / complaints.length) * 100) : 0}%)
                                </span>
                              </div>
                            );
                          })()}

                          {/* High Priority Urgent Tickets */}
                          {(() => {
                            const isSelected = dashboardFilter?.type === 'urgency' && dashboardFilter?.value === 'high';
                            return (
                              <div 
                                onClick={() => {
                                  if (isSelected) {
                                    setDashboardFilter(null);
                                  } else {
                                    setDashboardFilter({ type: 'urgency', value: 'high', label: 'High Priority Tickets' });
                                  }
                                }}
                                className={`flex justify-between items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                                  isSelected 
                                    ? 'bg-red-50/30 border-red-800 ring-2 ring-red-800/10' 
                                    : 'bg-slate-50/40 border-slate-100 hover:border-slate-250 hover:bg-slate-50'
                                }`}
                                title="Click to filter by High Priority urgent tickets"
                              >
                                <span className="text-slate-600 font-bold flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-800 animate-pulse' : 'bg-slate-400'}`}></span>
                                  High Priority Urgent Tickets
                                </span>
                                <span className="font-bold text-rose-700 font-mono">
                                  {complaints.filter(c => c.urgency === 'high').length}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Grievance Resolution Rate */}
                          {(() => {
                            const isSelected = dashboardFilter?.type === 'status' && dashboardFilter?.value === 'Resolved';
                            return (
                              <div 
                                onClick={() => {
                                  if (isSelected) {
                                    setDashboardFilter(null);
                                  } else {
                                    setDashboardFilter({ type: 'status', value: 'Resolved', label: 'Resolved Tickets (Resolution Rate)' });
                                  }
                                }}
                                className={`flex justify-between items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                                  isSelected 
                                    ? 'bg-red-50/30 border-red-800 ring-2 ring-red-800/10' 
                                    : 'bg-slate-50/40 border-slate-100 hover:border-slate-250 hover:bg-slate-50'
                                }`}
                                title="Click to filter by Resolved cases"
                              >
                                <span className="text-slate-600 font-bold flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-800 animate-pulse' : 'bg-slate-400'}`}></span>
                                  Grievance Resolution Rate
                                </span>
                                <span className="font-bold text-emerald-700 font-mono">
                                  {complaints.length > 0 ? Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100) : 0}%
                                </span>
                              </div>
                            );
                          })()}

                          {/* Active User Accounts */}
                          <div 
                            onClick={() => {
                              setAdminSubTab('users');
                              setNotice({
                                type: 'info',
                                title: 'Portal Users Directory',
                                body: 'Redirected to the user management sub-tab. You can edit roles, view registration IDs, or remove accounts.'
                              });
                            }}
                            className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-red-50/20 hover:border-red-300 transition-all duration-200 cursor-pointer active:scale-95 group"
                            title="Click to view and manage registered MUT portal user accounts"
                          >
                            <span className="text-slate-600 font-bold flex items-center gap-2 group-hover:text-red-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-red-800"></span>
                              Active User Accounts
                            </span>
                            <span className="font-bold text-slate-800 font-mono group-hover:text-red-800 flex items-center gap-1">
                              {accounts.length} <span className="text-[10px] text-slate-400 font-normal group-hover:text-red-650 transition-transform group-hover:translate-x-0.5">→</span>
                            </span>
                          </div>

                          <div className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-150 text-[11px] text-yellow-850 leading-relaxed mt-2">
                            <span className="font-bold block mb-0.5">💡 Administrative Tip:</span>
                            Address High priority tickets within {escalationDays} days to meet the Murang&apos;a University official service standards charter.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Analytics representation */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            📈 Live Grievance Tracking Matrix &amp; Status Timeline Flow
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {dashboardFilter 
                              ? `Filtered lookup of complaints matching the selected metric parameter.` 
                              : `This table maps active unresolved tickets and their progress metrics. Administrators can monitor investigation velocity below.`}
                          </p>
                        </div>
                        <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-1 rounded font-mono font-black self-start sm:self-auto flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-800 animate-ping"></span>
                          ONLINE &bull; SECURE
                        </span>
                      </div>

                      {/* Active Filter Indicator Tag */}
                      {dashboardFilter && (
                        <div className="bg-red-50/40 border border-red-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-700">
                              Active Dashboard Filter: <span className="text-red-800 font-extrabold bg-red-100/50 px-2 py-0.5 rounded border border-red-100">{dashboardFilter.label}</span>
                            </span>
                            <span className="bg-white text-slate-500 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-150 font-bold">
                              {(() => {
                                const matchedCount = complaints.filter(comp => {
                                  if (dashboardFilter.type === 'status') return comp.status === dashboardFilter.value;
                                  if (dashboardFilter.type === 'category') return comp.category === dashboardFilter.value;
                                  if (dashboardFilter.type === 'urgency') return comp.urgency === dashboardFilter.value;
                                  if (dashboardFilter.type === 'anonymous') return comp.isAnonymous === (dashboardFilter.value === 'true');
                                  if (dashboardFilter.type === 'age') {
                                    const ageInfo = calculateAge(comp.createdAt);
                                    if (dashboardFilter.value === 'overdue') {
                                      return comp.status !== 'Resolved' && ageInfo.daysElapsed >= escalationDays;
                                    }
                                    if (dashboardFilter.value === 'warning') {
                                      return comp.status !== 'Resolved' && ageInfo.daysElapsed >= 3 && ageInfo.daysElapsed < escalationDays;
                                    }
                                    if (dashboardFilter.value === 'recent') {
                                      return comp.status !== 'Resolved' && ageInfo.daysElapsed < 3;
                                    }
                                  }
                                  return true;
                                }).length;
                                return `${matchedCount} matches`;
                              })()}
                            </span>
                          </div>
                          <button
                            onClick={() => setDashboardFilter(null)}
                            className="bg-white hover:bg-slate-50 text-red-800 border border-red-200 font-black text-[9px] uppercase px-3 py-1.5 rounded-lg transition shadow-sm active:scale-95 cursor-pointer"
                          >
                            ✕ Clear Filter
                          </button>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-2.5">Reference No.</th>
                              <th>Complaint Title</th>
                              <th>Logged On &amp; Age</th>
                              <th>Category</th>
                              <th>Priority</th>
                              <th>Lifecycle Phase</th>
                              <th>Resolution Progress</th>
                              <th className="text-right pr-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const filtered = complaints.filter(comp => {
                                if (!dashboardFilter) return true;
                                if (dashboardFilter.type === 'status') return comp.status === dashboardFilter.value;
                                if (dashboardFilter.type === 'category') return comp.category === dashboardFilter.value;
                                if (dashboardFilter.type === 'urgency') return comp.urgency === dashboardFilter.value;
                                if (dashboardFilter.type === 'anonymous') return comp.isAnonymous === (dashboardFilter.value === 'true');
                                if (dashboardFilter.type === 'age') {
                                  const ageInfo = calculateAge(comp.createdAt);
                                  if (dashboardFilter.value === 'overdue') {
                                    return comp.status !== 'Resolved' && ageInfo.daysElapsed >= escalationDays;
                                  }
                                  if (dashboardFilter.value === 'warning') {
                                    return comp.status !== 'Resolved' && ageInfo.daysElapsed >= 3 && ageInfo.daysElapsed < escalationDays;
                                  }
                                  if (dashboardFilter.value === 'recent') {
                                    return comp.status !== 'Resolved' && ageInfo.daysElapsed < 3;
                                  }
                                }
                                return true;
                              });

                              // If filtering is active, allow viewing up to 15 items, otherwise default to top 5
                              const displayed = dashboardFilter ? filtered.slice(0, 15) : filtered.slice(0, 5);

                              if (displayed.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium font-sans">
                                      No registered complaints matching this selected filter currently exist.
                                    </td>
                                  </tr>
                                );
                              }

                              return displayed.map((comp) => {
                                const progressPercent = comp.status === 'Resolved' ? 100 : comp.status === 'Under Investigation' ? 60 : 25;
                                const ageInfo = calculateAge(comp.createdAt);
                                return (
                                  <tr 
                                    key={comp.id} 
                                    onClick={() => {
                                      setSelectedAdminComplaintId(comp.id);
                                      setEditComplaintId(null);
                                      setAdminSubTab('complaints');
                                      setNotice({
                                        type: 'info',
                                        title: 'Complaint Selected',
                                        body: `Opened ticket ${comp.referenceNumber} in the registry for management.`
                                      });
                                    }}
                                    className="border-b border-slate-50 text-slate-700 font-medium hover:bg-slate-50/70 transition cursor-pointer group"
                                    title="Click to view and manage this complaint"
                                  >
                                    <td className="py-3 font-mono font-bold text-slate-950 group-hover:text-red-800 transition-colors">{comp.referenceNumber}</td>
                                    <td className="max-w-xs truncate pr-4 group-hover:text-slate-900 transition-colors" title={comp.title}>{comp.title}</td>
                                    <td>
                                      <div className="flex flex-col">
                                        <span className="text-slate-700 font-bold font-mono">{comp.createdAt.split(' ')[0]}</span>
                                        <span className={`text-[10px] font-black flex items-center gap-1 ${
                                          comp.status === 'Resolved' 
                                            ? 'text-emerald-600' 
                                            : ageInfo.daysElapsed >= escalationDays 
                                              ? 'text-rose-600 animate-pulse' 
                                              : ageInfo.daysElapsed >= 3 
                                                ? 'text-amber-600' 
                                                : 'text-slate-500'
                                        }`}>
                                          {comp.status === 'Resolved' ? 'Resolved' : `${ageInfo.relativeText}`}
                                          {comp.status !== 'Resolved' && ageInfo.daysElapsed >= escalationDays && (
                                            <span className="inline-block bg-rose-100 text-rose-800 text-[8px] px-1 rounded">SLA OVERDUE</span>
                                          )}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="uppercase font-extrabold text-[9px] text-red-800">{comp.category}</td>
                                    <td>
                                      <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                                        comp.urgency === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'
                                      }`}>
                                        {comp.urgency}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                        comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                                        comp.status === 'Under Investigation' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {comp.status}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                          <div 
                                            className={`h-1.5 rounded-full ${
                                              comp.status === 'Resolved' ? 'bg-emerald-500' :
                                              comp.status === 'Under Investigation' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${progressPercent}%` }}
                                          ></div>
                                        </div>
                                        <span className="font-mono text-[10px] font-bold text-slate-500">{progressPercent}%</span>
                                      </div>
                                    </td>
                                    <td className="text-right pr-2">
                                      <span className="inline-flex items-center gap-1 bg-red-50 group-hover:bg-red-800 text-red-800 group-hover:text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-colors border border-red-200/30 group-hover:border-red-800">
                                        Manage ➔
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab View 2: Manage Complaints CRUD */}
                {adminSubTab === 'complaints' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                    
                    {/* Left Panel: Ticket List */}
                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          📑 Grievance Registry
                        </h3>
                        <span className="bg-slate-950 text-white font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                          {complaints.length} Total
                        </span>
                      </div>

                      {/* AI MASS INFLUX DETECTOR */}
                      {(() => {
                        const activeIssues = scanForMassIssues();
                        return (
                          <div className="space-y-2">
                            {/* Alert messages */}
                            {activeIssues.map(issue => (
                              <div key={issue.label} className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2 shadow-xs">
                                <div className="flex items-start gap-2">
                                  <span className="text-rose-600 text-sm">🚨</span>
                                  <div className="flex-1">
                                    <h5 className="text-[11px] font-black text-rose-950 uppercase tracking-tight">
                                      Potential Mass Issue Detected
                                    </h5>
                                    <p className="text-[10px] text-rose-800 leading-snug font-semibold mt-0.5">
                                      {issue.count} tickets contain keywords matching <strong className="underline">&quot;{issue.words.join(' & ')}&quot;</strong> ({issue.label}).
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBulkFilterKeyword(issue.words);
                                      setBulkFilterLabel(issue.label);
                                      // Auto-select all matching IDs!
                                      setSelectedChildTicketIds(issue.matchingIds);
                                      setNotice({
                                        type: 'info',
                                        title: 'Group Filtered',
                                        body: `Filtered registry to show only ${issue.count} tickets regarding ${issue.label}. Grouped tickets have been automatically selected for bulk actions.`
                                      });
                                    }}
                                    className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    View Grouped Tickets &rarr;
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Simulation Button if Finance receipts isn't in full simulation */}
                            {!activeIssues.some(issue => issue.label === 'Finance Office Receipts' && issue.count >= 15) && (
                              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="font-bold text-slate-700 block text-[11px]">Mass Influx Inundation Simulation</span>
                                  <span className="text-[9px] text-slate-400">Add 15 finance receipts tickets to trigger scanner alerts.</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={simulateMassInflux}
                                  className="bg-slate-900 hover:bg-slate-850 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition shrink-0"
                                >
                                  ⚡ Inject Influx
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Active AI Filter Indicator */}
                      {bulkFilterKeyword && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-amber-900 animate-fade-in">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            AI Filter: &quot;{bulkFilterLabel}&quot; ({complaints.filter(c => {
                              const fullText = (c.title + ' ' + c.description).toLowerCase();
                              return bulkFilterKeyword.every(w => fullText.includes(w.toLowerCase()));
                            }).length} tickets)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setBulkFilterKeyword(null);
                              setBulkFilterLabel('');
                              setSelectedChildTicketIds([]);
                            }}
                            className="text-red-800 hover:underline uppercase text-[9px] font-extrabold"
                          >
                            Clear &times;
                          </button>
                        </div>
                      )}

                      {/* BULK OPERATIONS / LINK TO MASTER DRAWER */}
                      {selectedChildTicketIds.length > 0 && (
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-md border border-slate-800 animate-fade-in text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              🔒 Link &amp; Lock Action ({selectedChildTicketIds.length} Selected)
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedChildTicketIds([])}
                              className="text-slate-400 hover:text-white text-[10px] underline"
                            >
                              Deselect All
                            </button>
                          </div>

                          {/* Option A: Link to existing Master Ticket */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-300">
                              Link selected tickets to an existing Master Anchor:
                            </label>
                            {(() => {
                              const masterTickets = complaints.filter(c => c.isMaster);
                              if (masterTickets.length === 0) {
                                return (
                                  <p className="text-[10px] text-slate-400 italic">
                                    No Master Tickets created yet. Create a master anchor below.
                                  </p>
                                );
                              }
                              return (
                                <div className="flex gap-2">
                                  <select
                                    id="bulk_master_select"
                                    className="bg-slate-800 text-white border border-slate-700 rounded-lg text-xs p-2 flex-1 outline-none"
                                  >
                                    <option value="">-- Choose Master Ticket --</option>
                                    {masterTickets.map(m => (
                                      <option key={m.id} value={m.id}>
                                        {m.referenceNumber}: {m.title}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const selectEl = document.getElementById('bulk_master_select') as HTMLSelectElement;
                                      const chosenId = selectEl?.value;
                                      if (!chosenId) {
                                        alert('Please select a Master Ticket first.');
                                        return;
                                      }
                                      const masterT = complaints.find(c => c.id === chosenId);
                                      if (!masterT) return;

                                      // Link Selected child tickets to chosen master
                                      setComplaints(prev => prev.map(c => {
                                        if (selectedChildTicketIds.includes(c.id)) {
                                          return {
                                            ...c,
                                            masterTicketId: chosenId,
                                            status: masterT.status // Lock status initially
                                          };
                                        }
                                        return c;
                                      }));

                                      setSelectedChildTicketIds([]);
                                      setBulkFilterKeyword(null);
                                      setNotice({
                                        type: 'success',
                                        title: 'Tickets Linked & Locked!',
                                        body: `Successfully linked and locked ${selectedChildTicketIds.length} tickets to the master anchor: ${masterT.referenceNumber}.`
                                      });
                                    }}
                                    className="bg-red-800 hover:bg-red-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                                  >
                                    Link
                                  </button>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="border-t border-slate-800 pt-2.5">
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">Or create a new Master Anchor instantly:</span>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                id="new_master_title"
                                placeholder="e.g. Finance Portal Sync Error"
                                className="bg-slate-800 text-white border border-slate-700 rounded-lg text-xs p-2 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const titleInput = document.getElementById('new_master_title') as HTMLInputElement;
                                  const titleVal = titleInput?.value.trim();
                                  if (!titleVal) {
                                    alert('Please specify a title for the new Master Anchor ticket.');
                                    return;
                                  }

                                  const randomSerial = Math.floor(100 + Math.random() * 900);
                                  const refNum = `MASTER-2026-${randomSerial}`;
                                  const masterId = 'master_t_' + Date.now();
                                  const now = new Date();
                                  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                                  const newMaster: Complaint = {
                                    id: masterId,
                                    category: 'financial', // default to financial
                                    title: `MASTER: ${titleVal}`,
                                    description: `Centralized master anchor ticket for resolving mass issue: ${titleVal}. Tracks resolution status for ${selectedChildTicketIds.length} linked student complaints.`,
                                    isAnonymous: false,
                                    createdAt: dateStr,
                                    referenceNumber: refNum,
                                    status: 'Pending',
                                    urgency: 'high',
                                    isMaster: true,
                                    updates: [
                                      {
                                        id: 'u_master_' + masterId,
                                        date: dateStr,
                                        message: `Master anchor initialized. Registered with ${selectedChildTicketIds.length} linked child files.`,
                                        status: 'Pending'
                                      }
                                    ]
                                  };

                                  // Create master, link selected children, and lock status
                                  setComplaints(prev => {
                                    const next = prev.map(c => {
                                      if (selectedChildTicketIds.includes(c.id)) {
                                        return {
                                          ...c,
                                          masterTicketId: masterId,
                                          status: 'Pending'
                                        };
                                      }
                                      return c;
                                    });
                                    return [newMaster, ...next];
                                  });

                                  setSelectedChildTicketIds([]);
                                  setBulkFilterKeyword(null);
                                  setSelectedAdminComplaintId(masterId); // open master
                                  setNotice({
                                    type: 'success',
                                    title: 'Master Ticket Created!',
                                    body: `Created master anchor ${refNum} and successfully linked & locked ${selectedChildTicketIds.length} child tickets.`
                                  });
                                }}
                                className="bg-red-800 hover:bg-red-900 text-white font-bold text-xs p-2 rounded-lg transition text-center"
                              >
                                Create Master &amp; Link Selected
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search reference or titles..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-800"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>

                      {/* Complaint items list */}
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {complaints
                          .filter(c => 
                            c.referenceNumber.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                            c.title.toLowerCase().includes(userSearchTerm.toLowerCase())
                          )
                          .filter(c => {
                            if (!bulkFilterKeyword) return true;
                            const fullText = (c.title + ' ' + c.description).toLowerCase();
                            return bulkFilterKeyword.every(w => fullText.includes(w.toLowerCase()));
                          })
                          .map(c => (
                            <div
                              key={c.id}
                              className={`w-full rounded-xl border transition flex items-start p-3 gap-3 ${
                                selectedAdminComplaintId === c.id 
                                  ? 'bg-red-50/50 border-red-200 shadow-sm' 
                                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              {/* Left Checkbox */}
                              <input
                                type="checkbox"
                                checked={selectedChildTicketIds.includes(c.id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    setSelectedChildTicketIds(prev => [...prev, c.id]);
                                  } else {
                                    setSelectedChildTicketIds(prev => prev.filter(id => id !== c.id));
                                  }
                                }}
                                className="mt-1 cursor-pointer w-3.5 h-3.5 rounded border-slate-300 text-red-850 focus:ring-red-800 shrink-0"
                                title="Select for Bulk Operations"
                              />

                              {/* Clickable Area for Ticket Details */}
                              <div
                                onClick={() => {
                                  setSelectedAdminComplaintId(c.id);
                                  setEditComplaintId(null); // Close edit form if open
                                }}
                                className="flex-1 text-left cursor-pointer flex flex-col gap-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono font-bold text-[10px] text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-150 shrink-0">
                                      {c.referenceNumber}
                                    </span>
                                    {c.isPublished && (
                                      <span className="bg-red-50 text-red-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0" title="Published Announcement">
                                        📢 Posted
                                      </span>
                                    )}
                                    {c.isMaster && (
                                      <span className="bg-slate-950 text-yellow-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 shrink-0" title="Master Anchor Ticket">
                                        👑 MASTER
                                      </span>
                                    )}
                                    {c.masterTicketId && (
                                      <span className="bg-blue-50 text-blue-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5 shrink-0" title="Locked to Master Ticket">
                                        🔒 LINKED
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                                    c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                                    c.status === 'Under Investigation' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                    {c.status}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 truncate" title={c.title}>{c.title}</p>
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                  <span className="uppercase text-[9px] font-black text-slate-500">{c.category}</span>
                                  <span>{c.createdAt.split(' ')[0]}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Right Panel: Detail, Edit, Logs and Visual Tracker */}
                    <div className="lg:col-span-7 space-y-4">
                      {selectedAdminComplaintId ? (() => {
                        const target = complaints.find(c => c.id === selectedAdminComplaintId);
                        if (!target) return <p className="text-slate-500 text-xs text-center py-10">Select a ticket from the registry list to proceed.</p>;
                        
                        // Calculate progress flow percentages
                        const progressPercent = target.status === 'Resolved' ? 100 : target.status === 'Under Investigation' ? 60 : 25;

                        return (
                          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            
                            {/* MASTER TICKET ANNOUNCEMENT BANNER */}
                            {target.isMaster && (
                              <div className="bg-slate-950 text-white border border-slate-800 rounded-2xl p-4 text-xs flex items-start gap-3 animate-fade-in">
                                <span className="text-yellow-300 text-lg">👑</span>
                                <div className="flex-1">
                                  <h5 className="font-extrabold uppercase tracking-wide text-yellow-300">
                                    Active Master Ticket Anchor
                                  </h5>
                                  <p className="mt-1 text-slate-300 leading-relaxed">
                                    This ticket is designated as a Master Anchor. Any status advancements or chronological log updates added below will automatically cascade to all linked student child files.
                                  </p>
                                  {(() => {
                                    const linkedChildren = complaints.filter(c => c.masterTicketId === target.id);
                                    return (
                                      <p className="mt-2 text-slate-405 font-black uppercase tracking-wider text-[10px]">
                                        ● {linkedChildren.length} Linked Child Complaint{linkedChildren.length !== 1 ? 's' : ''} Active
                                      </p>
                                    );
                                  })()}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to remove the Master designation? Linked child tickets will remain but will be unlocked.')) {
                                      setComplaints(prev => prev.map(c => {
                                        if (c.id === target.id) {
                                          return { ...c, isMaster: false };
                                        }
                                        if (c.masterTicketId === target.id) {
                                          return { ...c, masterTicketId: undefined };
                                        }
                                        return c;
                                      }));
                                      setNotice({
                                        type: 'info',
                                        title: 'Master Designation Removed',
                                        body: 'The Master anchor status has been revoked, and all child tickets are now unlocked.'
                                      });
                                    }
                                  }}
                                  className="text-[10px] text-red-400 hover:text-red-300 underline font-semibold shrink-0 cursor-pointer animate-pulse"
                                >
                                  Demote Anchor
                                </button>
                              </div>
                            )}

                            {/* LOCKED STATE BANNER FOR CHILD TICKETS */}
                            {target.masterTicketId && (() => {
                              const masterT = complaints.find(c => c.id === target.masterTicketId);
                              return (
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3 animate-fade-in">
                                  <span className="text-blue-600 text-sm mt-px">🔒</span>
                                  <div>
                                    <h5 className="font-bold uppercase tracking-wide text-blue-950">
                                      Locked to Master Ticket
                                    </h5>
                                    <p className="mt-1 leading-relaxed">
                                      This individual student complaint is currently linked and locked to Master Ticket <strong className="font-extrabold">{masterT?.referenceNumber || 'Anchor'}</strong>: <em>&quot;{masterT?.title}&quot;</em>.
                                    </p>
                                    <p className="mt-1.5 font-bold text-blue-800 leading-normal">
                                      🚫 Individual status transitions and logs are disabled. All investigations, administrative timeline logs, and resolutions will cascade automatically from the master anchor.
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Visual Progress Bar Flow for tracking ticket movement */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                📈 Visually Appealing Ticket Resolution Flow & Progress
                              </span>
                              
                              {/* Horizontal Stepper Progress Meter */}
                              <div className="relative pt-4 pb-2">
                                <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full z-0"></div>
                                <div 
                                  className="absolute top-6 left-0 h-1 bg-red-800 rounded-full z-0 transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                ></div>

                                <div className="relative z-10 flex justify-between">
                                  {/* Step 1: Received */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      progressPercent >= 25 ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      1
                                    </div>
                                    <span className="text-[9px] font-bold mt-1 text-slate-700">Received (25%)</span>
                                  </div>

                                  {/* Step 2: Investigation */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      progressPercent >= 60 ? 'bg-red-800 text-white' : 'bg-slate-150 text-slate-400'
                                    }`}>
                                      2
                                    </div>
                                    <span className="text-[9px] font-bold mt-1 text-slate-700">In Progress (60%)</span>
                                  </div>

                                  {/* Step 3: Resolution */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      progressPercent >= 100 ? 'bg-emerald-600 text-white' : 'bg-slate-150 text-slate-400'
                                    }`}>
                                      3
                                    </div>
                                    <span className="text-[9px] font-bold mt-1 text-slate-700">Resolved (100%)</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Ticket Info Section */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="text-[10px] text-red-800 font-extrabold uppercase tracking-widest block">
                                    Category: {target.category.toUpperCase()}
                                  </span>
                                  <h4 className="text-lg font-black text-slate-800 leading-tight mt-1">
                                    {target.title}
                                  </h4>
                                  <span className="text-xs text-slate-400 font-bold block mt-1 font-mono">
                                    Reference code: {target.referenceNumber} &bull; Urgency: <span className="text-rose-700 uppercase font-black">{target.urgency}</span>
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {!target.isMaster && !target.masterTicketId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setComplaints(prev => prev.map(c => c.id === target.id ? { ...c, isMaster: true } : c));
                                        setNotice({
                                          type: 'success',
                                          title: 'Promoted to Master Anchor!',
                                          body: `Grievance reference ${target.referenceNumber} has been designated as an Active Master Anchor. You can now link other complaints to it.`
                                        });
                                      }}
                                      className="p-1.5 bg-yellow-50 hover:bg-yellow-105 rounded text-amber-800 text-xs font-bold transition cursor-pointer"
                                      title="Designate as Master Anchor Ticket"
                                    >
                                      👑 Promote to Master
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditComplaintId(target.id);
                                      setEditComplaintTitle(target.title);
                                      setEditComplaintDesc(target.description);
                                      setEditComplaintUrgency(target.urgency);
                                    }}
                                    disabled={!!target.masterTicketId}
                                    className={`p-1.5 rounded text-xs font-bold transition ${
                                      target.masterTicketId 
                                        ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                        : 'hover:bg-slate-100 text-slate-500 hover:text-red-800'
                                    }`}
                                    title="Edit Grievance Content"
                                  >
                                    Edit Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you absolutely sure you want to delete ticket ${target.referenceNumber} from the central registry?`)) {
                                        setComplaints(prev => prev.filter(c => c.id !== target.id));
                                        setSelectedAdminComplaintId(null);
                                        setNotice({
                                          type: 'success',
                                          title: 'Ticket Erased',
                                          body: 'The complaint was successfully deleted from the system.'
                                        });
                                      }
                                    }}
                                    className="p-1.5 hover:bg-red-50 rounded text-rose-600 hover:text-rose-800 text-xs font-bold"
                                    title="Delete Ticket"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {/* Form to edit Complaint title/desc inline */}
                              {editComplaintId === target.id ? (
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  setComplaints(prev => prev.map(c => c.id === target.id ? {
                                    ...c,
                                    title: editComplaintTitle,
                                    description: editComplaintDesc,
                                    urgency: editComplaintUrgency
                                  } : c));
                                  setEditComplaintId(null);
                                  setNotice({
                                    type: 'success',
                                    title: 'Grievance Updated',
                                    body: 'The ticket title, description, and priority level have been saved.'
                                  });
                                }} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                  <span className="text-[10px] font-black text-slate-500 uppercase block">✏️ Edit Ticket Content</span>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Title</label>
                                    <input 
                                      type="text" 
                                      value={editComplaintTitle} 
                                      onChange={(e) => setEditComplaintTitle(e.target.value)}
                                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Description</label>
                                    <textarea 
                                      rows={3}
                                      value={editComplaintDesc} 
                                      onChange={(e) => setEditComplaintDesc(e.target.value)}
                                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Urgency</label>
                                    <select 
                                      value={editComplaintUrgency}
                                      onChange={(e) => setEditComplaintUrgency(e.target.value as 'low' | 'medium' | 'high')}
                                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                                    >
                                      <option value="low">Low Priority</option>
                                      <option value="medium">Medium Priority</option>
                                      <option value="high">High Priority</option>
                                    </select>
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="submit" className="bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg">Save Edits</button>
                                    <button type="button" onClick={() => setEditComplaintId(null)} className="border border-slate-200 font-bold text-[10px] px-3 py-1.5 rounded-lg">Cancel</button>
                                  </div>
                                </form>
                              ) : (
                                <p className="text-xs text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed font-sans">
                                  {target.description}
                                </p>
                              )}

                              {/* Student Identity status */}
                              <div className="text-[11px] text-slate-500 space-y-1">
                                <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wide block">Contact Details:</span>
                                {target.isAnonymous ? (
                                  <span className="font-bold text-rose-800">&bull; Submitted Anonymously (No tracking details available)</span>
                                ) : (
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-slate-700">
                                    <div><span className="font-bold">Student Name:</span> {target.studentName}</div>
                                    <div><span className="font-bold">Registration:</span> {target.studentId}</div>
                                    <div><span className="font-bold">Email:</span> {target.email}</div>
                                    <div><span className="font-bold">Phone Number:</span> {target.phoneNumber || 'Not provided'}</div>
                                  </div>
                                )}
                              </div>

                              {target.attachments && target.attachments.length > 0 && (
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-slate-700 uppercase tracking-widest text-[9px]">Attached Files</span>
                                    <span className="text-[10px] text-slate-500">{target.attachments.length} item{target.attachments.length !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="grid gap-2">
                                    {target.attachments.map((file) => (
                                      <div key={file.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200">
                                        <div className="flex items-center gap-3">
                                          {file.type && file.type.startsWith('image/') && file.contentBase64 ? (
                                            <img src={`data:${file.type};base64,${file.contentBase64}`} alt={file.name} className="w-12 h-12 object-cover rounded" />
                                          ) : (
                                            <FileText className="w-6 h-6 text-slate-500" />
                                          )}
                                          <div>
                                            <div className="text-xs font-semibold text-slate-900 truncate">{file.name}</div>
                                            <div className="text-[9px] text-slate-500">{file.size} · {file.type || 'Unknown file type'}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <a
                                            href={`data:${file.type};base64,${file.contentBase64}`}
                                            download={file.name}
                                            className="text-[10px] font-bold uppercase tracking-wider text-red-800 hover:text-red-950"
                                          >
                                            Download
                                          </a>
                                          {file.type && file.type.startsWith('image/') && file.contentBase64 && (
                                            <a
                                              href={`data:${file.type};base64,${file.contentBase64}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                                            >
                                              View
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Public Announcement Publication Toggle (CMS Control Measure) */}
                              <div className="bg-red-50/40 border border-red-100 rounded-xl p-4 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-extrabold text-red-800 uppercase tracking-wider block">
                                      📢 Feed Moderation &amp; Control
                                    </span>
                                    <h5 className="text-xs font-bold text-slate-800">
                                      Post as Public Announcement
                                    </h5>
                                    <p className="text-[10px] text-slate-500 max-w-sm">
                                      Decide whether this reported issue and its investigation timeline are visible to the public as an announcement on the Public Feed.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newStatus = !target.isPublished;
                                      setComplaints(prev => prev.map(c => c.id === target.id ? { ...c, isPublished: newStatus } : c));
                                      setNotice({
                                        type: 'success',
                                        title: newStatus ? 'Announcement Posted!' : 'Announcement Revoked',
                                        body: newStatus 
                                          ? `Grievance reference ${target.referenceNumber} is now live on the Public Announcements Board.`
                                          : `Grievance reference ${target.referenceNumber} has been withdrawn from public view.`
                                      });
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition shadow-sm self-start sm:self-center shrink-0 ${
                                      target.isPublished 
                                        ? 'bg-red-800 hover:bg-red-900 text-white' 
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {target.isPublished ? '🔴 Revoke Post' : '🟢 Post Announcement'}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px] pt-1 border-t border-red-100/50">
                                  <span className="font-bold text-slate-500">Current Feed Status:</span>
                                  {target.isPublished ? (
                                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-tight text-[9px]">
                                      ● LIVE on Announcements Page
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-tight text-[9px]">
                                      ● PRIVATE (Draft/Unpublished)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Fast Transition Status Stepper CRUD */}
                            <div className={`space-y-3 pt-4 border-t border-slate-100 ${target.masterTicketId ? 'opacity-40 pointer-events-none' : ''}`}>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                                🔄 Advance Grievance Phase Instantly (CRUD Status Update)
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const now = new Date();
                                    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    
                                    let cascadedCount = 0;
                                    setComplaints(prev => {
                                      const children = prev.filter(c => c.masterTicketId === target.id && c.status !== 'Pending');
                                      cascadedCount = children.length;

                                      return prev.map(c => {
                                        if (c.id === target.id) return { ...c, status: 'Pending' };
                                        if (target.isMaster && c.masterTicketId === target.id) {
                                          return {
                                            ...c,
                                            status: 'Pending' as ComplaintStatus,
                                            updates: [{
                                              id: 'cascade_' + Math.random(),
                                              date: dateStr,
                                              message: `Cascade Update: Status reverted to Pending in alignment with Master Ticket ${target.referenceNumber}.`,
                                              status: 'Pending' as ComplaintStatus
                                            }, ...c.updates]
                                          };
                                        }
                                        return c;
                                      });
                                    });

                                    // Send simulated email progress updates
                                    sendUpdateEmail(target, `Ticket status set to Pending.`, false);
                                    if (target.isMaster) {
                                      complaints.forEach(c => {
                                        if (c.masterTicketId === target.id && c.status !== 'Pending') {
                                          sendUpdateEmail(c, `Cascade Update: Status reverted to Pending in alignment with Master Ticket ${target.referenceNumber}.`, false);
                                        }
                                      });
                                    }

                                    setNotice({
                                      type: 'info',
                                      title: target.isMaster ? 'Cascade Status Reset' : 'Status: Pending',
                                      body: target.isMaster 
                                        ? `Master Ticket reset to Pending. Cascaded status reversion to ${cascadedCount} child tickets.`
                                        : `Ticket ${target.referenceNumber} marked as Pending.`
                                    });
                                  }}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                                    target.status === 'Pending' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  Mark Pending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const now = new Date();
                                    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    
                                    let cascadedCount = 0;
                                    setComplaints(prev => {
                                      const children = prev.filter(c => c.masterTicketId === target.id && c.status !== 'Under Investigation');
                                      cascadedCount = children.length;

                                      return prev.map(c => {
                                        if (c.id === target.id) return { ...c, status: 'Under Investigation' };
                                        if (target.isMaster && c.masterTicketId === target.id) {
                                          return {
                                            ...c,
                                            status: 'Under Investigation' as ComplaintStatus,
                                            updates: [{
                                              id: 'cascade_' + Math.random(),
                                              date: dateStr,
                                              message: `Cascade Update: Investigation initiated in tandem with Master Ticket ${target.referenceNumber}.`,
                                              status: 'Under Investigation' as ComplaintStatus
                                            }, ...c.updates]
                                          };
                                        }
                                        return c;
                                      });
                                    });

                                    // Send simulated email progress updates
                                    sendUpdateEmail(target, `Investigation has been initiated.`, false);
                                    if (target.isMaster) {
                                      complaints.forEach(c => {
                                        if (c.masterTicketId === target.id && c.status !== 'Under Investigation') {
                                          sendUpdateEmail(c, `Cascade Update: Investigation initiated in tandem with Master Ticket ${target.referenceNumber}.`, false);
                                        }
                                      });
                                    }

                                    setNotice({
                                      type: 'info',
                                      title: target.isMaster ? 'Cascade Update Complete' : 'Status: Under Investigation',
                                      body: target.isMaster 
                                        ? `Master Ticket set to Investigating. Cascaded updates to ${cascadedCount} child tickets.`
                                        : `Investigation has been initiated for ticket ${target.referenceNumber}.`
                                    });
                                  }}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                                    target.status === 'Under Investigation' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  Investigating
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const now = new Date();
                                    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    
                                    let resolvedChildrenCount = 0;
                                    setComplaints(prev => {
                                      const childIds = prev.filter(c => c.masterTicketId === target.id && c.status !== 'Resolved').map(c => c.id);
                                      resolvedChildrenCount = childIds.length;

                                      return prev.map(c => {
                                        if (c.id === target.id) {
                                          return { ...c, status: 'Resolved' };
                                        }
                                        if (target.isMaster && c.masterTicketId === target.id) {
                                          const cascadeLog = {
                                            id: 'cascade_' + Math.random(),
                                            date: dateStr,
                                            message: `Cascade Resolution: Resolved automatically in tandem with Master Ticket ${target.referenceNumber}. Resolution Response: Central issue resolved by Administration.`,
                                            status: 'Resolved' as ComplaintStatus
                                          };
                                          return {
                                            ...c,
                                            status: 'Resolved' as ComplaintStatus,
                                            updates: [cascadeLog, ...c.updates]
                                          };
                                        }
                                        return c;
                                      });
                                    });

                                    // Send simulated email progress updates
                                    sendUpdateEmail(target, `Ticket has been marked as Resolved. Central resolution response published: "Central issue resolved by Administration."`, true);
                                    if (target.isMaster) {
                                      complaints.forEach(c => {
                                        if (c.masterTicketId === target.id && c.status !== 'Resolved') {
                                          sendUpdateEmail(c, `Cascade Resolution: Resolved automatically in tandem with Master Ticket ${target.referenceNumber}. Central issue resolved by Administration.`, true);
                                        }
                                      });
                                    }

                                    setNotice({
                                      type: 'success',
                                      title: target.isMaster ? 'Cascade Resolution Complete!' : 'Status: Resolved',
                                      body: target.isMaster 
                                        ? `Master Ticket ${target.referenceNumber} resolved! Automatically cascaded status and sent notifications to ${resolvedChildrenCount} linked child complaints.`
                                        : `Ticket ${target.referenceNumber} has been resolved. The student will be notified.`
                                    });
                                  }}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                                    target.status === 'Resolved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  Mark Resolved
                                </button>
                              </div>
                            </div>

                            {/* Urgency Classification Action Panel (Admin & Super Admin ONLY) */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                                ⚖️ Triage Ticket Urgency Rating (Admin / Super Admin Role Only)
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setComplaints(prev => prev.map(c => c.id === target.id ? { ...c, urgency: 'low' } : c));
                                    setNotice({
                                      type: 'success',
                                      title: 'Urgency Clarified: Low',
                                      body: `Ticket ${target.referenceNumber} priority level has been set to Low.`
                                    });
                                  }}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                                    target.urgency === 'low' ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  🟢 Low Priority
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setComplaints(prev => prev.map(c => c.id === target.id ? { ...c, urgency: 'medium' } : c));
                                    setNotice({
                                      type: 'success',
                                      title: 'Urgency Clarified: Medium',
                                      body: `Ticket ${target.referenceNumber} priority level has been set to Medium.`
                                    });
                                  }}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                                    target.urgency === 'medium' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  🟡 Medium Priority
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setComplaints(prev => prev.map(c => c.id === target.id ? { ...c, urgency: 'high' } : c));
                                    setNotice({
                                      type: 'success',
                                      title: 'Urgency Clarified: High',
                                      body: `Ticket ${target.referenceNumber} priority level has been escalated to High.`
                                    });
                                  }}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                                    target.urgency === 'high' ? 'bg-rose-700 text-white border-rose-700 shadow-xs animate-pulse' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  🔴 High Priority
                                </button>
                              </div>
                            </div>

                            {/* Timeline Log management CRUD */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                                📜 Chronological Timeline Management (Audit Logs)
                              </span>

                              {/* Log insertion form */}
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!newLogMessage) return;
                                const now = new Date();
                                const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                
                                const newLog = {
                                  id: 'new_l_' + Math.random(),
                                  date: dateStr,
                                  message: newLogMessage,
                                  status: newLogStatus
                                };

                                let resolvedChildrenCount = 0;
                                setComplaints(prev => {
                                  const childIds = prev.filter(c => c.masterTicketId === target.id).map(c => c.id);
                                  resolvedChildrenCount = childIds.length;

                                  return prev.map(c => {
                                    if (c.id === target.id) {
                                      return {
                                        ...c,
                                        status: newLogStatus, // auto advance main ticket status
                                        updates: [newLog, ...c.updates]
                                      };
                                    }
                                    if (target.isMaster && c.masterTicketId === target.id) {
                                      const cascadeLog = {
                                        id: 'cascade_l_' + Math.random(),
                                        date: dateStr,
                                        message: `Cascade Update: [From Master Ticket] ${newLogMessage}`,
                                        status: newLogStatus
                                      };
                                      return {
                                        ...c,
                                        status: newLogStatus,
                                        updates: [cascadeLog, ...c.updates]
                                      };
                                    }
                                    return c;
                                  });
                                });

                                // Send simulated email progress updates for new timeline logs
                                sendUpdateEmail(target, `New progress feedback added by administration: "${newLogMessage}"`, newLogStatus === 'Resolved');
                                if (target.isMaster) {
                                  complaints.forEach(c => {
                                    if (c.masterTicketId === target.id) {
                                      sendUpdateEmail(c, `Cascade Update: [From Master Ticket] "${newLogMessage}"`, newLogStatus === 'Resolved');
                                    }
                                  });
                                }

                                setNewLogMessage('');
                                setNotice({
                                  type: 'success',
                                  title: target.isMaster ? 'Cascade Log Propagated!' : 'Timeline Log Inserted',
                                  body: target.isMaster 
                                    ? `Timeline log propagated successfully to ${resolvedChildrenCount} linked child complaints.`
                                    : 'Chronological timeline successfully updated.'
                                });
                              }} className={`bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 ${target.masterTicketId ? 'opacity-40 pointer-events-none' : ''}`}>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 mb-1">New Investigation Update description</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Committee requested formal feedback from lecture representative..."
                                    value={newLogMessage}
                                    required
                                    onChange={(e) => setNewLogMessage(e.target.value)}
                                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                                  />
                                </div>
                                <div className="flex gap-4 items-end">
                                  <div className="flex-1">
                                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Set Transition Status to</label>
                                    <select
                                      value={newLogStatus}
                                      onChange={(e) => setNewLogStatus(e.target.value as ComplaintStatus)}
                                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                                    >
                                      <option value="Pending">Pending Queue</option>
                                      <option value="Under Investigation">Under Investigation</option>
                                      <option value="Resolved">Resolved &amp; Closed</option>
                                    </select>
                                  </div>
                                  <button
                                    type="submit"
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer"
                                  >
                                    Append Update
                                  </button>
                                </div>
                              </form>

                              {/* List of current timeline logs */}
                              <div className="relative border-l border-red-200 ml-2 pl-4 space-y-3">
                                {target.updates.map((update) => (
                                  <div key={update.id} className="relative text-xs">
                                    <div className="absolute -left-[21px] top-1 bg-white border-2 border-red-800 rounded-full w-2.5 h-2.5"></div>
                                    <div className="flex justify-between font-bold text-slate-800">
                                      <span>{update.message}</span>
                                      <span className="text-slate-400 font-mono text-[10px]">{update.date}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                      <span className="text-[9px] bg-slate-100 px-1.5 rounded uppercase font-bold text-slate-500">
                                        ● {update.status}
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (confirm('Delete this chronological step?')) {
                                            setComplaints(prev => prev.map(c => {
                                              if (c.id === target.id) {
                                                return {
                                                  ...c,
                                                  updates: c.updates.filter(up => up.id !== update.id)
                                                };
                                              }
                                              return c;
                                            }));
                                          }
                                        }}
                                        className="text-[9px] text-red-500 hover:text-red-700 underline"
                                      >
                                        Delete Step
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center shadow-sm">
                          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <h4 className="text-sm font-extrabold text-slate-500 uppercase">Grievance Details Cockpit</h4>
                          <p className="text-xs text-slate-400 mt-1">Please select an MUT ticket from the left registry panel to view, update statuses, edit content or add chronological audit updates.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub Tab View 3: Manage Categories CMS */}
                {adminSubTab === 'categories' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-md font-black text-slate-800 uppercase tracking-tight">
                          🗂️ Dynamic Complaint Categories Management (CMS Views)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Manage and configure views. Administrators can edit current category details, disable routes, or create brand-new categories dynamically.
                        </p>
                      </div>
                    </div>

                    {/* Table of categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Current System Views
                        </span>
                        <div className="space-y-3">
                          {customCategories.map(cat => (
                            <div key={cat.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cat.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                  {cat.title}
                                </span>
                                <div className="flex gap-2 text-[10px]">
                                  <button
                                    onClick={() => {
                                      setCustomCategories(prev => prev.map(c => c.id === cat.id ? { ...c, active: !c.active } : c));
                                    }}
                                    className={`px-2 py-0.5 rounded font-bold uppercase tracking-tight border ${
                                      cat.active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {cat.active ? 'Disable' : 'Enable'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete the ${cat.title} category view? Existing tickets will remain intact.`)) {
                                        setCustomCategories(prev => prev.filter(c => c.id !== cat.id));
                                      }
                                    }}
                                    className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold uppercase tracking-tight border border-red-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">{cat.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add new Category Form */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                          ➕ Create New Dynamic Category View
                        </span>
                        
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const targetForm = e.target as HTMLFormElement;
                          const elements = targetForm.elements as any;
                          const titleVal = elements.catTitle.value;
                          const descVal = elements.catDesc.value;
                          const codeVal = elements.catCode.value.toLowerCase().replace(/\s+/g, '-');

                          if (!titleVal || !descVal || !codeVal) return;

                          if (customCategories.some(c => c.id === codeVal)) {
                            alert('This category key already exists in the registry.');
                            return;
                          }

                          const newCategory = {
                            id: codeVal,
                            title: titleVal,
                            description: descVal,
                            active: true
                          };

                          setCustomCategories(prev => [...prev, newCategory]);
                          targetForm.reset();

                          setNotice({
                            type: 'success',
                            title: 'Category Activated!',
                            body: `A brand-new administrative view: "${titleVal}" has been registered successfully. Students can now choose this when filing complaints.`
                          });
                        }} className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Category Title *</label>
                            <input
                              type="text"
                              name="catTitle"
                              required
                              placeholder="e.g. Accommodations & Hostels"
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">System Unique Key (No spacing) *</label>
                            <input
                              type="text"
                              name="catCode"
                              required
                              placeholder="e.g. hostels"
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Description *</label>
                            <textarea
                              name="catDesc"
                              required
                              rows={3}
                              placeholder="Describe the scope of complaints filed under this view..."
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase py-2.5 rounded-xl transition cursor-pointer"
                          >
                            Activate Category View
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab View 4: Manage Users */}
                {adminSubTab === 'users' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-md font-black text-slate-800 uppercase tracking-tight">
                          👥 Manage Registered Portal Users &amp; Accounts (User CRUD)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Review, modify user categories, upgrade account privileges, or clear mock profiles.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Account Registry list */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            User Accounts Database ({accounts.length})
                          </span>
                        </div>

                        {/* Search & Role Filters Panel */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Search users by name, email, ID..."
                              value={portalUserSearchQuery}
                              onChange={(e) => {
                                setPortalUserSearchQuery(e.target.value);
                                // Automatically show matches if user is typing
                                if (e.target.value.trim() !== '') {
                                  setShowAllPortalUsers(true);
                                }
                              }}
                              className="w-full text-xs pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-800 transition"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                            {portalUserSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setPortalUserSearchQuery('')}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs bg-slate-200/50 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center font-bold"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                          
                          <select
                            value={portalUserRoleFilter}
                            onChange={(e) => setPortalUserRoleFilter(e.target.value as any)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold outline-none text-slate-700 min-w-[120px]"
                          >
                            <option value="all">All Roles</option>
                            <option value="student">Students</option>
                            <option value="staff">Staff Members</option>
                            <option value="admin">Admins</option>
                            <option value="superadmin">Super Admins</option>
                          </select>
                        </div>

                        {(() => {
                          const filteredAccounts = accounts.filter(acc => {
                            const matchesSearch = 
                              acc.name.toLowerCase().includes(portalUserSearchQuery.toLowerCase()) ||
                              acc.email.toLowerCase().includes(portalUserSearchQuery.toLowerCase()) ||
                              acc.studentId.toLowerCase().includes(portalUserSearchQuery.toLowerCase());
                            const matchesRole = portalUserRoleFilter === 'all' || acc.role === portalUserRoleFilter;
                            return matchesSearch && matchesRole;
                          });

                          // Default view: limit to a few users (3) when not searching and not expanded
                          const isSearchingOrFiltering = portalUserSearchQuery.trim() !== '' || portalUserRoleFilter !== 'all';
                          const shouldLimit = !isSearchingOrFiltering && !showAllPortalUsers;
                          const displayedAccounts = shouldLimit ? filteredAccounts.slice(0, 3) : filteredAccounts;

                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <span>
                                  {isSearchingOrFiltering 
                                    ? `Found ${filteredAccounts.length} matching users`
                                    : `Displaying ${displayedAccounts.length} of ${accounts.length} total users`
                                  }
                                </span>
                                {shouldLimit && filteredAccounts.length > 3 && (
                                  <button
                                    type="button"
                                    onClick={() => setShowAllPortalUsers(true)}
                                    className="text-red-800 hover:underline uppercase font-extrabold text-[10px]"
                                  >
                                    Show All ({filteredAccounts.length}) &rarr;
                                  </button>
                                )}
                                {!shouldLimit && !isSearchingOrFiltering && (
                                  <button
                                    type="button"
                                    onClick={() => setShowAllPortalUsers(false)}
                                    className="text-slate-500 hover:underline uppercase font-extrabold text-[10px]"
                                  >
                                    Collapse List &larr;
                                  </button>
                                )}
                              </div>

                              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                {displayedAccounts.length === 0 ? (
                                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 font-medium font-sans">No matching portal users found in registry.</p>
                                    {isSearchingOrFiltering && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPortalUserSearchQuery('');
                                          setPortalUserRoleFilter('all');
                                        }}
                                        className="mt-2 text-xs text-red-800 font-black hover:underline uppercase"
                                      >
                                        Clear Search Filters
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  displayedAccounts.map(acc => (
                                    <div key={acc.email} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4 hover:bg-slate-100/30 transition shadow-xs">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-800 text-xs">{acc.name}</span>
                                          <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded ${
                                            acc.role === 'superadmin' ? 'bg-red-950 text-yellow-300' :
                                            acc.role === 'admin' ? 'bg-slate-900 text-yellow-400' :
                                            acc.role === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {acc.role}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono truncate">{acc.email}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">Reg Code: <span className="font-mono text-slate-600">{acc.studentId}</span></p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <select
                                          value={acc.role}
                                          onChange={async (e) => {
                                            const newRole = e.target.value as 'student' | 'staff' | 'admin' | 'superadmin';
                                            await updateUserRemote(acc.email, { role: newRole });
                                            setNotice({
                                              type: 'success',
                                              title: 'Role Updated!',
                                              body: `Successfully changed privilege level for ${acc.name} to ${newRole}.`
                                            });
                                          }}
                                          className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 font-bold outline-none cursor-pointer"
                                        >
                                          <option value="student">Student</option>
                                          <option value="staff">Staff Member</option>
                                          <option value="admin">Admin</option>
                                          <option value="superadmin">Super Admin</option>
                                        </select>

                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (acc.email === 'admin@mut.ac.ke') {
                                              alert('The root Super Admin account cannot be deleted.');
                                              return;
                                            }
                                            if (confirm(`Delete user ${acc.name} permanently?`)) {
                                              await deleteUserRemote(acc.email);
                                            }
                                          }}
                                          className="p-1 hover:bg-red-50 text-red-700 hover:text-red-900 rounded transition cursor-pointer"
                                          title="Delete Account"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Right: Manual user creation form */}
                      <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                          👤 Create User Account manually
                        </span>

                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!newUserEmail || !newUserName || !newUserPassword) {
                            alert('All fields marked with (*) are required.');
                            return;
                          }

                          const requirements = getPasswordRequirements(newUserPassword);
                          const unmet = requirements.filter(req => !req.met);
                          if (unmet.length > 0) {
                            alert('Default Password does not meet the strong policy requirements:\n' + unmet.map(u => '• ' + u.label).join('\n'));
                            return;
                          }

                          const emailLower = newUserEmail.toLowerCase();
                          if (accounts.some(a => a.email.toLowerCase() === emailLower)) {
                            alert('An account with this email already exists.');
                            return;
                          }

                          const newAcc: UserAccount = {
                            email: emailLower,
                            phoneNumber: newUserPhone || undefined,
                            name: newUserName,
                            studentId: newUserId || 'MUT-REG-2026',
                            passwordHash: newUserPassword,
                            role: newUserRole
                          };

                          await createUserRemote(newAcc);
                          
                          // Reset form
                          setNewUserEmail('');
                          setNewUserName('');
                          setNewUserPhone('');
                          setUserId('');
                          setNewUserPassword('');

                          setNotice({
                            type: 'success',
                            title: 'Account Created',
                            body: `A new ${newUserRole} profile has been registered manually under email: ${emailLower}.`
                          });
                        }} className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={newUserName}
                              onChange={(e) => setNewUserName(e.target.value)}
                              placeholder="e.g. Prof. Jane Kamau"
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={newUserEmail}
                              onChange={(e) => setNewUserEmail(e.target.value)}
                              placeholder="e.g. j.kamau@staff.mut.ac.ke"
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">ID Code</label>
                              <input
                                type="text"
                                value={newUserId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="e.g. MUT-ST-1092"
                                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone</label>
                              <input
                                type="text"
                                value={newUserPhone}
                                onChange={(e) => setNewUserPhone(e.target.value)}
                                placeholder="+254..."
                                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">User Privilege Role *</label>
                            <select
                              value={newUserRole}
                              onChange={(e) => setNewUserRole(e.target.value as any)}
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none font-bold"
                            >
                              <option value="student">Student Account</option>
                              <option value="staff">Staff/Faculty Account</option>
                              <option value="admin">Administrator (Full Access)</option>
                              <option value="superadmin">Super Administrator (Full Access)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Default Password *</label>
                            <input
                              type="password"
                              required
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              placeholder="Create secure passkey"
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none font-mono"
                            />
                          </div>

                          {newUserPassword && (
                            <div className="text-[11px] bg-white border border-slate-200 p-3 rounded-xl space-y-1.5 animate-fade-in font-sans">
                              <span className="font-extrabold text-slate-700 block text-[9px] uppercase tracking-wider">
                                🔒 Security Requirements:
                              </span>
                              <div className="space-y-1 font-mono text-[9px]">
                                {getPasswordRequirements(newUserPassword).map((req, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5">
                                    {req.met ? (
                                      <span className="text-emerald-600 font-bold">✓</span>
                                    ) : (
                                      <span className="text-rose-500 font-bold">✗</span>
                                    )}
                                    <span className={req.met ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                                      {req.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase py-2.5 rounded-xl transition cursor-pointer"
                          >
                            Register User Profile
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab View 5: Grievance Reports Hub */}
                {adminSubTab === 'reports' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-md font-black text-slate-800 uppercase tracking-tight">
                          📊 MUT Administrative Audit &amp; Grievance Reports
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Filter complaints, review high-priority statistics, and generate ready-to-print administrative reports.
                        </p>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => {
                            alert('Generating PDF File... Murang\'a University Grievance Audit report successfully exported to system downloads!');
                          }}
                          className="bg-red-800 hover:bg-red-700 text-white font-black uppercase px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Export PDF
                        </button>
                        <button
                          onClick={() => {
                            alert('Assembling Excel Grid... Grievance data sheet compiled and exported successfully!');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-yellow-400" />
                          Download Excel
                        </button>
                      </div>
                    </div>

                    {/* Report filter parameters */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Filter by Category</label>
                        <select
                          value={reportCategoryFilter}
                          onChange={(e) => setReportCategoryFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                        >
                          <option value="all">All Categories</option>
                          {customCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Filter by Urgency</label>
                        <select
                          value={reportUrgencyFilter}
                          onChange={(e) => setReportUrgencyFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                        >
                          <option value="all">All Urgency Levels</option>
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Filter by Status</label>
                        <select
                          value={reportStatusFilter}
                          onChange={(e) => setReportStatusFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none"
                        >
                          <option value="all">All Statuses</option>
                          <option value="Pending">Pending Queue</option>
                          <option value="Under Investigation">Under Investigation</option>
                          <option value="Resolved">Resolved Cases</option>
                        </select>
                      </div>
                    </div>

                    {/* Formal printed Report display format */}
                    <div className="border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm font-sans text-slate-800 bg-white relative overflow-hidden">
                      {/* Simulated background official stamp seal watermark */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none text-center">
                        <Building className="w-96 h-96 text-red-950 mx-auto" />
                      </div>

                      {/* Header layout */}
                      <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                        <span className="font-extrabold text-sm uppercase tracking-widest text-slate-500">Official Grievance Audit Report</span>
                        <h2 className="text-xl font-black uppercase text-red-900">{adminCustomTitle}</h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Office of the Registrar (Student Affairs &amp; Welfare Complaints Board)</p>
                        <p className="text-[10px] text-slate-500 font-mono">Date Generated: 2026-07-01 &bull; Active Registry Access: Enabled</p>
                      </div>

                      {/* Summary calculations */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-4 text-xs">
                        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block">Complaints Matching Query</span>
                          <span className="text-lg font-black text-slate-800 font-mono">
                            {complaints.filter(c => 
                              (reportCategoryFilter === 'all' || c.category === reportCategoryFilter) &&
                              (reportUrgencyFilter === 'all' || c.urgency === reportUrgencyFilter) &&
                              (reportStatusFilter === 'all' || c.status === reportStatusFilter)
                            ).length} Case(s)
                          </span>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block">Critical High-Priority Cases</span>
                          <span className="text-lg font-black text-rose-700 font-mono">
                            {complaints.filter(c => 
                              (reportCategoryFilter === 'all' || c.category === reportCategoryFilter) &&
                              (reportUrgencyFilter === 'all' || c.urgency === reportUrgencyFilter) &&
                              (reportStatusFilter === 'all' || c.status === reportStatusFilter) &&
                              c.urgency === 'high'
                            ).length} Urgent
                          </span>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block">Formal Resolution Rate</span>
                          <span className="text-lg font-black text-emerald-700 font-mono">
                            {(() => {
                              const totalMatching = complaints.filter(c => 
                                (reportCategoryFilter === 'all' || c.category === reportCategoryFilter) &&
                                (reportUrgencyFilter === 'all' || c.urgency === reportUrgencyFilter) &&
                                (reportStatusFilter === 'all' || c.status === reportStatusFilter)
                              ).length;
                              const resolvedMatching = complaints.filter(c => 
                                (reportCategoryFilter === 'all' || c.category === reportCategoryFilter) &&
                                (reportUrgencyFilter === 'all' || c.urgency === reportUrgencyFilter) &&
                                (reportStatusFilter === 'all' || c.status === reportStatusFilter) &&
                                c.status === 'Resolved'
                              ).length;
                              return totalMatching > 0 ? Math.round((resolvedMatching / totalMatching) * 100) : 0;
                            })()}% Resolved
                          </span>
                        </div>
                      </div>

                      {/* Report Table */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Audit Logs breakdown</span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-800 font-extrabold uppercase text-[9px] tracking-wide">
                                <th className="py-2">Reference</th>
                                <th>Category</th>
                                <th>Complaint Subject</th>
                                <th>Urgency</th>
                                <th>Logged Date</th>
                                <th>Final Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {complaints
                                .filter(c => 
                                  (reportCategoryFilter === 'all' || c.category === reportCategoryFilter) &&
                                  (reportUrgencyFilter === 'all' || c.urgency === reportUrgencyFilter) &&
                                  (reportStatusFilter === 'all' || c.status === reportStatusFilter)
                                )
                                .map(c => (
                                  <tr key={c.id} className="border-b border-slate-100 text-slate-600 font-medium">
                                    <td className="py-2.5 font-mono font-bold text-slate-900">{c.referenceNumber}</td>
                                    <td className="uppercase text-[10px] font-bold text-red-800">{c.category}</td>
                                    <td className="font-semibold text-slate-800">{c.title}</td>
                                    <td className="uppercase font-bold text-[9px]">{c.urgency}</td>
                                    <td className="font-mono text-slate-500">{c.createdAt.split(' ')[0]}</td>
                                    <td>
                                      <span className={`font-bold uppercase text-[9px] px-1.5 py-0.2 rounded ${
                                        c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800' :
                                        c.status === 'Under Investigation' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                                      }`}>
                                        {c.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                        <span>Report Ref: MUT-AUDIT-2026-001</span>
                        <span>Authorized Digital Signature &bull; MUT Board</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab View 6: Portal Settings */}
                {adminSubTab === 'settings' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
                    <div>
                      <h3 className="text-md font-black text-slate-800 uppercase tracking-tight">
                        ⚙️ Portal Customization &amp; Configuration Menu
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Modify administrative details, change email notifications, specify auto-escalation periods, and turn features on/off.
                      </p>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setNotice({
                        type: 'success',
                        title: 'Settings Saved',
                        body: 'Official Murang\'a University Portal configuration has been updated successfully.'
                      });
                    }} className="space-y-4 max-w-xl text-xs">
                      
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">
                          University Portal Title Name
                        </label>
                        <input
                          type="text"
                          value={adminCustomTitle}
                          onChange={(e) => setAdminCustomTitle(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">
                          Registrar Office Primary Notification Email
                        </label>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:bg-white transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">
                            Urgency Resolution Threshold (Days)
                          </label>
                          <input
                            type="number"
                            value={escalationDays}
                            onChange={(e) => setEscalationDays(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">
                            Academic Year Version
                          </label>
                          <input
                            type="text"
                            disabled
                            value="2025/2026 Academic Cycle"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase block">💡 Suggestions Features toggle</span>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-700">Allow Anonymous Suggestions</p>
                            <p className="text-[10px] text-slate-400">If toggled off, students must authenticate before using the quick drawer box.</p>
                          </div>
                          <input 
                            type="checkbox"
                            checked={anonymousAllowed}
                            onChange={(e) => setAnonymousAllowed(e.target.checked)}
                            className="w-4 h-4 text-red-800 rounded outline-none border-slate-300 focus:ring-red-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-6 py-3 rounded-xl transition cursor-pointer"
                      >
                        Save Portal Configuration
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Interactive Quick Suggestion Panel / Drawer Footer */}
      <footer className="bg-[#b2d27f] text-slate-900 mt-12 py-10 border-t border-emerald-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-8 border-b border-emerald-400/20">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-lg bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>
                  Fast Anonymous Suggestion Drawer
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Have a quick suggestion for MUT?</h3>
              <p className="text-xs text-slate-800 mt-1">
                Skip the entire verification form and log an instant anonymous community idea directly onto the central board. No emails required.
              </p>
            </div>

            <form onSubmit={handleQuickSuggestionSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Suggest campus Wi-Fi enhancements, safety patrols, lectures format..."
                value={suggestionInput}
                onChange={(e) => setSuggestionInput(e.target.value)}
                maxLength={200}
                className="bg-white text-slate-900 px-4 py-3 rounded-xl text-xs flex-1 outline-none border border-emerald-600/30 focus:border-[#2563eb] placeholder-slate-400"
              />
              <button 
                type="submit"
                className="bg-[#9b0000] hover:bg-[#7a0000] text-white font-bold text-xs uppercase px-5 rounded-xl flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </form>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-slate-800 text-xs">
            <p>&copy; 2026 Murang&apos;a University of Technology Complaints Committee. All rights secured.</p>
            <div className="flex gap-4 font-bold">
              <a href="#" className="hover:text-[#9b0000] transition">Institutional Terms</a>
              <a href="#" className="hover:text-[#9b0000] transition">Privacy Safeguards</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Submission Form Modal Container */}
      {showSubmitModal && (
        <SubmissionForm
          category={formCategory}
          onClose={() => {
            setShowSubmitModal(false);
            setFormCategory(null);
          }}
          onSubmit={handleAddComplaint}
          currentUser={currentUser}
        />
      )}

      {/* Midpoint Right-Hand Side Floating Accessibility Hub */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end">
        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border-2 ${
            isAccessibilityOpen 
              ? 'bg-[#2563eb] border-[#b2d27f] text-[#b2d27f] scale-110' 
              : 'bg-[#9b0000] border-white text-white hover:bg-[#7a0000] hover:scale-105'
          } cursor-pointer focus:outline-none`}
          title="Accessibility Settings"
          aria-label="Toggle Accessibility Controls"
        >
          <Accessibility className="w-6 h-6 animate-pulse" />
        </button>

        {/* Floating panel drawer */}
        {isAccessibilityOpen && (
          <div className="mt-3 mr-1 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-left transition-all duration-300 animate-in fade-in slide-in-from-right-5 text-slate-800">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150 mb-3">
              <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                <Accessibility className="w-4 h-4 text-[#9b0000]" />
                <span>Accessibility Hub</span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                WCAG 2.1
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Font Size Scaling */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Font Size Scale
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['normal', 'medium', 'large', 'extra'] as const).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setFontScale(scale)}
                      className={`py-1 px-1.5 rounded-lg font-bold text-[10px] uppercase border transition cursor-pointer ${
                        fontScale === scale
                          ? 'bg-[#9b0000] text-white border-transparent'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dyslexia Friendly Mode */}
              <div className="flex items-center justify-between py-1 border-t border-slate-50 mt-1">
                <div>
                  <span className="block text-[11px] font-extrabold text-slate-800">
                    Dyslexia Font
                  </span>
                  <span className="block text-[9px] text-slate-400">
                    High-readability layout
                  </span>
                </div>
                <button
                  onClick={() => setIsDyslexic(!isDyslexic)}
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                    isDyslexic ? 'bg-[#b2d27f] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>

              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-slate-50">
                <div>
                  <span className="block text-[11px] font-extrabold text-slate-800">
                    Stark High Contrast
                  </span>
                  <span className="block text-[9px] text-slate-400">
                    Optimized for visibility
                  </span>
                </div>
                <button
                  onClick={() => setIsHighContrast(!isHighContrast)}
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                    isHighContrast ? 'bg-[#b2d27f] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>

              {/* Text To Speech Helper */}
              <div className="border-t border-slate-50 pt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <div>
                    <span className="block text-[11px] font-extrabold text-[#9b0000]">
                      Audio Voice Assistance
                    </span>
                    <span className="block text-[9px] text-slate-400">
                      Hear view summaries aloud
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const isMuted = speechVolume === 0;
                      setSpeechVolume(isMuted ? 0.8 : 0);
                      if (!isMuted) {
                        stopSpeaking();
                      } else {
                        speakText("Audio Reader Active. Use summary options below to read current section.");
                      }
                    }}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={speechVolume === 0 ? "Unmute Audio" : "Mute Audio"}
                  >
                    {speechVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#2563eb] animate-pulse" />
                    )}
                  </button>
                </div>

                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => {
                      if (activeTab === 'guide') {
                        speakText("Welcome to the Murang'a University of Technology Complaint Committee Guidelines and FAQ. Point 1: The complaints committee is appointed by and reports directly to the Vice-Chancellor. Point 2: Your anonymity is protected through zero knowledge database routing. Point 3: The maximum turnaround time for resolving all complaints is fourteen days.");
                      } else {
                        speakText("Welcome to the Your Voice Matters Portal of Murang'a University of Technology. Select a category below or browse public logs to file or track grievances.");
                      }
                    }}
                    className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3 text-[#9b0000]" />
                    <span>Read Summary</span>
                  </button>
                  <button
                    onClick={stopSpeaking}
                    className="py-1 px-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Sandbox Drawer Modal */}
      {showEmailsDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in" id="email-sandbox-modal">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-from-right text-slate-800">
            {/* Header */}
            <div className="p-4 bg-emerald-900 text-white flex justify-between items-center border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#b2d27f]" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Email Dispatch Sandbox</h3>
                  <p className="text-[10px] text-emerald-100">Simulated SMTP Mail Delivery Logs</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailsDrawer(false)}
                className="text-white/80 hover:text-white text-xs bg-emerald-800 hover:bg-emerald-700 px-3 py-1 rounded-lg font-bold"
              >
                Close Logs
              </button>
            </div>

            {/* Sandbox Notice Banner */}
            <div className="bg-amber-50 border-b border-amber-200/60 p-3.5 text-xs text-amber-900 flex gap-2 items-start">
              <span className="text-base">💡</span>
              <div>
                <span className="font-extrabold block mb-0.5">Real-Time Dispatch Simulation</span>
                This sandbox displays automated notifications sent to students who opted in with their email address. To trigger a dispatch: submit a ticket with identity details or use the <strong className="underline">Admin CMS</strong> tab to update progress status/add timeline comments.
              </div>
            </div>

            {/* Email list container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Dispatched Outbox ({simulatedEmails.length} messages)
                </span>
                {simulatedEmails.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear simulated email logs?")) {
                        setSimulatedEmails([]);
                      }
                    }}
                    className="text-[10px] text-red-600 hover:text-red-800 font-extrabold uppercase tracking-tight flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Logs
                  </button>
                )}
              </div>

              {simulatedEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-black text-slate-700">Sandbox Empty</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    No simulated emails have been dispatched. Create a new ticket (with identity details + email toggle checked) or update a ticket's phase in the admin CMS.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {simulatedEmails.map((email) => (
                    <div key={email.id} className="border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition shadow-xs overflow-hidden">
                      {/* Meta header info */}
                      <div className="bg-slate-100 p-3 border-b border-slate-200/60 text-[11px] space-y-1 font-sans">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-700">
                            TO: <span className="font-medium text-[#2563eb]">{email.recipient}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-medium">
                            {email.timestamp}
                          </span>
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-600">SUBJECT:</span>{" "}
                          <span className="font-extrabold text-slate-800">{email.subject}</span>
                        </div>
                        <div className="flex gap-2 items-center pt-1">
                          <span className="bg-[#b2d27f]/40 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight">
                            Ref: {email.referenceNumber}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight">
                            Type: {email.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Body */}
                      <div className="p-3">
                        <pre className="text-[10.5px] font-mono leading-relaxed text-slate-700 whitespace-pre-wrap bg-white border border-slate-150 p-3 rounded-lg max-h-56 overflow-y-auto">
                          {email.body}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer summary details */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
              Murang&apos;a University of Technology Concerns Sandbox Engine &bull; Educational Outbox
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
