-- DropForeignKey
ALTER TABLE `tbl_rau` DROP FOREIGN KEY `Tbl_RAU_gen_id_fkey`;

-- AlterTable
ALTER TABLE `tbl_rau` MODIFY `gen_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Tbl_RAU` ADD CONSTRAINT `Tbl_RAU_gen_id_fkey` FOREIGN KEY (`gen_id`) REFERENCES `Tbl_Generators_1`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;
