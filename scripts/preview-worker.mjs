// Entrega o mesmo HTML/RSC/JSON do export, sem carregar o acervo na memória.
export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response(null, { status: 405 });
    const url = new URL(request.url);
    const path = url.pathname;
    let assetPath = path.endsWith("/") ? `${path}index.html` : path;
    if (!assetPath.split("/").pop().includes(".")) assetPath += "/index.html";
    if (/\.(html|txt|json)$/.test(assetPath)) {
      const assetUrl = new URL(url);
      assetUrl.pathname = `${assetPath}.gz`;
      assetUrl.search = "";
      const asset = await env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
      if (asset.ok && asset.body) {
        const headers = new Headers(asset.headers);
        headers.delete("content-length");
        headers.delete("content-encoding");
        headers.delete("etag");
        headers.set(
          "content-type",
          assetPath.endsWith(".html")
            ? "text/html; charset=utf-8"
            : assetPath.endsWith(".json")
              ? "application/json; charset=utf-8"
              : "text/plain; charset=utf-8",
        );
        headers.set("x-content-type-options", "nosniff");
        return new Response(
          request.method === "HEAD"
            ? null
            : asset.body.pipeThrough(new DecompressionStream("gzip")),
          { headers },
        );
      }
    }
    return env.ASSETS.fetch(request);
  },
};
