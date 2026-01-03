async function saveBlog() {
  const t = today();
  const text = document.getElementById("blog").value;
  let sha = null;

  try {
    sha = (await gh(`data/blogs/${t}.md`)).sha;
  } catch {}
  await gh(`data/blogs/${t}.md`, "PUT", text, sha);
}

function loadBlog() {
  const date = new Date().toISOString().split("T")[0];
  document.getElementById("blog-output").innerText =
    localStorage.getItem("blog-" + date) || "";
}

loadBlog();
