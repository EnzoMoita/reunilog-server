/*
  Warnings:

  - You are about to drop the `transcripts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "transcripts" DROP CONSTRAINT "transcripts_meeting_id_fkey";

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "summary" TEXT,
ADD COLUMN     "transcript" TEXT;

-- DropTable
DROP TABLE "transcripts";
