-- CreateTable
CREATE TABLE "weekly_checkins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "energyLevel" INTEGER,
    "hungerLevel" INTEGER,
    "sleepQuality" INTEGER,
    "stressLevel" INTEGER,
    "adherenceLevel" TEXT,
    "mealsOutside" BOOLEAN NOT NULL DEFAULT false,
    "hadTravel" BOOLEAN NOT NULL DEFAULT false,
    "wasIll" BOOLEAN NOT NULL DEFAULT false,
    "hormonalChanges" BOOLEAN NOT NULL DEFAULT false,
    "emotionalStress" BOOLEAN NOT NULL DEFAULT false,
    "poorSleep" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "selfPerception" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_versions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "nutritionPlan" JSONB NOT NULL,
    "trainingPlan" JSONB NOT NULL,
    "supplementPlan" JSONB,
    "dailyCalories" INTEGER,
    "proteinGrams" INTEGER,
    "carbsGrams" INTEGER,
    "fatGrams" INTEGER,
    "engineVersion" TEXT NOT NULL,
    "rulePackVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyCheckinId" TEXT,
    "isInitialPlan" BOOLEAN NOT NULL DEFAULT false,
    "inputSnapshot" JSONB NOT NULL,
    "derivedSignals" JSONB NOT NULL,
    "rulesFired" JSONB NOT NULL,
    "guardrailsApplied" JSONB NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "rulePackVersion" TEXT NOT NULL,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_plan_pointers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_plan_pointers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mealType" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "tags" TEXT[],
    "excludedFor" TEXT[],
    "ingredients" JSONB NOT NULL,
    "instructions" TEXT,
    "prepTimeMin" INTEGER,
    "cookTimeMin" INTEGER,
    "servingSize" TEXT,
    "servingsCount" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysPerWeek" INTEGER NOT NULL,
    "programType" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "suitableFor" TEXT[],
    "equipmentNeeded" TEXT[],
    "weeklySchedule" JSONB NOT NULL,
    "progressionRules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_checkins_userId_idx" ON "weekly_checkins"("userId");

-- CreateIndex
CREATE INDEX "weekly_checkins_userId_weekNumber_idx" ON "weekly_checkins"("userId", "weekNumber");

-- CreateIndex
CREATE INDEX "plan_versions_userId_idx" ON "plan_versions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_versions_userId_version_key" ON "plan_versions"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "decision_records_weeklyCheckinId_key" ON "decision_records"("weeklyCheckinId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_records_planVersionId_key" ON "decision_records"("planVersionId");

-- CreateIndex
CREATE INDEX "decision_records_userId_idx" ON "decision_records"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "active_plan_pointers_userId_key" ON "active_plan_pointers"("userId");

-- CreateIndex
CREATE INDEX "meal_templates_mealType_idx" ON "meal_templates"("mealType");

-- AddForeignKey
ALTER TABLE "weekly_checkins" ADD CONSTRAINT "weekly_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_records" ADD CONSTRAINT "decision_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_records" ADD CONSTRAINT "decision_records_weeklyCheckinId_fkey" FOREIGN KEY ("weeklyCheckinId") REFERENCES "weekly_checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_records" ADD CONSTRAINT "decision_records_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_plan_pointers" ADD CONSTRAINT "active_plan_pointers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_plan_pointers" ADD CONSTRAINT "active_plan_pointers_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
