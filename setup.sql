-- Setup script for Campus Pass MySQL Database
CREATE DATABASE IF NOT EXISTS campus_pass_db;
USE campus_pass_db;

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    dateTime VARCHAR(100) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    totalTickets INT NOT NULL,
    availableTickets INT NOT NULL,
    imageUrl VARCHAR(500),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eventId INT NOT NULL,
    eventName VARCHAR(255) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    userEmail VARCHAR(255) NOT NULL,
    userDepartment VARCHAR(100),
    ticketsCount INT NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    paymentStatus ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    bookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
);

-- 3. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL
);

-- 4. Sample Data
INSERT INTO events (name, department, dateTime, venue, price, totalTickets, availableTickets, imageUrl, lat, lng)
VALUES 
('Global Tech Seminar 2026', 'Computer Science', 'May 15, 2026 • 10:00 AM', 'Main Auditorium', 499.00, 250, 250, 'https://images.unsplash.com/photo-1540575861501-7ad058bf30ad?auto=format&fit=crop&q=80&w=1000', 17.3850, 78.4867),
('Intra-College Coding Hackathon', 'Information Technology', 'May 20, 2026 • 09:00 AM', 'Computer Lab 3', 199.00, 100, 45, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000', 17.3860, 78.4870),
('Annual Cultural Fest', 'Arts & Culture', 'June 10, 2026 • 5:30 PM', 'College Grounds', 999.00, 1000, 850, 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=1000', 17.3870, 78.4890),
('Robotics Workshop', 'Mechanical Engineering', 'June 25, 2026 • 11:00 AM', 'Engineering Hall', 750.00, 50, 20, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000', 17.3880, 78.4900);
