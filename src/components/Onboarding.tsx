/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Building, 
  UserSquare2, 
  MapPin, 
  Phone, 
  Mail, 
  QrCode, 
  CreditCard, 
  Upload, 
  ArrowRight, 
  Lock, 
  School,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Academy, AcademyType, compressImage } from '../types';

interface OnboardingProps {
  currentUser: { uid: string; email: string; displayName?: string | null };
  onCompleteTeacher: (academy: Academy) => void;
  onCompleteStudent: (studentId: string, email: string) => void;
}

export default function Onboarding({ currentUser, onCompleteTeacher, onCompleteStudent }: OnboardingProps) {
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Teacher Creation Forms
  const [institutionName, setInstitutionName] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [academyEmail, setAcademyEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [academyType, setAcademyType] = useState<AcademyType>('Coaching Institute');

  // Teacher Payment Forms
  const [upiId, setUpiId] = useState('');
  const [qrBase64, setQrBase64] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('Please scan the QR code above or pay directly to the UPI ID provided.');

  // Student Validation Forms
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Generate Globally Unique FAID
  const generateFAID = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'FLD-ACA-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Base64 helper with canvas compression to stay under Firestore document size limits
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, 400, 0.7)
        .then((compressedBase64) => {
          setter(compressedBase64);
        })
        .catch((err) => {
          console.error("Compression failed, using direct base64 fallback:", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            setter(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
    }
  };

  // Submit student credential link
  const handleStudentUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim() || !studentPassword.trim()) {
      setErrorMsg('Please enter both your Student ID and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const formattedId = studentIdInput.toUpperCase().trim();
      const studentDocRef = doc(db, 'students', formattedId);
      const studentSnap = await getDoc(studentDocRef);

      if (!studentSnap.exists()) {
        setErrorMsg('Invalid Student ID. Please query your academy teacher to check your ID.');
        setLoading(false);
        return;
      }

      const studentData = studentSnap.data();
      if (studentData.password !== studentPassword) {
        setErrorMsg('Incorrect Password. Please check with your teacher if you forgot your credentials.');
        setLoading(false);
        return;
      }

      if (studentData.disabled) {
        setErrorMsg('This Student Dashboard login has been disabled by your academy teacher.');
        setLoading(false);
        return;
      }

      // Success! Link this user's Google login to the student profile
      // 1. Write the Student record email sync if needed (or simply update student row with logged email)
      await setDoc(studentDocRef, { ...studentData, email: currentUser.email }, { merge: true });

      // 2. Write the user profile record
      const userProfileRef = doc(db, 'users', currentUser.uid);
      const profile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || studentData.name,
        role: 'student',
        academyId: studentData.academyId,
        createdAt: new Date()
      };
      await setDoc(userProfileRef, profile);

      // Create standard portfolio if missing
      const portfolioRef = doc(db, 'portfolios', formattedId);
      const portfolioSnap = await getDoc(portfolioRef);
      if (!portfolioSnap.exists()) {
        await setDoc(portfolioRef, {
          id: formattedId,
          academyId: studentData.academyId,
          isVisible: true,
          achievements: [],
          certificates: [],
          gallery: [],
          progressReports: [],
          teacherFeedback: 'Welcome to your portfolio portal! Start adding achievements with your teacher.',
          updatedAt: new Date()
        });
      }

      onCompleteStudent(formattedId, currentUser.email);
    } catch (err) {
      setErrorMsg('An error occurred. Check internet connection and verify credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit academy creator
  const handleTeacherSubmit = async () => {
    if (!institutionName.trim() || !phone.trim() || !address.trim() || !academyEmail.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let uniqueFaid = '';
      let isUnique = false;
      let attempts = 0;

      // Duplicate Check Loop
      while (!isUnique && attempts < 5) {
        uniqueFaid = generateFAID();
        const checkRef = doc(db, 'academies', uniqueFaid);
        const checkSnap = await getDoc(checkRef);
        if (!checkSnap.exists()) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate a unique Academy ID, please try again.');
      }

      const freshAcademy: Academy = {
        id: uniqueFaid,
        ownerId: currentUser.uid,
        institutionName: institutionName.trim(),
        logoUrl: logoBase64 || 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f97316"/><text x="50" y="55" font-family="sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">A</text></svg>',
        academyEmail: academyEmail.trim(),
        phone: phone.trim(),
        address: address.trim(),
        academyType,
        upiId: upiId.trim(),
        upiQrCode: qrBase64 || 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230f172a"/><text x="50" y="55" font-family="sans-serif" font-size="12" fill="white" text-anchor="middle">QR Pending</text></svg>',
        paymentInstructions: paymentInstructions.trim(),
        theme: 'orange',
        createdAt: new Date()
      };

      // 1. Create Academy Doc
      await setDoc(doc(db, 'academies', uniqueFaid), freshAcademy);

      // 2. Create User Profile Doc
      const freshProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || 'Academy Director',
        role: 'teacher',
        academyId: uniqueFaid,
        createdAt: new Date()
      };
      await setDoc(doc(db, 'users', currentUser.uid), freshProfile);

      onCompleteTeacher(freshAcademy);
    } catch (err) {
      setErrorMsg('Failed to deploy academy document registry. Please check credentials or firewall settings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8 selection:bg-orange-500 selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#f97316_0.1px,transparent_0.1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        <center>
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-white text-2xl shadow-md mb-4 animate-bounce">
            F
          </div>
        </center>
        <h2 className="text-center text-3xl font-extrabold text-slate-950 font-sans tracking-tight">
          Welcome to Flodech
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w">
          "Manage your academy in one place."
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-8 border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-100 relative">
          
          {/* Main Error indicator */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-sm text-red-600">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Core selection panel */}
          {role === null && (
            <div className="flex flex-col gap-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Select user type</h3>
                <p className="text-sm text-slate-500">Are you a teacher or a student?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Teacher option */}
                <button
                  id="select-teacher-btn"
                  onClick={() => setRole('teacher')}
                  className="p-6 border border-slate-200 hover:border-orange-500 hover:shadow-lg rounded-2xl text-left bg-white transition-all duration-200 group flex flex-col justify-between h-48 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-200">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 text-base flex items-center gap-1.5">
                      Teacher <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-slate-500 text-xs mt-1">Create your academy, set timetables, mark attendance, and manage fees.</p>
                  </div>
                </button>

                {/* Student option */}
                <button
                  id="select-student-btn"
                  onClick={() => setRole('student')}
                  className="p-6 border border-slate-200 hover:border-slate-800 hover:shadow-lg rounded-2xl text-left bg-white transition-all duration-200 group flex flex-col justify-between h-48 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform duration-200">
                    <UserSquare2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 text-base flex items-center gap-1.5">
                      Student <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-slate-500 text-xs mt-1">Check timetables, pay fees, see announcements, and build your portfolio.</p>
                  </div>
                </button>
              </div>

              <div className="h-px bg-slate-100 my-4" />
              <p className="text-center text-xs text-slate-400">
                Logged in as: <span className="font-mono text-slate-500">{currentUser.email}</span>
              </p>
            </div>
          )}

          {/* Student Login Flow */}
          {role === 'student' && (
            <form onSubmit={handleStudentUnlock} className="flex flex-col gap-6">
              <div className="text-center">
                <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 uppercase tracking-widest font-sans inline-block mb-3">Student Portal</span>
                <h3 className="text-2xl font-bold text-slate-950">Log in as student</h3>
                <p className="text-slate-500 text-xs mt-1">Enter your Student ID and Password given by your teacher.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Student ID</label>
                  <div className="relative">
                    <UserSquare2 className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
                    <input
                      id="student-id-input"
                      type="text"
                      placeholder="e.g. FLD-STU-X8P4K"
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white font-mono text-sm tracking-wide"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Student Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
                    <input
                      id="student-password-input"
                      type="password"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="w-1/3 py-3 border.border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors rounded-xl"
                >
                  Back
                </button>
                <button
                  id="student-login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 bg-slate-950 font-bold text-white hover:bg-orange-500 transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In & Link Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Teacher Onboarding Flow */}
          {role === 'teacher' && (
            <div className="flex flex-col gap-6">
              {/* Stepper progress */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 1 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>1</span>
                  <span className="text-xs font-semibold text-slate-900">Academy Details</span>
                </div>
                <div className="h-px bg-slate-200 flex-grow mx-4" />
                <div className="flex items-center gap-1">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 2 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
                  <span className="text-xs font-semibold text-slate-600">UPI Setup</span>
                </div>
              </div>

              {/* STEP 1: Academy Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <span className="px-2.5 py-1 bg-orange-50 rounded-full text-xs font-semibold text-orange-600 uppercase tracking-widest font-sans inline-block mb-3">Step 1</span>
                    <h3 className="text-xl font-bold text-slate-950">Create your academy</h3>
                    <p className="text-slate-500 text-xs">Enter your academy name, email, and contact info.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Academy Name *</label>
                    <input
                      id="onboarding-inst-name"
                      type="text"
                      placeholder="e.g. Royal Academy of Dance"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white font-sans text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Academy Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input
                          id="onboarding-inst-email"
                          type="email"
                          value={academyEmail}
                          onChange={(e) => setAcademyEmail(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white font-sans text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Academy Type *</label>
                      <select
                        id="onboarding-inst-type"
                        value={academyType}
                        onChange={(e) => setAcademyType(e.target.value as AcademyType)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white font-sans text-sm"
                      >
                        <option value="Coaching Institute">Coaching Institute</option>
                        <option value="Tuition Center">Tuition Center</option>
                        <option value="Music Academy">Music Academy</option>
                        <option value="Dance Academy">Dance Academy</option>
                        <option value="Training Center">Training Center</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input
                          id="onboarding-inst-phone"
                          type="tel"
                          placeholder="e.g. +1 123 456 7890"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white font-sans text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Academy Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                        <input
                          id="onboarding-inst-address"
                          type="text"
                          placeholder="e.g. Suite 302, Broadway Building"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white font-sans text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Academy Logo</label>
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="border border-dashed border-slate-300 hover:border-orange-500 py-6 text-center cursor-pointer rounded-2xl bg-slate-50 flex flex-col items-center gap-1.5 transition-colors"
                    >
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Preview Logo" className="w-16 h-16 object-contain rounded-lg border border-slate-200" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-xs text-slate-600 font-medium">Click to upload logo</span>
                          <span className="text-[10px] text-slate-400">Supported formats: JPG, PNG, WEBP</span>
                        </>
                      )}
                      <input 
                        ref={logoInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, setLogoBase64)}
                        className="hidden" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setRole(null)}
                      className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!institutionName.trim() || !phone.trim() || !address.trim() || !academyEmail.trim()) {
                          setErrorMsg('Please fill in all required fields.');
                          return;
                        }
                        setErrorMsg(null);
                        setStep(2);
                      }}
                      className="w-2/3 py-2.5 bg-slate-950 hover:bg-orange-500 font-semibold text-white transition-colors rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Payment Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <span className="px-2.5 py-1 bg-orange-50 rounded-full text-xs font-semibold text-orange-600 uppercase tracking-widest font-sans inline-block mb-3">Step 2</span>
                    <h3 className="text-xl font-bold text-slate-950">Payment Setup</h3>
                    <p className="text-slate-500 text-xs">Add your UPI details so students can scan and pay fees instantly.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Your UPI ID (required to accept payments)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                      <input
                        id="onboarding-upi-id"
                        type="text"
                        placeholder="e.g. info@upi, paytm@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white font-sans text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Custom Payment Instructions</label>
                    <textarea
                      id="onboarding-upi-instruct"
                      placeholder="Enter billing instructions, due schedule, or policy messages..."
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white font-sans text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Upload UPI QR Code</label>
                    <div 
                      onClick={() => qrInputRef.current?.click()}
                      className="border border-dashed border-slate-300 hover:border-orange-500 py-6 text-center cursor-pointer rounded-2xl bg-slate-50 flex flex-col items-center gap-1.5 transition-colors"
                    >
                      {qrBase64 ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={qrBase64} alt="Preview QR" className="w-28 h-28 object-contain rounded-lg border border-slate-200 p-1 bg-white" />
                          <span className="text-[10px] text-orange-500 font-semibold uppercase">QR Code Linked Successfully</span>
                        </div>
                      ) : (
                        <>
                          <QrCode className="w-6 h-6 text-slate-400" />
                          <span className="text-xs text-slate-600 font-medium">Click to upload QR code</span>
                          <span className="text-[10px] text-slate-400">Supported formats: JPG, PNG, WEBP</span>
                        </>
                      )}
                      <input 
                        ref={qrInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, setQrBase64)}
                        className="hidden" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      id="onboarding-complete-btn"
                      type="button"
                      disabled={loading}
                      onClick={handleTeacherSubmit}
                      className="w-2/3 py-2.5 bg-slate-950 font-bold text-white hover:bg-orange-500 transition-colors rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create My Academy <Sparkles className="w-4 h-4 text-orange-400" /></>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
