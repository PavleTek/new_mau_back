-- CreateTable
CREATE TABLE `Tbl_Centrals` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `CenName` VARCHAR(191) NOT NULL,
    `CenAddres` VARCHAR(191) NOT NULL,
    `CenLongitude` DOUBLE NOT NULL,
    `CenLatitude` DOUBLE NOT NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tbl_Generators_1` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Central_id` INTEGER NOT NULL,
    `FnPrefix` VARCHAR(191) NOT NULL,
    `Freq_Nominal` DOUBLE NOT NULL,
    `pelec_nominal` DOUBLE NOT NULL,
    `db_min` DOUBLE NOT NULL,
    `db_max` DOUBLE NOT NULL,
    `droop_max` DOUBLE NOT NULL,
    `droop_min` DOUBLE NOT NULL,
    `rise_time_max` DOUBLE NOT NULL,
    `rise_time_min` DOUBLE NOT NULL,
    `p_set_min` DOUBLE NOT NULL,
    `p_set_max` DOUBLE NOT NULL,
    `psetp_min_difference_pu` DOUBLE NOT NULL,
    `pearson_max` DOUBLE NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tbl_RAU` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Rau_type` VARCHAR(191) NOT NULL,
    `gen_id` INTEGER NOT NULL,
    `is_master` BOOLEAN NOT NULL,
    `scale_factor_u` DOUBLE NOT NULL,
    `scale_factor_i` DOUBLE NOT NULL,
    `p_set_scale` DOUBLE NOT NULL,
    `p_set_offset` DOUBLE NOT NULL,
    `RAUConf` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tbl_RawData` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Rau_id` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `serial_number` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `est_freq` DOUBLE NOT NULL,
    `est_p` DOUBLE NOT NULL,
    `est_q` DOUBLE NOT NULL,
    `est_s` DOUBLE NOT NULL,
    `est_fi` DOUBLE NOT NULL,
    `est_fi_deg` DOUBLE NOT NULL,
    `est_pset` DOUBLE NOT NULL,
    `channel_raw` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tbl_Rau_Type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `typename` VARCHAR(191) NOT NULL,
    `typeDescription` VARCHAR(191) NOT NULL,
    `conf_file` VARCHAR(191) NOT NULL,
    `tbl_RAUId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tbl_Generators_1` ADD CONSTRAINT `Tbl_Generators_1_Central_id_fkey` FOREIGN KEY (`Central_id`) REFERENCES `Tbl_Centrals`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tbl_RAU` ADD CONSTRAINT `Tbl_RAU_gen_id_fkey` FOREIGN KEY (`gen_id`) REFERENCES `Tbl_Generators_1`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tbl_RawData` ADD CONSTRAINT `Tbl_RawData_Rau_id_fkey` FOREIGN KEY (`Rau_id`) REFERENCES `Tbl_RAU`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tbl_Rau_Type` ADD CONSTRAINT `Tbl_Rau_Type_tbl_RAUId_fkey` FOREIGN KEY (`tbl_RAUId`) REFERENCES `Tbl_RAU`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
