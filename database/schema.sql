-- Matir Bank Database Schema
-- Feature 1: Visual Savings Ecosystem

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS matir_bank;
USE matir_bank;

-- Accounts Table
CREATE TABLE Accounts (
    AccountID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    AccountType VARCHAR(50) NOT NULL,
    CurrentBalance DECIMAL(10, 2) DEFAULT 0.00,
    DateOpened DATE NOT NULL,
    INDEX idx_userid (UserID),
    INDEX idx_accounttype (AccountType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transactions Table
CREATE TABLE Transactions (
    TransID INT AUTO_INCREMENT PRIMARY KEY,
    AccountID INT NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Type VARCHAR(20) NOT NULL DEFAULT 'Deposit',
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReferenceID VARCHAR(100),
    FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID) ON DELETE CASCADE,
    INDEX idx_accountid (AccountID),
    INDEX idx_timestamp (Timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Savings_Goals Table
CREATE TABLE Savings_Goals (
    GoalID INT AUTO_INCREMENT PRIMARY KEY,
    AccountID INT NOT NULL,
    TargetAmount DECIMAL(10, 2) NOT NULL,
    SavedAmount DECIMAL(10, 2) DEFAULT 0.00,
    Deadline DATE,
    Status VARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID) ON DELETE CASCADE,
    INDEX idx_accountid (AccountID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: Update Balance and Goal Progress on Transaction Insert
DELIMITER $$

CREATE TRIGGER UpdateBalance AFTER INSERT ON Transactions
FOR EACH ROW
BEGIN
    -- Update Account Balance
    UPDATE Accounts 
    SET CurrentBalance = CurrentBalance + NEW.Amount
    WHERE AccountID = NEW.AccountID;
    
    -- Update Savings Goal Progress (only for deposits)
    IF NEW.Type = 'Deposit' THEN
        UPDATE Savings_Goals 
        SET SavedAmount = SavedAmount + NEW.Amount,
            Status = CASE 
                WHEN SavedAmount + NEW.Amount >= TargetAmount THEN 'Completed'
                ELSE Status
            END
        WHERE AccountID = NEW.AccountID 
        AND Status = 'Active';
    END IF;
END$$

DELIMITER ;

