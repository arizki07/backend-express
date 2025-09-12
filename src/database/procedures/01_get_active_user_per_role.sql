DELIMITER $$

CREATE PROCEDURE GetActiveUserCountPerRole()
BEGIN
    SELECT 
        role, 
        COUNT(*) AS total_active
    FROM users
    WHERE deleted_at IS NULL
    GROUP BY role;
END $$

DELIMITER ;
