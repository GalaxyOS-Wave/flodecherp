/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  academyId?: string;
  createdAt: any; // Timestamp or Date
}

export type AcademyType = 
  | 'Coaching Institute'
  | 'Tuition Center'
  | 'Music Academy'
  | 'Dance Academy'
  | 'Training Center'
  | 'Other';

export interface PublicCourse {
  id: string;
  name: string;
  description: string;
  duration: string;
  fees?: string;
}

export interface PublicTeacher {
  id: string;
  name: string;
  role: string;
  experience: string;
  specialization: string;
  photo: string; // Base64 or placeholder URL
}

export interface PublicEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
}

export interface PublicTestimonial {
  id: string;
  authorName: string;
  role: 'parent' | 'student';
  content: string;
  status: 'pending' | 'approved';
  createdAt: any;
}

export interface AdmissionRequest {
  id: string;
  academyId: string;
  studentName: string;
  parentName: string;
  phoneNumber: string;
  email: string;
  age: number;
  interestedCourse: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export interface PublicInquiry {
  id: string;
  academyId: string;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: any;
}

export interface Academy {
  id: string; // FAID
  ownerId: string;
  institutionName: string;
  logoUrl: string; // Base64 encoding supported
  academyEmail: string;
  phone: string;
  address: string;
  academyType: AcademyType;
  upiId: string;
  upiQrCode: string; // Base64 QR Image
  paymentInstructions: string;
  theme: string;
  createdAt: any;
  about?: string;
  mission?: string;
  teachingStyle?: string;
  whyChooseUs?: string;
  verified?: boolean;
  totalGraduatedCount?: number;
  certificatesIssuedCount?: number;
  eventsConductedCount?: number;
  coursesList?: PublicCourse[];
  teachersList?: PublicTeacher[];
  galleryList?: GalleryItem[];
  upcomingEventsList?: PublicEvent[];
  testimonialsList?: PublicTestimonial[];
  publicSettings?: {
    showAchievements?: boolean;
    showTeachers?: boolean;
    showPortfolios?: boolean;
    showGallery?: boolean;
    showEvents?: boolean;
    showTestimonials?: boolean;
  };
}

export interface Student {
  id: string; // FLD-STU-XXXXXX
  academyId: string;
  name: string;
  profilePhoto: string; // Base64 encoding supported
  parentName: string;
  parentPhone: string;
  email: string;
  batch: string;
  notes: string;
  password: string;
  disabled: boolean;
  createdAt: any;
}

export interface Batch {
  id: string; // FLD-BAT-XXXXXX
  academyId: string;
  name: string;
  description: string;
  createdAt: any;
}

export interface AttendanceRecord {
  id: string; // `${academyId}_${batch}_${date}`
  academyId: string;
  batch: string;
  date: string; // YYYY-MM-DD
  records: { [studentId: string]: 'present' | 'absent' | 'late' };
  updatedAt: any;
}

export interface Fee {
  id: string;
  academyId: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'pending' | 'paid';
  paidDate?: string; // YYYY-MM-DD
  receiptNumber?: string;
  createdAt: any;
}

export interface Notice {
  id: string;
  academyId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: any;
}

export interface ClassSchedule {
  id: string;
  academyId: string;
  batchName: string;
  className: string;
  dayOfWeek: string; // Monday, Tuesday, etc.
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  teacherName: string;
  notes?: string;
}

export interface ChatThread {
  id: string; // matches studentId
  academyId: string;
  studentId: string;
  studentName: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadCountTeacher: number;
  unreadCountStudent: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'teacher' | 'student';
  content: string;
  imageUrl?: string;
  createdAt: any;
  read: boolean;
}

export interface Achievement {
  title: string;
  date: string;
  desc: string;
}

export interface Certificate {
  title: string;
  issuer: string;
  date: string;
  fileUrl: string; // Base64 or placeholder URL
}

export interface GalleryItem {
  title: string;
  imageUrl: string; // Base64 or placeholder URL
}

export interface ProgressReport {
  subject: string;
  score: string;
  grade: string;
  comments: string;
  date: string;
}

export interface StudentPortfolio {
  id: string; // matches studentId
  academyId: string;
  isVisible: boolean;
  achievements: Achievement[];
  certificates: Certificate[];
  gallery: GalleryItem[];
  progressReports: ProgressReport[];
  teacherFeedback: string;
  updatedAt: any;
}

export function compressImage(file: File, maxWidth: number = 400, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = () => {
      resolve('');
    };
  });
}

