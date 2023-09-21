/*
  Warnings:

  - The primary key for the `tbl_centrals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `CenAddres` on the `tbl_centrals` table. All the data in the column will be lost.
  - You are about to drop the column `CenLatitude` on the `tbl_centrals` table. All the data in the column will be lost.
  - You are about to drop the column `CenLongitude` on the `tbl_centrals` table. All the data in the column will be lost.
  - You are about to drop the column `CenName` on the `tbl_centrals` table. All the data in the column will be lost.
  - You are about to drop the column `ID` on the `tbl_centrals` table. All the data in the column will be lost.
  - The primary key for the `tbl_generators_1` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Central_id` on the `tbl_generators_1` table. All the data in the column will be lost.
  - You are about to drop the column `FnPrefix` on the `tbl_generators_1` table. All the data in the column will be lost.
  - You are about to drop the column `Freq_Nominal` on the `tbl_generators_1` table. All the data in the column will be lost.
  - You are about to drop the column `Id` on the `tbl_generators_1` table. All the data in the column will be lost.
  - You are about to drop the column `Name` on the `tbl_generators_1` table. All the data in the column will be lost.
  - The primary key for the `tbl_rau` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Id` on the `tbl_rau` table. All the data in the column will be lost.
  - You are about to drop the column `typeDescription` on the `tbl_rau_type` table. All the data in the column will be lost.
  - You are about to drop the column `typename` on the `tbl_rau_type` table. All the data in the column will be lost.
  - The primary key for the `tbl_rawdata` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Id` on the `tbl_rawdata` table. All the data in the column will be lost.
  - You are about to drop the column `Rau_id` on the `tbl_rawdata` table. All the data in the column will be lost.
  - Added the required column `cen_address` to the `Tbl_Centrals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cen_name` to the `Tbl_Centrals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Tbl_Centrals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `central_id` to the `Tbl_Generators_1` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fn_prefix` to the `Tbl_Generators_1` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Tbl_Generators_1` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Tbl_Generators_1` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Tbl_RAU` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_description` to the `Tbl_Rau_Type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_name` to the `Tbl_Rau_Type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Tbl_RawData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rau_id` to the `Tbl_RawData` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `tbl_generators_1` DROP FOREIGN KEY `Tbl_Generators_1_Central_id_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_rau` DROP FOREIGN KEY `Tbl_RAU_gen_id_fkey`;

-- DropForeignKey
ALTER TABLE `tbl_rawdata` DROP FOREIGN KEY `Tbl_RawData_Rau_id_fkey`;

-- AlterTable
ALTER TABLE `tbl_centrals` DROP PRIMARY KEY,
    DROP COLUMN `CenAddres`,
    DROP COLUMN `CenLatitude`,
    DROP COLUMN `CenLongitude`,
    DROP COLUMN `CenName`,
    DROP COLUMN `ID`,
    ADD COLUMN `cen_address` VARCHAR(191) NOT NULL,
    ADD COLUMN `cen_latitude` DOUBLE NULL,
    ADD COLUMN `cen_longitude` DOUBLE NULL,
    ADD COLUMN `cen_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `tbl_generators_1` DROP PRIMARY KEY,
    DROP COLUMN `Central_id`,
    DROP COLUMN `FnPrefix`,
    DROP COLUMN `Freq_Nominal`,
    DROP COLUMN `Id`,
    DROP COLUMN `Name`,
    ADD COLUMN `central_id` INTEGER NOT NULL,
    ADD COLUMN `fn_prefix` VARCHAR(191) NOT NULL,
    ADD COLUMN `freq_nominal` DOUBLE NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `tbl_rau` DROP PRIMARY KEY,
    DROP COLUMN `Id`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `tbl_rau_type` DROP COLUMN `typeDescription`,
    DROP COLUMN `typename`,
    ADD COLUMN `type_description` VARCHAR(191) NOT NULL,
    ADD COLUMN `type_name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tbl_rawdata` DROP PRIMARY KEY,
    DROP COLUMN `Id`,
    DROP COLUMN `Rau_id`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `rau_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Tbl_Generators_1` ADD CONSTRAINT `Tbl_Generators_1_central_id_fkey` FOREIGN KEY (`central_id`) REFERENCES `Tbl_Centrals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tbl_RAU` ADD CONSTRAINT `Tbl_RAU_gen_id_fkey` FOREIGN KEY (`gen_id`) REFERENCES `Tbl_Generators_1`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tbl_RawData` ADD CONSTRAINT `Tbl_RawData_rau_id_fkey` FOREIGN KEY (`rau_id`) REFERENCES `Tbl_RAU`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
