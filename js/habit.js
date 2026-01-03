const today = () => new Date().toISOString().split("T")[0];

async function loadHabits() {
  const f = await gh("data/habits.json");
  return JSON.parse(atob(f.content));
}

async function addHabit() {
  const f = await gh("data/habits.json");
  const data = JSON.parse(atob(f.content));
  const t = today();

  data[t] = (data[t] || 0) + 1;
  await gh("data/habits.json", "PUT", JSON.stringify(data, null, 2), f.sha);
  renderHeatmap(data);
}

loadHabits().then(renderHeatmap);
