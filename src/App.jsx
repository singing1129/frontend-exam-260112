import "./App.css";
import React, { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import Papa from "papaparse";

// 註冊 Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function App() {
  const [countryData, setCountryData] = useState({});
  const [dateData, setDateData] = useState({});
  const [loading, setLoading] = useState(true);

  const pieOptions = { responsive: true, maintainAspectRatio: false };
  const barOptions = { responsive: true, maintainAspectRatio: false };

  // 解析日期 YYYY-MM-DD（支援 2011/6/10 11:54:00 AM）
  const parseDate = (value) => {
    if (!value) return "Unknown";
    // 先轉成 JS Date
    const dateObj = new Date(value);
    if (isNaN(dateObj)) return "Unknown";

    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    setLoading(true);

    fetch("/exam.csv")
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data;

            const countryMap = {};
            const dateMap = {};

            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];

              // 圓餅圖
              const customer = row.CustomerID || "Unknown";
              const country = row.Country || "Unknown";
              if (!countryMap[country]) countryMap[country] = new Set();
              countryMap[country].add(customer);

              // 長條圖
              const date = parseDate(row.InvoiceDate);
              dateMap[date] = (dateMap[date] || 0) + 1;
            }

            // Set → 數量
            const finalCountryData = {};
            Object.keys(countryMap).forEach(
              (c) => (finalCountryData[c] = countryMap[c].size)
            );

            // 排序日期
            const sortedDates = Object.keys(dateMap).sort();
            const finalDateData = {};
            sortedDates.forEach((d) => (finalDateData[d] = dateMap[d]));

            setCountryData(finalCountryData);
            setDateData(finalDateData);
            setLoading(false);
          },
        });
      });
  }, []);

  const pieData = {
    labels: Object.keys(countryData),
    datasets: [
      {
        label: "Customer Count by Country",
        data: Object.values(countryData),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#00C49F",
          "#FF8042",
        ],
      },
    ],
  };

  const barData = {
    labels: Object.keys(dateData),
    datasets: [
      {
        label: "Invoice Count per Day",
        data: Object.values(dateData),
        backgroundColor: "#36A2EB",
      },
    ],
  };

  return (
    <div className="container">
      <h1>Online Retail</h1>
      {loading ? (
        <p>Loading data, please wait...</p>
      ) : (
        <div className="dashboard">
          <div className="card">
            <h2>CustomerID of Country</h2>
            <div className="chart">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          <div className="card">
            <h2>InvoiceDate per day</h2>
            <div className="chart">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
