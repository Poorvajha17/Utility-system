const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "123sql",
    database: "utility_system",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Check database connection
db.getConnection()
    .then(() => console.log("Connected to MySQL database"))
    .catch((err) => {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    });

// **Signup API**
app.post("/signup", async (req, res) => {
   const { name, username, password, role, phone, position, department, serviceTypes } = req.body;

   try {
       // Validate role
       if (!["Customer", "Employee", "Admin"].includes(role)) {
           return res.status(400).json({ message: "Invalid role specified" });
       }

       // Check if user exists
       const [existingUser] = await db.query("SELECT * FROM Users WHERE Username = ?", [username]);
       if (existingUser.length > 0) {
           return res.status(400).json({ message: "Username already exists" });
       }

       // Create user
       const [userResult] = await db.query(
           "INSERT INTO Users (Name, Username, Password, Role, Phone) VALUES (?, ?, ?, ?, ?)",
           [name, username, password, role, phone]
       );

       const userId = userResult.insertId;

       if (role === "Employee") {
           // Create employee
           const [employeeResult] = await db.query(
               "INSERT INTO Employees (User_ID, Position, Department, Hire_Date) VALUES (?, ?, ?, CURDATE())",
               [userId, position, department]
           );
           
           const employeeId = employeeResult.insertId;

           // Add service proficiencies if provided
           if (serviceTypes && serviceTypes.length > 0) {
               const validServices = ["Electricity", "Water", "Telecom", "Gas"];
               const inserts = serviceTypes
                   .filter(type => validServices.includes(type))
                   .map(type => [employeeId, type, 3]); // Default proficiency 3

               if (inserts.length > 0) {
                   await db.query(
                       "INSERT INTO employee_skills (Employee_ID, Service_Type, Proficiency) VALUES ?",
                       [inserts]
                   );
               }
           }
       }

       res.status(201).json({ message: "User registered successfully" });

   } catch (error) {
       console.error("Signup error:", error);
       res.status(500).json({ message: "Internal server error" });
   }
});

