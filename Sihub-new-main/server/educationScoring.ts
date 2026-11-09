export interface ScoredQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export const scoreExamAnswers = (questions: ScoredQuestion[], answers: Record<string, number>, totalMarks: number) => {
  const correctCount = questions.reduce((count, question) => count + (answers[question.id] === question.correctAnswerIndex ? 1 : 0), 0);
  const percentage = questions.length ? Math.round((correctCount / questions.length) * 10000) / 100 : 0;
  const score = Math.round((correctCount / Math.max(questions.length, 1)) * totalMarks * 100) / 100;
  const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
  return { correctCount, score, percentage, grade };
};

export const publicExamQuestions = (questions: ScoredQuestion[]) => questions.map(({ id, options, ...question }) => ({ id, options, question: question.question }));