/*
    v1.0.1
    + Added a table for reminders.
*/

CREATE TABLE `reminders` (
  `id` int(11) NOT NULL,
  `guild_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `details` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `timestamp` (`timestamp`),
  ADD KEY `guild_id` (`guild_id`);

UPDATE `meta` SET `value` = '1.0.1' WHERE `name` = 'schema_version';
