-- Add missing Role enum values
ALTER TYPE "Role" ADD VALUE 'LEARNER';
ALTER TYPE "Role" ADD VALUE 'STARTUP_FOUNDER';
ALTER TYPE "Role" ADD VALUE 'MENTOR';
ALTER TYPE "Role" ADD VALUE 'COMMUNITY_MEMBER';
ALTER TYPE "Role" ADD VALUE 'STAFF';
ALTER TYPE "Role" ADD VALUE 'PARTNER';
ALTER TYPE "Role" ADD VALUE 'PROGRAM_MANAGER';
ALTER TYPE "Role" ADD VALUE 'VISITOR';

-- Create SubmissionStatus enum
CREATE TYPE "SubmissionStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'COMPLETED'
);

-- Create Submission table
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "submitterId" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "Submission_referenceCode_key"
ON "Submission"("referenceCode");

CREATE INDEX "Submission_type_status_createdAt_idx"
ON "Submission"("type", "status", "createdAt");

CREATE INDEX "Submission_submitterId_createdAt_idx"
ON "Submission"("submitterId", "createdAt");

-- Add foreign keys
ALTER TABLE "Submission"
ADD CONSTRAINT "Submission_submitterId_fkey"
FOREIGN KEY ("submitterId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Submission"
ADD CONSTRAINT "Submission_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
