const OWNER = "siliwho";
const REPO = "documentry";
const BRANCH = "main";

function setToken() {
  const t = prompt("Enter GitHub Token:");
  localStorage.setItem("GITHUB_TOKEN", t);
}

function token() {
  return localStorage.getItem("GITHUB_TOKEN");
}

async function gh(path, method = "GET", content = null, sha = null) {
  const body = content
    ? {
        message: "update " + path,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: BRANCH,
        sha,
      }
    : null;

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method,
      headers: {
        Authorization: `token ${token()}`,
        Accept: "application/vnd.github+json",
      },
      body: body ? JSON.stringify(body) : null,
    },
  );

  if (!res.ok) throw new Error("GitHub API error");
  return res.json();
}
