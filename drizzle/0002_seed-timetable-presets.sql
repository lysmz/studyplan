INSERT INTO `timetable_presets` (`id`, `name`, `description`, `faculty`) VALUES
	(1, 'Informatik 1. Semester', 'Stundenplan für das erste Semester Informatik', 'Fakultät für Informatik'),
	(2, 'Informatik 3. Semester', 'Stundenplan für das dritte Semester Informatik', 'Fakultät für Informatik'),
	(3, 'Wirtschaftsinformatik 1. Semester', 'Stundenplan für das erste Semester WI', 'Fakultät für Wirtschaft'),
	(4, 'Mathematik 1. Semester', 'Stundenplan für das erste Semester Mathematik', 'Fakultät für Mathematik')
ON CONFLICT (`id`) DO UPDATE SET
	`name` = excluded.`name`,
	`description` = excluded.`description`,
	`faculty` = excluded.`faculty`;
--> statement-breakpoint
INSERT INTO `preset_entries` (`id`, `preset_id`, `course_name`, `week_day`, `time_slot`, `room`, `professor`) VALUES
	(1, 1, 'Mathematik I', 'monday', 'slot1', 'H1', 'Prof. Müller'),
	(2, 1, 'Programmierung I', 'monday', 'slot3', 'PC-Pool A', 'Prof. Weber'),
	(3, 1, 'Technische Grundlagen', 'tuesday', 'slot2', 'H3', 'Prof. Schmidt'),
	(4, 1, 'Mathematik I', 'wednesday', 'slot1', 'H1', 'Prof. Müller'),
	(5, 1, 'Programmierung I', 'wednesday', 'slot4', 'PC-Pool A', 'Prof. Weber'),
	(6, 1, 'Technische Grundlagen', 'thursday', 'slot2', 'H3', 'Prof. Schmidt'),
	(7, 1, 'Mathematik I Übung', 'friday', 'slot1', 'Ü-Raum 1', 'Dr. Klein'),
	(8, 2, 'Algorithmen & Datenstrukturen', 'monday', 'slot2', 'H2', 'Prof. Bauer'),
	(9, 2, 'Rechnernetze', 'tuesday', 'slot1', 'H4', 'Prof. Fischer'),
	(10, 2, 'Betriebssysteme', 'tuesday', 'slot3', 'H4', 'Prof. Wagner'),
	(11, 2, 'Algorithmen Übung', 'wednesday', 'slot2', 'PC-Pool B', 'Dr. Richter'),
	(12, 2, 'Rechnernetze', 'thursday', 'slot1', 'H4', 'Prof. Fischer'),
	(13, 2, 'Betriebssysteme Praktikum', 'friday', 'slot4', 'PC-Labor', 'Dr. Hoffmann'),
	(14, 3, 'Grundlagen BWL', 'monday', 'slot1', 'WI-H1', 'Prof. Braun'),
	(15, 3, 'Mathematik für WI', 'monday', 'slot3', 'H5', 'Prof. Müller'),
	(16, 3, 'Programmierung', 'tuesday', 'slot2', 'PC-Pool C', 'Prof. Lehmann'),
	(17, 3, 'Grundlagen BWL', 'wednesday', 'slot1', 'WI-H1', 'Prof. Braun'),
	(18, 3, 'Mathematik für WI', 'thursday', 'slot3', 'H5', 'Prof. Müller'),
	(19, 3, 'Programmierung Übung', 'friday', 'slot2', 'PC-Pool C', 'Dr. Neumann'),
	(20, 4, 'Analysis I', 'monday', 'slot1', 'M-H1', 'Prof. Kaiser'),
	(21, 4, 'Lineare Algebra I', 'monday', 'slot3', 'M-H2', 'Prof. Schulz'),
	(22, 4, 'Analysis I', 'wednesday', 'slot1', 'M-H1', 'Prof. Kaiser'),
	(23, 4, 'Lineare Algebra I', 'wednesday', 'slot3', 'M-H2', 'Prof. Schulz'),
	(24, 4, 'Analysis I Übung', 'friday', 'slot2', 'Ü-M1', 'Dr. Hartmann'),
	(25, 4, 'Lineare Algebra I Übung', 'friday', 'slot4', 'Ü-M2', 'Dr. Zimmermann')
ON CONFLICT (`id`) DO UPDATE SET
	`preset_id` = excluded.`preset_id`,
	`course_name` = excluded.`course_name`,
	`week_day` = excluded.`week_day`,
	`time_slot` = excluded.`time_slot`,
	`room` = excluded.`room`,
	`professor` = excluded.`professor`;
