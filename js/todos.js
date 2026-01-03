async function addDaily() {
  const f = await gh("data/todos-daily.json");
  const d = JSON.parse(atob(f.content));
  const t = today();
  d[t] = d[t] || [];
  d[t].push(prompt("Daily todo"));
  await gh("data/todos-daily.json", "PUT", JSON.stringify(d, null, 2), f.sha);
}

async function addWeekly() {
  const f = await gh("data/todos-weekly.json");
  const d = JSON.parse(atob(f.content));
  d.push(prompt("Weekly todo"));
  await gh("data/todos-weekly.json", "PUT", JSON.stringify(d, null, 2), f.sha);
}
