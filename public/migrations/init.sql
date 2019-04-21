CREATE TABLE IF NOT EXISTS `guilds` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voice` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifications` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `quotes` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

TRUNCATE TABLE `guilds`;
CREATE TABLE IF NOT EXISTS `members` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guild_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `inventory` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` mediumint(8) UNSIGNED NOT NULL,
  `experience` mediumint(8) UNSIGNED NOT NULL,
  `exp_award_time` bigint(20) UNSIGNED NOT NULL,
  `redeem_time` bigint(20) UNSIGNED NOT NULL,
  `name_history` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastfm_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_year` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`id`,`guild_id`),
  KEY `id` (`id`),
  KEY `guild_id` (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

TRUNCATE TABLE `members`;
CREATE TABLE IF NOT EXISTS `meta` (
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

TRUNCATE TABLE `meta`;
INSERT INTO `meta` (`name`, `value`) VALUES
('schema_version', '1.0');
