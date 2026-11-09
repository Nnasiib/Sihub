/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SiHub Digital Ecosystem - Public Education & LMS Course Catalog
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, CourseCategory } from '../../types';
import { useCourseCatalog } from '../../hooks/useCourseCatalog';
import { useCmsPage } from '../../hooks/useCmsPage';
import { DynamicCmsSections } from './DynamicCmsSections';
import {
  GraduationCap,
  Search,
  Filter,
  Clock,
  BookOpen,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  User,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';

type CoursesCmsPage = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  governanceTitle?: string;
  governanceDescription?: string;
  subsidyLabel?: string;
};

export const CoursesPage: React.FC = () => {
  const { page: cmsPage } = useCmsPage<CoursesCmsPage>('courses');
  const { setSelectedCourseForApply, language, t } = useApp();
  const { courses } = useCourseCatalog();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);

  const categoryAliases: Record<string, string> = {
    'technology-software': 'Technology & Software',
    'digital-entrepreneurship': 'Digital Entrepreneurship',
    'data-ai': 'Data & AI',
    'renewable-energy': 'Renewable Energy & Climate',
    'agritech': 'AgriTech & Food Security',
    'agri-tech': 'AgriTech & Food Security',
    'health': 'Health & MedTech',
    'health-medtech': 'Health & MedTech'
  };

  const categories: string[] = [
    'All',
    'Technology & Software',
    'Renewable Energy & Climate',
    'AgriTech & Food Security',
    'Digital Entrepreneurship',
    'Data & AI',
    'Health & MedTech'
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (!category) {
      setSelectedCategory('All');
      return;
    }

    const normalized = category.trim().toLowerCase();
    const directMatch = categories.find(cat => cat.toLowerCase() === normalized.toLowerCase());
    const aliasMatch = categoryAliases[normalized] || categoryAliases[normalized.replace(/[_\s]+/g, '-')];
    setSelectedCategory(directMatch || aliasMatch || 'All');
  }, []);

  const applyCategoryFilter = (nextCategory: string) => {
    setSelectedCategory(nextCategory);

    const params = new URLSearchParams(window.location.search);
    if (nextCategory === 'All') {
      params.delete('category');
    } else {
      const alias = Object.entries(categoryAliases).find(([, label]) => label === nextCategory)?.[0];
      params.set('category', alias ?? nextCategory);
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  };

  const filtered = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <DynamicCmsSections pageSlug="courses" placement="top" />
      {/* Catalog Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">
          {cmsPage?.eyebrow ?? 'SiHub Academy & Online LMS'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          {cmsPage?.heading ?? 'Professional Course Catalog'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {cmsPage?.description ?? 'Browse courses currently published in the SiHub catalog and review each course before applying.'}
        </p>
      </div>

      {/* LMS Business Rule Banner */}
      <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-sm block">{cmsPage?.governanceTitle ?? 'Important LMS Enrollment Governance:'}</strong>
            <span className="text-slate-600">
              {cmsPage?.governanceDescription ?? 'To ensure academic rigor and cohort support, all student enrollments require SiHub Admin Approval. Once approved, the full course player, videos, quizzes, and certificates unlock in your Learner Dashboard.'}
            </span>
          </div>
        </div>
        {cmsPage?.subsidyLabel && <div className="shrink-0 px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 font-mono text-[11px] font-bold border border-cyan-300">{cmsPage.subsidyLabel}</div>}
      </div>

      <div id="certification" className="p-6 rounded-3xl bg-cyan-50 border border-cyan-200 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white border border-cyan-200 text-cyan-700">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Public Certification Pathway</span>
            <h2 className="text-xl font-bold text-slate-900">Completion records and digital credentials</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              SiHub learning pathways support verified completion records for approved learners. Course milestones, assignment review, and final assessment workflows are designed to issue digital credentials through the official SiHub Academy process when learners meet the required standards.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search courses, instructors, keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => applyCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(course => (
          <div
            key={course.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 overflow-hidden">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-cyan-50 flex items-center justify-center" aria-label={`${course.title} course image unavailable`}>
                    <GraduationCap className="w-12 h-12 text-cyan-700" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-slate-900/90 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {course.category}
                </div>
                <div className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {course.level}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                    {course.code} • {course.deliveryMode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                    {language === 'so' && course.titleSo ? course.titleSo : course.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {language === 'so' && course.descriptionSo ? course.descriptionSo : course.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-cyan-600" /> Instructor:</span>
                    <strong className="text-slate-800">{course.instructorName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-600" /> Duration:</span>
                    <strong className="text-slate-800">{course.durationWeeks} Weeks ({course.hoursPerWeek}h/wk)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-600" /> Modules:</span>
                    <strong className="text-slate-800">{course.modulesCount ?? course.modules.length} Modules</strong>
                  </div>
                </div>

                {(course.learningOutcomes?.length ?? 0) > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Outcomes:</span>
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="truncate">{course.learningOutcomes[0]}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 space-y-2">
              <button
                onClick={() => setSelectedCourseForApply(course)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <GraduationCap className="w-4 h-4" /> Apply for Enrollment
              </button>
              <button
                onClick={() => setSelectedCourseDetail(course)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                View Syllabus Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Course Detail Drawer / Modal */}
      {selectedCourseDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 shadow-2xl animate-in zoom-in-95">
            <div className="bg-slate-900 p-6 text-white relative">
              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                {selectedCourseDetail.category}
              </span>
              <h3 className="text-xl font-bold pr-6">{selectedCourseDetail.title}</h3>
              <p className="text-xs text-slate-300 mt-1">Instructor: {selectedCourseDetail.instructorName} • {selectedCourseDetail.durationWeeks} Weeks</p>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedCourseDetail.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prerequisites</h4>
                <ul className="space-y-1">
                  {selectedCourseDetail.prerequisites.map((p, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Learning Outcomes</h4>
                <ul className="space-y-1">
                  {selectedCourseDetail.learningOutcomes.map((o, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {o}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Syllabus Modules ({selectedCourseDetail.modules.length})</h4>
                <div className="space-y-2">
                  {selectedCourseDetail.modules.map((m, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{m.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{m.lessons.length} Lessons (Video, Reading, Assignments, Quizzes)</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedCourseDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const c = selectedCourseDetail;
                    setSelectedCourseDetail(null);
                    setSelectedCourseForApply(c);
                  }}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700"
                >
                  Apply for Enrollment &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DynamicCmsSections pageSlug="courses" placement="bottom" />
    </div>
  );
};
