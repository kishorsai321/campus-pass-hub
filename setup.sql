-- Create the database
CREATE DATABASE IF NOT EXISTS campus_pass_db;
USE campus_pass_db;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    dateTime VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    totalTickets INT NOT NULL,
    availableTickets INT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eventId INT NOT NULL,
    eventName VARCHAR(255) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    userEmail VARCHAR(255) NOT NULL,
    userDepartment VARCHAR(255) NOT NULL,
    ticketsCount INT NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    paymentStatus ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
    stripeSessionId VARCHAR(255),
    bookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255)
);

-- Insert dummy admin (Replace with your UID after first login)
-- INSERT INTO admins (uid, email, name) VALUES ('your_firebase_uid_here', 'your_email@example.com', 'Admin User');

-- Insert dummy event
INSERT INTO events (name, department, dateTime, venue, price, totalTickets, availableTickets) 
VALUES ('Global Tech Seminar 2026', 'Computer Science & Engineering', 'May 15, 2026 • 10:00 AM', 'Main Auditorium', 25.00, 250, 250);
