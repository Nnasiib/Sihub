/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Database-Ready Data Models & TypeScript Definitions
 * Prepared for future PostgreSQL / Prisma / Drizzle ORM integration.
 */

export type EducationRole =
  | 'education_admin'
  | 'academic_manager'
  | 'course_instructor'
  | 'teaching_assistant'
  | 'exam_officer'
  | 'admissions_officer'
  | 'student'
  | 'parent_guardian';

export type UserRole =
  | 'visitor'
  | 'learner'
  | 'instructor'
  | 'startup_founder'
  | 'mentor'
  | 'community_member'
  | 'staff'
  | 'partner'
  | 'program_manager'
  | 'admin'
  | 'super_admin'
  | EducationRole;

export type Language = 'en' | 'so';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  organization?: string;
  isActive: boolean;
  registeredAt: string;
  lastLoginAt?: string;
}

export type CourseCategory =
  | 'Technology & Software'
  | 'Renewable Energy & Climate'
  | 'AgriTech & Food Security'
  | 'Digital Entrepreneurship'
  | 'Data & AI'
  | 'Health & MedTech'
  | 'Creative & Digital Media'
  | 'Financial Literacy';

export type LessonType = 'video' | 'pdf' | 'reading' | 'assignment' | 'quiz';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  contentUrl?: string; // Video URL, PDF URL, or document link
  textContent?: string;
  assignmentPrompt?: string;
  quizQuestions?: QuizQuestion[];
  isCompleted?: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  titleSo?: string;
  code: string;
  category: CourseCategory;
  description: string;
  descriptionSo?: string;
  instructorId: string;
  instructorName: string;
  instructorTitle: string;
  durationWeeks: number;
  hoursPerWeek: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  deliveryMode: 'Online' | 'Hybrid' | 'In-Person';
  capacity: number;
  enrolledCount: number;
  thumbnailUrl: string;
  thumbnailAlt?: string;
  thumbnailUrlType?: 'image' | 'video';
  prerequisites: string[];
  learningOutcomes: string[];
  isPublished: boolean;
  createdAt: string;
  modules: CourseModule[];
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  motivation: string;
  status: EnrollmentStatus;
  progressPercent: number;
  appliedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  rejectionReason?: string;
  completedLessonIds: string[];
  quizScores?: Record<string, number>;
  certificateIssued?: boolean;
  certificateDate?: string;
  certificateNumber?: string;
}

export interface AssignmentSubmission {
  id: string;
  lessonId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  submissionText: string;
  fileAttachmentName?: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  gradedAt?: string;
}

export type StartupStage = 'Ideation' | 'Prototype' | 'Incubation' | 'Acceleration' | 'Growth / Scale';

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  sector: 'AgriTech' | 'CleanTech / Energy' | 'Fintech' | 'HealthTech' | 'EdTech' | 'Logistics' | 'E-commerce' | 'Creative';
  founderName: string;
  founderEmail: string;
  founderPhone: string;
  teamSize: number;
  stage: StartupStage;
  description: string;
  problemStatement: string;
  solution: string;
  fundingRaised: string;
  website?: string;
  location: string;
  logoUrl?: string;
  pitchDeckUrl?: string;
  incubationCohort?: string;
  mentorAssigned?: string;
  status: 'active' | 'graduated' | 'under_review' | 'rejected';
  appliedDate: string;
}

export interface InnovationProject {
  id: string;
  title: string;
  sector: 'Technology' | 'Agriculture' | 'Education' | 'Health' | 'Environment' | 'Social' | 'Creative' | 'R&D';
  leadResearcher: string;
  organizationOrTeam: string;
  description: string;
  objectives: string[];
  status: 'Concept' | 'In Progress' | 'Pilot Tested' | 'Completed';
  location: string;
  beneficiariesCount: number;
  milestones: { title: string; completed: boolean; dueDate: string }[];
  budgetEstimated: string;
  startDate: string;
}

