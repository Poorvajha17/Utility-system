import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";


function Home() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <div className="home-container">
            {/* Hero Section */}
            <header className="hero">
                <div className="container">
                    <h1>GERU Utility Management System</h1>
                    <p className="hero-subtitle">
                        Enterprise-grade solutions for electricity, water, gas, and telecom management
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {/* User Type Selection */}
                <section className="section user-type-section">
                    <div className="container">
                        <h2>Select Your Access Portal</h2>
                        <div className="button-container">
                            <button 
                                className="btn btn-primary btn-lg"
                                onClick={() => navigate("/customer/login")}
                            >
                                Customer Login
                            </button>
                            <button 
                                className="btn btn-secondary btn-lg"
                                onClick={() => navigate("/employee/login")}
                            >
                                Employee Login
                            </button>
                        </div>
                        <div className="auth-links">
                            <p>
                                New user? <a href="/customer/signup">Create customer account</a> or{' '}
                                <a href="/employee/signup">Register as employee</a>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className="section services-section">
                    <div className="container">
                        <h2>Our Utility Services</h2>
                        <div className="services-grid">
                            <div className="service-card">
                                <div className="service-icon">⚡</div>
                                <h3>Electricity</h3>
                                <p>Smart metering and consumption analytics</p>
                            </div>
                            <div className="service-card">
                                <div className="service-icon">🔥</div>
                                <h3>Natural Gas</h3>
                                <p>Safe distribution and usage monitoring</p>
                            </div>
                            <div className="service-card">
                                <div className="service-icon">💧</div>
                                <h3>Water</h3>
                                <p>Quality tracking and conservation tools</p>
                            </div>
                            <div className="service-card">
                                <div className="service-icon">📶</div>
                                <h3>Telecom</h3>
                                <p>Reliable connectivity solutions</p>
                            </div>
                        </div>
                    </div>
                </section>

                
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-logo">GERU</div>
                        <div className="footer-links">
                            <a href="/about">About Us</a>
                            <a href="/contact">Contact</a>
                            <a href="/privacy">Privacy Policy</a>
                        </div>
                        <div className="footer-contact">
                            <p>support@geru-utilities.com</p>
                            <p>+1 (800) GERU-123</p>
                        </div>
                    </div>
                    <div className="footer-copyright">
                        © {currentYear} GERU Utilities. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;