async function loadNotes() {
  const f = await gh("data/notes/index.md");
  document.getElementById("notes").innerText = decodeURIComponent(
    escape(atob(f.content)),
  );
}
loadNotes();
