importScripts("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");

self.onmessage = (e) => {
  const arrayBuffer = e.data;
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = rows[0];
  const idxCustomer = header.indexOf("CustomerID");
  const idxCountry = header.indexOf("Country");
  const idxInvoiceDate = header.indexOf("InvoiceDate");

  const countryMap = {};
  const dateMap = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Pie
    const customer = row[idxCustomer] || "Unknown";
    const country = row[idxCountry] || "Unknown";
    if (!countryMap[country]) countryMap[country] = new Set();
    countryMap[country].add(customer);

    // Bar
    const rawDate = row[idxInvoiceDate];
    let date = "Unknown";
    if (!rawDate) date = "Unknown";
    else if (rawDate instanceof Date) date = rawDate.toISOString().slice(0, 10);
    else if (typeof rawDate === "number") {
      const v = XLSX.SSF.parse_date_code(rawDate);
      date = `${v.y}-${String(v.m).padStart(2, "0")}-${String(v.d).padStart(2, "0")}`;
    } else if (typeof rawDate === "string") {
      const [datePart] = rawDate.split(" ");
      const [y, m, d] = datePart.split(/[/-]/);
      date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }

    dateMap[date] = (dateMap[date] || 0) + 1;
  }

  // Set -> count
  const finalCountryData = {};
  Object.keys(countryMap).forEach(c => finalCountryData[c] = countryMap[c].size);

  // 日期排序
  const sortedDates = Object.keys(dateMap).sort();
  const finalDateData = {};
  sortedDates.forEach(d => finalDateData[d] = dateMap[d]);

  self.postMessage({ countryData: finalCountryData, dateData: finalDateData });
};
