/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Student, Academy } from './types';
import logoImg from './assets/images/logotech_icon_1780152227001.png';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import PublicPortfolio from './components/PublicPortfolio';
import PublicAcademyProfile from './components/PublicAcademyProfile';
import { 
  Building2, 
  GraduationCap, 
  ShieldAlert, 
  Mail, 
  Lock, 
  Loader2, 
  User, 
  ArrowRight,
  BookOpen,
  Info
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication overlays controls
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'teacher' | 'student'>('teacher');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Router matching
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    // Monitor path swaps
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    async function initSession() {
      setLoading(true);
      // Check if a local Student session is active
      const savedStudId = localStorage.getItem('student_session_id');
      if (savedStudId) {
        try {
          const sRef = doc(db, 'students', savedStudId);
          const sSnap = await getDoc(sRef);
          if (sSnap.exists()) {
            const sData = sSnap.data();
            setCurrentUser({
              uid: sData.id,
              email: sData.email,
              displayName: sData.name
            });
            setStudentId(sData.id);
            setUserProfile({
              uid: sData.id,
              email: sData.email,
              name: sData.name,
              role: 'student',
              academyId: sData.academyId,
              createdAt: new Date()
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error loading persisted student:', e);
        }
      }

      // If no student session, check Firebase Auth state
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setLoading(true);
        if (user) {
          setCurrentUser(user);
          try {
            const uRef = doc(db, 'users', user.uid);
            const uSnap = await getDoc(uRef);
            
            if (uSnap.exists()) {
              const profile = uSnap.data() as UserProfile;
              setUserProfile(profile);

              if (profile.role === 'student') {
                const studentsRef = collection(db, 'students');
                const q = query(studentsRef, where('email', '==', user.email));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                  setStudentId(querySnap.docs[0].id);
                }
              }
            } else {
              setUserProfile(null);
            }
          } catch (e) {
            console.error('Error fetching user profile record:', e);
          }
        } else {
          // Double-check student id in localStorage before clearing
          const activeId = localStorage.getItem('student_session_id');
          if (!activeId) {
            setCurrentUser(null);
            setUserProfile(null);
            setStudentId(null);
          }
        }
        setLoading(false);
      });
    }

    initSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('student_session_id');
      await signOut(auth);
      setUserProfile(null);
      setStudentId(null);
      setCurrentUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please fill in credentials and password details.');
      return;
    }

    const enteredVal = emailInput.trim();
    const enteredPass = passwordInput.trim();

    // 1. If LOGIN as student portal: Use Custom Firestore check directly (NO EMAIL AUTH NEEDED)
    if (authRole === 'student' && authMode === 'login') {
      try {
        setLoading(true);
        const idToTry = enteredVal.toUpperCase();
        const docRef = doc(db, 'students', idToTry);
        const docSnap = await getDoc(docRef);
        
        let foundStudent: any = null;
        if (docSnap.exists()) {
          foundStudent = docSnap.data();
        } else {
          // Try email address lookup
          const studentsRef = collection(db, 'students');
          const q = query(studentsRef, where('email', '==', enteredVal.toLowerCase()));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            foundStudent = querySnap.docs[0].data();
          }
        }

        if (!foundStudent) {
          setAuthError('Student record or credentials not found. Check your assigned Student ID or Email.');
          setLoading(false);
          return;
        }

        if (foundStudent.disabled) {
          setAuthError('Your student account is currently deactivated. Contact your instructor.');
          setLoading(false);
          return;
        }

        if (foundStudent.password !== enteredPass) {
          setAuthError('Incorrect student credentials password. Please verify and try again.');
          setLoading(false);
          return;
        }

        // Successfully authenticated student session! Save to LocalStorage
        localStorage.setItem('student_session_id', foundStudent.id);
        
        setCurrentUser({
          uid: foundStudent.id,
          email: foundStudent.email,
          displayName: foundStudent.name
        });
        setStudentId(foundStudent.id);
        setUserProfile({
          uid: foundStudent.id,
          email: foundStudent.email,
          name: foundStudent.name,
          role: 'student',
          academyId: foundStudent.academyId,
          createdAt: new Date()
        });

        setShowAuthModal(false);
        setEmailInput('');
        setPasswordInput('');
        setLoading(false);
        return;
      } catch (err: any) {
        console.error("Student custom login error:", err);
        setAuthError(err.message || 'Verifying student database credentials failed.');
        setLoading(false);
        return;
      }
    }

    // 2. Instructor login / signup: Use standard secure Firebase Auth
    try {
      if (authMode === 'login') {
        const credentials = await signInWithEmailAndPassword(auth, enteredVal, enteredPass);
        
        const uRef = doc(db, 'users', credentials.user.uid);
        const uSnap = await getDoc(uRef);
        
        if (uSnap.exists()) {
          const profile = uSnap.data() as UserProfile;
          setUserProfile(profile);

          if (profile.role === 'student') {
            const studentsRef = collection(db, 'students');
            const q = query(studentsRef, where('email', '==', enteredVal.toLowerCase()));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              setStudentId(querySnap.docs[0].id);
            }
          }
        }
        setShowAuthModal(false);
      } else {
        // Teacher Register
        if (authRole === 'student') {
          setAuthError('Students cannot sign up directly. Ask your instructor to assign your Student ID first.');
          return;
        }

        await createUserWithEmailAndPassword(auth, enteredVal, enteredPass);
        setShowAuthModal(false);
      }

      setEmailInput('');
      setPasswordInput('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid credentials or account mismatch.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password credentials access is currently not activated on this Firebase project. Real-time direct Google Sign-In is fully enabled, or you can activate "Email/Password" under Authentication inside the Firebase Console.');
      } else {
        setAuthError(err.message || 'Verification failed. Try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const credentials = await signInWithPopup(auth, provider);
      
      const uRef = doc(db, 'users', credentials.user.uid);
      const uSnap = await getDoc(uRef);
      
      if (uSnap.exists()) {
        const profile = uSnap.data() as UserProfile;
        setUserProfile(profile);

        if (profile.role === 'student') {
          const studentsRef = collection(db, 'students');
          const q = query(studentsRef, where('email', '==', credentials.user.email?.toLowerCase()));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            setStudentId(querySnap.docs[0].id);
          }
        }
      }
      setShowAuthModal(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In access is currently not activated on this Firebase project. You can activate it under Build > Authentication > Sign-in method inside the Firebase Console.');
      } else {
        setAuthError(err.message || 'Google sign-in failed. Try again.');
      }
    }
  };

  // Check Academy Routing matches `/academy/:id`
  const academyMatch = currentPath.match(/^\/academy\/([^/]+)/);
  if (academyMatch) {
    const aId = academyMatch[1];
    return (
      <PublicAcademyProfile 
        academyId={aId} 
        onBackToPortal={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }} 
      />
    );
  }

  // Check Portfolio Routing matches `/portfolio/:id`
  const portfolioMatch = currentPath.match(/^\/portfolio\/([^/]+)/);
  if (portfolioMatch) {
    const pId = portfolioMatch[1];
    return (
      <PublicPortfolio 
        studentId={pId} 
        onBackToPortal={currentUser ? () => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        } : undefined} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Initializing authenticated services...</p>
      </div>
    );
  }

  // User is logged in
  if (currentUser) {
    // Role profile loaded
    if (userProfile) {
      if (userProfile.role === 'teacher') {
        return (
          <TeacherDashboard 
            academyId={userProfile.academyId || ''} 
            onLogout={handleLogout} 
          />
        );
      } else if (userProfile.role === 'student' && studentId) {
        return (
          <StudentDashboard 
            studentId={studentId} 
            studentEmail={currentUser.email || ''} 
            onLogout={handleLogout} 
          />
        );
      }
    }

    // Role profile missing: Redirect to secure Onboarding!
    return (
      <Onboarding 
        currentUser={{
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName
        }}
        onCompleteTeacher={(academy) => {
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            name: currentUser.displayName || 'Academy Instructor',
            role: 'teacher',
            academyId: academy.id,
            createdAt: new Date()
          });
        }}
        onCompleteStudent={(sId, email) => {
          setStudentId(sId);
          setUserProfile({
            uid: currentUser.uid,
            email: email,
            name: 'Academy Student',
            role: 'student',
            academyId: '',
            createdAt: new Date()
          });
        }}
      />
    );
  }

  // Not logged in: Show landing page with modal registration trigger
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="Flodech Logo"
              className="w-8 h-8 rounded-lg object-cover bg-orange-500 shrink-0 select-none shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className="text-slate-900 font-extrabold text-lg tracking-tight">Flodech</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
            <a href="#benefits" className="hover:text-orange-500 transition-colors">Benefits</a>
            <a href="#faq" className="hover:text-orange-500 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              id="header-login-btn"
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="px-4 py-2 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-700 rounded-xl transition"
            >
              Sign In
            </button>
            <button
              id="header-register-btn"
              onClick={() => {
                setAuthMode('register');
                setAuthRole('teacher');
                setShowAuthModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer text-center"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero marketing panels */}
      <LandingPage 
        onGetStarted={() => {
          setAuthMode('register');
          setShowAuthModal(true);
        }} 
        onSignIn={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
      />

      {/* Auth Form Overlay Drawer */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border text-slate-800 rounded-3xl w-full max-w-md shadow-xl overflow-hidden relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-850 cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="p-8">
              <center>
                <img
                  src={logoImg}
                  alt="Flodech Logo"
                  className="w-11 h-11 rounded-xl object-cover bg-orange-500 select-none mb-4 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 capitalize">
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">"Manage your academy in one place."</p>
              </center>

              {/* Form type tabs */}
              <div className="grid grid-cols-2 bg-slate-50 border border-slate-100 p-1 rounded-xl my-6">
                <button
                  type="button"
                  id="tab-role-teacher-btn"
                  onClick={() => setAuthRole('teacher')}
                  className={`py-1.5 text-center font-bold text-xs uppercase tracking-wider rounded-lg transition-all ${authRole === 'teacher' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  id="tab-role-student-btn"
                  onClick={() => setAuthRole('student')}
                  className={`py-1.5 text-center font-bold text-xs uppercase tracking-wider rounded-lg transition-all ${authRole === 'student' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Student Portal
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3.5 bg-red-400/5 border border-red-200 rounded-xl flex flex-col gap-1.5 text-xs text-red-650 font-medium">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="flex-1">{authError}</span>
                  </div>
                  {authError.includes('already registered') && (
                    <div className="mt-1 pl-6 text-[11px] text-slate-600 flex flex-col gap-1">
                      <span>Did you mean to sign in instead of register?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthError(null);
                        }}
                        className="text-orange-600 font-bold hover:underline text-left self-start"
                      >
                        Click here to login &rarr;
                      </button>
                    </div>
                  )}
                  {(authError.includes('activated') || authError.includes('not-allowed') || authError.includes('not enabled')) && (
                    <div className="mt-3 pl-6 border-t border-red-200/40 pt-3 text-[11px] text-slate-650 flex flex-col gap-2.5">
                      <div className="font-extrabold uppercase text-[9px] tracking-wider text-red-650">Steps to Activate in Firebase Console:</div>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-medium leading-relaxed">
                        <li>Go directly to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline font-bold inline-flex items-center gap-0.5">Firebase Console</a></li>
                        <li>Click <strong className="text-slate-800">Build &gt; Authentication</strong> in the left drawer menu</li>
                        <li>Switch to the <strong className="text-slate-800">Sign-in method</strong> tab (or tap "Get Started")</li>
                        <li>Under <strong className="text-slate-800">Sign-in providers</strong>, edit and enable <strong className="text-slate-800">Email/Password</strong> and/or <strong className="text-slate-800">Google</strong></li>
                        <li>Confirm and save changes, then try authentication again!</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Submission fields */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-650 mb-1">
                    {authRole === 'student' ? 'Student ID or Registered Email' : 'Email address'}
                  </label>
                  <div className="relative">
                    {authRole === 'student' ? (
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    )}
                    <input
                      id="auth-email-input"
                      type={authRole === 'student' ? 'text' : 'email'}
                      required
                      placeholder={authRole === 'student' ? 'e.g. FLD-STU-XXXXXX or email' : 'you@academy.com'}
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-650 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      id="auth-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>

                {authRole === 'student' && authMode === 'register' && (
                  <div className="p-3.5 bg-orange-50 border border-orange-100/50 text-[11px] text-orange-600 rounded-xl flex gap-2">
                    <Info className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Students cannot sign up. Please contact your teacher for your Student ID and Password.</span>
                  </div>
                )}

                <button
                  id="auth-form-submit-btn"
                  type="submit"
                  disabled={authRole === 'student' && authMode === 'register'}
                  className="w-full py-3 bg-slate-950 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-orange-500 transition-colors shadow-md mt-2 cursor-pointer disabled:opacity-40"
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Academy'}
                </button>
              </form>

              {authRole !== 'student' && (
                <>
                  <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-bold tracking-wider">Or continue with</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    type="button"
                    id="google-signin-btn"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2.5 py-3 border border-slate-200 bg-white text-slate-700 font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition shadow-sm cursor-pointer"
                  >
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22c.23-.74.45-1.51.81-2.6z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#EA4335" />
                    </svg>
                    Sign In with Google
                  </button>
                </>
              )}

              {/* Mode swappers */}
              <div className="mt-6 text-center border-t border-slate-100 pt-4">
                {authMode === 'login' ? (
                  <p className="text-xs text-slate-500">
                    Need to create a new academy?{' '}
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setAuthRole('teacher');
                        setAuthError(null);
                      }}
                      className="text-orange-500 font-bold hover:underline"
                    >
                      Sign up here &rarr;
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError(null);
                      }}
                      className="text-orange-500 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