export interface Program {
  id: string;
  title: string;
  titleSo?: string;
  category: 'Incubation' | 'Acceleration' | 'Youth Tech' | 'Women in Innovation' | 'Fellowship' | 'Seed Grant';
  summary: string;
  summarySo?: string;
  objectives: string[];
  targetAudience: string;
  duration: string;
  eligibility: string[];
  cohortSize: number;
  status: 'Open' | 'In Progress' | 'Upcoming' | 'Closed';
  deadline: string;
  coordinator: string;
  thumbnailUrl: string;
  thumbnailAlt?: string;
  thumbnailUrlType?: 'image' | 'video';
}

export interface SiHubEvent {
  id: string;
  title: string;
  category: 'Workshop' | 'Conference' | 'Hackathon' | 'Demo Day' | 'Networking' | 'Masterclass';
  date: string;
  time: string;
  locationType: 'In-Person' | 'Virtual' | 'Hybrid';
  venue: string;
  description: string;
  capacity: number;
  registeredCount: number;
  speaker: string;
  isUpcoming: boolean;
  qrCodeSample?: string;
}

export type Event = SiHubEvent;

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  userId: string;
  userName: string;
  userEmail: string;
  ticketCode: string;
  registeredAt: string;
  attended: boolean;
}

export interface Mentor {
  id: string;
  userId?: string;
  name: string;
  title: string;
  organization: string;
  expertise: string[];
  sectors: string[];
  bio: string;
  availableHoursPerMonth: number;
  avatarUrl: string;
  avatarAlt?: string;
  avatarUrlType?: 'image' | 'video';
  rating: number;
  totalMenteesHelped: number;
}

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  menteeEmail: string;
  topic: string;
  preferredSlot: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  scheduledDate?: string;
  meetingLink?: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'Scholarship' | 'Grant' | 'Job' | 'Internship' | 'Fellowship' | 'Competition';
  provider: string;
  location: string;
  deadline: string;
  amountOrStipend?: string;
  description: string;
  eligibility: string[];
  status: 'Open' | 'Reviewing' | 'Closed';
  applicantsCount: number;
}

export type ProgramApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface ProgramApplication {
  id: string;
  programId: string;
  programTitle: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  ventureName?: string;
  proposalBrief: string;
  status: ProgramApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerNotes?: string;
  rejectionReason?: string;
}

export type OpportunityApplicationStatus = 'under_review' | 'shortlisted' | 'awarded' | 'declined';

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityType: Opportunity['type'];
  userId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  portfolioOrProposal: string;
  score?: number; // 0 - 100
  adminFeedback?: string;
  decisionReason?: string;
  status: OpportunityApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  decisionHistory?: {
    status: OpportunityApplicationStatus;
    timestamp: string;
    notes?: string;
  }[];
}

export type PartnerInquiryStatus = 'submitted' | 'reviewed' | 'mou_initiated';

export interface PartnerInquiry {
  id: string;
  organizationName: string;
  partnerType: string;
  focusArea: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  proposalDetails: string;
  status: PartnerInquiryStatus;
  submittedAt: string;
  internalNotes?: string;
  reviewedAt?: string;
  reviewerId?: string;
}

export interface Partner {
  id: string;
  name: string;
  type: 'Institutional' | 'Development Agency' | 'Corporate Sponsor' | 'Academic' | 'NGO';
  country: string;
  collaborativePrograms: string[];
  mouStatus: 'Active' | 'Under Renewal' | 'MOU Signed';
  contactPerson: string;
  logoUrl?: string;
  joinedYear: number;
}

export interface CommunityMember {
  id: string;
  name: string;
  sectorInterest: string;
  city: string;
  contributionsCount: number;
  joinedDate: string;
  isAmbassador: boolean;
}

