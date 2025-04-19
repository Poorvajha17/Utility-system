import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Employee.css";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function EmployeeDashboard() {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState("home");
    const [failureReports, setFailureReports] = useState([]);
    const [customerPayments, setCustomerPayments] = useState([]);
    const [customerConsumption, setCustomerConsumption] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [stats, setStats] = useState({
        totalReports: 0,
        resolvedReports: 0,
        pendingReports: 0,
        totalPayments: 0,
        recentPayments: []
    });
    const [reportStatus, setReportStatus] = useState("Pending");
    const [selectedReport, setSelectedReport] = useState(null);
    const [statusUpdateNote, setStatusUpdateNote] = useState("");
    const [employeeId, setEmployeeId] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [consumptionData, setConsumptionData] = useState({
        serviceType: '',
        usageAmount: '',
        monthYear: ''
    });

    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '0.00';
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // Fetch employee ID from username
    const fetchEmployeeId = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8081/employee-profile-by-username/${username}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (response.ok && data.Employee_ID) {
                setEmployeeId(data.Employee_ID);
                return data.Employee_ID;
            }
            return null;
        } catch (error) {
            console.error("Error fetching employee ID:", error);
            return null;
        }
    }, [username, token]);

    // Fetch dashboard statistics
    const fetchDashboardStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const id = employeeId || await fetchEmployeeId();
            if (!id) {
                throw new Error("Employee ID not found");
            }

            const response = await fetch(`http://localhost:8081/employee-stats/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                setStats({
                    totalReports: Number(data.totalReports) || 0,
                    resolvedReports: Number(data.resolvedReports) || 0,
                    pendingReports: Number(data.pendingReports) || 0,
                    totalPayments: Number(data.totalPayments) || 0,
                    recentPayments: Array.isArray(data.recentPayments) ? data.recentPayments : []
                });
            } else {
                setError(data.message || "Failed to fetch dashboard stats");
            }
        } catch (error) {
            setError(error.message || "Network error while fetching stats");
        } finally {
            setLoading(false);
        }
    }, [token, employeeId, fetchEmployeeId]);

    // Fetch all failure reports
    const fetchFailureReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8081/all-failure-reports`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                setFailureReports(data);
            } else {
                setError(data.message || "Failed to fetch failure reports");
            }
        } catch (error) {
            setError("Network error while fetching failure reports");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Fetch customer payments
    const fetchCustomerPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8081/all-payments`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                setCustomerPayments(data);
            } else {
                setError(data.message || "Failed to fetch payments");
            }
        } catch (error) {
            setError("Network error while fetching payments");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Fetch customer list
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8081/customers`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                setCustomers(data);
            } else {
                setError(data.message || "Failed to fetch customers");
            }
        } catch (error) {
            setError("Network error while fetching customers");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Modify fetchCustomerConsumption to accept month parameter
const fetchCustomerConsumption = useCallback(async (customerId, monthYear = null) => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    try {
        let url = `http://localhost:8081/customer-consumption/${customerId}`;
        if (monthYear) {
            url += `?monthYear=${monthYear}`;
        }

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (response.ok) {
            const formattedData = data.map(item => ({
                ...item,
                Usage_Amount: Number(item.Usage_Amount) || 0,
                Rate: Number(item.Rate) || 0,
                Total_Charge: Number(item.Total_Charge) || 0
            }));
            setCustomerConsumption(formattedData);
        } else {
            setError(data.message || "Failed to fetch consumption data");
        }
    } catch (error) {
        setError("Network error while fetching consumption data");
    } finally {
        setLoading(false);
    }
}, [token]);

