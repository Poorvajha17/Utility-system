import React, { useEffect, useState, useMemo } from "react";

function EnergyConsumption({ username }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    const currentDate = useMemo(() => {
        return new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM-01
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null); 

            try {
                console.log(`🔍 Fetching energy data for ${username} in ${currentDate}`);

                const response = await fetch(`http://localhost:8081/getEnergyConsumption/${username}/${currentDate}`);
                const result = await response.json();

                if (response.ok) {
                    console.log("✅ API Response:", result);
                    setData(result);
                } else {
                    console.error("❌ API Error:", result.message);
                    setError(result.message);
                }
            } catch (err) {
                console.error("❌ Fetch Error:", err);
                setError("Failed to fetch data");
            } finally {
                setLoading(false); 
            }
        };

        if (username && currentDate) {
            fetchData();
        }
    }, [username, currentDate]);

    return (
        <div>
            <h2>Energy Consumption</h2>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>⚠️ {error}</p>}
            {!loading && !error && data.length === 0 && <p>No Data Available</p>}

            {!loading && !error && data.length > 0 && (
                <table border="1" cellPadding="5" style={{ width: "100%", textAlign: "left" }}>
                    <thead>
                        <tr>
                            <th>Service Type</th>
                            <th>Usage Amount</th>
                            <th>Month</th>
                            <th>Rate</th>
                            <th>Minimum Charge</th>
                            <th>Total Charge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                                <td>{item.Service_Type}</td>
                                <td>{Number(item.Usage_Amount).toFixed(2)}</td>
                                <td>{item.Month_Year.slice(0, 7)}</td> {/* Format YYYY-MM */}
                                <td>{Number(item.Rate).toFixed(4)}</td> {/* 4 decimal places for Rate */}
                                <td>{Number(item.Minimum_Charge).toFixed(2)}</td>
                                <td>{Number(item.Total_Charge).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default EnergyConsumption;
