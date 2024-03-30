/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `userInfo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "userInfo_user_id_key" ON "userInfo"("user_id");
