import postcss from "postcss";

/** Reject stale CSS exports that would hide the page while its pinning rules are absent. */
export function verifySceneCss(css) {
  const found = new Set();
  postcss.parse(css).walkRules((rule) => {
    const declarations = new Map(
      rule.nodes
        .filter((node) => node.type === "decl")
        .map((node) => [node.prop, node.value]),
    );
    if (
      rule.selector.includes(".scene-stack") &&
      declarations.get("overflow-y") === "auto" &&
      declarations.get("height")?.includes("--scene-viewport")
    )
      found.add("scrollport");
    if (
      rule.selector.includes(".scene-stage") &&
      declarations.get("position") === "sticky" &&
      declarations.get("height")?.includes("--scene-viewport")
    )
      found.add("sticky stage");
    if (
      rule.selector.includes(".scene-panel") &&
      declarations.get("position") === "absolute"
    )
      found.add("positioned panels");
  });
  const missing = ["scrollport", "sticky stage", "positioned panels"].filter(
    (name) => !found.has(name),
  );
  if (missing.length)
    throw new Error(
      `Scene CSS is missing: ${missing.join(", ")}. Refusing to publish a broken layout.`,
    );
}
