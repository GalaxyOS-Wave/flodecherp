/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  FileCheck2, 
  GraduationCap, 
  Image as ImageIcon, 
  Lock, 
  MessageSquare, 
  School, 
  Sparkles,
  Share2,
  CheckCircle2,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, StudentPortfolio, Academy } from '../types';

interface PublicPortfolioProps {
  studentId: string;
  onBackToPortal?: () => void;
}

export default function PublicPortfolio({ studentId, onBackToPortal }: PublicPortfolioProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [portfolio, setPortfolio] = useState<StudentPortfolio | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        setLoading(true);
        // Load student document
        const studentRef = doc(db, 'students', studentId);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          const sData = studentSnap.data() as Student;
          setStudent(sData);

          // Load academy
          const academyRef = doc(db, 'academies', sData.academyId);
          const academySnap = await getDoc(academyRef);
          if (academySnap.exists()) {
            setAcademy(academySnap.data() as Academy);
          }
        }

        // Load portfolio document
        const portfolioRef = doc(db, 'portfolios', studentId);
        const portfolioSnap = await getDoc(portfolioRef);
        if (portfolioSnap.exists()) {
          setPortfolio(portfolioSnap.data() as StudentPortfolio);
        }
      } catch (err) {
        console.error('Error fetching public portfolio details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      loadPortfolioData();
    }
  }, [studentId]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/portfolio/${studentId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Retrieving verified academic record...</p>
      </div>
    );
  }

  if (!student || !portfolio) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6 text-white text-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-red-500 mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Academic Portfolios Restricted</h3>
        <p className="text-slate-500 max-w-sm mt-2 mb-6">
          We could not resolve or retrieve portfolio files under Student ID: <span className="font-mono text-orange-500">{studentId}</span>.
        </p>
        {onBackToPortal && (
          <button 
            type="button"
            onClick={onBackToPortal} 
            className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white"
          >
            Return to Portal Home
          </button>
        )}
      </div>
    );
  }

  // Handle visibility locks
  if (!portfolio.isVisible) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6 text-white">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 mb-6 animate-pulse">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Private Student Portfolio</h3>
        <p className="text-slate-500 text-sm max-w-md mt-2 mb-8">
          The public profile of <strong>{student.name}</strong> is currently locked. The academy is auditing achievements, or custom visibility has been set to off by the teacher.
        </p>
        {onBackToPortal && (
          <button 
            type="button"
            onClick={onBackToPortal} 
            className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-medium text-xs tracking-wider uppercase cursor-pointer"
          >
            Portal Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans tracking-tight flex flex-col pb-20 selection:bg-orange-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation / Floating Action Bar */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 ">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToPortal ? (
              <button 
                onClick={onBackToPortal}
                className="text-xs font-semibold uppercase text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                &larr; Back to Portal
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center font-bold text-white text-xs">F</div>
                <span className="text-slate-200 font-bold text-sm tracking-tight">Flodech Portfolio</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Block Registry Active
            </span>
            
            <button
              onClick={handleShare}
              className="px-4 py-2 text-xs font-bold text-[11px] uppercase tracking-wider text-slate-100 bg-orange-500 rounded-xl hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Copied Link!' : 'Share Portfolio'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header / Card Profile Details */}
      <header className="max-w-5xl mx-auto w-full px-6 pt-12 pb-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900/80 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <img 
              src={student.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} 
              alt={student.name} 
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-orange-500/40 p-1 bg-slate-950"
            />
            <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-100 text-center block" />
            </div>
          </div>

          <div className="flex-grow text-center md:text-left">
            <span className="text-xs uppercase font-extrabold tracking-widest text-orange-500 font-mono inline-block mb-1">STU-PORTFOLIO</span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-2">{student.name}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-slate-400 text-xs font-medium">
              <span className="font-mono text-orange-500/80">{student.id}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <span className="flex items-center gap-1 text-slate-300"><GraduationCap className="w-4 h-4 text-slate-500" /> Batch: {student.batch}</span>
              {academy && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <span className="flex items-center gap-1 text-slate-300"><School className="w-4 h-4 text-slate-300" /> {academy.institutionName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-4 md:flex-col bg-slate-950/60 p-4 border border-slate-900 rounded-2xl w-full sm:w-auto items-center md:items-start divide-x justify-around md:divide-x-0 md:divide-y border-slate-900">
            <div className="p-1 pr-4 md:pr-0 md:pb-3 w-1/2 md:w-full text-center md:text-left">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Certificates</span>
              <span className="text-xl font-bold text-white tracking-tight">{portfolio.certificates?.length || 0}</span>
            </div>
            <div className="p-1 pl-4 md:pl-0 md:pt-3 w-1/2 md:w-full text-center md:text-left border-slate-900">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Achievements</span>
              <span className="text-xl font-bold text-orange-500 tracking-tight">{portfolio.achievements?.length || 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio Body Grid */}
      <main className="max-w-5xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Feedback & Metadata */}
        <div className="space-y-8 lg:col-span-1">
          {/* Academy Bio Block */}
          {academy && (
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col items-center text-center">
              <img 
                src={academy.logoUrl} 
                alt={academy.institutionName} 
                className="w-14 h-14 object-contain rounded-xl border border-slate-800 bg-slate-950 p-1 mb-4" 
              />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">CERTIFIED EDUCATIONAL OUTLET</span>
              <h4 className="text-sm font-bold text-white leading-tight">{academy.institutionName}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{academy.address}</p>
              
              <div className="h-px bg-slate-900 w-full my-4" />
              <div className="flex flex-col gap-2 w-full text-left text-xs text-slate-400">
                <div className="flex justify-between"><span>Type:</span><span className="font-semibold text-slate-200">{academy.academyType}</span></div>
                <div className="flex justify-between"><span>Contact:</span><span className="font-semibold text-slate-200">{academy.phone}</span></div>
                <div className="flex justify-between"><span>Email:</span><span className="font-semibold text-slate-200">{academy.academyEmail}</span></div>
              </div>
            </div>
          )}

          {/* Teacher Review / Endorsement */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-900 relative">
            <div className="absolute top-6 right-6 text-orange-500/10">
              <MessageSquare className="w-16 h-16" />
            </div>
            
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-orange-500" /> Educator Endorsement
            </h3>
            
            <p className="text-slate-300 italic text-sm leading-relaxed">
              "{portfolio.teacherFeedback || "No educator endorsement comments registered yet."}"
            </p>
            
            <div className="mt-4 pt-4 border-t border-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-xs">
                {academy?.institutionName?.charAt(0) || 'D'}
              </div>
              <div className="text-xs leading-none">
                <span className="font-bold text-slate-200 block">Academy Faculty Board</span>
                <span className="text-slate-500 text-[10px]">{academy?.institutionName || 'Flodech Academy'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Achievements, Certificates, Gallery & Classes */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Achievements Block */}
          <div>
            <h3 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-orange-500" /> Academic Achievements
            </h3>
            
            {portfolio.achievements && portfolio.achievements.length > 0 ? (
              <div className="space-y-4">
                {portfolio.achievements.map((item, index) => (
                  <div key={index} className="bg-gradient-to-r from-slate-900/80 to-slate-900/20 p-5 border border-slate-900 rounded-2xl flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <span className="text-[10px] font-medium text-slate-500">{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-dashed border-slate-900/80 rounded-2xl p-8 text-center text-xs text-slate-500">
                No active highlights registered for this semester.
              </div>
            )}
          </div>

          {/* Certificates Block */}
          <div>
            <h3 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2 mb-4">
              <FileCheck2 className="w-5 h-5 text-orange-500" /> Earned Certificates
            </h3>
            
            {portfolio.certificates && portfolio.certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolio.certificates.map((cert, index) => (
                  <div key={index} className="bg-slate-900/40 p-5 border border-slate-900 rounded-2xl flex flex-col justify-between hover:border-orange-500/30 transition-colors group">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center justify-between gap-1 group-hover:text-orange-400 transition-colors">
                        {cert.title} <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-500 transition-colors" />
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">Issuer: {cert.issuer}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Date: {cert.date}</span>
                      <a 
                        href={cert.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-orange-500 hover:underline font-semibold"
                      >
                        View Document
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-dashed border-slate-900/80 rounded-2xl p-8 text-center text-xs text-slate-500">
                Credentials dossier is empty.
              </div>
            )}
          </div>

          {/* Gallery Block */}
          <div>
            <h3 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-orange-500" /> Media Activity Gallery
            </h3>
            
            {portfolio.gallery && portfolio.gallery.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {portfolio.gallery.map((img, index) => (
                  <div key={index} className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden group hover:border-orange-500/20 transition-all">
                    <div className="aspect-square bg-slate-900 overflow-hidden relative">
                      <img 
                        src={img.imageUrl} 
                        alt={img.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3 bg-slate-900/40 text-center">
                      <p className="text-[11px] font-bold text-slate-200 line-clamp-1">{img.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-dashed border-slate-900/80 rounded-2xl p-8 text-center text-xs text-slate-500">
                Activity gallery has no published photos.
              </div>
            )}
          </div>

          {/* Gradebook and Progress Reports */}
          <div>
            <h3 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-orange-500" /> Semester Gradebook & Status
            </h3>
            
            {portfolio.progressReports && portfolio.progressReports.length > 0 ? (
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-900">
                      <th className="p-4">Subject / Topic</th>
                      <th className="p-4 text-center">Grade</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4">Teacher Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {portfolio.progressReports.map((report, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/25 transition-colors">
                        <td className="p-4 font-bold text-white">{report.subject}</td>
                        <td className="p-4 text-center font-mono font-bold text-orange-500">{report.grade}</td>
                        <td className="p-4 text-center font-mono text-slate-200">{report.score}</td>
                        <td className="p-4 text-slate-400 italic leading-relaxed">{report.comments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-dashed border-slate-900/80 rounded-2xl p-8 text-center text-xs text-slate-500">
                Gradebook evaluations and progress indexes are pending publish.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
