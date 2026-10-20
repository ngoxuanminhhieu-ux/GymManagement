CREATE DATABASE IF NOT EXISTS gym_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_db;

CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL
);

CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    package_id INT,
    join_date DATE NOT NULL,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
);

CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    trainer_id INT,
    workout_day VARCHAR(50) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    notes VARCHAR(255),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE
);

INSERT INTO packages (name, duration_months, price) VALUES
('Gói Cơ Bản (Gym)', 1, 500000),
('Gói Nâng Cao (Gym + Yoga)', 6, 2500000),
('Gói VIP 1-1 PT', 12, 12000000);

INSERT INTO trainers (full_name, specialty, phone) VALUES
('Nguyễn Văn Hùng', 'Thể hình & Tăng cơ', '0901234567'),
('Trần Thị Mai', 'Yoga & Giảm mỡ', '0912345678'),
('Lê Hoàng Nam', 'Cardio & Sức bền', '0987654321');

INSERT INTO members (full_name, phone, package_id, join_date) VALUES
('Phạm Minh Tuấn', '0933112233', 3, '2026-01-15'),
('Hoàng Thu Trang', '0944556677', 2, '2026-02-10');

INSERT INTO schedules (member_id, trainer_id, workout_day, time_slot, notes) VALUES
(1, 1, 'Thứ 2 - Thứ 4 - Thứ 6', '17:30 - 19:00', 'Tập thân trên & Ngực'),
(2, 2, 'Thứ 3 - Thứ 5 - Thứ 7', '08:00 - 09:30', 'Yoga trị liệu cột sống');
