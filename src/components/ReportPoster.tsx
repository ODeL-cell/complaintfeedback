import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Laptop,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  QrCode,
  DollarSign,
  Trash2,
  Trophy,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CategoryDetails, ComplaintCategory } from '../types';

interface ReportPosterProps {
  onSelectCategory: (category: ComplaintCategory) => void;
  onSubmitQuickSuggestion: () => void;
}

export const CATEGORIES: CategoryDetails[] = [
  {
    id: 'academic',
    title: 'Academic Issues',
    description: 'Exam scheduling, supervisor complaints, course allocations, lecturing quality, or grading discrepancies.',
    iconName: 'BookOpen',
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
  {
    id: 'safety',
    title: 'Institutional & Safety',
    description: 'Security patrols, lost items, lighting blackouts, physical safety concerns, or emergency responses.',
    iconName: 'ShieldCheck',
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
  },
  {
    id: 'ict',
    title: 'ICT-Related Issues',
    description: 'Student portal login issues, Wi-Fi connectivity problems, e-learning platform bugs, library computers.',
    iconName: 'Laptop',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  {
    id: 'financial',
    title: 'Financial Issues',
    description: 'Fee reconciliation, scholarship allocation, Helb disbursements, bursary receipt delays or invoice errors.',
    iconName: 'DollarSign',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  {
    id: 'environmental',
    title: 'Health, Sanitation & Environmental Issues',
    description: 'Hostel washroom sanitation, waste management, water supply issues, or green spaces and pathway cleaning.',
    iconName: 'Trash2',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  {
    id: 'co_curricular',
    title: 'Co-curricular Activities',
    description: 'Sports equipment, club approvals, drama and music events, student union activities, or recreational facilities.',
    iconName: 'Trophy',
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
];

export default function ReportPoster({ onSelectCategory, onSubmitQuickSuggestion }: ReportPosterProps) {
  const renderIcon = (name: string, classes: string) => {
    switch (name) {
      case 'BookOpen': return <BookOpen className={classes} />;
      case 'Laptop': return <Laptop className={classes} />;
      case 'Trash2': return <Trash2 className={classes} />;
      case 'DollarSign': return <DollarSign className={classes} />;
      case 'ShieldCheck': return <ShieldCheck className={classes} />;
      case 'Trophy': return <Trophy className={classes} />;
      default: return <HelpCircle className={classes} />;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 max-w-6xl mx-auto my-6">
      {/* Target Logo and Header Banner */}
      <div className="relative bg-gradient-to-r from-red-800 to-red-950 px-8 py-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6"></div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2 shadow-lg">
            {/* Elegant symbolic seal drawing */}
            <svg viewBox="0 0 100 100" className="w-16 h-16 text-red-950">
              <ellipse cx="50" cy="50" rx="46" ry="46" fill="none" stroke="currentColor" strokeWidth="4" />
              <ellipse cx="50" cy="50" rx="40" ry="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
              <polygon points="50,15 80,35 80,68 50,88 20,68 20,35" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M50,15 L50,88" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20,35 L80,35" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20,68 L80,68" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="8" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="font-sans text-xl md:text-2xl font-black tracking-tight uppercase leading-none">
              MURANG&apos;A UNIVERSITY
            </h1>
            <p className="text-[#b2d27f] font-sans font-bold tracking-widest text-xs uppercase mt-1">
              OF TECHNOLOGY
            </p>
            <span className="text-[10px] text-zinc-300 tracking-wider">Innovation for Prosperity</span>
          </div>
        </div>

        <div className="text-center md:text-right">
          <div className="inline-block bg-[#b2d27f] text-slate-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Complaints Committee
          </div>
          <p className="text-xs text-zinc-150">Email: complaints@mut.ac.ke</p>
          <p className="text-xs text-zinc-150">Website: mut.ac.ke</p>
        </div>
      </div>

      <div className="p-8">
        {/* Poster Main Theme Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black font-sans text-slate-800 tracking-tight leading-none mb-4 uppercase"
          >
            YOUR VOICE MATTERS
          </motion.h2>
          <p className="text-lg md:text-xl font-bold text-red-700 tracking-normal mb-2 leading-relaxed">
            Report Complaints, Concerns or Suggestions Safely &amp; Confidentially
          </p>
          <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto">
            MUT is committed to dynamic institutional improvement. Feel free to raise any feedback below or scan the interactive QR code.
          </p>
        </div>

        {/* Categories Grid - Stylized similarly to poster circles but interactive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.id}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => onSelectCategory(cat.id)}
              className="group cursor-pointer bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Decorative side badge matching category accent color */}
              <div className={`absolute top-0 left-0 w-full h-1 ${cat.colorClass.replace('text-', 'bg-')}`}></div>
              
              <div className={`w-14 h-14 ${cat.bgClass} rounded-full flex items-center justify-center mb-4 border ${cat.borderClass} group-hover:scale-110 transition-transform`}>
                {renderIcon(cat.iconName, `w-7 h-7 ${cat.colorClass}`)}
              </div>
              <h3 className="text-md font-extrabold text-slate-800 mb-2 font-sans group-hover:text-red-700 transition-colors">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-500 leading-normal line-clamp-3">
                {cat.description}
              </p>
              
              <span className="text-[10px] text-red-600 font-bold tracking-wider uppercase mt-4 block opacity-0 group-hover:opacity-100 transition-opacity">
                Report This &rarr;
              </span>
            </motion.div>
          ))}
        </div>

        {/* Illustrations Divider resembling the physical poster's bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-8 border-t border-slate-100">
          
          {/* Generated Image Left with original name/path context */}
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl overflow-hidden shadow-md max-w-[180px] bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <img
                src="/src/assets/images/two_students_1781690303292.jpg"
                alt="Empowered African American Students on Left"
                className="w-full h-auto object-cover aspect-square"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-2">Inclusive Representation</span>
          </div>

          {/* Center Column: Interactive Suggestions & Feedback Module */}
          <div className="bg-gradient-to-b from-rose-50 to-red-50/50 rounded-2xl p-6 border border-red-150 text-center flex flex-col items-center shadow-inner relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-800/5 rounded-full -mr-4 -mt-4"></div>
            <HelpCircle className="w-10 h-10 text-red-800 mb-3 group-hover:animate-bounce transition-all" />
            
            <h4 className="text-xs font-black uppercase text-red-950 tracking-wider mb-2">
              Suggestions &amp; Feedback
            </h4>
            
            <p className="text-[11px] text-slate-600 mb-4 max-w-[180px] leading-snug">
              Have recommendations or creative feedback to improve student life or university services? Share them directly.
            </p>
            
            <button
              onClick={onSubmitQuickSuggestion}
              className="w-full bg-red-800 hover:bg-red-900 text-white font-extrabold text-[11px] uppercase py-2 px-4 rounded-xl shadow-sm transition hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Submit Suggestion</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Generated Image Right with original name/path context */}
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl overflow-hidden shadow-md max-w-[180px] bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <img
                src="/src/assets/images/three_students_1781690319462.jpg"
                alt="Expressive African American Students on Right"
                className="w-full h-auto object-cover aspect-square"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-2">Active Discussion Team</span>
          </div>

        </div>

        {/* Footer Notes on Security */}
        <div className="text-center bg-slate-50 mt-8 rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-600 font-medium">
            &ldquo;Your Complaint will be carefully investigated and a university representative will get back to you. Thank you for making the university better.&rdquo;
          </p>
        </div>

      </div>
      
      {/* Help Banner at absolute footer */}
      <div className="bg-[#b2d27f] p-4 text-center">
        <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
          Help us improve the university experience for everyone
        </p>
      </div>
    </div>
  );
}
