import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import EnergyConsumption from "../components/EnergyConsumption";
import "./Dashboard.css";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function CustomerDashboard() {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState("home");
    const [custId, setCustId] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [pendingBills, setPendingBills] = useState([]);
    const [failureReports, setFailureReports] = useState([]);
    const [billId, setBillId] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Credit Card");
    const [serviceType, setServiceType] = useState("Electricity");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [classification, setClassification] = useState("");
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [consumptionData, setConsumptionData] = useState([]);
    const [loadingHome, setLoadingHome] = useState(false);

    const username = localStorage.getItem("username");

    const fetchCustId = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8081/getCustId/${username}`);
            const data = await response.json();
            if (response.ok && data.custId) {
                setCustId(data.custId);
            } else {
                console.error("❌ Error fetching custId:", data.message);
            }
        } catch (error) {
            console.error("❌ Fetch error:", error);
        }
    }, [username]);

    const fetchPaymentHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8081/payment-history/${username}`);
            const data = await response.json();

            if (response.ok) {
                setPaymentHistory(data);
            } else {
                setError(data.message || "Failed to fetch payment history");
            }
        } catch (error) {
            setError("Network error while fetching payment history");
        } finally {
            setLoading(false);
        }
    }, [username]);

    const fetchPendingBills = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8081/pending-bills/${username}`);
            const data = await response.json();

            if (response.ok) {
                setPendingBills(data);
            } else {
                setError(data.message || "Failed to fetch pending bills");
            }
        } catch (error) {
            setError("Network error while fetching pending bills");
        } finally {
            setLoading(false);
        }
    }, [username]);

    const fetchFailureReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8081/failure-reports/${username}`);
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
    }, [username]);

    const fetchHomeData = useCallback(async () => {
        setLoadingHome(true);
        setError(null);
        try {
            // Fetch consumption data
            const response = await fetch(`http://localhost:8081/monthly-consumption/${username}`);
            if (!response.ok) throw new Error("Failed to fetch consumption data");
            const data = await response.json();
            
            // Process consumption data
            const processedData = data.map(item => ({
                Service_Type: item.Service_Type,
                Usage_Amount: parseFloat(item.Usage_Amount) || 0,
                Rate: parseFloat(item.Rate) || 0,
                Total_Charge: parseFloat(item.Total_Charge) || 0,
                Month_Year: item.Month_Year,
                Classification: item.Classification || 'N/A'
            }));
            
            setConsumptionData(processedData);
            
            
        } catch (error) {
            console.error("Error fetching home data:", error);
            setError(error.message);
            setConsumptionData([]);
        } finally {
            setLoadingHome(false);
        }
    }, [username]);

    // Chart configuration - memoized to prevent unnecessary re-renders
    const { chartData, chartOptions } = React.useMemo(() => {
        const data = {
            labels: consumptionData.map(item => item.Service_Type),
            datasets: [
                {
                    label: 'Usage Amount',
                    data: consumptionData.map(item => item.Usage_Amount),
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1,
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Monthly Consumption',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const data = consumptionData[context.dataIndex];
                            return [
                                `Usage: ${data.Usage_Amount.toFixed(2)}`,
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)', // Light gray grid lines
                    drawBorder: true, // Show axis border
                    borderColor: 'rgba(0, 0, 0, 0.3)' // Slightly darker border
                  },
                  ticks: {
                    color: '#666', // Dark gray tick labels
                    font: {
                      size: 12, // Slightly larger font
                      family: "'Roboto', sans-serif" // Modern font
                    },
                    padding: 10, // Add some spacing
                    callback: function(value) {
                      // Format numbers with commas for thousands
                      return value.toLocaleString(); 
                    }
                  },
                  title: {
                    display: true,
                    text: 'Usage Amount',
                    color: '#333', // Dark title color
                    font: {
                      weight: 'bold',
                      size: 14,
                      family: "'Roboto', sans-serif"
                    },
                    padding: {top: 20, bottom: 10} // Space around title
                  }
                },
                x: {
                  grid: {
                    display: false // Remove vertical grid lines for cleaner look
                  },
                  ticks: {
                    color: '#666',
                    font: {
                      size: 12,
                      family: "'Roboto', sans-serif"
                    }
                  }
                }
              }
        };

        return { chartData: data, chartOptions: options };
    }, [consumptionData]);

    const submitFailureReport = async () => {
        if (!serviceType || !description) {
            alert("Please select service type and provide a description");
            return;
        }
        try {
            const response = await fetch("http://localhost:8081/report-failure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, serviceType, description })
            });

            const data = await response.json();
            alert(data.message);

            if (response.ok) {
                fetchFailureReports();
                setServiceType("Electricity");
                setDescription("");
            }
        } catch (error) {
            console.error("❌ Report submission error:", error);
            alert("Failed to submit report. Please try again.");
        }
    };

    const updateUserInfo = async () => {
        if (newPassword && newPassword !== confirmPassword) {
            alert("New passwords don't match");
            return;
        }
    
        setLoading(true);
        setError(null);
        setUpdateSuccess(false);
    
        try {
            const response = await fetch("http://localhost:8081/update-info", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ 
                    username,
                    password: newPassword || undefined,
                    phone: phone || undefined,
                    address: address || undefined,
                    classification: classification || undefined
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

    const handlePayment = async () => {
        if (!billId || !amount || isNaN(amount) || amount <= 0) {
            alert("Please enter valid bill ID and amount");
            return;
        }

        try {
            const response = await fetch("http://localhost:8081/make-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, billId, amount, paymentMethod })
            });

            const data = await response.json();
            alert(data.message);

            if (response.ok) {
                fetchPendingBills();
                fetchPaymentHistory();
                setBillId("");
                setAmount("");
            }
        } catch (error) {
            console.error("❌ Payment error:", error);
            alert("Payment failed. Please try again.");
        }
    };

    useEffect(() => {
        if (username) fetchCustId();
    }, [username, fetchCustId]);

    useEffect(() => {
        if (activePage === "home") {
            fetchHomeData();
        } else if (activePage === "payments") {
            fetchPaymentHistory();
        } else if (activePage === "make-payment") {
            fetchPendingBills();
        } else if (activePage === "report-failure") {
            fetchFailureReports();
        }
    }, [activePage, fetchHomeData, fetchPaymentHistory, fetchPendingBills, fetchFailureReports]);

    useEffect(() => {
        if (activePage === "update-info") {
            setUpdateSuccess(false);
        }
    }, [activePage]);

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <h2>GERU</h2>
                <p className="username">Welcome, {username}</p>
                <nav>
                    <ul>
                        <li onClick={() => setActivePage("home")}>Home</li>
                        <li onClick={() => setActivePage("consumption")}>View Energy Consumption</li>
                        <li onClick={() => setActivePage("payments")}>Check Payment History</li>
                        <li onClick={() => setActivePage("update-info")}>Update Contact Information</li>
                        <li onClick={() => setActivePage("report-failure")}>Report Power Failure</li>
                        <li onClick={() => setActivePage("make-payment")}>Make a Payment</li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="dashboard-header">
                    <button className="home-btn" onClick={() => setActivePage("home")}>Home</button>
                    <button className="logout-btn" onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("username");
                        navigate("/");
                    }}>Logout</button>
                </header>

                <section className="content">
                    {/* Home */}
                    {activePage === "home" && (
                        <div className="dashboard-home">
                            <h1>Dashboard Overview</h1>
                            
                            <div className="summary-cards">
                                {/* Consumption Summary Card */}
                                <div className="card">
                                    <h3>Monthly Consumption Summary</h3>
                                    {loadingHome ? (
                                        <div className="loading-spinner">Loading data...</div>
                                    ) : error ? (
                                        <div className="error-message">Error: {error}</div>
                                    ) : consumptionData.length > 0 ? (
                                        <>
                                            <div className="chart-container">
                                                <Bar 
                                                    data={chartData} 
                                                    options={chartOptions}
                                                    key={JSON.stringify(consumptionData)} // Force re-render on data change
                                                />
                                            </div>
                                            <div className="consumption-details">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Service</th>
                                                            <th>Usage</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {consumptionData.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{item.Service_Type}</td>
                                                                <td>{item.Usage_Amount.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <p>No consumption data available</p>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Energy Consumption */}
                    {activePage === "consumption" && (custId === null ? <p>Loading customer data...</p> : <EnergyConsumption username={username} />)}

                    {/* Payment History */}
                    {activePage === "payments" && (
  <div>
    <h2>Payment History</h2>
    {loading && <p>Loading...</p>}
    {error && <p style={{ color: "red" }}>⚠️ {error}</p>}
    {!loading && !error && paymentHistory.length === 0 && (
      <p>No Payment History Available</p>
    )}
    {!loading && !error && paymentHistory.length > 0  && (
                                <table border="1" cellPadding="5" style={{ width: "100%", textAlign: "left" }}>
                                    <thead>
                                        <tr>
                                            <th>Payment ID</th>
                                            <th>Bill ID</th>
                                            <th>Amount</th>
                                            <th>Payment Method</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map((payment, index) => (
                                            <tr key={index}>
                                                <td>{payment.Payment_ID}</td>
                                                <td>{payment.Bill_ID ? payment.Bill_ID : "N/A"}</td>
                                                <td>${payment.Amount_Paid ? Number(payment.Amount_Paid).toFixed(2) : "0.00"}</td>
                                                <td>{payment.Payment_Method}</td>
                                                <td>{new Date(payment.Payment_Date).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                    
                    {/* Update Info */}
                    {activePage === "update-info" && (
                        <div className="update-info-container">
                            <h2 className="section-title">Update Contact Information</h2>
                            
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

                                        <div className="form-group">
                                            <label className="form-label">Address</label>
                                            <textarea
                                                className="form-textarea"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Enter your full address"
                                                rows="3"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Customer Classification</label>
                                            <select
                                                className="form-select"
                                                value={classification}
                                                onChange={(e) => setClassification(e.target.value)}
                                            >
                                                <option value="">Select classification</option>
                                                <option value="Residential">Residential</option>
                                                <option value="Commercial">Commercial</option>
                                                <option value="Industrial">Industrial</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button 
                                            className="submit-btn"
                                            onClick={updateUserInfo}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Make Payment */}
                    {activePage === "make-payment" && (
                        <div className="payment-container">
                            <div className="payment-section">
                                <h2 className="section-title">Pending Bills</h2>
                                
                                {loading && <div className="loading-spinner">Loading bills...</div>}
                                {error && <div className="error-message">⚠️ {error}</div>}
                                
                                {!loading && !error && pendingBills.length === 0 ? (
                                    <div className="no-bills-card">
                                        <div className="no-bills-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 13H15M9 9H15M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21Z" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <p className="no-bills-text">No pending bills found</p>
                                        <button className="refresh-btn" onClick={fetchPendingBills}>
                                            Refresh
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bills-list">
                                        {pendingBills.map((bill, index) => (
                                            <div key={index} className="bill-card">
                                                <div className="bill-info">
                                                    <span className="bill-id">Bill #{bill.Bill_ID}</span>
                                                    <span className="bill-due">Due: {new Date(bill.Month_Year).toLocaleDateString()}</span>
                                                </div>
                                                <div className="bill-amount">
                                                    ${Number(bill.Total_Charge).toFixed(2)}
                                                </div>
                                                <button 
                                                    className="pay-now-btn"
                                                    onClick={() => {
                                                        setBillId(bill.Bill_ID);
                                                        setAmount(bill.Total_Charge);
                                                    }}
                                                >
                                                    Pay Now
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="payment-section">
                                <h2 className="section-title">Make a Payment</h2>
                                <div className="payment-form">
                                    <div className="form-group">
                                        <label className="form-label">Bill ID</label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="Enter Bill ID"
                                            value={billId} 
                                            onChange={(e) => setBillId(e.target.value)} 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Amount ($)</label>
                                        <input 
                                            type="number" 
                                            className="form-input"
                                            placeholder="Enter amount"
                                            value={amount} 
                                            onChange={(e) => setAmount(e.target.value)} 
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Payment Method</label>
                                        <select 
                                            className="form-select"
                                            value={paymentMethod} 
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="Credit Card">Credit Card</option>
                                            <option value="Debit Card">Debit Card</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    
                                    <button 
                                        className="submit-payment-btn"
                                        onClick={handlePayment}
                                        disabled={!billId || !amount || isNaN(amount) || amount <= 0}
                                    >
                                        Process Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Report Failure */}
                    {activePage === "report-failure" && (
                        <div className="failure-report-container">
                            <div className="failure-report-form">
                                <h2 className="section-title">Report Service Issue</h2>
                                
                                <div className="form-group">
                                    <label className="form-label">Service Type:</label>
                                    <select 
                                        className="form-select"
                                        value={serviceType} 
                                        onChange={(e) => setServiceType(e.target.value)}
                                    >
                                        <option value="Electricity">Electricity</option>
                                        <option value="Water">Water</option>
                                        <option value="Telecom">Telecom</option>
                                        <option value="Gas">Gas</option>
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Description:</label>
                                    <textarea 
                                        className="form-textarea"
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Please describe the issue in detail including location, time it started, and any other relevant information..."
                                        rows="6"
                                    />
                                </div>
                                
                                <button 
                                    className="submit-report-btn"
                                    onClick={submitFailureReport}
                                >
                                    Submit Report
                                </button>
                            </div>

                            <div className="previous-reports">
                                <h2 className="section-title">Your Previous Reports</h2>
                                
                                {loading && <div className="loading-spinner">Loading...</div>}
                                {error && <div className="error-message">⚠️ {error}</div>}
                                
                                {!loading && !error && failureReports.length === 0 && (
                                    <div className="no-reports">No previous reports found</div>
                                )}
                                
                                {!loading && !error && failureReports.length > 0 && (
                                    <div className="reports-table-container">
                                        <table className="reports-table">
                                            <thead>
                                                <tr>
                                                    <th>Report ID</th>
                                                    <th>Service</th>
                                                    <th>Description</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {failureReports.map((report, index) => (
                                                    <tr key={index} className={`status-${report.Status.toLowerCase()}`}>
                                                        <td>{report.Report_ID}</td>
                                                        <td>{report.Service_Type}</td>
                                                        <td className="description-cell">{report.Description}</td>
                                                        <td>{new Date(report.Report_Date).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`status-badge ${report.Status.toLowerCase()}`}>
                                                                {report.Status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default CustomerDashboard;