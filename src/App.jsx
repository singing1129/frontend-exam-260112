// App.jsx
import "./App.css";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx"; // 讀 Excel
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

// 註冊 Chart.js 元件
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function App() {
  const [data, setData] = useState([]); // Excel 原始資料
  const [countryData, setCountryData] = useState({}); // 圓餅圖資料
  const [dateData, setDateData] = useState({}); // 長條圖資料
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // 解析 Excel 日期格式
  const parseDate = (value) => {
    if (!value) return "Unknown";

    let dateObj;

    if (value instanceof Date) {
      dateObj = value;
    } else if (typeof value === "number") {
      const v = XLSX.SSF.parse_date_code(value);
      dateObj = new Date(v.y, v.m - 1, v.d);
    } else if (typeof value === "string") {
      const [datePart] = value.split(" ");
      const [y, m, d] = datePart.split(/[/-]/).map(Number);
      dateObj = new Date(y, m - 1, d);
    } else {
      return "Unknown";
    }

    return dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  useEffect(() => {
    //  讀 Excel
    fetch("/exam.xlsx")
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const workbook = XLSX.read(ab, {
          type: "array",
          cellDates: true, //  Excel日期變成JS Date物件
        });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          raw: true, // 保留原始型別（Date / number）
        });

        // 圓餅圖
        const countryCustomerMap = {};
        jsonData.forEach((row) => {
          const country = row.Country || "Unknown";
          const customer = row.CustomerID || "Unknown";
          if (!countryCustomerMap[country])
            countryCustomerMap[country] = new Set();
          countryCustomerMap[country].add(customer);
        });
        const countryCount = {};
        Object.keys(countryCustomerMap).forEach(
          (c) => (countryCount[c] = countryCustomerMap[c].size)
        );
        setCountryData(countryCount);

        // 長條圖
        const dateCount = {};
        jsonData.forEach((row) => {
          const date = parseDate(row.InvoiceDate);
          dateCount[date] = (dateCount[date] || 0) + 1;
        });

        // 排序日期
        const sortedDates = Object.keys(dateCount).sort(
          (a, b) => new Date(a) - new Date(b)
        );
        const sortedDateCount = {};
        sortedDates.forEach((d) => (sortedDateCount[d] = dateCount[d]));
        setDateData(sortedDateCount);
      });
  }, []);

  // // 圓餅圖資料顯示
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

  // 長條圖資料顯示
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

    <div className="dashboard">
      {/* 左邊 Pie */}
      <div className="card">
        <h2>CustomerID of Country</h2>
        <div className="chart">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>

      {/* 右邊 Bar */}
      <div className="card">
        <h2>InvoiceDate per day</h2>
        <div className="chart">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  </div>
);
}

export default App;
