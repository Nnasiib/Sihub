import test from 'node:test';
import assert from 'node:assert/strict';
import { publicExamQuestions, scoreExamAnswers } from '../server/educationScoring.ts';

const questions = [
  { id: 'q1', question: 'First?', options: ['A', 'B'], correctAnswerIndex: 1 },
  { id: 'q2', question: 'Second?', options: ['C', 'D'], correctAnswerIndex: 0 }
];

test('exam scoring is calculated on the server from submitted answer indexes', () => {
  assert.deepEqual(scoreExamAnswers(questions, { q1: 1, q2: 1 }, 100), {
    correctCount: 1,
    score: 50,
    percentage: 50,
    grade: 'F'
  });
});

test('student exam projection omits answer keys and explanations', () => {
  const projection = publicExamQuestions(questions);
  assert.deepEqual(projection, [
    { id: 'q1', question: 'First?', options: ['A', 'B'] },
    { id: 'q2', question: 'Second?', options: ['C', 'D'] }
  ]);
});