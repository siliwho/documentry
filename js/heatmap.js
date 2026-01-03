function renderHeatmap(data) {
  const div = document.getElementById("heatmap");
  div.innerHTML = "";

  Object.entries(data).forEach(([d, v]) => {
    const c = document.createElement("div");
    c.className = "cell l" + Math.min(4, v);
    c.title = d;
    div.appendChild(c);
  });
}