export interface ForumTopic {
  id: string;
  title: string;
  author: string;
  category: string;
  repliesCount: number;
  likesCount: number;
  createdAt: string;
  content: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  titleSo?: string;
  category: 'Announcement' | 'Success Story' | 'Press Release' | 'Impact Report';
  author: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  content: string;
  coverImage: string;
  coverImageAlt?: string;
  coverImageType?: 'image' | 'video';
  coverImageCaption?: string;
}

export interface ImpactMetrics {
  totalBeneficiaries: number;
  learnersTrained: number;
  coursesDelivered: number;
  startupsSupported: number;
  jobsCreatedDirectly: number;
  grantsDisbursedUSD: number;
  womenParticipationRate: number;
  innovationProjectsCompleted: number;
  partnerOrganizations: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
}

// ----------------------------------------------------
// Dedicated Education Portal Types (Task 2)
// ----------------------------------------------------

export interface AcademicProgram {
  id: string;
  code: string;
  title: string;
  department: string;
  durationWeeks: number;
  description: string;
  cohortsCount: number;
  credits: number;
  isActive: boolean;
}

export interface AcademicDepartment {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  email: string;
  programsCount: number;
  coursesCount: number;
  facultyCount: number;
}

export interface AcademicCohort {
  id: string;
  code: string;
  programId: string;
  programTitle: string;
  startDate: string;
  endDate: string;
  studentsEnrolled: number;
  maxCapacity: number;
  status: 'active' | 'upcoming' | 'graduated';
}

export interface EducationAssignment {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  weightPercent: number;
  createdBy: string;
  createdAt: string;
}

export interface EducationSubmission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  attachmentName?: string;
  attachmentUrl?: string;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  status: 'submitted' | 'graded' | 'resubmit_requested';
}

export interface EducationExam {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  durationMinutes: number;
  scheduledDate: string;
  totalMarks: number;
  passingMarks: number;
  status: 'draft' | 'published' | 'completed';
  questions: QuizQuestion[];
  createdBy: string;
}

export interface EducationExamResult {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface EducationAttendanceRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  sessionDate: string;
  topic: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  recordedBy: string;
}

export interface EducationCertificate {
  id: string;
  certificateNumber: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  grade: string;
  verificationHash: string;
  issuer: string;
}

// ----------------------------------------------------
// Phase 2: Visitor Portal & Student Profile Types
// ----------------------------------------------------

export type VisitPurpose =
  | 'Diplomatic / Government Delegation'
  | 'University / Academic Tour'
  | 'Startup & Investment Exploration'
  | 'Technology & MakerSpace Tour'
  | 'Media & Press Coverage'
  | 'Public & Student Group Visit'
  | 'Partnership / NGO Collaboration';

export type VisitStatus = 'pending' | 'approved' | 'declined' | 'completed' | 'cancelled';

export interface VisitRequest {
  id: string;
  referenceCode: string; // e.g. VIST-2026-0812
  fullName: string;
  email: string;
  phone: string;
  organization?: string;
  visitorCount: number;
  hubLocation: 'Mogadishu HQ' | 'Hargeisa Hub' | 'Garowe Hub' | 'Baidoa Hub' | 'Kismayo Hub';
  purpose: VisitPurpose;
  customDetails: string;
  requestedDate: string;
  timeSlot: 'Morning (09:00 - 11:30)' | 'Afternoon (13:30 - 15:30)' | 'Late Afternoon (16:00 - 17:30)';
  status: VisitStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  assignedHost?: string;
  badgeIssued?: boolean;
}

export interface VisitorPass {
  id: string;
  passNumber: string;
  requestId: string;
  visitorName: string;
  organization?: string;
  hubLocation: string;
  validDate: string;
  timeSlot: string;
  assignedHost: string;
  securityClearanceCode: string;
  issuedAt: string;
}

export interface StudentProfileSettings {
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  regionalHub: string;
  programEnrolled: string;
  cohort: string;
  academicGoals: string[];
  preferredLanguage: 'English' | 'Somali';
  emailNotifications: boolean;
  smsAlerts: boolean;
}

