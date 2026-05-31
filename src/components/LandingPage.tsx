/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import logoImg from '../assets/images/logotech_icon_1780152227001.png';
import { 
  Building2, 
  Users, 
  Calendar, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  FileText, 
  CreditCard, 
  GraduationCap, 
  Award,
  ChevronDown,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    {
      icon: <Users className="w-6 h-6 text-orange-500" />,
      title: "Student Management",
      description: "Direct student profiles with parent contacts, batches, and personal notes. Replace paper registers forever."
    },
    {
      icon: <Calendar className="w-6 h-6 text-orange-500" />,
      title: "Attendance Tracking",
      description: "Mark attendance batch-wise or daily in seconds. Automatic monthly percentages and clear history for students."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-orange-500" />,
      title: "Fee Tracking & UPI QR",
      description: "Generate fee dues, upload your custom UPI QR code, and allow instant student validation and payment updates."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-orange-500" />,
      title: "Internal Chat System",
      description: "Secure, real-time student-teacher communication. Share images, worksheets, and documents with active search."
    },
    {
      icon: <FileText className="w-6 h-6 text-orange-500" />,
      title: "Notices & Announcements",
      description: "Pin notices, events, and schedules. Instantly push critical news to all student dashboards."
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-500" />,
      title: "Class Scheduler",
      description: "Manage weekly timetables, batch assignments, and upcoming schedules with real-time sync."
    },
    {
      icon: <Award className="w-6 h-6 text-orange-500" />,
      title: "Automatic Portfolios",
      description: "Every student gets a public, customizable web portfolio highlighting certificates, feedback, and progress."
    },
     {
      icon: <Award className="w-6 h-6 text-orange-500" />,
      title: "Grow Your Academy",
      description: "Grow your academy with FLODECH LIVE WEBSITE of each academy which acts like academy's portfolio with 0% coding! Share the link of website and let future students experience professioanlism!"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-orange-500" />,
      title: "Reports & Analytics",
      description: "Instantly create PDF summaries for individual student history, batch attendance logs, and financial collection records."
    }
  ];

  const benefits = [
    {
      metric: "90%",
      label: "Reduction in Admin Tasks",
      detail: "Spend your time teaching instead of chasing fees and messaging student parents."
    },
    {
      metric: "100%",
      label: "Fee Verification Rate",
      detail: "Direct UPI QR scans paired with instant teacher-side receipts leave no transaction unverified."
    },
    {
      metric: "10x",
      label: "Better Student Branding",
      detail: "Professional public portfolio links celebrate student milestones and win parent recommendations."
    }
  ];

  const testimonials = [
    {
      quote: "Flodech replaced three different apps for us. Our parents love the portfolios, and marking attendance takes 5 seconds now.",
      author: "Sneha Mehta",
      role: "Vidyarthii Academy , PUNE"
    },
    {
      quote: "No more scrolling WhatsApp groups searching for payment receipts. The UPI QR features and fee status boards are absolute lifesavers.",
      author: "Rajesh Kumar",
      role: "Gurukul  , DELHI"
    },
    {
      quote: "The students feel incredibly motivated with their portfolio galleries. It highlights our academy as a truly technology-driven learning center.",
      author: "Arun Bhatia",
      role: "Bhatia Academy , Bihar"
    }
  ];

  const faqs = [
    {
      question: "Is Flodech suitable for small tutoring academies or single teachers?",
      answer: "Absolutely! Flodech is optimized for educational organizations of all sizes—from solo tutors managing 10 students inside a home tuition center to large multi-batch music, dance, and training academies."
    },
    {
      question: "How do students log into their dashboards?",
      answer: "Teachers generate a unique Student ID (e.g. FLD-STU-X8P4K) and a starting password. Students can sign in using these credentials to get full, safe access to schedules, notices, reports, portfolios, and chat."
    },
    {
      question: "Does client data transfer securely with Firebase?",
      answer: "Yes, all data resides in secure cloud containers governed by rigorous Firebase Security Rules. Only authenticated students can download their records, and only verified teachers can view their academy data."
    },
    {
      question: "Can I print receipts and reports as PDFs?",
      answer: "Yes, Flodech includes a built-in Reports system. Teachers can download complete visual charts for attendance logs, student enrollment profiles, and payment histories instantly."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans tracking-tight flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Header - Hidden to avoid duplicate headers */}
      <header className="hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src='../assets/images/logotech_icon_1780152227001.png'
              alt="Flodech Logo"
              className="w-9 h-9 rounded-lg object-cover bg-orange-500 select-none shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span id="logo-text" className="text-xl font-bold tracking-tight text-slate-950 font-sans">
              Flodech
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
            <a href="#benefits" className="hover:text-orange-500 transition-colors">Benefits</a>
            <a href="#faq" className="hover:text-orange-500 transition-colors">FAQ</a>
          </nav>

          <button 
            id="header-cta-btn"
            onClick={onGetStarted}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-950 rounded-lg hover:bg-orange-500 transition-colors active:scale-95 duration-100 shadow-sm"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 bg-white overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 bg-[radial-gradient(#f97316_0.15px,transparent_0.15px)] [background-size:16px_16px] opacity-10" />
        
        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-xs font-semibold text-orange-600 mb-6 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> All-In-One Academy Manager
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950 leading-[1.08] mb-6 max-w-3xl">
            Everything for Your Academy in <span className="text-orange-500 italic font-medium">One Place.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            Replace scattered WhatsApp groups, spreadsheets, paper books, and payment notes with a beautiful, professional, secure platform designed for coaching, dance, music, and educational academies.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button 
              id="hero-cta-btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
            >
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-center"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-14 inline-flex items-center gap-4 text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange-500" /> Fully Mobile Responsive</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-orange-500" /> Live Firestore Sync</span>
          </div>
        </div>
      </section>

      {/* Comparison Hook Panel */}
      <section className="bg-slate-950 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 items-center justify-between gap-8">
          <div className="w-full p-4 text-center md:text-left">
            <span className="text-xs uppercase font-extrabold tracking-widest text-orange-500 block mb-2 font-mono">PROBLEM</span>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Weekly Chaos</h3>
            <p className="text-slate-400 text-sm">Chasing clients, misinterpreting texts, lost excel records, paper logs getting wet or forgotten.</p>
          </div>
          <div className="w-full p-4 md:pl-8 text-center md:text-left">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-500 block mb-2 font-mono">SOLUTION</span>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Standardized Platform</h3>
            <p className="text-slate-400 text-sm">Direct, fast data grids for schedules, fees, portfolios, chat channels, and attendance stats.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 mb-4">
              Everything Your Academy Needs
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Say goodbye to fragmented tools. Flodech bundles administration, records, communications, and branding into a cohesive dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all group duration-200 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-115 transition-transform duration-200">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-grow">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-4">
              Designed To Transform Operations
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Run your tutoring coaching center like a professional SaaS. Experience instant workflow efficiencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {benefits.map((benefit, index) => (
              <div key={index} className="px-6 py-10 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-5xl lg:text-6xl font-extrabold text-orange-500 tracking-tight mb-2">
                  {benefit.metric}
                </div>
                <h4 className="text-lg font-bold text-slate-950 mb-3">{benefit.label}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{benefit.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-3">
              Trusted by Premier Educators
            </h2>
            <p className="text-slate-600 text-sm">
              Here is what founders, teachers, and tutors say about Flodech.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <p className="text-slate-700 italic text-sm leading-relaxed mb-6">
                  "{t.quote}"
                </p>
                <div>
                  <div className="h-px bg-slate-100 mb-4" />
                  <h4 className="font-bold text-slate-950 text-sm">{t.author}</h4>
                  <p className="text-orange-500 text-xs font-medium">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm">
              Everything you need to know about setting up and running your Academy platform on Flodech.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left font-bold text-slate-900 hover:bg-slate-50 flex items-center justify-between text-sm sm:text-base cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeFaq === index ? 'rotate-180 text-orange-500' : ''}`} />
                </button>
                
                {activeFaq === index && (
                  <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Footer Action */}
      <section className="bg-slate-950 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Ready to streamline your Academy?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed font-sans">
            Join premier schools, freelance trainers, and educational institutes worldwide who manage everything under one centralized portal.
          </p>
          <button 
            id="bottom-cta-btn"
            onClick={onGetStarted}
            className="px-8 py-4 text-base font-bold text-slate-950 bg-white rounded-xl hover:bg-orange-500 hover:text-white transition-colors duration-150 shadow-lg cursor-pointer"
          >
            Get Started Instantly
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 px-6 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-orange-500 flex items-center justify-center font-bold text-white text-base">
              F
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Flodech</span>
          </div>
          
          <p className="text-xs text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Flodech Technologies. All rights reserved. "Everything for Your Academy in One Place."
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
