import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Users, 
  Video, 
  BookOpen, 
  Calendar, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  Send, 
  X, 
  Sparkles, 
  ChevronRight, 
  Heart, 
  MessageSquare,
  ArrowLeft,
  Tv,
  Image as ImageIcon,
  Share2
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Academy, PublicCourse, PublicTeacher, PublicEvent, PublicTestimonial, Student, StudentPortfolio } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PublicAcademyProfileProps {
  academyId: string;
  onBackToPortal?: () => void;
}

export default function PublicAcademyProfile({ academyId, onBackToPortal }: PublicAcademyProfileProps) {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
  const [publicPortfolios, setPublicPortfolios] = useState<{ student: Student; portfolio: StudentPortfolio }[]>([]);

  // Modals state
  const [showAdmissionModal, setShowAdmissionModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);

  // Admission request form
  const [admissionStudentName, setAdmissionStudentName] = useState('');
  const [admissionParentName, setAdmissionParentName] = useState('');
  const [admissionPhone, setAdmissionPhone] = useState('');
  const [admissionEmail, setAdmissionEmail] = useState('');
  const [admissionAge, setAdmissionAge] = useState('');
  const [admissionCourse, setAdmissionCourse] = useState('');
  const [admissionMessage, setAdmissionMessage] = useState('');
  const [submittingAdmission, setSubmittingAdmission] = useState(false);
  const [admissionSuccess, setAdmissionSuccess] = useState(false);

  // Inquiry form
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Load Academy details, public portfolios, and counts
  useEffect(() => {
    async function loadPublicData() {
      try {
        setLoading(true);
        // 1. Try fetching via ID directly
        let aDocRef = doc(db, 'academies', academyId);
        let aSnap = await getDoc(aDocRef);
        let targetAcademy: Academy | null = null;

        if (aSnap.exists()) {
          targetAcademy = { id: aSnap.id, ...aSnap.data() } as Academy;
        } else {
          // Try fetching via slug (match lowercase institution name or search collection)
          const academiesRef = collection(db, 'academies');
          const searchVal = academyId.replace(/-/g, ' ').toLowerCase();
          const qSnap = await getDocs(academiesRef);
          qSnap.forEach((docItem) => {
            const data = docItem.data();
            const nameMatch = data.institutionName?.toLowerCase() === searchVal || 
                              docItem.id.toLowerCase() === academyId.toLowerCase();
            if (nameMatch) {
              targetAcademy = { id: docItem.id, ...data } as Academy;
            }
          });
        }

        if (!targetAcademy) {
          setErrorMessage('The academy public profile could not be found. Check URL spelling or try again.');
          setLoading(false);
          return;
        }

        setAcademy(targetAcademy);

        // 2. Fetch student count for this academy
        const studentsQuery = query(
          collection(db, 'students'),
          where('academyId', '==', targetAcademy.id)
        );
        const stSnap = await getDocs(studentsQuery);
        setTotalStudentsCount(stSnap.size);

        // Organize active student records to match profiles
        const studentMap: { [id: string]: Student } = {};
        const studentList: Student[] = [];
        stSnap.forEach((d) => {
          const s = { id: d.id, ...d.data() } as Student;
          studentMap[s.id] = s;
          studentList.push(s);
        });

        // 3. Fetch Portfolios that are visible publicly
        const portsQuery = query(
          collection(db, 'portfolios'),
          where('academyId', '==', targetAcademy.id),
          where('isVisible', '==', true)
        );
        const portSnap = await getDocs(portsQuery);
        const resolvedPortfolios: { student: Student; portfolio: StudentPortfolio }[] = [];
        portSnap.forEach((portDoc) => {
          const p = portDoc.data() as StudentPortfolio;
          const matchingS = studentMap[portDoc.id];
          if (matchingS) {
            resolvedPortfolios.push({ student: matchingS, portfolio: p });
          }
        });
        setPublicPortfolios(resolvedPortfolios);

      } catch (err) {
        console.error('Error fetching public academy details:', err);
        setErrorMessage('Failed to connect to databases. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    }
    if (academyId) {
      loadPublicData();
    }
  }, [academyId]);

  // Handle Admission Request submission
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academy) return;

    try {
      setSubmittingAdmission(true);
      const docId = `ADM-${Math.floor(100000 + Math.random() * 900000)}`;
      await addDoc(collection(db, 'admissions'), {
        id: docId,
        academyId: academy.id,
        studentName: admissionStudentName.trim(),
        parentName: admissionParentName.trim(),
        phoneNumber: admissionPhone.trim(),
        email: admissionEmail.trim(),
        age: Number(admissionAge) || 7,
        interestedCourse: admissionCourse || 'General Curriculum',
        message: admissionMessage.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setAdmissionSuccess(true);
      // Clear form
      setAdmissionStudentName('');
      setAdmissionParentName('');
      setAdmissionPhone('');
      setAdmissionEmail('');
      setAdmissionAge('');
      setAdmissionCourse('');
      setAdmissionMessage('');
    } catch (err) {
      console.error(err);
      alert('Fail to submit admission request. Verify fields and try again.');
    } finally {
      setSubmittingAdmission(false);
    }
  };

  // Handle Inquiry submission
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academy) return;

    try {
      setSubmittingInquiry(true);
      const docId = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      await addDoc(collection(db, 'inquiries'), {
        id: docId,
        academyId: academy.id,
        name: inquiryName.trim(),
        email: inquiryEmail.trim(),
        phoneNumber: inquiryPhone.trim(),
        message: inquiryMsg.trim(),
        status: 'open',
        createdAt: serverTimestamp()
      });

      setInquirySuccess(true);
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMsg('');
    } catch (err) {
      console.error(err);
      alert('Fail to submit your inquiry. Verify fields and try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const shareAcademy = () => {
    if (navigator.share) {
      navigator.share({
        title: `${academy?.institutionName || 'Flodech Academy'} Public Profile`,
        text: `Check out ${academy?.institutionName} on Flodech!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Public URL copied to clipboard! Share it on WhatsApp, Telegram, or social media.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Loading Academy Profile...</p>
      </div>
    );
  }

  if (errorMessage || !academy) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6 shadow-sm border border-red-150">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Public Profile Offline</h2>
        <p className="text-slate-500 text-sm mt-2">{errorMessage || 'The academy public workspace does not exist.'}</p>
        <button
          onClick={() => {
            if (onBackToPortal) onBackToPortal();
            else { window.location.href = '/'; }
          }}
          className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 shadow"
        >
          Back To Home
        </button>
      </div>
    );
  }

  // Fallbacks for profile fields
  const infoAbout = academy.about || '';
  const infoMission = academy.mission || '';
  const infoStyle = academy.teachingStyle || '';
  const infoWhy = academy.whyChooseUs || '';

  // Lists Fallback
  const courses = academy.coursesList || [];
  const teachers = academy.teachersList?.filter(t => t.name) || [];
  const gallery = academy.galleryList || [];
  const events = academy.upcomingEventsList || [];
  const testimonials = academy.testimonialsList?.filter(t => t.status === 'approved') || [];
  const settings = academy.publicSettings || {
    showAchievements: true,
    showTeachers: true,
    showPortfolios: true,
    showGallery: true,
    showEvents: true,
    showTestimonials: true
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-orange-500 selection:text-white relative font-sans leading-normal">
      
      {/* 1. STICKY ACTION HEADER & METAtags (Simulated) */}
      <div className="bg-slate-950 text-white py-3.5 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (onBackToPortal) onBackToPortal();
              else { window.location.href = '/'; }
            }}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={shareAcademy}
              className="px-3.5 py-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition border border-white/10"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Page
            </button>
            <button
              onClick={() => setShowAdmissionModal(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow transition duration-150 cursor-pointer"
            >
              Request Admission
            </button>
          </div>
        </div>
      </div>

      {/* 2. HERO HEADER SECTION */}
      <section className="bg-white border-b border-slate-100 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8">
            <img 
              src={academy.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${academy.institutionName}`}
              alt={`${academy.institutionName} logo`}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-contain bg-white border border-slate-200 p-1 mb-2 block shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            
            <div className="flex-grow">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1.5">
                <span className="bg-slate-100 text-slate-600 font-extrabold font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-slate-200/50">
                  {academy.academyType}
                </span>
                <span className="bg-orange-50 text-orange-600 font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-orange-200/50">
                  <ShieldCheck className="w-3 h-3 fill-orange-500 text-white" />
                  Flodech Verified
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-none mb-3">
                {academy.institutionName}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base max-w-2xl font-normal leading-relaxed mb-4">
                {academy.paymentInstructions || 'Providing premium learning pathways for creative expression, professional mastery, and athletic growth in our community.'}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-y-2 gap-x-5 text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {academy.address}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {academy.academyEmail}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {academy.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN WORKSPACE / PROFILE SPLIT */}
      <div className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        
        {/* OVERVIEW INTRO */}
        {(infoAbout || infoMission || infoStyle || infoWhy) && (
          <div className="bg-white p-8 sm:p-10 border border-slate-150 rounded-3xl shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5.5 h-5.5 text-orange-500" /> Academy Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base leading-relaxed text-slate-650">
              <div className="space-y-4">
                {infoAbout && (
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1">About Us</h3>
                    <p className="font-normal">{infoAbout}</p>
                  </div>
                )}
                
                {infoMission && (
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1">Our Mission</h3>
                    <p className="font-normal">{infoMission}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {infoStyle && (
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1">Teaching Style</h3>
                    <p className="font-normal">{infoStyle}</p>
                  </div>
                )}
                
                {infoWhy && (
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1">Why Choose Us</h3>
                    <p className="font-normal">{infoWhy}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. COURSES OFFERED - BROCHURE */}
        <div id="courses-offered-section" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Admissions Open</span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Courses Offered</h2>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 font-medium text-xs sm:text-sm">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              There are no courses listed at this moment. Tap "Contact Academy" to inquire.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="bg-white border border-slate-150 rounded-3xl p-6 flex flex-col justify-between hover:border-orange-200 transition duration-150 shadow-xs"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-black text-slate-900 text-lg leading-snug">{course.name}</h3>
                      <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wide font-mono px-2.5 py-0.5 rounded-full shrink-0">
                        {course.duration}
                      </span>
                    </div>
                    
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4">
                      {course.description}
                    </p>
                  </div>

                  {course.fees && (
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center bg-slate-50/50 -mx-6 -mb-6 px-6 py-3 rounded-b-3xl mt-4">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400">Course Fee</span>
                      <span className="text-sm font-black text-orange-600 font-mono">{course.fees}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. TEACHER SHOWCASE */}
        {settings.showTeachers && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Expert Mentors</span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Teacher Showcase</h2>
            </div>

            {teachers.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 font-medium text-xs sm:text-sm">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No teacher profiles have been marked public/showcased.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="bg-white border border-slate-200/60 rounded-3xl p-5 text-center transition duration-150 hover:-translate-y-1 hover:shadow-md">
                    <img
                      src={teacher.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${teacher.name}`}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-2xl object-cover bg-slate-100 mx-auto mb-3.5 border border-slate-100 p-0.5"
                      referrerPolicy="no-referrer"
                    />
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">{teacher.name}</h3>
                    <span className="text-orange-500 font-extrabold text-[10px] uppercase tracking-wider block mb-2">{teacher.role}</span>
                    
                    <div className="text-[11px] text-slate-500 border-t border-slate-100/60 pt-2 space-y-1 font-medium bg-slate-50 rounded-xl p-2 mt-2">
                      <p><strong className="text-slate-700">Specialization:</strong> {teacher.specialization || 'N/A'}</p>
                      <p><strong className="text-slate-700">Experience:</strong> {teacher.experience || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. STUDENT PORTFOLIO SHOWCASE */}
        {settings.showPortfolios && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Outstanding Learners</span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Student Portfolios</h2>
            </div>

            {publicPortfolios.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 font-medium text-xs sm:text-sm">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Featured student profiles will appear here once spotlighted by instructors.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {publicPortfolios.map(({ student, portfolio }) => (
                  <div key={student.id} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between hover:border-slate-300 transition shadow-xs">
                    <div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <img 
                          src={student.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} 
                          alt={student.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none mb-1">{student.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Cohort: {student.batch}</span>
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs italic line-clamp-3 mb-4 leading-relaxed">
                        "{portfolio.teacherFeedback || 'Student is performing consistently across curriculum with notable leadership.'}"
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[11px]">
                      <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-black uppercase text-[9px] tracking-wide font-mono">
                        {portfolio.achievements?.length || 0} Wins
                      </span>
                      
                      <button
                        onClick={() => {
                          window.history.pushState({}, '', `/portfolio/${student.id}`);
                          window.dispatchEvent(new Event('popstate'));
                        }}
                        className="text-slate-900 hover:text-orange-500 font-black flex items-center gap-0.5 uppercase tracking-wide text-[10px]"
                      >
                        Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. GALLERY HIGHLIGHTS */}
        {settings.showGallery && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Explore Classes</span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Academy Gallery</h2>
            </div>

            {gallery.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 font-medium text-xs sm:text-sm">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Image gallery loading is empty. Stay tuned for class event photos!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((item, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-video border border-slate-200 bg-white shadow-xs">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold truncate tracking-tight">{item.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 9. UPCOMING EVENTS */}
        {settings.showEvents && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Stay Updated</span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Upcoming Events</h2>
            </div>

            {events.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 font-medium text-xs sm:text-sm">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                There are no upcoming workshops, annual concerts, or performance functions scheduled right now.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="bg-white border border-slate-150 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-50 text-orange-500 w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border border-orange-100 font-mono">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight mb-1">{event.title}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed max-w-xl">{event.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold text-slate-650 shrink-0 self-start sm:self-center">
                      <span>{event.date}</span>
                      <span className="border-l border-slate-200 h-3" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 10. TESTIMONIALS */}
        {settings.showTestimonials && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Our Commitee Speaks</span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Testimonials & Reviews</h2>
            </div>

            {testimonials.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 font-medium text-xs sm:text-sm">
                <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Enrollment reviews are empty. Testimonials are approved on behalf of the director.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {testimonials.map((test) => (
                  <div key={test.id} className="bg-white border border-slate-250 p-6 rounded-3xl shadow-xs relative flex flex-col justify-between">
                    <p className="text-slate-600 text-xs sm:text-sm italic leading-relaxed mb-4">
                      "{test.content}"
                    </p>
                    
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 tracking-tight">{test.authorName}</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                        {test.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 11. ENHANCED CTA AND CONTACT FOOTER */}
        <div className="bg-slate-950 text-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-orange-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          
          <div className="space-y-2 text-center md:text-left z-10 relative">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" /> Register with Flodech
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md font-medium">
              Start building professional skills, access daily learning dashboards, track fee invoices, and collaborate direct with mentors securely.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0 z-10">
            <button
              onClick={() => setShowContactModal(true)}
              className="px-5 py-3 border border-slate-800 bg-slate-900 text-white hover:text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-850 active:scale-95 transition shadow cursor-pointer text-center"
            >
              Contact Academy
            </button>
            <button
              onClick={() => setShowAdmissionModal(true)}
              className="px-6 py-3 bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-orange-600 active:scale-95 transition shadow-md cursor-pointer text-center"
            >
              Request Admission
            </button>
          </div>
        </div>

      </div>

      {/* 12. FLOATING ADMISSION FORM MODAL */}
      <AnimatePresence>
        {showAdmissionModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-base shadow-inner">
                    A
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-none">Admission Inquiry</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Submit details to join {academy.institutionName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowAdmissionModal(false); setAdmissionSuccess(false); }}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal scroll area */}
              <div className="p-6 overflow-y-auto space-y-4">
                {admissionSuccess ? (
                  <center className="py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center inline-block">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg leading-snug">Submission Successful!</h4>
                    <p className="text-slate-500 text-xs max-w-sm">
                      Your admission request has been logged inside Flodech Academy Dashboard. An administrator will contact you shortly using your registered details.
                    </p>
                    <button
                      onClick={() => { setShowAdmissionModal(false); setAdmissionSuccess(false); }}
                      className="px-4 py-2 bg-slate-900 hover:bg-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition shadow"
                    >
                      Dismiss View
                    </button>
                  </center>
                ) : (
                  <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Student Name</label>
                        <input
                          type="text"
                          required
                          value={admissionStudentName}
                          onChange={(e) => setAdmissionStudentName(e.target.value)}
                          placeholder="e.g. Robin Harrison"
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Parent/Guardian Name</label>
                        <input
                          type="text"
                          required
                          value={admissionParentName}
                          onChange={(e) => setAdmissionParentName(e.target.value)}
                          placeholder="e.g. Arthur Harrison"
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Parent Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={admissionPhone}
                          onChange={(e) => setAdmissionPhone(e.target.value)}
                          placeholder="e.g. +1 (555) 0199"
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Contact Email Address</label>
                        <input
                          type="email"
                          required
                          value={admissionEmail}
                          onChange={(e) => setAdmissionEmail(e.target.value)}
                          placeholder="e.g. parent@academy.com"
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Student Age (Years)</label>
                        <input
                          type="number"
                          required
                          value={admissionAge}
                          onChange={(e) => setAdmissionAge(e.target.value)}
                          placeholder="e.g. 12"
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Interested Course</label>
                        <select
                          required
                          value={admissionCourse}
                          onChange={(e) => setAdmissionCourse(e.target.value)}
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white h-9.5"
                        >
                          <option value="">Select learning program</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="General Interest">General Curriculum</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Brief Introduction & Message</label>
                      <textarea
                        required
                        rows={3}
                        value={admissionMessage}
                        onChange={(e) => setAdmissionMessage(e.target.value)}
                        placeholder="State any previous skill experience, preferred slot timings, or special requirements..."
                        className="w-full border border-slate-200 p-3 rounded-xl text-xs sm:text-sm bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAdmission}
                      className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 cursor-pointer shadow flex items-center justify-center gap-1.5 transition"
                    >
                      {submittingAdmission ? 'Submitting Inquiry...' : 'Submit Application'}
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 13. FLOATING CONTACT / INQUIRY TICKET FORM MODAL */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-base shadow-inner">
                    T
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-none">Inquiry Ticket</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Communicate direct with {academy.institutionName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowContactModal(false); setInquirySuccess(false); }}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal scroll area */}
              <div className="p-6 overflow-y-auto space-y-4">
                {inquirySuccess ? (
                  <center className="py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center inline-block">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg leading-snug">Inquiry Submitted!</h4>
                    <p className="text-slate-500 text-xs max-w-sm">
                      Your inquiry has been placed inside Flodech Messenger desk. Academy advisors can respond directly without exposing external phone numbers.
                    </p>
                    <button
                      onClick={() => { setShowContactModal(false); setInquirySuccess(false); }}
                      className="px-4 py-2 bg-slate-900 hover:bg-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition shadow"
                    >
                      Dismiss
                    </button>
                  </center>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        placeholder="e.g. Jane Foster"
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={inquiryEmail}
                          onChange={(e) => setInquiryEmail(e.target.value)}
                          placeholder="e.g. visitor@network.com"
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Callback Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          placeholder="e.g. +1 (555) 8303"
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">How can we help you?</label>
                      <textarea
                        required
                        rows={4}
                        value={inquiryMsg}
                        onChange={(e) => setInquiryMsg(e.target.value)}
                        placeholder="State your query, question, slot timings proposal, or specific requirements..."
                        className="w-full border border-slate-200 p-3 rounded-xl text-xs sm:text-sm bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingInquiry}
                      className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-500 cursor-pointer shadow flex items-center justify-center gap-1.5 transition"
                    >
                      {submittingInquiry ? 'Sending Inquiries...' : 'Submit Inquiry'}
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
