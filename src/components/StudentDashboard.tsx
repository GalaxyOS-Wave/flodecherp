/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Bell, 
  Calendar, 
  Clock, 
  DollarSign, 
  Award, 
  MessageSquare, 
  LogOut, 
  QrCode, 
  Send, 
  Search, 
  Image as ImageIcon,
  Check,
  CheckCheck,
  Home,
  CheckCircle2,
  CalendarCheck,
  Building,
  Shield,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc,
  getDoc,
  onSnapshot, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Student, Notice, ClassSchedule, Fee, AttendanceRecord, ChatMessage, ChatThread, compressImage } from '../types';
import logoImg from '../assets/images/logotech_icon_1780152227001.png';

interface StudentDashboardProps {
  studentId: string;
  studentEmail: string;
  onLogout: () => void;
}

export default function StudentDashboard({ studentId, studentEmail, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notices' | 'schedule' | 'attendance' | 'fees' | 'portfolio' | 'chat'>('profile');
  const [student, setStudent] = useState<Student | null>(null);
  const [academyName, setAcademyName] = useState('Flodech Academy');
  const [academyUpiId, setAcademyUpiId] = useState('');
  const [academyQr, setAcademyQr] = useState('');
  const [academyInstructions, setAcademyInstructions] = useState('');
  const [loading, setLoading] = useState(true);

  // Real-time states
  const [notices, setNotices] = useState<Notice[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Chat system states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatImageBase64, setChatImageBase64] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        setLoading(true);
        const sRef = doc(db, 'students', studentId);
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          const sData = sSnap.data() as Student;
          setStudent(sData);

          // Get Academy properties
          const aSnap = await getDoc(doc(db, 'academies', sData.academyId));
          if (aSnap.exists()) {
            const aData = aSnap.data();
            setAcademyName(aData.institutionName);
            setAcademyUpiId(aData.upiId);
            setAcademyQr(aData.upiQrCode);
            setAcademyInstructions(aData.paymentInstructions);
          }
        }
      } catch (err) {
        console.error('Error fetching student context:', err);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      loadStudentProfile();
    }
  }, [studentId]);

  // Real-time Queries matching Student's Academy ID & Batch
  useEffect(() => {
    if (!student) return;

    // 1. Notices Subscription
    const noticesQuery = query(
      collection(db, 'notices'),
      where('academyId', '==', student.academyId)
    );
    const unsubsNotices = onSnapshot(noticesQuery, (snap) => {
      const noticeList: Notice[] = [];
      snap.forEach((d) => {
        noticeList.push({ id: d.id, ...d.data() } as Notice);
      });
      // Sort pinned notices on top, then by date descending
      noticeList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // fallback to date
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setNotices(noticeList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notices');
    });

    // 2. Class Schedules Subscription
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('academyId', '==', student.academyId),
      where('batchName', '==', student.batch)
    );
    const unsubsSchedules = onSnapshot(schedulesQuery, (snap) => {
      const schList: ClassSchedule[] = [];
      snap.forEach((d) => {
        schList.push({ id: d.id, ...d.data() } as ClassSchedule);
      });
      setSchedules(schList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schedules');
    });

    // 3. Fees Invoices Subscription
    const feesQuery = query(
      collection(db, 'fees'),
      where('studentId', '==', student.id)
    );
    const unsubsFees = onSnapshot(feesQuery, (snap) => {
      const feeList: Fee[] = [];
      snap.forEach((d) => {
        feeList.push({ id: d.id, ...d.data() } as Fee);
      });
      // Sort by due date descending
      feeList.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
      setFees(feeList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'fees');
    });

    // 4. Attendance Subscription
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('academyId', '==', student.academyId),
      where('batch', '==', student.batch)
    );
    const unsubsAttendance = onSnapshot(attendanceQuery, (snap) => {
      const attList: AttendanceRecord[] = [];
      snap.forEach((d) => {
        attList.push({ id: d.id, ...d.data() } as AttendanceRecord);
      });
      setAttendance(attList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    // 5. Chat Messages Subscription
    const chatMsgQuery = query(
      collection(db, 'chats', student.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubsChat = onSnapshot(chatMsgQuery, (snap) => {
      const msgList: ChatMessage[] = [];
      snap.forEach((d) => {
        msgList.push({ id: d.id, ...d.data() } as ChatMessage);
      });
      setChatMessages(msgList);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${student.id}/messages`);
    });

    return () => {
      unsubsNotices();
      unsubsSchedules();
      unsubsFees();
      unsubsAttendance();
      unsubsChat();
    };
  }, [student]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!chatInput.trim() && !chatImageBase64) return;

    try {
      const messageId = 'MSG-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const messageData: ChatMessage = {
        id: messageId,
        senderId: student.id,
        senderRole: 'student',
        content: chatInput.trim() || 'Shared a photo',
        imageUrl: chatImageBase64 || '',
        createdAt: new Date(),
        read: false
      };

      // 1. Write the message Doc
      await setDoc(doc(db, 'chats', student.id, 'messages', messageId), messageData);

      // 2. Update parent Chat Thread doc to trigger teacher-side alerts
      const threadRef = doc(db, 'chats', student.id);
      await setDoc(threadRef, {
        id: student.id,
        academyId: student.academyId,
        studentId: student.id,
        studentName: student.name,
        lastMessage: chatInput.trim() || 'Shared a photo',
        lastMessageAt: new Date(),
        unreadCountTeacher: 1, // trigger notification for teacher
        unreadCountStudent: 0
      }, { merge: true });

      setChatInput('');
      setChatImageBase64('');
      scrollToBottom();
    } catch (err) {
      console.error('Error posting message:', err);
    }
  };

  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, 400, 0.7)
        .then((compressedBase64) => {
          setChatImageBase64(compressedBase64);
        })
        .catch((err) => {
          console.error("Image compression failed, using direct base64 fallback:", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            setChatImageBase64(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const calculateAttendanceRate = (): number => {
    if (!student || attendance.length === 0) return 100;
    let presentCount = 0;
    let totalClassesForStudent = 0;

    attendance.forEach((record) => {
      const status = record.records[student.id];
      if (status) {
        totalClassesForStudent++;
        if (status === 'present' || status === 'late') {
          presentCount++;
        }
      }
    });

    if (totalClassesForStudent === 0) return 100;
    return Math.round((presentCount / totalClassesForStudent) * 105) > 100 ? 100 : Math.round((presentCount / totalClassesForStudent) * 100);
  };

  const getAttendanceSummary = () => {
    if (!student) return { present: 0, absent: 0, late: 0 };
    let present = 0;
    let absent = 0;
    let late = 0;

    attendance.forEach((r) => {
      const state = r.records[student.id];
      if (state === 'present') present++;
      if (state === 'absent') absent++;
      if (state === 'late') late++;
    });

    return { present, absent, late };
  };

  const filteredMessages = chatMessages.filter((msg) => 
    msg.content.toLowerCase().includes(chatSearch.toLowerCase())
  );

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-9 h-9 text-orange-500 animate-spin mb-4" />
        <p className="text-slate-600 text-sm">Synchronizing live portal credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="Flodech Logo"
              className="w-8 h-8 rounded-lg object-cover bg-orange-500 select-none shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className="text-white font-extrabold text-lg tracking-tight">Flodech</span>
          </div>

          <span className="text-[9px] uppercase font-bold tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/10 px-2 py-0.5 rounded-full font-mono">
            STU-PORT
          </span>
        </div>

        {/* Short info display */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-3">
          <img 
            src={student.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} 
            alt={student.name} 
            className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-slate-800 p-0.5" 
          />
          <div className="text-sm truncate">
            <span className="font-extrabold text-white block truncate leading-tight">{student.name}</span>
            <span className="text-slate-500 text-xs font-mono">{student.id}</span>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'}`}
          >
            <User className="w-4 h-4" /> Profile Info
          </button>
          
          <button
            id="tab-notices-btn"
            onClick={() => setActiveTab('notices')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === 'notices' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'}`}
          >
            <span className="flex items-center gap-3"><Bell className="w-4 h-4" /> Core Notices</span>
            {notices.length > 0 && <span className="text-[10px] bg-orange-600 px-2 py-0.5 rounded-full text-white font-mono">{notices.length}</span>}
          </button>

          <button
            id="tab-schedule-btn"
            onClick={() => setActiveTab('schedule')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${activeTab === 'schedule' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'}`}
          >
            <Calendar className="w-4 h-4" /> Weekly Timetable
          </button>

          <button
            id="tab-attendance-btn"
            onClick={() => setActiveTab('attendance')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === 'attendance' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'}`}
          >
            <span className="flex items-center gap-3"><CalendarCheck className="w-4 h-4" /> Attendance Rates</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-orange-400 font-mono font-bold">{calculateAttendanceRate()}%</span>
          </button>

          <button
            id="tab-fees-btn"
            onClick={() => setActiveTab('fees')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === 'fees' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'}`}
          >
            <span className="flex items-center gap-3"><DollarSign className="w-4 h-4" /> Tuition & Fees</span>
            {fees.some(f => f.status === 'pending') && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
          </button>

          <button
            id="tab-portfolio-btn"
            onClick={() => setActiveTab('portfolio')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === 'portfolio' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'}`}
          >
            <span className="flex items-center gap-3"><Award className="w-4 h-4" /> My Digital Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button
            id="tab-chat-btn"
            onClick={() => setActiveTab('chat')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${activeTab === 'chat' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/45'}`}
          >
            <MessageSquare className="w-4 h-4" /> Faculty Chat Room
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            id="student-logout-btn"
            onClick={onLogout}
            className="w-full text-slate-400 hover:text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-slate-850 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect Session
          </button>
        </div>
      </aside>

      {/* WORKSPACE DETAIL BLOCK */}
      <main className="flex-grow p-6 sm:p-10 overflow-y-auto max-w-5xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <span className="text-xs font-bold font-mono tracking-widest text-orange-500 uppercase">{academyName} Portal</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5 capitalize">{activeTab} controls</h1>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Server Sync online</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </header>

        {/* 1. PROFILE SECTION */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Core credentials card */}
            <div className="md:col-span-1 bg-white p-6 border border-slate-200/60 rounded-3xl text-center shadow-lg shadow-slate-100">
              <img 
                src={student.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} 
                alt={student.name} 
                className="w-24 h-24 mx-auto rounded-3xl object-contain border border-slate-200 bg-slate-50 p-1 mb-4" 
              />
              <h3 className="text-base font-black text-slate-900 leading-tight">{student.name}</h3>
              <p className="font-mono text-xs text-orange-500 font-bold mt-1">{student.id}</p>
              
              <div className="h-px bg-slate-100 mx-auto my-6" />
              <div className="space-y-3.5 text-left text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Home Academy:</span>
                  <span className="font-bold text-slate-800 truncate">{academyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Target Batch:</span>
                  <span className="font-bold text-slate-800">{student.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Account Email:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[160px]">{studentEmail}</span>
                </div>
              </div>
            </div>

            {/* Parent contact information block */}
            <div className="md:col-span-2 bg-white p-8 border border-slate-200/60 rounded-3xl shadow-lg shadow-slate-100 space-y-6">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900 font-sans uppercase">Registry Contact Dossier</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Parent / Guardian Legal Name</span>
                  <p className="font-bold text-slate-900">{student.parentName || 'No parent name registered'}</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Emergency Parent Phone</span>
                  <p className="font-bold text-slate-900">{student.parentPhone || 'No contacts compiled'}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl text-white">
                <h4 className="text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Academy Bulletin</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">To update fields or address modifications inside your contact profile, please ping your chief instructor or academy operations director directly using the built-in Faculty Chat Room.</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. NOTICES BOARD */}
        {activeTab === 'notices' && (
          <div className="space-y-6">
            {notices.length > 0 ? (
              notices.map((notice) => (
                <div 
                  key={notice.id} 
                  className={`bg-white p-6 border rounded-3xl shadow-sm ${notice.isPinned ? 'border-l-4 border-l-orange-500 border-slate-200' : 'border-slate-200/60'}`}
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      {notice.isPinned && (
                        <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-100 rounded-full text-[9px] font-bold text-orange-600 block w-max uppercase tracking-wider mb-2 font-mono">
                          PINNED BULLETIN
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-slate-950">{notice.title}</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {notice.createdAt?.seconds ? new Date(notice.createdAt.seconds * 1000).toLocaleDateString() : 'Active Date'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No active bulletins posted</h3>
                <p className="text-slate-400 text-xs mt-1">Check back later for announcements and schedules.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. CLASS SCHEDULES */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-3xl text-white shadow-md shadow-orange-500/10">
              <h3 className="font-bold text-lg mb-1">{student.batch} Weekly Timetable</h3>
              <p className="text-xs text-orange-100">Live academic calendar parsed from scheduler logs.</p>
            </div>

            {schedules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {schedules.map((sch) => (
                  <div key={sch.id} className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm flex items-start gap-4 hover:border-orange-200 transition-colors">
                    <div className="w-11 h-11 bg-orange-50 rounded-xl text-orange-500 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 font-mono block mb-1">{sch.dayOfWeek}</span>
                      <h4 className="font-bold text-slate-950 text-sm leading-snug">{sch.className}</h4>
                      
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-2 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sch.startTime} - {sch.endTime}</span>
                      </div>

                      <div className="h-px bg-slate-100 my-3" />
                      <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                        <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center font-bold text-[10px]">T</div>
                        <span>Instructor: {sch.teacherName}</span>
                      </div>

                      {sch.notes && (
                        <p className="text-[10px] text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg italic font-sans">Notes: {sch.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No scheduled classes found</h3>
                <p className="text-slate-400 text-xs mt-1">Please ask your academy teacher to add a schedule.</p>
              </div>
            )}
          </div>
        )}

        {/* 4. ATTENDANCE LOGS */}
        {activeTab === 'attendance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Circular statistic block */}
              <div className="bg-white p-8 border border-slate-200/60 rounded-3xl shadow-lg shadow-slate-100 flex items-center justify-around gap-6">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">Your Attendance Rate</span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{calculateAttendanceRate()}%</h3>
                  <p className="text-xs text-slate-500 font-sans">Required minimum 75% for credentials.</p>
                </div>
                
                <div className="w-20 h-20 rounded-full border-8 border-slate-100 flex items-center justify-center relative bg-orange-50/20 border-t-orange-500">
                  <span className="font-extrabold text-sm text-orange-500">{calculateAttendanceRate()}%</span>
                </div>
              </div>

              {/* Attendance metrics */}
              <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-lg shadow-slate-100 flex flex-col justify-around">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Metrics Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 border border-emerald-100/50 p-3 rounded-2xl">
                    <span className="text-lg font-bold text-emerald-600 block">{getAttendanceSummary().present}</span>
                    <span className="text-[10px] font-semibold text-emerald-500">Present</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    <span className="text-lg font-bold text-slate-600 block">{getAttendanceSummary().late}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Late</span>
                  </div>
                  <div className="bg-red-50 border border-red-100/50 p-3 rounded-2xl">
                    <span className="text-lg font-bold text-red-600 block">{getAttendanceSummary().absent}</span>
                    <span className="text-[10px] font-semibold text-red-500">Absent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance list table */}
            <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Attendance Logs</h3>
              </div>
              
              {attendance.length > 0 ? (
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans border-b border-slate-100">
                      <th className="p-4">Track Date</th>
                      <th className="p-4">Class Batch</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-800 font-mono">{att.date}</td>
                        <td className="p-4 font-mono text-xs">{att.batch}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                            att.records[student.id] === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            att.records[student.id] === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {att.records[student.id] || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No attendance records logged inside this batch context.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. FEES PORTAL */}
        {activeTab === 'fees' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left side: Invoice logs */}
            <div className="md:col-span-2 space-y-6">
              <h3 className="font-bold text-base text-slate-900 uppercase">Payment Invoices Ledger</h3>
              
              {fees.length > 0 ? (
                <div className="space-y-4">
                  {fees.map((fee) => (
                    <div key={fee.id} className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-sm flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-950">${fee.amount.toFixed(2)}</h4>
                          <span className={`px-2.5 py-0.5 text-[9px] uppercase font-bold rounded-full ${fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {fee.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-medium">
                          <span>DUE DATE: <strong className="font-mono text-slate-600">{fee.dueDate}</strong></span>
                          <span>ID: <code className="font-mono bg-slate-50 px-1 rounded">{fee.id}</code></span>
                        </div>
                      </div>

                      {fee.status === 'paid' ? (
                        <div className="text-right text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipt Compiled</span>
                          <span className="font-mono text-slate-700 mt-1 block">{fee.receiptNumber || 'N/A'}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                          Pending Scan
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60">
                  <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <h3 className="text-xs font-bold text-slate-800">Clear Records!</h3>
                  <p className="text-slate-400 text-xs mt-1">No invoices or dues outstanding.</p>
                </div>
              )}
            </div>

            {/* Right side: UPI payment instructions gateway */}
            <div className="md:col-span-1 space-y-6">
              <h3 className="font-bold text-base text-slate-900 uppercase">Scan to Pay</h3>
              <div className="bg-white p-6 border border-slate-200/60 rounded-3xl shadow-lg shadow-slate-100 flex flex-col items-center text-center">
                
                {academyQr ? (
                  <img src={academyQr} alt="UPI QR" className="w-44 h-44 object-contain border border-slate-200 rounded-2xl p-2 bg-white" />
                ) : (
                  <div className="w-44 h-44 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <QrCode className="w-8 h-8 text-slate-300" />
                    <span className="text-[10px] text-slate-400">QR Code Pending Creator</span>
                  </div>
                )}

                <div className="h-px bg-slate-100 w-full my-4" />
                <div className="w-full text-left font-sans text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">UPI billing identifier</span>
                  <code className="text-slate-800 font-bold block select-all bg-slate-50 p-2 text-center rounded">{academyUpiId || 'Direct Pay Only'}</code>
                  
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mt-4 mb-1">Billing instructions</span>
                  <p className="text-slate-500 italic leading-relaxed bg-orange-50/20 p-3 rounded border border-orange-100">{academyInstructions || 'Please scan and send transaction screenshot inside chat room.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. My Digital Portfolio */}
        {activeTab === 'portfolio' && (
          <div className="bg-white p-10 border border-slate-200/60 rounded-3xl shadow-lg shadow-slate-100 text-center space-y-6 max-w-lg mx-auto">
            <Award className="w-14 h-14 text-orange-500 mx-auto mb-2" />
            <h3 className="text-xl font-black text-slate-950">Your Professional Showcase</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Every student gets a professional public resume path (e.g., matching achievements, gallery media, certifications, grade report books, and endorsements).
            </p>

            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-xs font-mono text-slate-600 select-all block break-all text-center">
              {window.location.origin}/portfolio/{student.id}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                _id="copy-portfolio-btn"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/portfolio/${student.id}`);
                  alert('Portfolio Link Copied to Clipboard!');
                }}
                className="w-full sm:w-1/2 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors rounded-xl"
              >
                Copy Link
              </button>
              <a
                id="open-portfolio-link"
                href={`/portfolio/${student.id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-1/2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/10"
              >
                Open Showcase <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* 7. CHAT ROOM */}
        {activeTab === 'chat' && (
          <div className="bg-white border border-slate-200/60 shadow-lg rounded-3xl flex flex-col h-[520px] overflow-hidden">
            {/* Header / Search filters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-xs uppercase shadow-sm">
                  T
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-none">Your Chief Instructor</h4>
                  <span className="text-[10px] text-emerald-500 font-semibold">Active & online</span>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="chat-filter-input"
                  type="text"
                  placeholder="Filter keys/topics..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-xs bg-slate-50/50"
                />
              </div>
            </div>

            {/* Message listing zone */}
            <div className="flex-grow p-6 overflow-y-auto bg-slate-50/55 space-y-4">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[75%] gap-1 ${msg.senderRole === 'student' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div 
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        msg.senderRole === 'student' 
                          ? 'bg-orange-500 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Screenshot" 
                          className="max-w-[180px] max-h-[180px] rounded-lg object-cover mb-2 border border-slate-200/20" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}</span>
                      {msg.senderRole === 'student' && (
                        <span>{msg.read ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500 font-bold" /> : <Check className="w-3.5 h-3.5" />}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <MessageSquare className="w-8 h-8 text-slate-350 mb-2" />
                  <p className="text-xs text-slate-500 select-none">No messages matching keyword queries.</p>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Preview image slot */}
            {chatImageBase64 && (
              <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <img src={chatImageBase64} alt="Pre-upload" className="w-10 h-10 object-cover rounded-lg border border-slate-200 p-0.5 bg-white" />
                  <span className="text-[10px] text-orange-500 font-bold">Screenshot attached</span>
                </div>
                <button onClick={() => setChatImageBase64('')} className="text-xs text-slate-400 hover:text-red-500 uppercase font-bold tracking-wider cursor-pointer">Remove</button>
              </div>
            )}

            {/* Form writing controls */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <button
                type="button"
                onClick={() => chatImageRef.current?.click()}
                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
                title="Attach Screenshot"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <input 
                ref={chatImageRef}
                type="file" 
                accept="image/*" 
                onChange={handleChatImageSelect}
                className="hidden" 
              />

              <input
                id="chat-send-input"
                type="text"
                placeholder="Share transaction reports or ask questions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              />

              <button
                id="chat-send-submit-btn"
                type="submit"
                className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
