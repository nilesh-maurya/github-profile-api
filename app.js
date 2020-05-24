const express = require("express");
const cors = require("cors");

const scrape = require("./scrape.js");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.json({
    user_Profile_data: req.headers.host + "/api/username",
    repos: req.headers.host + "/api/username/repos",
  });
});

app.get("/api/:username", async (req, res, next) => {
  const username = req.params.username;

  try {
    const user = await scrape.getUserData(username);

    let repoDataPromise;

    if (user.type === "User") {
      repoDataPromise = scrape.getUserRepo(username);
    } else if (user.type === "Organization") {
      repoDataPromise = scrape.getOrganizationRepo(username);
    }
    const pinnedPromise = scrape.getPinnedRepo(username);

    const [pinnedRepo, repoData] = await Promise.all([
      pinnedPromise,
      repoDataPromise,
    ]);
    res.json({
      username: user.login,
      avatar: user.avatar_url,
      html_url: user.html_url,
      name: user.name,
      company: user.company,
      blog: user.blog,
      location: user.location,
      bio: user.bio,
      repos: user.public_repos,
      followers: user.followers,
      following: user.following,
      created_on: user.created_at,
      updated_on: user.updated_at,
      pinnedRepo,
      repoData,
    });
  } catch (err) {
    res.json({
      error: err.message,
    });
  }
});

app.get("/api/:username/repos", async (req, res) => {
  const username = req.params.username;

  const type = req.query.type;
  let next = req.query.next;

  console.log(next, username);

  try {
    let repoData;

    if (type === "User" || type === "user") {
      next = next === undefined ? "" : next;
      repoData = await scrape.getUserRepo(username, next);
    } else if (type === "Organization" || type === "organization") {
      next = next === undefined ? "" : next;
      repoData = await scrape.getOrganizationRepo(username, next);
    }

    res.json({
      repoData,
    });
  } catch (err) {
    res.json({
      error: err.message,
    });
  }
});

const server = app.listen(3030, () => {
  console.log("server is running on 3030");
});
