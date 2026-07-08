export type ComplaintCategory =
  | 'academic'
  | 'ict'
  | 'environmental'
  | 'financial'
  | 'safety'
  | 'suggestions'
  | 'co_curricular';

export type ComplaintStatus = 'Pending' | 'Under Investigation' | 'Resolved';

export interface TimelineUpdate {
  id: string;
  date: string;
  message: string;
  status: ComplaintStatus;
}

export interface QuestionnaireAnswers {
  hasBeenReported: 'yes' | 'no';
  channelsSubmitted: string[];
  channelsSubmittedOther?: string;
  prevCaseReference?: string;
  prevSubmissionDates?: string;
  notApplicableQ3: boolean;
  actionsTaken?: string;
  actionsTakenOther?: string;
  escalationReason?: string;
  escalationReasonOther?: string;
}

export interface ComplaintAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  contentBase64?: string;
}

export interface Complaint {
  id: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  isAnonymous: boolean;
  studentName?: string;
  studentId?: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  referenceNumber: string;
  status: ComplaintStatus;
  urgency: 'low' | 'medium' | 'high';
  updates: TimelineUpdate[];
  attachments?: ComplaintAttachment[];
  isPublished?: boolean;
  isAcknowledged?: boolean;
  receiveEmails?: boolean;
  questionnaire?: QuestionnaireAnswers;
  isMaster?: boolean;
  masterTicketId?: string;
}

export interface UserAccount {
  email: string;
  phoneNumber?: string;
  name: string;
  studentId: string;
  passwordHash: string; // Stored securely
  role: 'student' | 'staff' | 'admin' | 'superadmin';
}

export interface CategoryDetails {
  id: ComplaintCategory;
  title: string;
  description: string;
  iconName: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}
