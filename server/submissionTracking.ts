export type PublicSubmissionStatus = {
  referenceCode: string;
  type: string;
  status: string;
  createdAt: Date;
};

export const submissionMatchesEmail = (payload: Record<string, unknown>, email: string) => {
  const submittedEmails = [payload.email, payload.contactEmail, payload.founderEmail].filter((value): value is string => typeof value === 'string');
  return submittedEmails.some(value => value.trim().toLowerCase() === email.trim().toLowerCase());
};

export const publicSubmissionTrackingInfo = ({ referenceCode, type, status, createdAt }: PublicSubmissionStatus) => ({
  referenceCode,
  type,
  status,
  createdAt
});
