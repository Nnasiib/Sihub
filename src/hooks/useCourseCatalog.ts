import { useEffect, useState } from 'react';
import type { Course } from '../types';
import { apiGet, ApiError } from '../services/apiClient';

export type PublicCourse = Course & { modulesCount: number };

export function useCourseCatalog() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiGet<{ courses: PublicCourse[] }>('/api/education/courses')
      .then(result => {
        if (active) {
          setCourses(Array.isArray(result?.courses) ? result.courses : []);
          setError('');
        }
      })
      .catch(reason => {
        if (active) {
          setCourses([]);
          setError(reason instanceof ApiError ? reason.message : 'Unable to load public courses.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { courses: Array.isArray(courses) ? courses : [], loading, error };
}

