-- Phase 1-4 completion: auth support, wedding members, smart planner data.

CREATE TYPE "FamilyPlanningRole" AS ENUM ('WEDDING_OWNER', 'BUDGET_MANAGER', 'VENDOR_COORDINATOR', 'GUEST_MANAGER', 'CATERING_COORDINATOR', 'SHOPPING_COORDINATOR', 'TRANSPORT_COORDINATOR', 'EVENT_DAY_COORDINATOR', 'VIEWER');
CREATE TYPE "MemberInviteStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED');
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'AWAITING_INFORMATION', 'AWAITING_APPROVAL', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ReminderStatus" AS ENUM ('SCHEDULED', 'SENT', 'CANCELLED');
CREATE TYPE "TaskBlockerStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeddingMember" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "FamilyPlanningRole" NOT NULL DEFAULT 'VIEWER',
    "status" "MemberInviteStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WeddingMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanningTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanningTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanningPhase" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanningPhase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "phaseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "whyImportant" TEXT,
    "instructions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL,
    "offsetDaysBeforeWedding" INTEGER NOT NULL DEFAULT 30,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedRole" "FamilyPlanningRole",
    "requiredEvidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "completionCriteria" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeddingPlan" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WeddingPlan_pkey" PRIMARY KEY ("id")
);

UPDATE "WeddingTask"
SET "status" = CASE
  WHEN "status" = 'DONE' THEN 'COMPLETED'
  WHEN "status" = 'PENDING' THEN 'NOT_STARTED'
  ELSE "status"
END;

ALTER TABLE "WeddingTask" DROP CONSTRAINT "WeddingTask_weddingId_fkey";
ALTER TABLE "WeddingTask" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "WeddingTask" ALTER COLUMN "status" TYPE "TaskStatus" USING ("status"::"TaskStatus");
ALTER TABLE "WeddingTask" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
ALTER TABLE "WeddingTask" ADD COLUMN "eventId" TEXT;
ALTER TABLE "WeddingTask" ADD COLUMN "whyImportant" TEXT;
ALTER TABLE "WeddingTask" ADD COLUMN "instructions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "WeddingTask" ADD COLUMN "category" TEXT;
ALTER TABLE "WeddingTask" ADD COLUMN "assignedUserId" TEXT;
ALTER TABLE "WeddingTask" ADD COLUMN "assignedRole" "FamilyPlanningRole";
ALTER TABLE "WeddingTask" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "WeddingTask" ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "WeddingTask" ADD COLUMN "requiredEvidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "WeddingTask" ADD COLUMN "completionCriteria" TEXT;
ALTER TABLE "WeddingTask" ADD COLUMN "requiresApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeddingTask" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED';
ALTER TABLE "WeddingTask" ADD COLUMN "relatedVendorId" TEXT;

CREATE TABLE "TaskStep" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "FamilyPlanningRole",
    "assigneeName" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskEvidence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskApproval" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskReminder" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskReminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskBlocker" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "blockerType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "responsiblePerson" TEXT,
    "expectedResolutionDate" TIMESTAMP(3),
    "status" "TaskBlockerStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskBlocker_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskStatusHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus" NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX "WeddingMember_weddingId_email_key" ON "WeddingMember"("weddingId", "email");
CREATE INDEX "WeddingMember_weddingId_role_idx" ON "WeddingMember"("weddingId", "role");
CREATE UNIQUE INDEX "WeddingPlan_weddingId_key" ON "WeddingPlan"("weddingId");
CREATE INDEX "WeddingTask_weddingId_status_idx" ON "WeddingTask"("weddingId", "status");
CREATE INDEX "WeddingTask_weddingId_dueDate_idx" ON "WeddingTask"("weddingId", "dueDate");
CREATE INDEX "WeddingTask_assignedUserId_idx" ON "WeddingTask"("assignedUserId");
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnTaskId_key" ON "TaskDependency"("taskId", "dependsOnTaskId");

ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeddingMember" ADD CONSTRAINT "WeddingMember_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeddingMember" ADD CONSTRAINT "WeddingMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlanningPhase" ADD CONSTRAINT "PlanningPhase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PlanningTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PlanningTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "PlanningPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeddingPlan" ADD CONSTRAINT "WeddingPlan_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeddingTask" ADD CONSTRAINT "WeddingTask_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeddingTask" ADD CONSTRAINT "WeddingTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "WeddingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeddingTask" ADD CONSTRAINT "WeddingTask_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskStep" ADD CONSTRAINT "TaskStep_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskApproval" ADD CONSTRAINT "TaskApproval_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskApproval" ADD CONSTRAINT "TaskApproval_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskReminder" ADD CONSTRAINT "TaskReminder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskBlocker" ADD CONSTRAINT "TaskBlocker_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WeddingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