// Update your useEffect to include month selection
useEffect(() => {
    if (selectedCustomer) {
        fetchCustomerConsumption(selectedCustomer, selectedMonth || null);
    }
}, [selectedCustomer, selectedMonth, fetchCustomerConsumption]);

    // Update report status
    const updateReportStatus = async () => {
        if (!selectedReport || !reportStatus || !employeeId) {
            alert("Please select a report and status");
            return;
        }

        try {
            const response = await fetch(`http://localhost:8081/update-report-status`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    reportId: selectedReport.Report_ID,
                    status: reportStatus,
                    employeeId: employeeId,
                    notes: statusUpdateNote
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Update failed");
            }

            alert("Report status updated successfully!");
            fetchFailureReports();
            setSelectedReport(null);
            setStatusUpdateNote("");
        } catch (error) {
            setError(error.message);
        }
    };

    // Generate bill for customer
    const generateBill = async () => {
        if (!selectedCustomer || !selectedMonth) {
            alert("Please select both a customer and a month");
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:8081/generate-bill`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    customerId: selectedCustomer,
                    billMonth: selectedMonth + '-01' // Format as YYYY-MM-DD
                })
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Bill generation failed");
            }
    
            alert(`Bill generated successfully for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}!`);
            // Refresh the consumption data
            fetchCustomerConsumption(selectedCustomer, selectedMonth);
            fetchCustomers();
        } catch (error) {
            setError(error.message);
            alert(`Error: ${error.message}`);
        }
    };
    
    // Update employee info
    const updateEmployeeInfo = async () => {
        if (newPassword && newPassword !== confirmPassword) {
            alert("New passwords don't match");
            return;
        }
    
        setLoading(true);
        setError(null);
        setUpdateSuccess(false);
    
        try {
            const response = await fetch("http://localhost:8081/update-employee-info", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    employeeId: employeeId,
                    password: newPassword || undefined,
                    phone: phone || undefined,
                    position: undefined,
                    department: undefined
                })
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Update failed");
            }
    
            setUpdateSuccess("Information updated successfully!");
            setTimeout(() => setUpdateSuccess(""), 3000);
            
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
    
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const submitConsumptionData = async () => {
        if (!selectedCustomer || !consumptionData.serviceType || !consumptionData.usageAmount || !consumptionData.monthYear) {
            alert("Please fill all fields");
            return;
        }
    
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8081/add-consumption", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerId: selectedCustomer,
                    serviceType: consumptionData.serviceType,
                    usageAmount: parseFloat(consumptionData.usageAmount),
                    monthYear: consumptionData.monthYear
                })
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Failed to add consumption data");
            }
    
            alert("Consumption data added successfully!");
            setConsumptionData({
                serviceType: '',
                usageAmount: '',
                monthYear: ''
            });
        } catch (error) {
            setError(error.message);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Chart data for reports by status
    const reportsByStatusChart = {
        data: {
            labels: ['Resolved', 'Pending', 'In Progress', 'Assigned'],
            datasets: [{
                data: [
                    stats.resolvedReports, 
                    stats.pendingReports, 
                    stats.totalReports - stats.resolvedReports - stats.pendingReports,
                    0
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Failure Reports by Status',
                    font: {
                        size: 16
                    }
                }
            }
        }
    };

    useEffect(() => {
        // Fetch employee ID when component mounts
        const fetchId = async () => {
            const id = await fetchEmployeeId();
            if (id) {
                setEmployeeId(id);
            }
        };
        fetchId();
    }, [fetchEmployeeId]);

    useEffect(() => {
        if (activePage === "home") {
            fetchDashboardStats();
        } else if (activePage === "failure-reports") {
            fetchFailureReports();
        } else if (activePage === "customer-payments") {
            fetchCustomerPayments();
        } else if (activePage === "generate-bills") {
            fetchCustomers();
        }
    }, [activePage, fetchDashboardStats, fetchFailureReports, fetchCustomerPayments, fetchCustomers]);




    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <h2>GERU Employee</h2>
                <p className="username">Welcome, {username}</p>
                <nav>
                    <ul>
                        <li onClick={() => setActivePage("home")}>Dashboard</li>
                        <li onClick={() => setActivePage("failure-reports")}>View Failure Reports</li>
                        <li onClick={() => setActivePage("customer-payments")}>View Customer Payments</li>
                        <li onClick={() => setActivePage("generate-bills")}>Generate Bills</li>
                        <li onClick={() => setActivePage("update-info")}>Update Information</li>
                        <li onClick={() => setActivePage("add-consumption")}>Add Consumption Data</li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="dashboard-header">
                    <button className="home-btn" onClick={() => setActivePage("home")}>Dashboard</button>
                    <button className="logout-btn" onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("username");
                        navigate("/");
                    }}>Logout</button>
                </header>

                <section className="content">
                    {/* Dashboard Home */}
                    {activePage === "home" && (
                        <div className="dashboard-home">
                            <h1>Employee Dashboard</h1>
                            
                            <div className="summary-cards">
                                {/* Stats Overview */}
                                <div className="stats-overview">
                                    <div className="stat-card">
                                        <h3>Total Reports</h3>
                                        <p className="stat-value">{stats.totalReports}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Resolved Reports</h3>
                                        <p className="stat-value">{stats.resolvedReports}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Pending Reports</h3>
                                        <p className="stat-value">{stats.pendingReports}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Total Payments</h3>
                                        <p className="stat-value">${formatCurrency(stats.totalPayments)}</p>
                                    </div>
                                </div>

                                {/* Reports Chart */}
                                <div className="card">
                                    <div className="chart-container" style={{ height: '300px' }}>
                                        <Pie 
                                            data={reportsByStatusChart.data} 
                                            options={reportsByStatusChart.options}
                                        />
                                    </div>
                                </div>

                                {/* Recent Payments */}
                                <div className="card">
                                    <h3>Recent Payments</h3>
                                    {stats.recentPayments.length > 0 ? (
                                        <table className="recent-payments">
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Amount</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            {stats.recentPayments.map((payment, index) => (
    <tr key={index}>
        <td>{payment.customer_name || payment.Customer_Name || payment.Username || "N/A"}</td>
        <td>${formatCurrency(payment.Amount_Paid)}</td>
        <td>{new Date(payment.Payment_Date).toLocaleDateString()}</td>
    </tr>
))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No recent payments</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Failure Reports */}
                    {activePage === "failure-reports" && (
                        <div className="failure-reports-container">
                            <h2>Customer Failure Reports</h2>
                            
                            {loading && <div className="loading-spinner">Loading reports...</div>}
                            {error && <div className="error-message">⚠️ {error}</div>}
                            
                            {!loading && !error && (
                                <div className="reports-management">
                                    <div className="reports-list">
                                        <table className="reports-table">
                                            <thead>
                                                <tr>
                                                    <th>Report ID</th>
                                                    <th>Customer</th>
                                                    <th>Service</th>
                                                    <th>Description</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            {failureReports.map((report, index) => (
    <tr key={index} className={`status-${report.Status.toLowerCase()}`}>
        <td>{report.Report_ID}</td>
        <td>{report.Customer_Name || report.customer_name || report.Username || "N/A"}</td>
        <td>{report.Service_Type}</td>
         <td className="description-cell">{report.Description}</td>
                                                        <td>{new Date(report.Report_Date).toLocaleDateString()}</td>
                                                        <td>
                                                        <span className={`status-badge ${report.Status.toLowerCase().replace(/\s+/g, "-")}`}>
                                                              {report.Status}
                                                        </span>

                                                        </td>
                                                        <td>
                                                            <button 
                                                                className="action-btn"
                                                                onClick={() => setSelectedReport(report)}
                                                            >
                                                                Update
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {selectedReport && (
                                        <div className="status-update-form">
                                            <h3>Update Report Status</h3>
                                            <div className="form-group">
                                                <label>Current Status: </label>
                                                <span className={`status-badge ${selectedReport.Status.toLowerCase().replace(/\s+/g, "-")}`}>
                                                      {selectedReport.Status}
                                                </span>

                                            </div>
                                            <div className="form-group">
                                                <label>Update to:</label>
                                                <select
                                                    value={reportStatus}
                                                    onChange={(e) => setReportStatus(e.target.value)}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Resolved">Resolved</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Notes:</label>
                                                <textarea
                                                    value={statusUpdateNote}
                                                    onChange={(e) => setStatusUpdateNote(e.target.value)}
                                                    placeholder="Add any notes about the status update..."
                                                    rows="3"
                                                />
                                            </div>
                                            <button 
                                                className="submit-btn"
                                                onClick={updateReportStatus}
                                            >
                                                Update Status
                                            </button>
                                            <button 
                                                className="cancel-btn"
                                                onClick={() => setSelectedReport(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customer Payments */}
                    {activePage === "customer-payments" && (
                        <div className="customer-payments-container">
                            <h2>Customer Payment History</h2>
                            
                            {loading && <div className="loading-spinner">Loading payments...</div>}
                            {error && <div className="error-message">⚠️ {error}</div>}
                            
                            {!loading && !error && (
                                <div className="payments-table-container">
                                    <table className="payments-table">
                                        <thead>
                                            <tr>
                                                <th>Payment ID</th>
                                                <th>Customer</th>
                                                <th>Bill ID</th>
                                                <th>Amount</th>
                                                <th>Method</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {customerPayments.map((payment, index) => (
    <tr key={index}>
        <td>{payment.Payment_ID}</td>
        <td>{payment.Customer_Name || payment.customer_name || payment.Username || "N/A"}</td>
        <td>{payment.Bill_ID || "N/A"}</td>
        <td>${formatCurrency(payment.Amount_Paid)}</td>
        <td>{payment.Payment_Method}</td>
        <td>{new Date(payment.Payment_Date).toLocaleDateString()}</td>
    </tr>
))}


                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Generate Bills Section */}
                    {activePage === "generate-bills" && (
    <div className="generate-bills-container">
        <h2>Generate Customer Bills</h2>
        
        <div className="bill-generation-form">
            <div className="form-group">
                <label>Select Customer:</label>
                <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                    <option value="">-- Select Customer --</option>
                    {customers.map((customer) => (
                        <option key={customer.Customer_ID} value={customer.Customer_ID}>
                            {customer.Name} ({customer.Username})
                        </option>
                    ))}
                </select>
            </div>

            {selectedCustomer && (
                <>
                    <div className="form-group">
                        <label>Select Month:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>

                    <div className="consumption-details">
                        <h3>Consumption Data</h3>
                        {customerConsumption.length > 0 ? (
                            <table className="consumption-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Usage</th>
                                        <th>Rate</th>
                                        <th>Total</th>
                                        <th>Month</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerConsumption.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.Service_Type}</td>
                                            <td>{item.Usage_Amount.toFixed(2)}</td>
                                            <td>{item.Rate.toFixed(4)}</td>
                                            <td>${item.Total_Charge.toFixed(2)}</td>
                                            <td>{new Date(item.Month_Year).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No consumption data available for {selectedMonth ? 
                                `the selected month (${selectedMonth})` : 'this customer'}</p>
                        )}
                    </div>

                    <button 
                        className="generate-btn"
                        onClick={generateBill}
                        disabled={!selectedCustomer || !selectedMonth}
                    >
                        Generate Bill for {selectedMonth ? 
                            new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
                            'Selected Month'}
                    </button>
                </>
            )}
        </div>
    </div>
)}
                    {activePage === "add-consumption" && (
    <div className="add-consumption-container">
        <h2>Add Customer Consumption Data</h2>
        
        <div className="consumption-form">
            <div className="form-group">
                <label>Select Customer:</label>
                <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                    <option value="">-- Select Customer --</option>
                    {customers.map((customer) => (
                        <option key={customer.Customer_ID} value={customer.Customer_ID}>
                            {customer.Name} ({customer.Username})
                        </option>
                    ))}
                </select>
            </div>

            {selectedCustomer && (
                <div className="consumption-details-form">
                    <div className="form-group">
                        <label>Service Type:</label>
                        <select
                            value={consumptionData.serviceType || ''}
                            onChange={(e) => setConsumptionData({...consumptionData, serviceType: e.target.value})}
                        >
                            <option value="">-- Select Service --</option>
                            <option value="Electricity">Electricity</option>
                            <option value="Gas">Gas</option>
                            <option value="Water">Water</option>
                            <option value="Telecom">Telecom</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Usage Amount:</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={consumptionData.usageAmount || ''}
                            onChange={(e) => setConsumptionData({...consumptionData, usageAmount: e.target.value})}
                            placeholder="Enter usage amount"
                        />
                    </div>

                    <div className="form-group">
                        <label>Month/Year:</label>
                        <input
                            type="month"
                            value={consumptionData.monthYear || ''}
                            onChange={(e) => setConsumptionData({...consumptionData, monthYear: e.target.value})}
                        />
                    </div>

                    <button 
                        className="submit-btn"
                        onClick={submitConsumptionData}
                        disabled={!consumptionData.serviceType || !consumptionData.usageAmount || !consumptionData.monthYear}
                    >
                        Add Consumption Data
                    </button>
                </div>
            )}
        </div>
    </div>
)}

                    {/* Update Info */}
                    {activePage === "update-info" && (
                        <div className="update-info-container">
                            <h2 className="section-title">Update Employee Information</h2>
                            
                            {loading && (
                                <div className="loading-indicator">
                                    <div className="spinner"></div>
                                    <p>Updating information...</p>
                                </div>
                            )}

                            {error && !loading && (
                                <div className="error-message">
                                    ⚠️ {error}
                                </div>
                            )}

                            {updateSuccess && !loading && (
                                <div className="success-message">
                                    ✔️ {updateSuccess}
                                </div>
                            )}

                            {!loading && (
                                <div className="update-form">
                                    <div className="form-section">
                                        <h3 className="form-subtitle">Change Password</h3>
                                        
                                        <div className="form-group">
                                            <label className="form-label">Current Password</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">New Password</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Confirm New Password</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3 className="form-subtitle">Contact Details</h3>
                                        
                                        <div className="form-group">
                                            <label className="form-label">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button 
                                            className="submit-btn"
                                            onClick={updateEmployeeInfo}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default EmployeeDashboard;