-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "host" TEXT,
ADD COLUMN     "liveMode" BOOLEAN NOT NULL DEFAULT false;
