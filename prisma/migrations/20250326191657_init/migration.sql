-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NULL,
    `avatar_url` VARCHAR(191) NULL,
    `preferred_rating` ENUM('IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PASSWORD_RECOVER') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('GOOGLE') NOT NULL,
    `provider_account_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `accounts_provider_account_id_key`(`provider_account_id`),
    UNIQUE INDEX `accounts_provider_user_id_key`(`provider`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movies` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `original_title` VARCHAR(191) NOT NULL,
    `poster_path` VARCHAR(191) NULL,
    `backdrop_path` VARCHAR(191) NULL,
    `release_date` DATETIME(3) NOT NULL,
    `runtime` INTEGER NULL,
    `imdb_id` VARCHAR(191) NOT NULL,
    `tmdb_id` INTEGER NOT NULL,
    `imdb_rating` DOUBLE NULL,
    `tmdb_rating` DOUBLE NULL,
    `metacritic_rating` DOUBLE NULL,
    `rotten_tomatoes_rating` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `movies_imdb_id_key`(`imdb_id`),
    UNIQUE INDEX `movies_tmdb_id_key`(`tmdb_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genres` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tmdbId` INTEGER NOT NULL,

    UNIQUE INDEX `genres_tmdbId_key`(`tmdbId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tmdbId` INTEGER NOT NULL,
    `logo_path` VARCHAR(191) NULL,

    UNIQUE INDEX `companies_tmdbId_key`(`tmdbId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `people` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tmdbId` INTEGER NOT NULL,
    `gender` INTEGER NULL,
    `profile_path` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `people_tmdbId_key`(`tmdbId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_genres` (
    `movie_id` VARCHAR(191) NOT NULL,
    `genre_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `movie_genres_genre_id_movie_id_key`(`genre_id`, `movie_id`),
    PRIMARY KEY (`genre_id`, `movie_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_companies` (
    `movie_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `movie_companies_company_id_movie_id_key`(`company_id`, `movie_id`),
    PRIMARY KEY (`company_id`, `movie_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_ratings` (
    `value` DOUBLE NOT NULL,
    `movie_id` VARCHAR(191) NOT NULL,
    `rating_source` ENUM('IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC') NOT NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `movie_ratings_rating_source_movie_id_key`(`rating_source`, `movie_id`),
    PRIMARY KEY (`rating_source`, `movie_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_crew` (
    `person_id` VARCHAR(191) NOT NULL,
    `movie_id` VARCHAR(191) NOT NULL,
    `job` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `movie_crew_person_id_movie_id_job_key`(`person_id`, `movie_id`, `job`),
    PRIMARY KEY (`person_id`, `movie_id`, `job`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_cast` (
    `person_id` VARCHAR(191) NOT NULL,
    `movie_id` VARCHAR(191) NOT NULL,
    `character` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,

    UNIQUE INDEX `movie_cast_person_id_movie_id_key`(`person_id`, `movie_id`),
    PRIMARY KEY (`person_id`, `movie_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_person` (
    `person_id` VARCHAR(191) NOT NULL,
    `movie_id` VARCHAR(191) NOT NULL,
    `character` VARCHAR(191) NULL,
    `order` INTEGER NULL,
    `role` ENUM('ACTOR', 'ACTRESS', 'DIRECTOR', 'WRITER', 'PRODUCER') NOT NULL,

    UNIQUE INDEX `movie_person_person_id_movie_id_role_key`(`person_id`, `movie_id`, `role`),
    PRIMARY KEY (`person_id`, `movie_id`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lists` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('WATCHLIST', 'CUSTOM') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE') NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `list_movies` (
    `id` VARCHAR(191) NOT NULL,
    `movie_id` VARCHAR(191) NOT NULL,
    `list_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `list_movies_list_id_movie_id_key`(`list_id`, `movie_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `histories` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `movie_id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `review` VARCHAR(191) NULL,
    `rating` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `histories_movie_id_user_id_key`(`movie_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TagsOnHistory` (
    `historyId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`historyId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_genres` ADD CONSTRAINT `movie_genres_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_genres` ADD CONSTRAINT `movie_genres_genre_id_fkey` FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_companies` ADD CONSTRAINT `movie_companies_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_companies` ADD CONSTRAINT `movie_companies_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_ratings` ADD CONSTRAINT `movie_ratings_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_crew` ADD CONSTRAINT `movie_crew_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_crew` ADD CONSTRAINT `movie_crew_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_cast` ADD CONSTRAINT `movie_cast_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_cast` ADD CONSTRAINT `movie_cast_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_person` ADD CONSTRAINT `movie_person_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movie_person` ADD CONSTRAINT `movie_person_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lists` ADD CONSTRAINT `lists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_movies` ADD CONSTRAINT `list_movies_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_movies` ADD CONSTRAINT `list_movies_list_id_fkey` FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tags` ADD CONSTRAINT `tags_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `histories` ADD CONSTRAINT `histories_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `histories` ADD CONSTRAINT `histories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagsOnHistory` ADD CONSTRAINT `TagsOnHistory_historyId_fkey` FOREIGN KEY (`historyId`) REFERENCES `histories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagsOnHistory` ADD CONSTRAINT `TagsOnHistory_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
