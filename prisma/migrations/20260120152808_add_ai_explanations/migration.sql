-- CreateTable
CREATE TABLE "user_journey_summaries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalWeeks" INTEGER NOT NULL DEFAULT 0,
    "startingWeight" DOUBLE PRECISION,
    "currentWeight" DOUBLE PRECISION,
    "totalWeightChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWaistChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageAdherence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consecutiveGoodWeeks" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "plateauWeeksCount" INTEGER NOT NULL DEFAULT 0,
    "currentPlateauWeeks" INTEGER NOT NULL DEFAULT 0,
    "lowestWeight" DOUBLE PRECISION,
    "lowestWeightWeek" INTEGER,
    "lowestWaist" DOUBLE PRECISION,
    "lowestWaistWeek" INTEGER,
    "bestAdherenceWeek" INTEGER,
    "hardestWeek" INTEGER,
    "firstWeekDate" TIMESTAMP(3),
    "lastCheckinDate" TIMESTAMP(3),
    "weeklyTrends" JSONB NOT NULL DEFAULT '[]',
    "notableEvents" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_journey_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_explanations" (
    "id" TEXT NOT NULL,
    "decisionRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "explanationText" TEXT NOT NULL,
    "progressSummary" TEXT,
    "whyThisDecision" TEXT,
    "whatToDoNext" JSONB,
    "motivationalNote" TEXT,
    "safetyNote" TEXT,
    "needsMedicalDisclaimer" BOOLEAN NOT NULL DEFAULT false,
    "shouldHoldChanges" BOOLEAN NOT NULL DEFAULT false,
    "promptVersion" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "generationTimeMs" INTEGER,
    "contextSnapshot" JSONB,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "fallbackReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_journey_summaries_userId_key" ON "user_journey_summaries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_explanations_decisionRecordId_key" ON "ai_explanations"("decisionRecordId");

-- CreateIndex
CREATE INDEX "ai_explanations_userId_idx" ON "ai_explanations"("userId");

-- CreateIndex
CREATE INDEX "ai_explanations_decisionRecordId_idx" ON "ai_explanations"("decisionRecordId");

-- AddForeignKey
ALTER TABLE "user_journey_summaries" ADD CONSTRAINT "user_journey_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_explanations" ADD CONSTRAINT "ai_explanations_decisionRecordId_fkey" FOREIGN KEY ("decisionRecordId") REFERENCES "decision_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_explanations" ADD CONSTRAINT "ai_explanations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
