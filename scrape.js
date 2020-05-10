const axios = require("axios");
const cheerio = require("cheerio");

const url = "https://github.com";

function findAndExtractText(element, query) {
  return element.find(query).text().trim();
}

module.exports.getUserData = (username) => {
  return axios
    .get(`https://api.github.com/users/${username}`)
    .then((response) => {
      return response.data;
    });
};

module.exports.getPinnedRepo = (username) => {
  return axios
    .get(`https://github.com/${username}`)
    .then((response) => {
      const $ = cheerio.load(response.data);

      const pinned = [];

      $(".js-pinned-items-reorder-list .pinned-item-list-item-content").each(
        (_, element) => {
          const $element = $(element);
          pinnedRepo = {};

          pinnedRepo.repoName = findAndExtractText($element, "span.repo");

          pinnedRepo.repoLink = url + $element.find("a.text-bold").attr("href");

          pinnedRepo.description = findAndExtractText(
            $element,
            "p.pinned-item-desc"
          );

          pinnedRepo.isForked = false;

          if ($element.find("p.mb-2").length) {
            pinnedRepo.isForked = true;
            pinnedRepo.forkedFrom = findAndExtractText($element, "p.mb-2");
          }

          pinnedRepo.progLang = findAndExtractText(
            $element,
            "span[itemprop='programmingLanguage']"
          );

          pinnedRepo.stargazers = findAndExtractText(
            $element,
            `.f6 a[href="/${username}/${pinnedRepo.repoName}/stargazers"]`
          );

          pinnedRepo.forkCount = findAndExtractText(
            $element,
            `.f6 a[href="/${username}/${pinnedRepo.repoName}/network/members"]`
          );

          pinned.push(pinnedRepo);
        }
      );

      return pinned;
    })
    .catch((error) => {
      console.log(error.message);
      return { error: error.message, message: "User Not Found" };
    });
};

module.exports.getEachRepo = (username, next = "") => {
  return axios
    .get(`https://github.com/${username}?tab=repositories&after=${next}`)
    .then((response) => {
      const $ = cheerio.load(response.data);

      const repos = [];

      $("#user-repositories-list li").each((_, element) => {
        const $element = $(element);
        const repo = {};

        repo.repoName = $element.find(".wb-break-all").text().trim();

        repo.repoLink = url + $element.find(".wb-break-all a").attr("href");

        repo.forkedFrom = $element.find("span .muted-link").text();

        if (repo.forkedFrom == "") {
          repo.isForked = false;
        } else {
          repo.isForked = true;
        }
        repo.description = $element
          .find('p[itemprop = "description"]')
          .text()
          .trim();

        repo.topics = [];

        $element.find("div.topics-row-container a").each((_, el) => {
          const $el = $(el);
          repo.topics.push($el.text().trim());
        });

        repo.progLang = findAndExtractText(
          $element,
          "span[itemprop='programmingLanguage']"
        );

        repo.stargazers = findAndExtractText(
          $element,
          `.f6 a[href="/${username}/${repo.repoName}/stargazers"]`
        );

        repo.forkCount = findAndExtractText(
          $element,
          `.f6 a[href="/${username}/${repo.repoName}/network/members"]`
        );

        repos.push(repo);
      });

      const afterValue = $('div[data-test-selector="pagination"] a')
        .last()
        .attr("href");

      let after = "";

      if (afterValue.includes("after")) {
        after = afterValue.match(/after=(.*)/)[1].slice(0, 56);
        console.log(afterValue, after);
      }

      return { repos, after };
    })
    .catch((error) => {
      console.log(error.message);
      return { error: error.message, message: "User Not Found" };
    });
};
