-- Seed Initial User
USE matir_bank;
INSERT INTO Users (UserID, Username, PasswordHash, FullName, Email, PhoneNumber, Address, Role)
VALUES (1, 'demo_user', 'hash_placeholder', 'Demo User', 'demo@matirbank.com', '01700000000', 'Dhaka, Bangladesh', 'User')
ON DUPLICATE KEY UPDATE Role = 'User';

INSERT INTO Users (UserID, Username, PasswordHash, FullName, Email, PhoneNumber, Address, Role)
VALUES (2, 'admin', 'admin123', 'System Admin', 'admin@matirbank.com', '01700000001', 'Admin HQ', 'Admin')
ON DUPLICATE KEY UPDATE Role = 'Admin', PasswordHash = 'admin123';
