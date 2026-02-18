(() => {
  "use strict";

  const AGENTS_LABEL = "agents";
  const HIDDEN_ATTRIBUTE = "data-gh-agents-tab-hidden";
  const REPOSITORY_PATH_PATTERN = /^\/[^/]+\/[^/]+(?:\/|$)/;
  const NAV_SCOPES = [
    'nav[aria-label="Repository"]',
    "nav.UnderlineNav",
    'div[data-testid="repository-navigation"] nav'
  ];
  const NAV_MUTATION_HINT_SELECTORS = [
    'nav[aria-label="Repository"]',
    "nav.UnderlineNav",
    'div[data-testid="repository-navigation"]',
    'a[href*="/agents"]'
  ];
  let queuedAnimationFrame = 0;

  /**
   * Returns true when a pathname points to a repository route.
   */
  function isRepositoryPathname(pathname) {
    return REPOSITORY_PATH_PATTERN.test(pathname);
  }

  /**
   * Returns the repository root path (e.g. /owner/repo) from a pathname.
   */
  function getRepositoryRootPathFromPathname(pathname) {
    const pathParts = pathname.split("/");
    const owner = pathParts[1];
    const repo = pathParts[2];

    if (!owner || !repo) {
      return "";
    }

    return `/${owner}/${repo}`;
  }

  /**
   * Converts an href to a pathname in a safe, cross-origin aware way.
   */
  function getPathnameFromHref(href, origin) {
    if (typeof href !== "string" || href.trim() === "") {
      return "";
    }

    if (typeof origin !== "string" || origin.trim() === "") {
      return "";
    }

    try {
      return new URL(href, origin).pathname;
    } catch {
      return "";
    }
  }

  /**
   * Normalizes link text to a case-insensitive comparison value.
   */
  function normalizeLinkLabel(textContent) {
    return (textContent || "").trim().toLowerCase();
  }

  /**
   * Returns true when a pathname is exactly the repository Agents tab path.
   */
  function isRepositoryAgentsPath(pathname, repositoryRootPath) {
    const agentsPath = `${repositoryRootPath}/agents`;
    return pathname === agentsPath || pathname === `${agentsPath}/`;
  }

  /**
   * Returns true when an element is the repository "Agents" tab link.
   */
  function isAgentsTabLink(link, repositoryRootPath, origin) {
    if (typeof HTMLAnchorElement === "undefined" || !(link instanceof HTMLAnchorElement)) {
      return false;
    }

    const label = normalizeLinkLabel(link.textContent);
    const pathname = getPathnameFromHref(link.getAttribute("href") || "", origin);
    const isRepositoryScopedLink = pathname.startsWith(`${repositoryRootPath}/`);

    return isRepositoryAgentsPath(pathname, repositoryRootPath) || (label === AGENTS_LABEL && isRepositoryScopedLink);
  }

  /**
   * Returns the list of repository navigation roots to scan.
   */
  function collectNavigationRoots(rootNode) {
    const roots = [];

    for (const selector of NAV_SCOPES) {
      const matches = rootNode.querySelectorAll(selector);
      for (const match of matches) {
        if (!roots.includes(match)) {
          roots.push(match);
        }
      }
    }

    return roots.length > 0 ? roots : [rootNode];
  }

  /**
   * Marks an element as hidden to avoid repeated style writes.
   */
  function markTabAsHidden(element) {
    if (element.hasAttribute(HIDDEN_ATTRIBUTE)) {
      return false;
    }

    element.style.display = "none";
    element.setAttribute("aria-hidden", "true");
    element.setAttribute(HIDDEN_ATTRIBUTE, "true");
    return true;
  }

  /**
   * Hides the visual tab container (or the anchor as a fallback).
   */
  function hideTabElement(link) {
    const tabContainer =
      link.closest("li") ||
      link.closest('[role="tab"]') ||
      link.closest(".UnderlineNav-item") ||
      link;

    return markTabAsHidden(tabContainer);
  }

  /**
   * Scans repository navigation and hides any Agents tab links.
   */
  function hideAgentsTab() {
    const pathname = window.location.pathname;
    if (!isRepositoryPathname(pathname)) {
      return;
    }

    const repositoryRootPath = getRepositoryRootPathFromPathname(pathname);
    if (repositoryRootPath === "") {
      return;
    }

    const searchRoots = collectNavigationRoots(document);
    const origin = window.location.origin;

    for (const root of searchRoots) {
      const links = root.querySelectorAll("a[href]");
      for (const link of links) {
        if (isAgentsTabLink(link, repositoryRootPath, origin)) {
          hideTabElement(link);
        }
      }
    }
  }

  /**
   * Returns true when an element matches one of the selector hints.
   */
  function nodeMatchesAnySelector(node, selectors) {
    if (typeof Element === "undefined" || !(node instanceof Element)) {
      return false;
    }

    return selectors.some((selector) => node.matches(selector));
  }

  /**
   * Returns true when an element contains one of the selector hints.
   */
  function nodeContainsAnySelector(node, selectors) {
    if (typeof Element === "undefined" || !(node instanceof Element)) {
      return false;
    }

    return selectors.some((selector) => node.querySelector(selector) !== null);
  }

  /**
   * Returns true when mutation records could affect repository navigation.
   */
  function mutationCanAffectNavigation(mutations) {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }

      const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
      for (const node of changedNodes) {
        if (
          nodeMatchesAnySelector(node, NAV_MUTATION_HINT_SELECTORS) ||
          nodeContainsAnySelector(node, NAV_MUTATION_HINT_SELECTORS)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Debounces repeated DOM updates into a single animation frame run.
   */
  function queueHideAgentsTab() {
    if (queuedAnimationFrame !== 0) {
      return;
    }

    queuedAnimationFrame = window.requestAnimationFrame(() => {
      queuedAnimationFrame = 0;
      hideAgentsTab();
    });
  }

  /**
   * Initializes observers and page event handlers for GitHub navigation.
   */
  function initialize() {
    const observer = new MutationObserver((mutations) => {
      if (mutationCanAffectNavigation(mutations)) {
        queueHideAgentsTab();
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("turbo:load", queueHideAgentsTab, true);
    document.addEventListener("pjax:end", queueHideAgentsTab, true);
    window.addEventListener("popstate", queueHideAgentsTab, true);
    queueHideAgentsTab();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      getPathnameFromHref,
      getRepositoryRootPathFromPathname,
      isRepositoryAgentsPath,
      isRepositoryPathname,
      normalizeLinkLabel
    };
  }

  if (typeof window !== "undefined" && typeof document !== "undefined" && document.documentElement) {
    initialize();
  }
})();
