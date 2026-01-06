-- Seed Initial User
USE matir_bank;
INSERT INTO Users (UserID, Username, PasswordHash, FullName, Email, PhoneNumber, Address)
VALUES (1, 'demo_user', 'hash_placeholder', 'Demo User', 'demo@matirbank.com', '01700000000', 'Dhaka, Bangladesh')
ON DUPLICATE KEY UPDATE FullName = VALUES(FullName);
