import React, { useState } from 'react';
import { 
  Globe, 
  Building2, 
  BookOpen, 
  Users, 
  Calendar, 
  Image as ImageIcon, 
  Heart, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  UserCheck, 
  X, 
  Sparkles, 
  ExternalLink,
  Clipboard,
  Shield,
  FileText,
  Mail,
  UserPlus,
  HelpCircle,
  MessageSquare,
  XCircle
} from 'lucide-react';
import { doc, updateDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Academy, 
  Student, 
  PublicCourse, 
  PublicTeacher, 
  PublicEvent, 
  PublicTestimonial, 
  AdmissionRequest, 
  PublicInquiry,
  GalleryItem
} from '../types';

interface PublicProfileBuilderProps {
  academyId: string;
  academy: Academy;
  students: Student[];
  admissionRequests: AdmissionRequest[];
  inquiries: PublicInquiry[];
  onUpdateAcademy: (updated: Academy) => void;
}

export default function PublicProfileBuilder({
  academyId,
  academy,
  students,
  admissionRequests,
  inquiries,
  onUpdateAcademy
}: PublicProfileBuilderProps) {
  // Navigation internal
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'courses' | 'teachers' | 'gallery' | 'events' | 'testimonials' | 'admissions' | 'inquiries'>('overview');

  // Overview content form states
  const [about, setAbout] = useState(academy.about || '');
  const [mission, setMission] = useState(academy.mission || '');
  const [teachingStyle, setTeachingStyle] = useState(academy.teachingStyle || '');
  const [whyChooseUs, setWhyChooseUs] = useState(academy.whyChooseUs || '');
  const [totalGraduated, setTotalGraduated] = useState(academy.totalGraduatedCount || 140);
  const [eventsConducted, setEventsConducted] = useState(academy.eventsConductedCount || 36);
  const [certificatesIssued, setCertificatesIssued] = useState(academy.certificatesIssuedCount || 250);

  // Settings
  const [showAchievements, setShowAchievements] = useState(academy.publicSettings?.showAchievements !== false);
  const [showTeachers, setShowTeachers] = useState(academy.publicSettings?.showTeachers !== false);
  const [showPortfolios, setShowPortfolios] = useState(academy.publicSettings?.showPortfolios !== false);
  const [showGallery, setShowGallery] = useState(academy.publicSettings?.showGallery !== false);
  const [showEvents, setShowEvents] = useState(academy.publicSettings?.showEvents !== false);
  const [showTestimonials, setShowTestimonials] = useState(academy.publicSettings?.showTestimonials !== false);

  // Courses states
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('3 Months');
  const [newCourseFees, setNewCourseFees] = useState('');

  // Teachers states
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState('Senior Instructor');
  const [newTeacherSpecial, setNewTeacherSpecial] = useState('');
  const [newTeacherExp, setNewTeacherExp] = useState('5+ Years');
  const [newTeacherPhoto, setNewTeacherPhoto] = useState('');
  const teacherPhotoRef = React.useRef<HTMLInputElement>(null);

  // Events states
  const [newEvtTitle, setNewEvtTitle] = useState('');
  const [newEvtDate, setNewEvtDate] = useState('');
  const [newEvtTime, setNewEvtTime] = useState('');
  const [newEvtDesc, setNewEvtDesc] = useState('');

  // Gallery states
  const [newGalTitle, setNewGalTitle] = useState('');
  const [newGalImage, setNewGalImage] = useState('');
  const galImageRef = React.useRef<HTMLInputElement>(null);

  // Testimonials manual review state
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualRole, setManualRole] = useState<'parent' | 'student'>('parent');
  const [manualContent, setManualContent] = useState('');

  const [saving, setSaving] = useState(false);

  // Helper compression for profile photos / gallery uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setter(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  // 1. Save general Overview
  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updates: Partial<Academy> = {
        about: about.trim(),
        mission: mission.trim(),
        teachingStyle: teachingStyle.trim(),
        whyChooseUs: whyChooseUs.trim(),
        totalGraduatedCount: Number(totalGraduated) || 0,
        eventsConductedCount: Number(eventsConducted) || 0,
        certificatesIssuedCount: Number(certificatesIssued) || 0,
        publicSettings: {
          showAchievements,
          showTeachers,
          showPortfolios,
          showGallery,
          showEvents,
          showTestimonials
        }
      };

      await updateDoc(doc(db, 'academies', academyId), updates);
      onUpdateAcademy({ ...academy, ...updates });
      alert('Academy overview and visibility flags updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save overview details.');
    } finally {
      setSaving(false);
    }
  };

  // 2. Courses Action
  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    const newCourse: PublicCourse = {
      id: `crs-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newCourseName.trim(),
      description: newCourseDesc.trim(),
      duration: newCourseDuration.trim(),
      fees: newCourseFees.trim()
    };

    const updatedList = [...(academy.coursesList || []), newCourse];
    await updateDoc(doc(db, 'academies', academyId), { coursesList: updatedList });
    onUpdateAcademy({ ...academy, coursesList: updatedList });

    // Clear inputs
    setNewCourseName('');
    setNewCourseDesc('');
    setNewCourseDuration('3 Months');
    setNewCourseFees('');
    alert('Program added to brochure successfully!');
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!window.confirm('Delete this course brochure card?')) return;
    const updatedList = (academy.coursesList || []).filter(c => c.id !== courseId);
    await updateDoc(doc(db, 'academies', academyId), { coursesList: updatedList });
    onUpdateAcademy({ ...academy, coursesList: updatedList });
  };

  // 3. Teachers Action
  const handleAddTeacher = async () => {
    if (!newTeacherName.trim()) return;
    const newTeacher: PublicTeacher = {
      id: `tch-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newTeacherName.trim(),
      role: newTeacherRole.trim(),
      specialization: newTeacherSpecial.trim() || 'All Levels',
      experience: newTeacherExp.trim() || '5+ Years',
      photo: newTeacherPhoto
    };

    const updatedList = [...(academy.teachersList || []), newTeacher];
    await updateDoc(doc(db, 'academies', academyId), { teachersList: updatedList });
    onUpdateAcademy({ ...academy, teachersList: updatedList });

    setNewTeacherName('');
    setNewTeacherRole('Senior Instructor');
    setNewTeacherSpecial('');
    setNewTeacherExp('5+ Years');
    setNewTeacherPhoto('');
    alert('Instructor details registered!');
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!window.confirm('Remove this teacher profile?')) return;
    const updatedList = (academy.teachersList || []).filter(t => t.id !== teacherId);
    await updateDoc(doc(db, 'academies', academyId), { teachersList: updatedList });
    onUpdateAcademy({ ...academy, teachersList: updatedList });
  };

  // 4. Events Action
  const handleAddEvent = async () => {
    if (!newEvtTitle.trim()) return;
    const newEvent: PublicEvent = {
      id: `evt-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newEvtTitle.trim(),
      date: newEvtDate || 'To be announced',
      time: newEvtTime || 'N/A',
      description: newEvtDesc.trim()
    };

    const updatedList = [...(academy.upcomingEventsList || []), newEvent];
    await updateDoc(doc(db, 'academies', academyId), { upcomingEventsList: updatedList });
    onUpdateAcademy({ ...academy, upcomingEventsList: updatedList });

    setNewEvtTitle('');
    setNewEvtDate('');
    setNewEvtTime('');
    setNewEvtDesc('');
    alert('New upcoming event listed!');
  };

  const handleRemoveEvent = async (eventId: string) => {
    if (!window.confirm('Delete this event listing?')) return;
    const updatedList = (academy.upcomingEventsList || []).filter(e => e.id !== eventId);
    await updateDoc(doc(db, 'academies', academyId), { upcomingEventsList: updatedList });
    onUpdateAcademy({ ...academy, upcomingEventsList: updatedList });
  };

  // 5. Gallery Action
  const handleAddGallery = async () => {
    if (!newGalImage) {
      alert('Attach or upload an image first!');
      return;
    }
    const newItem: GalleryItem = {
      title: newGalTitle.trim() || 'Class Highlight',
      imageUrl: newGalImage
    };

    const updatedList = [...(academy.galleryList || []), newItem];
    await updateDoc(doc(db, 'academies', academyId), { galleryList: updatedList });
    onUpdateAcademy({ ...academy, galleryList: updatedList });

    setNewGalTitle('');
    setNewGalImage('');
    alert('Gallery photograph added successfully!');
  };

  const handleRemoveGallery = async (index: number) => {
    if (!window.confirm('Delete this image from gallery?')) return;
    const updatedList = (academy.galleryList || []).filter((_, idx) => idx !== index);
    await updateDoc(doc(db, 'academies', academyId), { galleryList: updatedList });
    onUpdateAcademy({ ...academy, galleryList: updatedList });
  };

  // 6. Testimonials Actions
  const handleAddManualTestimonial = async () => {
    if (!manualAuthor.trim() || !manualContent.trim()) return;
    const newTest: PublicTestimonial = {
      id: `test-${Math.floor(1000 + Math.random() * 9000)}`,
      authorName: manualAuthor.trim(),
      role: manualRole,
      content: manualContent.trim(),
      status: 'approved',
      createdAt: new Date()
    };

    const updatedList = [...(academy.testimonialsList || []), newTest];
    await updateDoc(doc(db, 'academies', academyId), { testimonialsList: updatedList });
    onUpdateAcademy({ ...academy, testimonialsList: updatedList });

    setManualAuthor('');
    setManualContent('');
    alert('Manual testimonial registered as approved!');
  };

  const handleToggleTestimonial = async (testId: string, currentStatus: 'pending' | 'approved') => {
    const updatedList = (academy.testimonialsList || []).map((t) => {
      if (t.id === testId) {
        return { ...t, status: currentStatus === 'pending' ? 'approved' : 'pending' } as PublicTestimonial;
      }
      return t;
    });

    await updateDoc(doc(db, 'academies', academyId), { testimonialsList: updatedList });
    onUpdateAcademy({ ...academy, testimonialsList: updatedList });
  };

  const handleRemoveTestimonial = async (testId: string) => {
    if (!window.confirm('Are you sure you want to remove this recommendation?')) return;
    const updatedList = (academy.testimonialsList || []).filter(t => t.id !== testId);
    await updateDoc(doc(db, 'academies', academyId), { testimonialsList: updatedList });
    onUpdateAcademy({ ...academy, testimonialsList: updatedList });
  };

  // 7. Admissions Actions (Enroll Applicant directly)
  const handleEnrollAdmissionApplicant = async (request: AdmissionRequest) => {
    const pass = Math.random().toString(36).slice(-8); // Generate temporary portal access password
    const sId = `FLD-STU-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // Create student document
      await setDoc(doc(db, 'students', sId), {
        id: sId,
        academyId: academyId,
        name: request.studentName,
        parentName: request.parentName,
        parentPhone: request.phoneNumber,
        email: request.email.toLowerCase(),
        batch: request.interestedCourse || 'Batch Alpha',
        profilePhoto: '',
        notes: `Auto-enrolled from Public Profile Admission Form. Original applicant message: ${request.message}`,
        password: pass,
        disabled: false,
        createdAt: new Date()
      });

      // Update Admission status to approved
      const q = query(collection(db, 'admissions'), where('id', '==', request.id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, 'admissions', snap.docs[0].id), {
          status: 'approved'
        });
      }

      alert(`Great! ${request.studentName} has been enrolled! \nID: ${sId}\nPassword: ${pass}. Share these portal credentials with parents.`);
    } catch (err) {
      console.error(err);
      alert('Failed to register student record.');
    }
  };

  const handleRejectAdmissionRequest = async (id: string) => {
    if (!window.confirm('Mark this request as Rejected / Archived?')) return;
    try {
      const q = query(collection(db, 'admissions'), where('id', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, 'admissions', snap.docs[0].id), {
          status: 'rejected'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveInquiry = async (id: string) => {
    try {
      const q = query(collection(db, 'inquiries'), where('id', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, 'inquiries', snap.docs[0].id), {
          status: 'resolved'
        });
        alert('Ticket marked as resolved.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyPublicLink = () => {
    const rawUrl = `${window.location.origin}/academy/${academyId}`;
    navigator.clipboard.writeText(rawUrl);
    alert('Public profile link copied! Share it with prospective parents or list it on your social media channels.');
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* PUBLIC SITE LINK BANNER CARD */}
      <div className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-200/50 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-orange-600">
            <Sparkles className="w-5 h-5" />
            <span className="font-extrabold text-xs uppercase tracking-widest font-mono">Public Mini-Website is Live!</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Your Professional Digital Identity</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Any client or parent can inspect courses, explore achievements, and submit admissions inquiries without logging in.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={copyPublicLink}
            className="flex-grow md:flex-grow-0 px-4 py-2.5 bg-white border border-slate-250 text-slate-700 hover:text-slate-950 rounded-xl font-extrabold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Clipboard className="w-3.5 h-3.5" /> Copy Public Link
          </button>
          
          <a
            href={`/academy/${academyId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow md:flex-grow-0 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
          >
            Launch Website <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* HORIZONTAL PAGE DESIGN CONTROLS SHELF */}
      <div className="flex overflow-x-auto border-b border-slate-200 pb-0.5 gap-1.5 scrollbar-none shrink-0 -mx-6 px-6 sm:mx-0 sm:px-0">
        {[
          { id: 'overview', label: 'Basic Info', icon: Building2 },
          { id: 'courses', label: 'Courses offered', icon: BookOpen },
          { id: 'teachers', label: 'Experts Showcase', icon: Users },
          { id: 'gallery', label: 'Photo Album', icon: ImageIcon },
          { id: 'events', label: 'Upcoming Programs', icon: Calendar },
          { id: 'testimonials', label: 'Testimonials', icon: Heart },
          { id: 'admissions', label: `Admission Pipeline (${admissionRequests.filter(r=>r.status==='pending').length})`, icon: UserPlus },
          { id: 'inquiries', label: `Inquiries tickets (${inquiries.filter(i=>i.status==='open').length})`, icon: MessageSquare }
        ].map((sub) => {
          const Icon = sub.icon;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`px-4 py-3 shrink-0 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeSubTab === sub.id 
                  ? 'border-orange-500 text-orange-600 bg-orange-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SPACES */}
      
      {/* 1. OVERVIEW & STATS FORM */}
      {activeSubTab === 'overview' && (
        <form onSubmit={handleSaveOverview} className="bg-white border border-slate-200/60 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <h3 className="font-black text-slate-950 text-base border-b border-slate-100 pb-2.5">Edit Institutional Info</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 mb-1.5">Academy bio / Intro statement</label>
                <textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Explain what makes your academy special, when it was established, and the types of students list you cater to..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 mb-1.5">Mission & Goals</label>
                <textarea
                  rows={2}
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="Define the primary pedagogical mission or core objective of your instructors..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 mb-1.5">Teaching style details</label>
                <textarea
                  rows={3}
                  value={teachingStyle}
                  onChange={(e) => setTeachingStyle(e.target.value)}
                  placeholder="Incorporate details about batch ratios (e.g., 1-on-1 focus), certification tracks, practical performance routines..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-extrabold text-slate-400 mb-1.5 font-sans">Why students / parents choose us</label>
                <textarea
                  rows={2}
                  value={whyChooseUs}
                  onChange={(e) => setWhyChooseUs(e.target.value)}
                  placeholder="List bulleted bulletpoints or descriptive text showing infrastructure highlights, expert credentials, convenient slot booking..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <h3 className="font-black text-slate-950 text-base border-b border-slate-100 pt-4 pb-2.5">Website Sections Visibility Controls</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { id: 'achieve', flag: showAchievements, set: setShowAchievements, name: 'Wins & Achievements' },
              { id: 'teach', flag: showTeachers, set: setShowTeachers, name: 'Faculty Members Showcase' },
              { id: 'ports', flag: showPortfolios, set: setShowPortfolios, name: 'Student Digital Portfolios' },
              { id: 'gals', flag: showGallery, set: setShowGallery, name: 'Photo Highlights Album' },
              { id: 'evts', flag: showEvents, set: setShowEvents, name: 'Timetabled News & Events' },
              { id: 'tests', flag: showTestimonials, set: setShowTestimonials, name: 'Approved Testimonials' }
            ].map((cnt) => (
              <label key={cnt.id} className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-150 rounded-2xl cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={cnt.flag}
                  onChange={(e) => cnt.set(e.target.checked)}
                  className="w-4.5 h-4.5 accent-orange-500 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] sm:text-xs font-bold text-slate-700">{cnt.name}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-3 bg-slate-50 border-t border-slate-100 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition duration-150 cursor-pointer shadow"
            >
              {saving ? 'Saving changes...' : 'Save Website Config'}
            </button>
          </div>
        </form>
      )}

      {/* 2. COURSES OFFERED BUILDING */}
      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Add Program brochure card</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Course Title *</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Classical Guitar Mastery"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Duration *</label>
                  <input
                    type="text"
                    value={newCourseDuration}
                    onChange={(e) => setNewCourseDuration(e.target.value)}
                    placeholder="e.g. 6 Months"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Fees Details</label>
                  <input
                    type="text"
                    value={newCourseFees}
                    onChange={(e) => setNewCourseFees(e.target.value)}
                    placeholder="e.g. $150 / mo"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Syllabus / Short description</label>
              <textarea
                rows={2}
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                placeholder="State learning outcomes, batch times, key skills developed, and certification milestones..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleAddCourse}
                disabled={!newCourseName.trim()}
                className="px-4.5 py-2 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-orange-500 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Add Program
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest font-mono">Current Course Brochure</h4>
            {(!academy.coursesList || academy.coursesList.length === 0) ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 text-xs sm:text-sm">
                No courses added yet. Populate items above so guests can view what programs you offer.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {academy.coursesList.map((crs) => (
                  <div key={crs.id} className="bg-white border border-slate-200/60 p-5 rounded-2xl flex justify-between gap-4 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-slate-900 text-sm">{crs.name}</span>
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full">{crs.duration}</span>
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-2 max-w-sm mb-2">{crs.description}</p>
                      {crs.fees && <span className="text-orange-500 text-xs font-black font-mono">Cost: {crs.fees}</span>}
                    </div>

                    <button
                      onClick={() => handleRemoveCourse(crs.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition shrink-0 self-start cursor-pointer border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. EXPERTS SHOWCASE */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Add faculty member to public showcase</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="e.g. Prof. David Miller"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Role / Designations *</label>
                <input
                  type="text"
                  value={newTeacherRole}
                  onChange={(e) => setNewTeacherRole(e.target.value)}
                  placeholder="e.g. Lead Piano Mentor"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Experience</label>
                  <input
                    type="text"
                    value={newTeacherExp}
                    onChange={(e) => setNewTeacherExp(e.target.value)}
                    placeholder="e.g. 10+ Years"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={newTeacherSpecial}
                    onChange={(e) => setNewTeacherSpecial(e.target.value)}
                    placeholder="e.g. Jazz / Blues"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Faculty Portrait Photograph</label>
              <div 
                onClick={() => teacherPhotoRef.current?.click()}
                className="border border-dashed border-slate-250 hover:border-orange-500 p-6 text-center rounded-2xl bg-slate-50 cursor-pointer flex flex-col items-center gap-1.5"
              >
                {newTeacherPhoto ? (
                  <img src={newTeacherPhoto} alt="Snapshot preview" className="w-16 h-16 rounded-full object-cover border border-slate-250 p-0.5" />
                ) : (
                  <>
                    <Users className="w-5 h-5 text-slate-450" />
                    <span className="text-xs text-slate-600 font-bold uppercase tracking-wide">Change photo profile</span>
                  </>
                )}
                <input 
                  type="file"
                  ref={teacherPhotoRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, setNewTeacherPhoto)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleAddTeacher}
                disabled={!newTeacherName.trim()}
                className="px-4.5 py-2 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-orange-500 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Map Instructor
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest font-mono">Faculty Roster</h4>
            {(!academy.teachersList || academy.teachersList.filter(t=>t.name).length === 0) ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 text-xs sm:text-sm">
                No teacher profiles added. Add instructors to showcase your academy's professional roster details.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {academy.teachersList.filter(t => t.name).map((tch) => (
                  <div key={tch.id} className="bg-white border border-slate-205 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
                    <img 
                      src={tch.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${tch.name}`} 
                      alt="" 
                      className="w-11 h-11 rounded-xl object-contain border border-slate-100 bg-slate-50 shrink-0"
                    />
                    
                    <div className="flex-grow truncate">
                      <h5 className="font-extrabold text-slate-900 text-sm leading-none mb-0.5 truncate">{tch.name}</h5>
                      <span className="text-orange-500 text-[10px] font-bold block leading-none mb-2">{tch.role}</span>
                      
                      <div className="text-[10px] text-slate-500 leading-tight space-y-0.5">
                        <p><strong>Years:</strong> {tch.experience}</p>
                        <p><strong>Focus:</strong> {tch.specialization}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveTeacher(tch.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition shrink-0 cursor-pointer border border-red-100"
                    >
                      <Trash2 className="w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CLASS ALBUM / GALLERY */}
      {activeSubTab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base font-sans">Upload photographs to live gallery</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Image caption / Title</label>
                <input
                  type="text"
                  value={newGalTitle}
                  onChange={(e) => setNewGalTitle(e.target.value)}
                  placeholder="e.g. Guitar annual function workshop"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Attach photograph</label>
                <div 
                  onClick={() => galImageRef.current?.click()}
                  className="border border-dashed border-slate-250 py-2.5 px-4 text-center cursor-pointer rounded-xl bg-slate-50 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-bold hover:border-orange-500"
                >
                  <ImageIcon className="w-4 h-4 text-slate-450" />
                  <span>{newGalImage ? 'Image Loaded ✔' : 'Select Photo file'}</span>
                  <input
                    type="file"
                    ref={galImageRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setNewGalImage)}
                  />
                </div>
              </div>
            </div>

            {newGalImage && (
              <center className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50">
                <img src={newGalImage} alt="Loaded preview" className="max-h-36 rounded-lg object-cover" />
              </center>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={handleAddGallery}
                disabled={!newGalImage}
                className="px-4.5 py-2 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-orange-500 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Save Photo
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest font-mono">Gallery Album grid</h4>
            {(!academy.galleryList || academy.galleryList.length === 0) ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 text-xs sm:text-sm">
                No gallery files attached. Upload beautiful moments from your workspace to highlight facility spaces.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {academy.galleryList.map((gal, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-sm bg-white">
                    <img src={gal.imageUrl} alt={gal.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 flex items-center justify-between text-white text-[10px] font-bold">
                      <span className="truncate max-w-28 leading-none block">{gal.title}</span>
                      <button
                        onClick={() => handleRemoveGallery(idx)}
                        className="text-red-400 hover:text-white transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. NEWS & TIMETABLE EVENTS */}
      {activeSubTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Schedule upcoming workshop / announcement</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvtTitle}
                  onChange={(e) => setNewEvtTitle(e.target.value)}
                  placeholder="e.g. Annual Instrumental Concert"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Date details *</label>
                <input
                  type="text"
                  value={newEvtDate}
                  onChange={(e) => setNewEvtDate(e.target.value)}
                  placeholder="e.g. Sunday, Oct 12"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Timings *</label>
                <input
                  type="text"
                  value={newEvtTime}
                  onChange={(e) => setNewEvtTime(e.target.value)}
                  placeholder="e.g. 5:00 PM - 8:00 PM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Brief descriptions / highlights</label>
              <textarea
                rows={2}
                value={newEvtDesc}
                onChange={(e) => setNewEvtDesc(e.target.value)}
                placeholder="Mention entrance ticket guidelines, student practice requirements, or special masterclass modules..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleAddEvent}
                disabled={!newEvtTitle.trim()}
                className="px-4.5 py-2 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-orange-500 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Publish Event
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest font-mono">Active Event Schedules</h4>
            {(!academy.upcomingEventsList || academy.upcomingEventsList.length === 0) ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 text-xs sm:text-sm">
                No upcoming events listed. Add concert slots, practice parent seminars, or holiday schedules.
              </div>
            ) : (
              <div className="space-y-3">
                {academy.upcomingEventsList.map((evt) => (
                  <div key={evt.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-50 text-orange-500 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-orange-100 text-xs font-bold uppercase">
                        Evt
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-none mb-1">{evt.title}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed font-sans">{evt.description}</p>
                        <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-1 block">Time: {evt.date} @ {evt.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveEvent(evt.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition shrink-0 cursor-pointer border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TESTIMONIALS & USER REVIEWS BOARD */}
      {activeSubTab === 'testimonials' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">Write manual recommendation review</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Author Name *</label>
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  placeholder="e.g. Mrs. Angela Watson"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">User Affiliations *</label>
                <select
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as any)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm bg-white h-9.5"
                >
                  <option value="parent">Parent/Guardian</option>
                  <option value="student">Alumni Student</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 font-sans">Review content *</label>
              <textarea
                rows={3}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Write specific outcomes of learning (e.g., 'Flodech transformed my son's focus...')"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-650"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleAddManualTestimonial}
                disabled={!manualAuthor.trim() || !manualContent.trim()}
                className="px-4.5 py-2 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-orange-500 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Save Review
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest font-mono">Approved client reviews</h4>
            {(!academy.testimonialsList || academy.testimonialsList.length === 0) ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 text-xs sm:text-sm">
                No reviews recorded. Add testimonials or approve visitor submissions to build trust and authority.
              </div>
            ) : (
              <div className="space-y-3">
                {academy.testimonialsList.map((test) => (
                  <div key={test.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex-grow max-w-xl">
                      <p className="text-slate-600 text-xs italic sm:text-sm leading-relaxed mb-2 font-serif">"{test.content}"</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase font-mono">
                        <span className="text-slate-800">{test.authorName}</span>
                        <span>•</span>
                        <span>{test.role}</span>
                        <span>•</span>
                        <span className={`px-2.5 py-0.5 rounded-full ${test.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-amber-50 text-amber-600 border border-amber-150'}`}>
                          {test.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleTestimonial(test.id, test.status)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer text-xs uppercase font-extrabold tracking-wider px-3 py-1.5 ${
                          test.status === 'approved' ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {test.status === 'approved' ? 'Unapprove' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRemoveTestimonial(test.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition cursor-pointer border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. ADMISSIONS PIPELINE GRID */}
      {activeSubTab === 'admissions' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest font-mono">Prospective Student Admissions pipelines</h3>
          
          {admissionRequests.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 text-xs sm:text-sm">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Your inward admission pipeline is clean. Once prospective students fill the public form, their requests land here in real time!
            </div>
          ) : (
            <div className="space-y-4">
              {admissionRequests.map((req) => (
                <div key={req.id} className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 font-extrabold text-sm flex items-center justify-center font-mono shrink-0">
                        {req.studentName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-950 text-base leading-none mb-1">{req.studentName}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block">Age: {req.age} Years • Course interest: <span className="text-orange-500 font-extrabold">{req.interestedCourse}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase text-center font-mono px-3 py-1 rounded-full border ${
                        req.status === 'approved' 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-600' 
                          : req.status === 'rejected' 
                          ? 'bg-red-50 border-red-250 text-red-500' 
                          : 'bg-amber-50 border-amber-250 text-amber-500 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-150/60">
                    <div>
                      <p className="mb-1"><strong className="text-slate-800">Parent/Guardian Name:</strong> {req.parentName}</p>
                      <p className="mb-1"><strong className="text-slate-800">Contact Number:</strong> {req.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="mb-1"><strong className="text-slate-800">Email Address:</strong> {req.email}</p>
                    </div>
                  </div>

                  {req.message && (
                    <div className="text-xs text-slate-500 bg-amber-50/30 border border-amber-100 rounded-xl p-3 leading-relaxed">
                      💡 <strong>Applicant Message:</strong> "{req.message}"
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex justify-end gap-3.5 pt-1">
                      <button
                        onClick={() => handleRejectAdmissionRequest(req.id)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-red-500 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-50 active:scale-95 transition cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleEnrollAdmissionApplicant(req)}
                        className="px-4.5 py-2 bg-slate-900 border border-slate-950 text-white hover:text-white hover:bg-orange-500 font-black text-xs uppercase tracking-wider rounded-xl active:scale-95 transition shadow cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve & Enroll as Active
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. INQUIRIES DESK */}
      {activeSubTab === 'inquiries' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest font-mono">Visitor inquiry tickets</h3>
          
          {inquiries.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-150/80 text-center text-slate-400 text-xs sm:text-sm">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No inquiry tickets filed. General communications submitted by website guests appear here!
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="bg-white border border-slate-205 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-slate-900 text-sm">{inq.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">☎ {inq.phoneNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">✉ {inq.email}</span>
                    </div>
                    
                    <p className="text-slate-600 text-xs leading-normal font-sans italic my-1.5">"{inq.message}"</p>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Ticket Code: {inq.id}</span>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                      inq.status === 'resolved' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-orange-50 border-orange-200 text-orange-500 animate-pulse'
                    }`}>
                      {inq.status}
                    </span>
                    
                    {inq.status === 'open' && (
                      <button
                        onClick={() => handleResolveInquiry(inq.id)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
