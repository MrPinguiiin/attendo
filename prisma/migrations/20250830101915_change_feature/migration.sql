-- AlterTable
ALTER TABLE "public"."OvertimeRequest" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Plan" ALTER COLUMN "features" SET NOT NULL,
ALTER COLUMN "features" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."UserSchedule" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);
