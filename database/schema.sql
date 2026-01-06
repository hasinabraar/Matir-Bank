-- Matir Bank Database Schema
-- Feature 1: Visual Savings Ecosystem

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS matir_bank;
USE matir_bank;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100),
    PhoneNumber VARCHAR(20),
    Address TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Accounts Table
CREATE TABLE IF NOT EXISTS Accounts (
    AccountID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    AccountType VARCHAR(50) NOT NULL,
    CurrentBalance DECIMAL(10, 2) DEFAULT 0.00,
    DateOpened DATE NOT NULL,
    INDEX idx_userid (UserID),
    INDEX idx_accounttype (AccountType),
    CONSTRAINT fk_accounts_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
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
    UPDATE Accounts 
    SET CurrentBalance = CurrentBalance + NEW.Amount
    WHERE AccountID = NEW.AccountID;
    
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

-- Feature 1: Digital Samity (Lending Circles)
CREATE TABLE IF NOT EXISTS Samity_Groups (
    GroupID INT AUTO_INCREMENT PRIMARY KEY,
    GroupName VARCHAR(100) NOT NULL,
    LeaderID INT NOT NULL,
    CreationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_groupname (GroupName),
    INDEX idx_leader (LeaderID),
    CONSTRAINT fk_groups_leader FOREIGN KEY (LeaderID) REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Group_Members (
    MembershipID INT AUTO_INCREMENT PRIMARY KEY,
    GroupID INT NOT NULL,
    UserID INT NOT NULL,
    Role VARCHAR(50) DEFAULT 'Member',
    JoinDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_group_user (GroupID, UserID),
    INDEX idx_group (GroupID),
    INDEX idx_user (UserID),
    CONSTRAINT fk_members_group FOREIGN KEY (GroupID) REFERENCES Samity_Groups(GroupID) ON DELETE CASCADE,
    CONSTRAINT fk_members_user FOREIGN KEY (UserID) REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Group_Policies (
    PolicyID INT AUTO_INCREMENT PRIMARY KEY,
    GroupID INT NOT NULL,
    MaxLoanAmount DECIMAL(12, 2) NOT NULL,
    InterestRate DECIMAL(5, 2) NOT NULL,
    UNIQUE KEY uq_policy_group (GroupID),
    CONSTRAINT chk_maxloanamount CHECK (MaxLoanAmount >= 0),
    CONSTRAINT chk_interestrate CHECK (InterestRate >= 0 AND InterestRate <= 100),
    CONSTRAINT fk_policies_group FOREIGN KEY (GroupID) REFERENCES Samity_Groups(GroupID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feature 2: Direct-to-Market Linkage (Agro-E-Commerce)
CREATE TABLE IF NOT EXISTS Products (
    ProdID INT AUTO_INCREMENT PRIMARY KEY,
    SellerID INT NOT NULL,
    Category VARCHAR(100) NOT NULL,
    PricePerUnit DECIMAL(12, 2) NOT NULL,
    StockQty INT NOT NULL DEFAULT 0,
    INDEX idx_seller (SellerID),
    INDEX idx_category (Category),
    CONSTRAINT chk_priceperunit CHECK (PricePerUnit > 0),
    CONSTRAINT chk_stockqty CHECK (StockQty >= 0),
    CONSTRAINT fk_products_seller FOREIGN KEY (SellerID) REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Orders (
    OrderID INT AUTO_INCREMENT PRIMARY KEY,
    BuyerID INT NOT NULL,
    TotalAmount DECIMAL(12, 2) NOT NULL,
    OrderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    INDEX idx_buyer (BuyerID),
    INDEX idx_status (Status),
    CONSTRAINT chk_totalamount CHECK (TotalAmount >= 0),
    CONSTRAINT fk_orders_buyer FOREIGN KEY (BuyerID) REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Order_Items (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT NOT NULL,
    ProdID INT NOT NULL,
    Quantity INT NOT NULL,
    LineTotal DECIMAL(12, 2) NOT NULL,
    INDEX idx_order (OrderID),
    INDEX idx_prod (ProdID),
    CONSTRAINT chk_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_linetotal CHECK (LineTotal >= 0),
    CONSTRAINT fk_items_order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT fk_items_prod FOREIGN KEY (ProdID) REFERENCES Products(ProdID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feature 3: Cooperative Bulk Procurement (“Sammilito Kroy” Engine)
CREATE TABLE IF NOT EXISTS Suppliers (
    SupplierID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    MinOrderQty INT NOT NULL,
    Category VARCHAR(100) NOT NULL,
    CONSTRAINT chk_minorderqty CHECK (MinOrderQty > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Bulk_Master_Orders (
    MasterID INT AUTO_INCREMENT PRIMARY KEY,
    SupplierID INT NOT NULL,
    TotalQty INT NOT NULL,
    WholesalePrice DECIMAL(12, 2) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    INDEX idx_supplier (SupplierID),
    INDEX idx_bmo_status (Status),
    CONSTRAINT chk_totalqty CHECK (TotalQty > 0),
    CONSTRAINT chk_wholesaleprice CHECK (WholesalePrice >= 0),
    CONSTRAINT fk_bmo_supplier FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Individual_Requests (
    ReqID INT AUTO_INCREMENT PRIMARY KEY,
    MasterID INT NULL,
    SupplierID INT NOT NULL,
    UserID INT NOT NULL,
    ReqQty INT NOT NULL,
    EstCost DECIMAL(12, 2) NOT NULL,
    INDEX idx_master (MasterID),
    INDEX idx_supplier (SupplierID),
    INDEX idx_req_user (UserID),
    CONSTRAINT chk_reqqty CHECK (ReqQty > 0),
    CONSTRAINT chk_estcost CHECK (EstCost >= 0),
    CONSTRAINT fk_req_master FOREIGN KEY (MasterID) REFERENCES Bulk_Master_Orders(MasterID) ON DELETE SET NULL,
    CONSTRAINT fk_req_supplier FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    CONSTRAINT fk_req_user FOREIGN KEY (UserID) REFERENCES Users(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feature 4: Dynamic Credit Scoring (“Reputation View”)
CREATE TABLE IF NOT EXISTS Credit_Tiers (
    TierLevel INT PRIMARY KEY,
    MinScore DECIMAL(5, 2) NOT NULL,
    MaxLoanLimit DECIMAL(12, 2) NOT NULL,
    CONSTRAINT chk_min_score CHECK (MinScore >= 0),
    CONSTRAINT chk_maxloanlimit CHECK (MaxLoanLimit >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- View: User_Reputation (dynamic credit scoring)
DROP VIEW IF EXISTS User_Reputation;
CREATE VIEW User_Reputation AS
SELECT 
    u.UserID,
    COALESCE(s.savings_score, 0) * 0.4 +
    COALESCE(r.repayment_score, 0) * 0.4 +
    COALESCE(m.market_score, 0) * 0.2 AS CreditScore
FROM 
    Users u
LEFT JOIN (
    SELECT 
        a.UserID,
        CASE 
            WHEN COUNT(g.GoalID) = 0 THEN 0
            ELSE LEAST(100, AVG(CASE WHEN g.TargetAmount > 0 THEN (g.SavedAmount / g.TargetAmount) * 100 ELSE 0 END))
        END AS savings_score
    FROM Accounts a
    LEFT JOIN Savings_Goals g ON g.AccountID = a.AccountID
    GROUP BY a.UserID
) s ON s.UserID = u.UserID
LEFT JOIN (
    SELECT 
        a.UserID,
        LEAST(100, SUM(CASE WHEN t.Type = 'Repayment' THEN 1 ELSE 0 END) * 5) AS repayment_score
    FROM Accounts a
    LEFT JOIN Transactions t ON t.AccountID = a.AccountID
    GROUP BY a.UserID
) r ON r.UserID = u.UserID
LEFT JOIN (
    SELECT 
        u.UserID,
        LEAST(100,
            (COALESCE(buyer_orders.order_count, 0) * 10) +
            (COALESCE(seller_orders.sales_amount, 0) / 1000)
        ) AS market_score
    FROM Users u
    LEFT JOIN (
        SELECT o.BuyerID AS UserID, COUNT(*) AS order_count
        FROM Orders o
        GROUP BY o.BuyerID
    ) buyer_orders ON buyer_orders.UserID = u.UserID
    LEFT JOIN (
        SELECT p.SellerID AS UserID, COALESCE(SUM(oi.LineTotal),0) AS sales_amount
        FROM Products p
        LEFT JOIN Order_Items oi ON oi.ProdID = p.ProdID
        GROUP BY p.SellerID
    ) seller_orders ON seller_orders.UserID = u.UserID
) m ON m.UserID = u.UserID;

