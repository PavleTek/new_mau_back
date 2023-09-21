-- CreateTable
CREATE TABLE `system` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `_key` VARCHAR(40) NOT NULL,
    `_value` TEXT NULL,

    UNIQUE INDEX `system__key_key`(`_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
