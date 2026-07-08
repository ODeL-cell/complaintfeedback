import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, FileText, User, ShieldAlert, GraduationCap, Laptop, Trash2, DollarSign, ShieldCheck, HelpCircle } from 'lucide-react';
import { Complaint, ComplaintAttachment, ComplaintCategory, UserAccount } from '../types';

interface SubmissionFormProps {
  category: ComplaintCategory | null;
  onClose: () => void;
  onSubmit: (formData: Partial<Complaint> & { password?: string }) => void;
  currentUser?: UserAccount | null;
}

/**
 * Password Security Policy Engine
 * Evaluates a proposed password against standard corporate and educational enterprise guidelines.
 * Returns an array of requirement descriptors, each containing a human-readable label and a boolean 'met' status.
 */
export const getPasswordRequirements = (pwd: string) => {
  return [
    { label: 'Minimum 8 characters', met: pwd.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(pwd) },
    { label: 'One digit (0-9)', met: /[0-9]/.test(pwd) },
    { label: 'One special character (e.g., !@#$%^&*)', met: /[^A-Za-z0-9]/.test(pwd) },
  ];
};

export default function SubmissionForm({ category, onClose, onSubmit, currentUser }: SubmissionFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Question 1: Has this specific issue been reported before?
  const [q1, setQ1] = useState<'yes' | 'no' | ''>('');

  // Question 2: Through which channels have you already submitted this complaint? (Select all that apply)
  const [q2Channels, setQ2Channels] = useState<{
    none: boolean;
    helpdesk: boolean;
    deptHead: boolean;
    studentUnion: boolean;
    box: boolean;
    other: boolean;
  }>({
    none: false,
    helpdesk: false,
    deptHead: false,
    studentUnion: false,
    box: false,
    other: false,
  });
  const [q2OtherText, setQ2OtherText] = useState('');

  // Question 3: Previous Case Reference / Date
  const [q3RefNumbers, setQ3RefNumbers] = useState('');
  const [q3Dates, setQ3Dates] = useState('');
  const [q3NotApplicable, setQ3NotApplicable] = useState(false);

  // Question 4: Actions on previous report
  const [q4Action, setQ4Action] = useState<string>('');
  const [q4OtherText, setQ4OtherText] = useState('');

  // Question 5: Why refiling or escalating today?
  const [q5Reason, setQ5Reason] = useState<string>('');
  const [q5OtherText, setQ5OtherText] = useState('');

  // Validation Error for Step 1
  const [step1Error, setStep1Error] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(currentUser ? false : true);
  const [studentName, setStudentName] = useState(currentUser?.name || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Mandatory submission acknowledgement and optional notification preferences
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [receiveEmails, setReceiveEmails] = useState(false);
  
  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ComplaintAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  const ALLOWED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx']);

  const readFileAsAttachment = (file: File): Promise<ComplaintAttachment> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve({
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'application/octet-stream',
          contentBase64: base64,
        });
      };
      reader.onerror = () => {
        resolve({
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'application/octet-stream',
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const addFiles = async (filesList: File[]) => {
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const f of filesList) {
      const lower = f.name.toLowerCase();
      const mimeOk = ALLOWED_MIME_TYPES.has(f.type);
      const extOk = Array.from(ALLOWED_EXTS).some(ext => lower.endsWith(ext));
      if (!mimeOk && !extOk) {
        rejected.push(f.name);
      } else {
        accepted.push(f);
      }
    }

    if (rejected.length > 0) {
      alert(`These files were not accepted: ${rejected.join(', ')}. Supported types: PNG, JPG, PDF, DOC, DOCX`);
    }

    if (accepted.length === 0) return;

    const nextAttachments = await Promise.all(accepted.map(readFileAsAttachment));
    setUploadedFiles(prev => [...prev, ...nextAttachments]);
  };

  // Render icons matching selected category
  const renderCatHeader = () => {
    switch (category) {
      case 'academic': return <div className="flex items-center gap-2 text-rose-600 font-bold"><GraduationCap /> <span>Academic Issue Filing</span></div>;
      case 'ict': return <div className="flex items-center gap-2 text-blue-600 font-bold"><Laptop /> <span>ICT Related Issue Filing</span></div>;
      case 'environmental': return <div className="flex items-center gap-2 text-amber-600 font-bold"><Trash2 /> <span>Environmental Complaint Filing</span></div>;
      case 'financial': return <div className="flex items-center gap-2 text-emerald-600 font-bold"><DollarSign /> <span>Financial Claim Filing</span></div>;
      case 'safety': return <div className="flex items-center gap-2 text-indigo-600 font-bold"><ShieldCheck /> <span>Safety &amp; security Filing</span></div>;
      default: return <div className="flex items-center gap-2 text-purple-600 font-bold"><HelpCircle /> <span>General Suggestion Hub</span></div>;
    }
  };

  const renderCategoryGuide = () => {
    let title = "General Suggestions Guide";
    let icon = <HelpCircle className="w-5 h-5 text-[#2563eb]" />;
    let issues: string[] = [];

    switch (category) {
      case 'academic':
        title = "Academic Issues Guide";
        icon = <GraduationCap className="w-5 h-5 text-[#2563eb]" />;
        issues = [
          "Lecturers missing classes repeatedly or irregular class attendance.",
          "Delayed examination grading or missing marks on the system.",
          "Inaccessible library resources or computer lab equipment.",
          "Timetabling clashes, room conflicts, or registration hurdles."
        ];
        break;
      case 'ict':
        title = "ICT Services Guide";
        icon = <Laptop className="w-5 h-5 text-[#2563eb]" />;
        issues = [
          "Student portal access downtime or login failures.",
          "Slow, disconnected, or non-existent campus Wi-Fi networks.",
          "Virtual learning system (E-learning portal) issues or course access bugs.",
          "Malfunctioning lab computers, printers, or projection screens."
        ];
        break;
      case 'environmental':
        title = "Environmental & Facilities Guide";
        icon = <Trash2 className="w-5 h-5 text-[#2563eb]" />;
        issues = [
          "Poor waste disposal, lack of trash bins, or unsanitary toilets.",
          "Unlit pathways, broken hallway bulbs, or power failures.",
          "Blocked drainage systems, broken water taps, or plumbing issues.",
          "Defective desks, chairs, or whiteboard issues in lecture halls."
        ];
        break;
      case 'financial':
        title = "Financial Services Guide";
        icon = <DollarSign className="w-5 h-5 text-[#2563eb]" />;
        issues = [
          "Delayed tuition fee reconciliation or registration blocks.",
          "HELB updates or private bursary allocation errors on portal.",
          "Inquiries regarding refund processes or double payment disputes.",
          "Issues with dynamic invoice generation or examination card clearance."
        ];
        break;
      case 'safety':
        title = "Safety & Security Guide";
        icon = <ShieldCheck className="w-5 h-5 text-[#2563eb]" />;
        issues = [
          "Theft, burglary, or security breaches on campus/hostels.",
          "Harassment, threats, bullying, or unsafe campus situations.",
          "Malfunctioning emergency equipment or poor pathway illumination at night.",
          "Presence of unauthorized suspicious persons inside campus bounds."
        ];
        break;
      case 'co_curricular':
        title = "Co-curricular & Sports Guide";
        icon = <User className="w-5 h-5 text-[#2563eb]" />;
        issues = [
          "Inadequate sports equipment, training gears, or playfield issues.",
          "Conflict with clubs/societies management or registration.",
          "Unfair selection processes for inter-university competitions.",
          "Scheduling issues for extra-curricular rehearsals or tournaments."
        ];
        break;
      case 'suggestions':
      default:
        title = "General Suggestion & Idea Hub Guide";
        icon = <HelpCircle className="w-5 h-5 text-[#2563eb]" />;
        issues = [
          "Constructive ideas for upgrading student dining and catering options.",
          "General suggestions on university administration workflow.",
          "New student association, club formation, or mental wellness proposal ideas.",
          "Any general student welfare recommendation not covered elsewhere."
        ];
        break;
    }

    return (
      <div className="bg-blue-50/60 border border-blue-200/50 rounded-2xl p-4 md:p-5 flex gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="bg-blue-100/80 p-2.5 rounded-xl text-[#2563eb] self-start">
          {icon}
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-extrabold text-[#2563eb] uppercase tracking-wide flex items-center gap-1.5">
            <span>{title}</span>
            <span className="text-[9px] bg-[#2563eb] text-white px-1.5 py-0.5 rounded font-black tracking-normal uppercase">
              Help Guide
            </span>
          </h4>
          <p className="text-[11px] text-slate-600 leading-normal font-medium">
            You can use this category to file grievances, reports, or feedback regarding:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
            {issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#b2d27f] font-bold text-xs mt-px">&bull;</span>
                <span className="leading-tight">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesList = Array.from(e.dataTransfer.files) as File[];
      addFiles(filesList);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesList = Array.from(e.target.files) as File[];
      addFiles(filesList);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the Title and Description fields.');
      return;
    }

    if (!isAcknowledged) {
      alert('Please review and tick the mandatory acknowledgement statement before submitting.');
      return;
    }

    if (!isAnonymous && !currentUser) {
      if (!password) {
        alert('Please specify a password to secure your newly created tracking account.');
        return;
      }
      
      // Enforce robust authentication criteria to protect sensitive student submissions
      const requirements = getPasswordRequirements(password);
      const unmet = requirements.filter(req => !req.met);
      if (unmet.length > 0) {
        alert('Password does not meet the strong policy requirements:\n' + unmet.map(u => '• ' + u.label).join('\n'));
        return;
      }

      // Verify that primary and confirmation input passwords match exactly
      if (password !== confirmPassword) {
        alert('Passwords do not match. Please verify your typing.');
        return;
      }
    }

    onSubmit({
      category: category || 'suggestions',
      title,
      description,
      isAnonymous,
      studentName: isAnonymous ? undefined : studentName,
      studentId: isAnonymous ? undefined : studentId,
      email: isAnonymous ? undefined : email,
      phoneNumber: isAnonymous ? undefined : phoneNumber,
      urgency,
      password: isAnonymous ? undefined : password,
      isAcknowledged,
      receiveEmails: isAnonymous ? false : receiveEmails,
      attachments: uploadedFiles,
      questionnaire: {
        hasBeenReported: q1 as 'yes' | 'no',
        channelsSubmitted: Object.keys(q2Channels).filter(k => q2Channels[k as keyof typeof q2Channels]),
        channelsSubmittedOther: q2Channels.other ? q2OtherText : undefined,
        prevCaseReference: q1 === 'yes' ? q3RefNumbers : undefined,
        prevSubmissionDates: q1 === 'yes' ? q3Dates : undefined,
        notApplicableQ3: q3NotApplicable,
        actionsTaken: q1 === 'yes' ? q4Action : undefined,
        actionsTakenOther: q1 === 'yes' && q4Action === 'other' ? q4OtherText : undefined,
        escalationReason: q1 === 'yes' ? q5Reason : undefined,
        escalationReasonOther: q1 === 'yes' && q5Reason === 'other' ? q5OtherText : undefined,
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[95vh] md:max-h-[88vh] overflow-hidden my-auto animate-fade-in">
        
        {/* Form Header */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              MURANG&apos;A UNIVERSITY CONCERNS DESK
            </span>
            <div className="mt-1">{renderCatHeader()}</div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-thin">
          {currentStep === 1 ? (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 md:p-5">
                <h4 className="text-sm font-extrabold text-red-900 uppercase tracking-wide flex items-center gap-2 mb-1">
                  <span>🛡️ Pre-Submission Verification</span>
                </h4>
                <p className="text-xs text-slate-600 leading-normal">
                  To deter misuse and repetitive reporting, please complete this quick pre-submission questionnaire. This helps the Complaints Committee trace previous cases and expedite resolution times.
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-amber-855 font-bold flex items-start gap-1.5">
                  <span className="text-amber-600 text-sm mt-px">⚠️</span>
                  <span>
                    <strong>Deter Duplicates:</strong> We strongly encourage you to consult the <strong>Public Logs Board</strong> first to verify whether this specific issue has already been raised. Doing so helps us streamline resources and avoid redundant efforts.
                  </span>
                </div>
              </div>

              {step1Error && (
                <div className="bg-rose-50 text-rose-800 text-xs p-3.5 rounded-xl border border-rose-150 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{step1Error}</span>
                </div>
              )}

              {/* Q1 */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Has this specific issue been reported before? <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQ1('no');
                      setStep1Error('');
                      // If they select NO, auto-check q2 "none", Q3 "N/A"
                      setQ2Channels({
                        none: true,
                        helpdesk: false,
                        deptHead: false,
                        studentUnion: false,
                        box: false,
                        other: false,
                      });
                      setQ3NotApplicable(true);
                      setQ4Action('no_action');
                      setQ5Reason('none');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      q1 === 'no'
                        ? 'border-red-850 bg-red-50/40 ring-2 ring-red-850/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${q1 === 'no' ? 'border-red-850 bg-red-850' : 'border-slate-300'}`}>
                        {q1 === 'no' && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs font-black text-slate-800">No, this is the first time I am reporting it.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQ1('yes');
                      setStep1Error('');
                      // Reset defaults for Yes
                      setQ2Channels({
                        none: false,
                        helpdesk: false,
                        deptHead: false,
                        studentUnion: false,
                        box: false,
                        other: false,
                      });
                      setQ3NotApplicable(false);
                      setQ4Action('');
                      setQ5Reason('');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      q1 === 'yes'
                        ? 'border-red-855 bg-red-50/40 ring-2 ring-red-850/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${q1 === 'yes' ? 'border-red-850 bg-red-850' : 'border-slate-300'}`}>
                        {q1 === 'yes' && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs font-black text-slate-800">Yes, I have reported this issue previously.</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Q2 */}
              {q1 !== '' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Through which channels have you already submitted this complaint? (Select all that apply) <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                    <label className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q2Channels.none}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setQ2Channels({
                              none: true,
                              helpdesk: false,
                              deptHead: false,
                              studentUnion: false,
                              box: false,
                              other: false
                            });
                          } else {
                            setQ2Channels(prev => ({ ...prev, none: false }));
                          }
                        }}
                        className="mt-0.5 rounded text-red-800 focus:ring-red-700 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">I have not submitted it through any other channel.</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q2Channels.helpdesk}
                        disabled={q2Channels.none}
                        onChange={(e) => {
                          setQ2Channels(prev => ({ ...prev, helpdesk: e.target.checked, none: false }));
                        }}
                        className="mt-0.5 rounded text-red-800 focus:ring-red-700 w-4 h-4 disabled:opacity-50"
                      />
                      <span className={`text-xs font-semibold text-slate-700 ${q2Channels.none ? 'opacity-50' : ''}`}>University Helpdesk / Email</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q2Channels.deptHead}
                        disabled={q2Channels.none}
                        onChange={(e) => {
                          setQ2Channels(prev => ({ ...prev, deptHead: e.target.checked, none: false }));
                        }}
                        className="mt-0.5 rounded text-red-800 focus:ring-red-700 w-4 h-4 disabled:opacity-50"
                      />
                      <span className={`text-xs font-semibold text-slate-700 ${q2Channels.none ? 'opacity-50' : ''}`}>Department Head / Faculty Member</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q2Channels.studentUnion}
                        disabled={q2Channels.none}
                        onChange={(e) => {
                          setQ2Channels(prev => ({ ...prev, studentUnion: e.target.checked, none: false }));
                        }}
                        className="mt-0.5 rounded text-red-800 focus:ring-red-700 w-4 h-4 disabled:opacity-50"
                      />
                      <span className={`text-xs font-semibold text-slate-700 ${q2Channels.none ? 'opacity-50' : ''}`}>Student Union / Student Affairs</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q2Channels.box}
                        disabled={q2Channels.none}
                        onChange={(e) => {
                          setQ2Channels(prev => ({ ...prev, box: e.target.checked, none: false }));
                        }}
                        className="mt-0.5 rounded text-red-800 focus:ring-red-700 w-4 h-4 disabled:opacity-50"
                      />
                      <span className={`text-xs font-semibold text-slate-700 ${q2Channels.none ? 'opacity-50' : ''}`}>Anonymous Suggestion Box</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q2Channels.other}
                        disabled={q2Channels.none}
                        onChange={(e) => {
                          setQ2Channels(prev => ({ ...prev, other: e.target.checked, none: false }));
                        }}
                        className="mt-0.5 rounded text-red-800 focus:ring-red-700 w-4 h-4 disabled:opacity-50"
                      />
                      <span className={`text-xs font-semibold text-slate-700 ${q2Channels.none ? 'opacity-50' : ''}`}>Other (Please specify)</span>
                    </label>
                  </div>

                  {q2Channels.other && (
                    <div className="pt-1 animate-fade-in">
                      <input
                        type="text"
                        placeholder="Specify other channels here..."
                        value={q2OtherText}
                        onChange={(e) => setQ2OtherText(e.target.value)}
                        className="w-full text-xs px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-red-800"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Previous Case Fields (Only if q1 is YES) */}
              {q1 === 'yes' && (
                <>
                  {/* Q3 */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      3. If you have reported this before, please provide the previous Case Reference Number(s) or the approximate date(s) of submission.
                    </label>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      This helps us link your current request to your previous file and prevents creating duplicate tickets.
                    </p>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Reference Number(s)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. MUT-9482"
                            value={q3RefNumbers}
                            disabled={q3NotApplicable}
                            onChange={(e) => setQ3RefNumbers(e.target.value)}
                            className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-800 disabled:bg-slate-100 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Date(s) of Submission
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. May 12, 2026"
                            value={q3Dates}
                            disabled={q3NotApplicable}
                            onChange={(e) => setQ3Dates(e.target.value)}
                            className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-800 disabled:bg-slate-100 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q3NotApplicable}
                          onChange={(e) => {
                            setQ3NotApplicable(e.target.checked);
                            if (e.target.checked) {
                              setQ3RefNumbers('');
                              setQ3Dates('');
                            }
                          }}
                          className="rounded text-red-800 focus:ring-red-700 w-4 h-4"
                        />
                        <span className="text-xs font-semibold text-slate-700">Not Applicable</span>
                      </label>
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      4. What actions have been taken regarding your previous report? <span className="text-rose-600">*</span>
                    </label>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-2">
                      {[
                        { id: 'no_action', label: 'No action has been taken yet / I received no response.' },
                        { id: 'unsatisfactory', label: 'The issue was investigated, but the resolution was unsatisfactory.' },
                        { id: 'partial', label: 'The issue was partially resolved, but new problems have arisen.' },
                        { id: 'other', label: 'Other (Please briefly describe):' }
                      ].map(opt => (
                        <label key={opt.id} className="flex items-start gap-2 p-1.5 cursor-pointer hover:bg-slate-100/40 rounded-lg">
                          <input
                            type="radio"
                            name="q4"
                            checked={q4Action === opt.id}
                            onChange={() => setQ4Action(opt.id)}
                            className="mt-0.5 text-red-800 focus:ring-red-700 w-4 h-4"
                          />
                          <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
                        </label>
                      ))}

                      {q4Action === 'other' && (
                        <div className="pt-1 pl-6 animate-fade-in">
                          <input
                            type="text"
                            placeholder="Briefly describe what actions were taken..."
                            value={q4OtherText}
                            onChange={(e) => setQ4OtherText(e.target.value)}
                            className="w-full text-xs px-3.5 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-red-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Q5 */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      5. Why are you refiling or escalating this complaint today? <span className="text-rose-600">*</span>
                    </label>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-2">
                      {[
                        { id: 'new_evidence', label: 'New evidence or information has come to light.' },
                        { id: 'timeline_passed', label: 'The agreed-upon timeline for a resolution has passed.' },
                        { id: 'appealing', label: 'I am appealing the previous decision/outcome.' },
                        { id: 'other', label: 'Other (Please explain):' }
                      ].map(opt => (
                        <label key={opt.id} className="flex items-start gap-2 p-1.5 cursor-pointer hover:bg-slate-100/40 rounded-lg">
                          <input
                            type="radio"
                            name="q5"
                            checked={q5Reason === opt.id}
                            onChange={() => setQ5Reason(opt.id)}
                            className="mt-0.5 text-red-800 focus:ring-red-700 w-4 h-4"
                          />
                          <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
                        </label>
                      ))}

                      {q5Reason === 'other' && (
                        <div className="pt-1 pl-6 animate-fade-in">
                          <input
                            type="text"
                            placeholder="Explain why you are refiling/escalating today..."
                            value={q5OtherText}
                            onChange={(e) => setQ5OtherText(e.target.value)}
                            className="w-full text-xs px-3.5 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-red-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Step 1 Actions */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Verification Progress: Step 1 of 2
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!q1) {
                        setStep1Error('Please select whether this specific issue has been reported before (Question 1).');
                        return;
                      }

                      const selectedChannels = Object.keys(q2Channels).filter(k => q2Channels[k as keyof typeof q2Channels]);
                      if (selectedChannels.length === 0) {
                        setStep1Error('Please select at least one channel from Question 2.');
                        return;
                      }
                      if (q2Channels.other && !q2OtherText.trim()) {
                        setStep1Error('Please specify other channels in Question 2.');
                        return;
                      }

                      if (q1 === 'yes') {
                        if (!q3NotApplicable && !q3RefNumbers.trim() && !q3Dates.trim()) {
                          setStep1Error('Please provide previous case reference number(s) or date(s) in Question 3, or select Not Applicable.');
                          return;
                        }

                        if (!q4Action) {
                          setStep1Error('Please specify what actions have been taken in Question 4.');
                          return;
                        }
                        if (q4Action === 'other' && !q4OtherText.trim()) {
                          setStep1Error('Please briefly describe other actions in Question 4.');
                          return;
                        }

                        if (!q5Reason) {
                          setStep1Error('Please explain why you are refiling or escalating in Question 5.');
                          return;
                        }
                        if (q5Reason === 'other' && !q5OtherText.trim()) {
                          setStep1Error('Please explain other reason in Question 5.');
                          return;
                        }
                      }

                      setStep1Error('');
                      setCurrentStep(2);
                    }}
                    className="px-6 py-2.5 bg-red-800 hover:bg-red-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                  >
                    <span>Proceed to details</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Category Guide */}
              {renderCategoryGuide()}

              {/* Anonymity Selector Flag */}
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-4">
                <div className="bg-rose-100 p-2.5 rounded-xl text-rose-700 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">
                    Anonymity Guarantee
                  </h4>
                  <p className="text-xs text-rose-700 leading-normal">
                    Choose whether you want to file confidentially. For anonymous cases, the Complaints Committee will NOT be able to view your registration details.
                  </p>
                  
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="anonymity"
                        checked={isAnonymous === true}
                        onChange={() => setIsAnonymous(true)}
                        className="text-red-700 focus:ring-red-600 h-4 w-4 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-rose-900">File Anonymously (Secure)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="anonymity"
                        checked={isAnonymous === false}
                        onChange={() => setIsAnonymous(false)}
                        className="text-red-700 focus:ring-red-600 h-4 w-4 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">Include Identity details</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Title field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Concern Title
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue (e.g., Block C socket faults)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Detailed Description &amp; Specifications
                </label>
                <textarea
                  rows={4}
                  placeholder="State exact timeline, units, block rooms, dates, or relevant student IDs. Give as much supportive info as possible."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition resize-none leading-relaxed"
                ></textarea>
              </div>

              {/* Identity forms if not anonymous */}
              {!isAnonymous && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 md:p-6 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-slate-400" />
                    <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Verified Contact Details
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Student Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kelvin Kimathi"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        required={!isAnonymous}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Registration Code / Student ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SC201-1405-2024"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required={!isAnonymous}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. student@mut.ac.ke"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required={!isAnonymous}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Phone Network Contact
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +254 712 345 678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-600 font-mono"
                      />
                    </div>
                    {currentUser ? (
                      <div className="col-span-1 sm:col-span-2 text-[11px] text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>You are logged in! Your registered profile details are automatically applied to this complaint.</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Set Account Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={!isAnonymous}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Confirm Account Password
                          </label>
                          <input
                            type="password"
                            placeholder="Re-type password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required={!isAnonymous}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-600 font-mono"
                          />
                        </div>

                        {password && (
                          <div className="col-span-1 sm:col-span-2 text-[11px] bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl space-y-2 animate-fade-in">
                            <span className="font-extrabold text-slate-700 block text-[10px] uppercase tracking-wider">
                              🔒 Strong Password Requirements:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                              {getPasswordRequirements(password).map((req, idx) => (
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
                            {confirmPassword && (
                              <div className="border-t border-slate-200/50 pt-2 mt-1">
                                {password === confirmPassword ? (
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
                      </>
                    )}
                  </div>
                  {!currentUser && (
                    <div className="mt-2 text-[11px] text-slate-500 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
                      <span>An official MUT feedback tracker account will be created instantly upon submission.</span>
                    </div>
                  )}
                </div>
              )}

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Supporting Documentation / Photos (Optional)
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    dragActive ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-400 bg-slate-50 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2 group-hover:scale-110 transition" />
                  <p className="text-xs font-bold text-slate-700">
                    Drag files here or <span className="text-red-700 underline">browse computer</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports PDF, JPG, PNG, DOC up to 5MB
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Files Attached ({uploadedFiles.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate flex-1 font-medium">{f.name}</span>
                          <span className="text-[9px] text-slate-400">{f.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Agreement & Notifications */}
              <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl space-y-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <input
                    id="ack-checkbox"
                    type="checkbox"
                    checked={isAcknowledged}
                    onChange={(e) => setIsAcknowledged(e.target.checked)}
                    required
                    className="w-4 h-4 mt-0.5 text-red-800 rounded outline-none border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="ack-checkbox" className="text-[11px] font-semibold text-slate-700 leading-normal cursor-pointer select-none">
                    <span className="text-red-800 font-black mr-1">[MANDATORY]</span> I hereby acknowledge that the information provided in this grievance ticket is true, factual, and accurate to the best of my knowledge. I understand that lodging false statements is subject to Murang&apos;a University of Technology disciplinary regulations.
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="pt-3 border-t border-slate-200/60 flex items-start gap-3 animate-fade-in">
                    <input
                      id="notify-checkbox"
                      type="checkbox"
                      checked={receiveEmails}
                      onChange={(e) => setReceiveEmails(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-red-800 rounded outline-none border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="notify-checkbox" className="text-[11px] font-semibold text-slate-700 leading-normal cursor-pointer select-none">
                      <span className="text-blue-700 font-black mr-1">[NOTIFICATIONS]</span> I want to receive acknowledgement and real-time feedback updates via email confirmation to <span className="font-mono text-[10px] font-bold text-red-800">{email || '(my submitted email address)'}</span> for any progress or feedback.
                    </label>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between animate-fade-in">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition text-xs uppercase rounded-xl"
                >
                  &larr; Back to Verification
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-800 hover:bg-red-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition"
                  >
                    Log Secure Ticket &rarr;
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
