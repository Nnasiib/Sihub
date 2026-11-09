/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Education Roles & Permission Matrix
 * Enforces explicit role boundaries across the 8 dedicated education personas.
 */

import { UserRole, EducationRole } from '../types';

export interface EducationRolePermissions {
  canAccessAdminPortal: boolean;
  canAccessTeacherPortal: boolean;
  canAccessStudentPortal: boolean;
  
  // Specific Admin Capabilities
  canManageEducationUsers: boolean;
  canManagePrograms: boolean;
  canManageDepartments: boolean;
  canManageCohorts: boolean;
  canManageCourses: boolean;
  canAssignTeachers: boolean;
  canReviewEnrollments: boolean;
  canApproveEnrollments: boolean;
  canManageExams: boolean;
  canPublishResults: boolean;
  canIssueCertificates: boolean;
  canViewAcademicReports: boolean;
  canEditSettings: boolean;

  // Teacher Capabilities
  canUploadContent: boolean;
  canCreateAssignments: boolean;
  canGradeSubmissions: boolean;
  canMarkAttendance: boolean;
  canDeleteCourse: boolean;

  // Student & Guardian Capabilities
  canEnrollInCourse: boolean;
  canSubmitAssignment: boolean;
  canTakeExam: boolean;
  canViewGrades: boolean;
  canViewAttendance: boolean;
  isReadOnlyGuardian: boolean;
}

export const EDUCATION_ROLE_PERMISSIONS: Record<EducationRole, EducationRolePermissions> = {
  education_admin: {
    canAccessAdminPortal: true,
    canAccessTeacherPortal: true,
    canAccessStudentPortal: false,

    canManageEducationUsers: true,
    canManagePrograms: true,
    canManageDepartments: true,
    canManageCohorts: true,
    canManageCourses: true,
    canAssignTeachers: true,
    canReviewEnrollments: true,
    canApproveEnrollments: true,
    canManageExams: true,
    canPublishResults: true,
    canIssueCertificates: true,
    canViewAcademicReports: true,
    canEditSettings: true,

    canUploadContent: true,
    canCreateAssignments: true,
    canGradeSubmissions: true,
    canMarkAttendance: true,
    canDeleteCourse: true,

    canEnrollInCourse: false,
    canSubmitAssignment: false,
    canTakeExam: false,
    canViewGrades: true,
    canViewAttendance: true,
    isReadOnlyGuardian: false
  },

  academic_manager: {
    canAccessAdminPortal: true,
    canAccessTeacherPortal: true,
    canAccessStudentPortal: false,

    canManageEducationUsers: false,
    canManagePrograms: true,
    canManageDepartments: true,
    canManageCohorts: true,
    canManageCourses: true,
    canAssignTeachers: true,
    canReviewEnrollments: false,
    canApproveEnrollments: false,
    canManageExams: false,
    canPublishResults: false,
    canIssueCertificates: false,
    canViewAcademicReports: true,
    canEditSettings: false,

    canUploadContent: true,
    canCreateAssignments: false,
    canGradeSubmissions: false,
    canMarkAttendance: true,
    canDeleteCourse: false,

    canEnrollInCourse: false,
    canSubmitAssignment: false,
    canTakeExam: false,
    canViewGrades: true,
    canViewAttendance: true,
    isReadOnlyGuardian: false
  },

  course_instructor: {
    canAccessAdminPortal: false,
    canAccessTeacherPortal: true,
    canAccessStudentPortal: false,

    canManageEducationUsers: false,
    canManagePrograms: false,
    canManageDepartments: false,
    canManageCohorts: false,
    canManageCourses: false,
    canAssignTeachers: false,
    canReviewEnrollments: false,
    canApproveEnrollments: false,
    canManageExams: false,
    canPublishResults: false,
    canIssueCertificates: false,
    canViewAcademicReports: false,
    canEditSettings: false,

    canUploadContent: true,
    canCreateAssignments: true,
    canGradeSubmissions: true,
    canMarkAttendance: true,
    canDeleteCourse: false,

    canEnrollInCourse: false,
    canSubmitAssignment: false,
    canTakeExam: false,
    canViewGrades: true,
    canViewAttendance: true,
    isReadOnlyGuardian: false
  },

  teaching_assistant: {
    canAccessAdminPortal: false,
    canAccessTeacherPortal: true,
    canAccessStudentPortal: false,

    canManageEducationUsers: false,
    canManagePrograms: false,
    canManageDepartments: false,
    canManageCohorts: false,
    canManageCourses: false,
    canAssignTeachers: false,
    canReviewEnrollments: false,
    canApproveEnrollments: false,
    canManageExams: false,
    canPublishResults: false,
    canIssueCertificates: false,
    canViewAcademicReports: false,
    canEditSettings: false,

    canUploadContent: false, // only instructor uploads curriculum; TA assists
    canCreateAssignments: false,
    canGradeSubmissions: true,
    canMarkAttendance: true,
    canDeleteCourse: false,

    canEnrollInCourse: false,
    canSubmitAssignment: false,
    canTakeExam: false,
    canViewGrades: true,
    canViewAttendance: true,
    isReadOnlyGuardian: false
  },

  exam_officer: {
    canAccessAdminPortal: true,
    canAccessTeacherPortal: false,
    canAccessStudentPortal: false,

    canManageEducationUsers: false,
    canManagePrograms: false,
    canManageDepartments: false,
    canManageCohorts: false,
    canManageCourses: false,
    canAssignTeachers: false,
    canReviewEnrollments: false,
    canApproveEnrollments: false,
    canManageExams: true,
    canPublishResults: true,
    canIssueCertificates: true,
    canViewAcademicReports: true,
    canEditSettings: false,

    canUploadContent: false,
    canCreateAssignments: false,
    canGradeSubmissions: false,
    canMarkAttendance: false,
    canDeleteCourse: false,

    canEnrollInCourse: false,
    canSubmitAssignment: false,
    canTakeExam: false,
    canViewGrades: true,
    canViewAttendance: false,
    isReadOnlyGuardian: false
  },

  admissions_officer: {
    canAccessAdminPortal: true,
    canAccessTeacherPortal: false,
    canAccessStudentPortal: false,

    canManageEducationUsers: false,
    canManagePrograms: false,
    canManageDepartments: false,
    canManageCohorts: false,
    canManageCourses: false,
    canAssignTeachers: false,
    canReviewEnrollments: true,
    canApproveEnrollments: true,
    canManageExams: false,
    canPublishResults: false,
    canIssueCertificates: false,
    canViewAcademicReports: true,
    canEditSettings: false,

    canUploadContent: false,
    canCreateAssignments: false,
    canGradeSubmissions: false,
    canMarkAttendance: false,
    canDeleteCourse: false,

    canEnrollInCourse: false,
    canSubmitAssignment: false,
    canTakeExam: false,
    canViewGrades: false,
    canViewAttendance: false,
    isReadOnlyGuardian: false
  },

  student: {
    canAccessAdminPortal: false,
    canAccessTeacherPortal: false,
    canAccessStudentPortal: true,

    canManageEducationUsers: false,
    canManagePrograms: false,
    canManageDepartments: false,
    canManageCohorts: false,
    canManageCourses: false,
    canAssignTeachers: false,
    canReviewEnrollments: false,
    canApproveEnrollments: false,
    canManageExams: false,
    canPublishResults: false,
    canIssueCertificates: false,
    canViewAcademicReports: false,
    canEditSettings: false,

    canUploadContent: false,
    canCreateAssignments: false,
    canGradeSubmissions: false,
    canMarkAttendance: false,
    canDeleteCourse: false,

    canEnrollInCourse: true,
    canSubmitAssignment: true,
    canTakeExam: true,
    canViewGrades: true,
    canViewAttendance: true,
    isReadOnlyGuardian: false
  },

  parent_guardian: {
    canAccessAdminPortal: false,
    canAccessTeacherPortal: false,
    canAccessStudentPortal: true, // accesses the student portal in linked read-only guardian mode

    canManageEducationUsers: false,
    canManagePrograms: false,
    canManageDepartments: false,
    canManageCohorts: false,
    canManageCourses: false,
    canAssignTeachers: false,
    canReviewEnrollments: false,
    canApproveEnrollments: false,
    canManageExams: false,
    canPublishResults: false,
    canIssueCertificates: false,
    canViewAcademicReports: false,
    canEditSettings: false,

    canUploadContent: false,
    canCreateAssignments: false,
    canGradeSubmissions: false,
    canMarkAttendance: false,
    canDeleteCourse: false,

    canEnrollInCourse: false, // Read-only
    canSubmitAssignment: false, // Read-only
    canTakeExam: false, // Read-only
    canViewGrades: true,
    canViewAttendance: true,
    isReadOnlyGuardian: true // Explicitly restricted
  }
};

