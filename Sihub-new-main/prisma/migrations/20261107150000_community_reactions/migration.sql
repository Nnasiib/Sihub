CREATE TABLE "CommunityReaction" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityReaction_entryId_userId_key" ON "CommunityReaction"("entryId", "userId");
CREATE INDEX "CommunityReaction_userId_createdAt_idx" ON "CommunityReaction"("userId", "createdAt");

ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "CmsEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
