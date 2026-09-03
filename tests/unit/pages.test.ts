import { describe, expect, it } from "vitest";
import { safeJsonLd } from "@/lib/pages";

describe("safeJsonLd", () => {
  it("escapa '<' para impedir o fechamento prematuro da tag script", () => {
    const input = { name: "</script><script>alert(1)</script>" };
    const out = safeJsonLd(input);
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c/script>");
    expect(JSON.parse(out)).toEqual(input);
  });
});
