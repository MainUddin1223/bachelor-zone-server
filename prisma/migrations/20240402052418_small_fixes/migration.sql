-- AddForeignKey
ALTER TABLE "userInfo" ADD CONSTRAINT "userInfo_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
