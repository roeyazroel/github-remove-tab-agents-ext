const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getPathnameFromHref,
  getRepositoryRootPathFromPathname,
  isRepositoryAgentsPath,
  isRepositoryPathname,
  normalizeLinkLabel
} = require("./content.js");

test("isRepositoryPathname identifies repository routes", () => {
  assert.equal(isRepositoryPathname("/owner/repo"), true);
  assert.equal(isRepositoryPathname("/owner/repo/issues"), true);
  assert.equal(isRepositoryPathname("/owner"), false);
  assert.equal(isRepositoryPathname("/"), false);
});

test("getRepositoryRootPathFromPathname extracts owner and repo", () => {
  assert.equal(getRepositoryRootPathFromPathname("/owner/repo"), "/owner/repo");
  assert.equal(getRepositoryRootPathFromPathname("/owner/repo/pulls"), "/owner/repo");
  assert.equal(getRepositoryRootPathFromPathname("/owner"), "");
  assert.equal(getRepositoryRootPathFromPathname("/"), "");
});

test("getPathnameFromHref resolves absolute and relative href values", () => {
  const origin = "https://github.com";

  assert.equal(getPathnameFromHref("/owner/repo/agents", origin), "/owner/repo/agents");
  assert.equal(
    getPathnameFromHref("https://github.com/owner/repo/agents?tab=1", origin),
    "/owner/repo/agents"
  );
  assert.equal(getPathnameFromHref("not a url", origin), "/not%20a%20url");
  assert.equal(getPathnameFromHref("", origin), "");
  assert.equal(getPathnameFromHref("/owner/repo/agents", ""), "");
});

test("normalizeLinkLabel produces lower-case, trimmed labels", () => {
  assert.equal(normalizeLinkLabel(" Agents "), "agents");
  assert.equal(normalizeLinkLabel("AGENTS"), "agents");
  assert.equal(normalizeLinkLabel(""), "");
});

test("isRepositoryAgentsPath matches only repository Agents tab paths", () => {
  const repositoryRootPath = "/owner/repo";

  assert.equal(isRepositoryAgentsPath("/owner/repo/agents", repositoryRootPath), true);
  assert.equal(isRepositoryAgentsPath("/owner/repo/agents/", repositoryRootPath), true);
  assert.equal(isRepositoryAgentsPath("/owner/repo/issues", repositoryRootPath), false);
  assert.equal(isRepositoryAgentsPath("/another/repo/agents", repositoryRootPath), false);
});
