import { NextResponse } from "next/server";

const SWAGGER_UI_VERSION = "5.18.2";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StockMind API Documentation</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css"
    />
    <style>
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #fafafa; }
      .swagger-ui .topbar { display: none; }
      .docs-banner {
        background: linear-gradient(135deg, #0b63cf 0%, #0058be 100%);
        color: #fff;
        padding: 1.25rem 1.5rem;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }
      .docs-banner h1 { margin: 0 0 0.35rem; font-size: 1.35rem; font-weight: 600; }
      .docs-banner p { margin: 0; font-size: 0.875rem; opacity: 0.92; max-width: 52rem; line-height: 1.5; }
      .docs-banner a { color: #fff; text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="docs-banner">
      <h1>StockMind API — Swagger Documentation</h1>
      <p>
        Authenticated endpoints use your browser session cookie.
        <a href="/login">Sign in</a> first, then use <em>Try it out</em> on protected routes.
        OpenAPI spec: <a href="/api/docs/openapi.json">/api/docs/openapi.json</a>
      </p>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/api/docs/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout",
          persistAuthorization: true,
          tryItOutEnabled: true,
          displayRequestDuration: true,
          filter: true,
          syntaxHighlight: { theme: "monokai" },
        });
      };
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
