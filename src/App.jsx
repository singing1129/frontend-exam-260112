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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function App() {
  const [countryData, setCountryData] = useState({});
  const [dateData, setDateData] = useState({});
  const [loading, setLoading] = useState(true);

  const pieOptions = { responsive: true, maintainAspectRatio: false };
  const barOptions = { responsive: true, maintainAspectRatio: false };

  useEffect(() => {
    const loadFromDB = async () => {
      if (!window.indexedDB) return false;
      return new Promise((resolve) => {
        const request = indexedDB.open("ExcelDB", 1);
        request.onupgradeneeded = (e) => e.target.result.createObjectStore("stats");
        request.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction("stats", "readonly");
          const store = tx.objectStore("stats");
          const getReq = store.get("data");
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => resolve(false);
        };
        request.onerror = () => resolve(false);
      });
    };

    const saveToDB = async (data) => {
      if (!window.indexedDB) return;
      const request = indexedDB.open("ExcelDB", 1);
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("stats", "readwrite");
        tx.objectStore("stats").put(data, "data");
      };
    };

    const fetchAndParse = async () => {
      const cached = await loadFromDB();
      if (cached) {
        setCountryData(cached.countryData);
        setDateData(cached.dateData);
        setLoading(false);
        return;
      }

      const worker = new Worker(new URL("./worker.js", import.meta.url));
      fetch("/exam.xlsx")
        .then((res) => res.arrayBuffer())
        .then((ab) => worker.postMessage(ab));

      worker.onmessage = (e) => {
        const { countryData, dateData } = e.data;
        setCountryData(countryData);
        setDateData(dateData);
        setLoading(false);
        saveToDB({ countryData, dateData });
        worker.terminate();
      };
    };

    fetchAndParse();
  }, []);

  const pieData = { labels: Object.keys(countryData), datasets: [{ label: "Customer Count by Country", data: Object.values(countryData), backgroundColor: ["#FF6384","#36A2EB","#FFCE56","#4BC0C0","#9966FF","#FF9F40","#00C49F","#FF8042"] }]};
  const barData = { labels: Object.keys(dateData), datasets: [{ label: "Invoice Count per Day", data: Object.values(dateData), backgroundColor: "#36A2EB" }]};

  return (
    <div className="container">
      <h1>Online Retail</h1>
      {loading ? <p>Loading data...</p> : (
        <div className="dashboard">
          <div className="card"><h2>CustomerID of Country</h2><div className="chart"><Pie data={pieData} options={pieOptions} /></div></div>
          <div className="card"><h2>InvoiceDate per day</h2><div className="chart"><Bar data={barData} options={barOptions} /></div></div>
        </div>
      )}
    </div>
  );
}

export default App;
