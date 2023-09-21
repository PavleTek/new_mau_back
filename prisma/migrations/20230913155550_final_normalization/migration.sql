/*
  Warnings:

  - You are about to drop the column `RAUConf` on the `tbl_rau` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `tbl_rau` DROP COLUMN `RAUConf`,
    ADD COLUMN `rau_conf` VARCHAR(191) NULL;
