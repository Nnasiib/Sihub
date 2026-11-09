const communityFields = ['title', 'content', 'author', 'category'] as const;
const startupFields = ['name', 'tagline', 'sector', 'stage', 'founderName', 'teamSize', 'problemStatement', 'solution', 'location', 'description', 'fundingRaised', 'incubationCohort'] as const;

export const publicSubmissionContent = (type: string, payload: Record<string, unknown>, referenceCode: string) => {
  const fields = type === 'community-topic' ? communityFields : type === 'startup-pitch' ? startupFields : [];
  const content = Object.fromEntries(fields.filter(field => payload[field] !== undefined).map(field => [field, payload[field]]));
  if (type === 'startup-pitch') return { ...content, id: referenceCode, status: 'active' };
  return content;
};
