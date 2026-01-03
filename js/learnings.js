async function saveLearning() {
  const t = today();
  const text = document.getElementById("learn").value;
  let sha = null;
  try {
    sha = (await gh(`data/learnings/${t}.md`)).sha;
  } catch {}
  await gh(`data/learnings/${t}.md`, "PUT", text, sha);
}
