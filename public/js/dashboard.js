async function renderTrendChart() {
  const chart = document.getElementById("trend-chart");
  if (!chart) return;

  const response = await fetch("/api/analytics/trend");
  const data = await response.json();

  chart.innerHTML = "";
  const points = data.points || [];

  const maxCount = Math.max(...points.map((point) => point.count), 1);

  points.forEach((point) => {
    const group = document.createElement("div");
    group.className = "bar-group";

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = point.count;

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${(point.count / maxCount) * 180 + 24}px`;

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = point.day.slice(5);

    group.appendChild(value);
    group.appendChild(bar);
    group.appendChild(label);
    chart.appendChild(group);
  });
}

function wireTableSearch() {
  const searchInput = document.getElementById("lead-search");
  const table = document.getElementById("lead-table");
  if (!searchInput || !table) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? "" : "none";
    });
  });
}

renderTrendChart();
wireTableSearch();
