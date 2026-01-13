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

  useEffect(() => {
    setLoading(true);

    // 建立 Web Worker
    const worker = new Worker(new URL("./worker.js", import.meta.url));

    fetch("/exam.xlsx")
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        worker.postMessage(ab);
      });

    worker.onmessage = (e) => {
      const { countryData, dateData } = e.data;
      setCountryData(countryData);
      setDateData(dateData);
      setLoading(false);
      worker.terminate();
    };

    return () => worker.terminate();
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