// **Login API**
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Fetch user details
        const [user] = await db.query("SELECT * FROM Users WHERE Username = ?", [username]);

        if (user.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        // Compare passwords (⚠️ Consider using bcrypt for security)
        if (password !== user[0].Password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token (No need to fetch custId)
        const token = jwt.sign(
            { userId: user[0].User_ID, username, role: user[0].Role }, 
            "your_secret_key", 
            { expiresIn: "1h" }
        );

        res.status(200).json({ 
            message: "Login successful", 
            token, 
            userId: user[0].User_ID,
            username,  // 🔹 Send username instead of custId
            role: user[0].Role
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/getEnergyConsumption/:username/:monthYear", async (req, res) => {
    const { username, monthYear } = req.params;

    try {
        const [rows] = await db.query("CALL GetEnergyConsumption(?, ?)", [username, monthYear]);

        console.log("Energy Consumption Data:", rows[0]); // ✅ Debug log

        if (rows[0].length === 0) {
            return res.status(404).json({ message: "No consumption data found." });
        }

        res.status(200).json(rows[0]); // Return the result set from stored procedure
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// In your payment endpoints, add validation:
app.post("/make-payment", async (req, res) => {
    const { username, billId, amount, paymentMethod } = req.body;
  
    // Validate amount is numeric
    if (isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }
  
    // Convert to number if it's a string
    const paymentAmount = parseFloat(amount);
    
    // Rest of your endpoint logic
    try {
      const [result] = await db.query("CALL MakePayment(?, ?, ?, ?)", [
        username, 
        billId, 
        paymentAmount, // Use the converted number
        paymentMethod
      ]);
      res.status(200).json({ message: "Payment successful", result });
    } catch (error) {
      console.error("Payment error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
// Get Payment History API
app.get("/payment-history/:username", async (req, res) => {
    const { username } = req.params;
    
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    try {
        const [result] = await db.query("CALL GetPaymentHistory(?)", [username]);

        if (result[0].length === 0) {
            return res.status(404).json({ message: "No payment history found" });
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error("❌ Error fetching payment history:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get Pending Bills API
app.get("/pending-bills/:username", async (req, res) => {
    const { username } = req.params;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    try {
        const [result] = await db.query("CALL GetCustomerBills(?)", [username]);

        if (result[0].length === 0) {
            return res.status(404).json({ message: "No pending bills found" });
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error("❌ Error fetching pending bills:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get("/getCustId/:username", async (req, res) => {
    const { username } = req.params;

    try {
        const [user] = await db.query("SELECT Customer_ID FROM Customers WHERE User_ID = (SELECT User_ID FROM Users WHERE Username = ?)", [username]);

        if (user.length === 0) {
            return res.status(404).json({ message: "Customer ID not found" });
        }

        res.status(200).json({ custId: user[0].Customer_ID });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Report Failure - Enhanced with auto-assignment
app.post("/report-failure", async (req, res) => {
   const { username, serviceType, description } = req.body;

   if (!username || !serviceType || !description) {
       return res.status(400).json({ message: "All fields are required" });
   }

   try {
       const [result] = await db.query("CALL ReportFailure(?, ?, ?)", 
           [username, serviceType, description]);
       
       // The stored procedure now returns the created report
       res.status(201).json({
           message: "Failure reported successfully",
           report: result[0][0] // First row of first result set
       });
   } catch (error) {
       console.error("Error reporting failure:", error);
       res.status(500).json({ 
           message: "Internal Server Error",
           error: error.message 
       });
   }
});
// Get Failure Reports - Enhanced with assignment info
app.get("/failure-reports/:username", async (req, res) => {
   const { username } = req.params;
   const { status } = req.query; // Optional status filter

   try {
       const [reports] = await db.query(
           `SELECT 
               fr.Report_ID,
               fr.Service_Type,
               fr.Description,
               fr.Report_Date,
               fr.Status,
               fr.Resolution_Notes,
               fr.Resolution_Date,
               emp.Name AS assigned_employee,
               fr.Assigned_Employee_ID
            FROM failure_reports fr
            JOIN Customers c ON fr.Customer_ID = c.Customer_ID
            JOIN Users u ON c.User_ID = u.User_ID
            LEFT JOIN Employees e ON fr.Assigned_Employee_ID = e.Employee_ID
            LEFT JOIN Users emp ON e.User_ID = emp.User_ID
            WHERE u.Username = ?
            ${status ? 'AND fr.Status = ?' : ''}
            ORDER BY fr.Report_Date DESC`,
           status ? [username, status] : [username]
       );

       res.status(200).json(reports);
   } catch (error) {
       console.error("Error fetching failure reports:", error);
       res.status(500).json({ message: "Internal Server Error" });
   }
});



app.put("/update-info", async (req, res) => {
    const { username, password, phone, address, classification } = req.body;

    if (!username) {
        return res.status(400).json({ 
            success: false, 
            message: "Username is required"
        });
    }

    try {
        const [results] = await db.query("CALL UpdateUserInfoSelective(?, ?, ?, ?, ?)", [
            username,
            password || null,
            phone || null,
            address || null,
            classification || null
        ]);

        res.status(200).json({
            success: true,
            message: "Update successful"
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
app.get('/monthly-consumption/:username', async (req, res) => {
   try {
       const { username } = req.params;
       
       // Call the stored procedure
       const [results] = await db.query('CALL GetMonthlyConsumption(?)', [username]);
       
       // The actual consumption data is in the second result set
       const consumptionData = Array.isArray(results[1]) ? results[1] : [];
       
       // Create a map of all required service types with default values
       const serviceTypes = ['Electricity', 'Water', 'Gas', 'Telecom'];
       const defaultData = serviceTypes.map(service => ({
           Service_Type: service,
           Usage_Amount: 0,
           Classification: 'N/A'
       }));
       
       // Merge actual data with defaults
       const mergedData = defaultData.map(defaultItem => {
           const foundItem = consumptionData.find(item => 
               item.Service_Type === defaultItem.Service_Type
           );
           return foundItem ? {
               Service_Type: foundItem.Service_Type,
               Usage_Amount: Number(foundItem.Usage_Amount) || 0,
               Classification: foundItem.Classification || 'N/A'
           } : defaultItem;
       });
       
       res.json(mergedData);
   } catch (error) {
       console.error('Error:', error);
       res.status(500).json({ 
           message: 'Error fetching consumption data',
           error: error.message
       });
   }
});





app.get("/employee-profile-by-username/:username", async (req, res) => {
    const { username } = req.params;

    try {
        const [result] = await db.query(
            `SELECT e.Employee_ID 
             FROM Employees e
             JOIN Users u ON e.User_ID = u.User_ID
             WHERE u.Username = ?`, 
            [username]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error("Error fetching employee profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Employee Stats
app.get("/employee-stats/:employeeId", async (req, res) => {
    const { employeeId } = req.params;

    // Validate employeeId is a number
    if (isNaN(employeeId)) {
        return res.status(400).json({ message: "Invalid employee ID" });
    }

    try {
        const [totalReports] = await db.query(
            "SELECT COUNT(*) AS total FROM failure_reports"
        );
        const [resolvedReports] = await db.query(
            "SELECT COUNT(*) AS resolved FROM failure_reports WHERE Status = 'Resolved'"
        );
        const [pendingReports] = await db.query(
            "SELECT COUNT(*) AS pending FROM failure_reports WHERE Status = 'Pending'"
        );
        const [totalPayments] = await db.query(
            `SELECT COALESCE(SUM(Amount_Paid), 0) AS total 
             FROM Payments 
             WHERE MONTH(Payment_Date) = MONTH(CURRENT_DATE()) 
             AND YEAR(Payment_Date) = YEAR(CURRENT_DATE())`
        );
        const [recentPayments] = await db.query(
            `SELECT 
                p.Payment_ID,
                u.Name AS customer_name,
                p.Amount_Paid,
                p.Payment_Method,
                p.Payment_Date
             FROM Payments p
             JOIN Customers c ON p.Customer_ID = c.Customer_ID
             JOIN Users u ON c.User_ID = u.User_ID
             ORDER BY p.Payment_Date DESC
             LIMIT 5`
        );

        res.status(200).json({
            totalReports: totalReports[0].total || 0,
            resolvedReports: resolvedReports[0].resolved || 0,
            pendingReports: pendingReports[0].pending || 0,
            totalPayments: totalPayments[0].total || 0,
            recentPayments: recentPayments || []
        });
    } catch (error) {
        console.error("Error fetching employee stats:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Employee Profile
app.get("/employee-profile/:employeeId", async (req, res) => {
    const { employeeId } = req.params;

    if (!employeeId || isNaN(employeeId)) {
        return res.status(400).json({ message: "Invalid employee ID" });
    }

    try {
        const [result] = await db.query(
            `SELECT 
                e.Employee_ID,
                u.Name,
                u.Username,
                u.Phone,
                e.Position,
                e.Department,
                e.Hire_Date
             FROM Employees e
             JOIN Users u ON e.User_ID = u.User_ID
             WHERE e.Employee_ID = ?`, 
            [employeeId]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error("Error fetching employee profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get all reports (for admin/employee dashboard)
app.get("/all-failure-reports", async (req, res) => {
   const { status, serviceType } = req.query;

   try {
       const [result] = await db.query("CALL GetAllFailureReports(?, ?)", 
           [status, serviceType]);
       res.status(200).json(result[0]);
   } catch (error) {
       console.error("Error fetching failure reports:", error);
       res.status(500).json({ message: "Internal Server Error" });
   }
});

// Update report status
app.put("/update-report-status", async (req, res) => {
   const { reportId, status, employeeId, notes } = req.body;

   if (!reportId || !status) {
       return res.status(400).json({ message: "Report ID and status are required" });
   }

   try {
       const [result] = await db.query("CALL UpdateFailureReportStatus(?, ?, ?, ?)", 
           [reportId, status, employeeId, notes]);
       
       res.status(200).json({ 
           message: "Report status updated",
           report: result[0][0]
       });
   } catch (error) {
       console.error("Error updating report status:", error);
       res.status(500).json({ message: "Internal Server Error" });
   }
});
// Get All Customers API
app.get("/customers", async (req, res) => {
   try {
       const [result] = await db.query("CALL GetAllCustomers()");
       res.status(200).json(result[0]);
   } catch (error) {
       console.error("❌ Error fetching customers:", error);
       res.status(500).json({ message: "Internal Server Error" });
   }
});

// Get Customer Consumption API
app.get("/customer-consumption/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;
        const { monthYear } = req.query;

        let monthDate = null;
        if (monthYear) {
            monthDate = new Date(monthYear + '-01');
            if (isNaN(monthDate.getTime())) {
                return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
            }
        }

        const [results] = await db.query(
            "CALL GetCustomerConsumptionData(?, ?)", 
            [customerId, monthDate]
        );
        
        res.status(200).json(results[0] || []);
    } catch (error) {
        console.error("❌ Error fetching consumption data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Generate Bill for Customer API
app.post("/generate-bill", async (req, res) => {
   const { customerId, billMonth } = req.body;

   if (!customerId || !billMonth) {
       return res.status(400).json({ 
           message: "Customer ID and bill month are required" 
       });
   }

   try {
       // First validate the date format
       const monthDate = new Date(billMonth);
       if (isNaN(monthDate.getTime())) {
           return res.status(400).json({ 
               message: "Invalid date format for bill month (use YYYY-MM-DD)" 
           });
       }

       // Format the date to YYYY-MM-01 to ensure it's the first day of the month
       const formattedMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;

       // Call the stored procedure
       const [result] = await db.query("CALL Generate_Bill_For_Customer(?, ?)", 
           [customerId, formattedMonth]);

       // Check if any rows were affected
       if (result.affectedRows === 0) {
           return res.status(404).json({ 
               message: "No consumption data found for this customer and month" 
           });
       }

       res.status(200).json({ 
           message: "✅ Bill generated successfully",
           customerId,
           billMonth: formattedMonth,
           affectedRows: result.affectedRows
       });

   } catch (error) {
       console.error("❌ Error generating bill:", error);
       
       if (error.code === 'ER_NO_REFERENCED_ROW_2') {
           return res.status(404).json({ 
               message: "Customer not found" 
           });
       }
       
       res.status(500).json({ 
           message: "Internal Server Error",
           error: error.message 
       });
   }
});

app.get("/customer-bills/:customerId", async (req, res) => {
    const { customerId } = req.params;

    try {
        const [bills] = await db.query(
            `SELECT 
                b.Bill_ID,
                b.Month_Year,
                b.Electricity_Charge,
                b.Gas_Charge,
                b.Water_Charge,
                b.Telecom_Charge,
                b.Total_Charge,
                b.Status
             FROM Billing b
             WHERE b.Customer_ID = ?
             ORDER BY b.Month_Year DESC`,
            [customerId]
        );

        res.status(200).json(bills);
    } catch (error) {
        console.error("Error fetching customer bills:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get All Payments API
app.get("/all-payments", async (req, res) => {
   const { startDate, endDate } = req.query;

   try {
       const [result] = await db.query("CALL GetAllPayments(?, ?)", [startDate, endDate]);
       res.status(200).json(result[0]);
   } catch (error) {
       console.error("❌ Error fetching payments:", error);
       res.status(500).json({ message: "Internal Server Error" });
   }
});

// Update Employee Profile API
app.put("/update-employee-info", async (req, res) => {
   const { employeeId, password, phone, position, department } = req.body;

   if (!employeeId) {
       return res.status(400).json({ message: "Employee ID is required" });
   }

   try {
       const [result] = await db.query("CALL UpdateEmployeeProfile(?, ?, ?, ?, ?)", 
           [employeeId, password, phone, position, department]);
       res.status(200).json({ message: "✅ Employee profile updated", profile: result[0][0] });
   } catch (error) {
       console.error("❌ Error updating employee profile:", error);
       res.status(500).json({ message: "Internal Server Error" });
   }
});

// Add Customer Consumption API
app.post("/add-consumption", async (req, res) => {
    try {
        const { customerId, serviceType, usageAmount, monthYear } = req.body;
        
        // Validate required fields
        if (!customerId || !serviceType || !usageAmount || !monthYear) {
            return res.status(400).json({ message: "All fields are required (customerId, serviceType, usageAmount, monthYear)" });
        }
        
        // Validate service type
        const validServices = ['Electricity', 'Gas', 'Water', 'Telecom'];
        if (!validServices.includes(serviceType)) {
            return res.status(400).json({ message: "Invalid service type. Must be one of: Electricity, Gas, Water, Telecom" });
        }
        
        // Validate usage amount is a positive number
        if (isNaN(usageAmount) || parseFloat(usageAmount) <= 0) {
            return res.status(400).json({ message: "Usage amount must be a positive number" });
        }
        
        // Convert monthYear (format: YYYY-MM) to proper date (first day of month)
        const monthDate = new Date(monthYear + '-01');
        if (isNaN(monthDate.getTime())) {
            return res.status(400).json({ message: "Invalid month/year format. Use YYYY-MM" });
        }
        
        // Call stored procedure
        const [result] = await db.query("CALL AddCustomerConsumption(?, ?, ?, ?, @result)", [
            customerId, 
            serviceType, 
            parseFloat(usageAmount), 
            monthDate
        ]);
        
        // Get the procedure result
        const [output] = await db.query("SELECT @result AS result");
        const resultMessage = output[0].result;
        
        if (resultMessage.startsWith('Error')) {
            return res.status(400).json({ message: resultMessage });
        }
        
        res.status(201).json({ 
            success: true,
            message: resultMessage,
            data: {
                customerId,
                serviceType,
                usageAmount: parseFloat(usageAmount),
                monthYear
            }
        });
        
    } catch (error) {
        console.error("❌ Error adding consumption data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// **Start Server**
app.listen(8081, () => {
    console.log("Server is running on port 8081");
});