/**
 * Returns permissions for any role, falling back to safe defaults for non-education roles
 */
export function getEducationPermissions(role: UserRole): EducationRolePermissions {
  // If global admin or super_admin, grant full education admin rights
  if (role === 'admin' || role === 'super_admin') {
    return EDUCATION_ROLE_PERMISSIONS.education_admin;
  }
  // If global instructor, map to course_instructor
  if (role === 'instructor') {
    return EDUCATION_ROLE_PERMISSIONS.course_instructor;
  }
  // If global learner, map to student
  if (role === 'learner') {
    return EDUCATION_ROLE_PERMISSIONS.student;
  }

  if (role in EDUCATION_ROLE_PERMISSIONS) {
    return EDUCATION_ROLE_PERMISSIONS[role as EducationRole];
  }

  // Default visitor / other role: read-only student catalogue browsing
  return {
    canAccessAdminPortal: false,
    canAccessTeacherPortal: false,
    canAccessStudentPortal: true,
    canManageEducationUsers: false,
    canManagePrograms: false,
    canManageDepartments: false,
    canManageCohorts: false,
    canManageCourses: false,
    canAssignTeachers: false,
    canReviewEnrollments: false,
    canApproveEnrollments: false,
    canManageExams: false,
    canPublishResults: false,
    canIssueCertificates: false,
    canViewAcademicReports: false,
    canEditSettings: false,
    canUploadContent: false,
    canCreateAssignments: false,
    canGradeSubmissions: false,
    canMarkAttendance: false,
    canDeleteCourse: false,
    canEnrollInCourse: true,
    canSubmitAssignment: false,
    canTakeExam: false,
    canViewGrades: false,
    canViewAttendance: false,
    isReadOnlyGuardian: false
  };
}
