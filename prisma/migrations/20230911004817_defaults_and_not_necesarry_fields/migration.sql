/*
  Warnings:

  - You are about to drop the column `Rau_type` on the `tbl_rau` table. All the data in the column will be lost.
  - You are about to drop the column `tbl_RAUId` on the `tbl_rau_type` table. All the data in the column will be lost.
  - Added the required column `rau_type_id` to the `Tbl_RAU` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `tbl_rau_type` DROP FOREIGN KEY `Tbl_Rau_Type_tbl_RAUId_fkey`;

-- AlterTable
ALTER TABLE `tbl_centrals` MODIFY `CenLongitude` DOUBLE NULL,
    MODIFY `CenLatitude` DOUBLE NULL;

-- AlterTable
ALTER TABLE `tbl_generators_1` MODIFY `Freq_Nominal` DOUBLE NULL,
    MODIFY `pelec_nominal` DOUBLE NULL,
    MODIFY `db_min` DOUBLE NULL,
    MODIFY `db_max` DOUBLE NULL,
    MODIFY `droop_max` DOUBLE NULL,
    MODIFY `droop_min` DOUBLE NULL,
    MODIFY `rise_time_max` DOUBLE NULL,
    MODIFY `rise_time_min` DOUBLE NULL,
    MODIFY `p_set_min` DOUBLE NULL,
    MODIFY `p_set_max` DOUBLE NULL,
    MODIFY `psetp_min_difference_pu` DOUBLE NULL,
    MODIFY `pearson_max` DOUBLE NULL;

-- AlterTable
ALTER TABLE `tbl_rau` DROP COLUMN `Rau_type`,
    ADD COLUMN `rau_type_id` INTEGER NOT NULL,
    MODIFY `is_master` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `scale_factor_u` DOUBLE NULL,
    MODIFY `scale_factor_i` DOUBLE NULL,
    MODIFY `p_set_scale` DOUBLE NULL,
    MODIFY `p_set_offset` DOUBLE NULL,
    MODIFY `RAUConf` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tbl_rau_type` DROP COLUMN `tbl_RAUId`;

-- AlterTable
ALTER TABLE `tbl_rawdata` MODIFY `est_freq` DOUBLE NULL,
    MODIFY `est_p` DOUBLE NULL,
    MODIFY `est_q` DOUBLE NULL,
    MODIFY `est_s` DOUBLE NULL,
    MODIFY `est_fi` DOUBLE NULL,
    MODIFY `est_fi_deg` DOUBLE NULL,
    MODIFY `est_pset` DOUBLE NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `is_admin` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `mandatory` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `Tbl_RAU` ADD CONSTRAINT `Tbl_RAU_rau_type_id_fkey` FOREIGN KEY (`rau_type_id`) REFERENCES `Tbl_Rau_Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
