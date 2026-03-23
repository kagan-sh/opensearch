import { describe, expect, it } from "vitest";
import { createGrepAppDatasource, createSearxngDatasource } from "../src/index";

const asFetch = (handler: (input: URL | RequestInfo | string) => Promise<Response>) => handler as typeof fetch;

describe("datasource snippet normalization", () => {
  it("strips grep.app html and line-number noise", async () => {
    const datasource = createGrepAppDatasource({
      fetch: asFetch(async () =>
        new Response(
          JSON.stringify({
            hits: {
              hits: [
                {
                  repo: { raw: "acme/api" },
                  path: { raw: "src/server.ts" },
                  content: {
                    snippet:
                      '<table><tr><td>120</td><td><mark>export</mark> async function search() {</td></tr><tr><td>121</td><td>return <mark>fetch</mark>(url)</td></tr></table>',
                  },
                  score: 82,
                },
              ],
            },
          }),
        ),
      ),
    });

    const result = await datasource.search({ query: "search", maxSources: 5 });

    expect(result.results[0]?.snippet).toBe("export async function search() {\nreturn fetch(url)");
  });

  it("normalizes searxng snippets into readable prose", async () => {
    const datasource = createSearxngDatasource({
      baseUrl: "https://example.com",
      fetch: asFetch(async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                url: "https://docs.example.com/search",
                title: "Search docs",
                content: "Search&nbsp;docs explain &quot;server-side&quot; setup <b>clearly</b>.",
              },
            ],
          }),
        ),
      ),
      queryExpansions: (query) => [query],
    });

    const result = await datasource.search({ query: "server-side setup", maxSources: 5 });

    expect(result.results[0]?.snippet).toBe('Search docs explain "server-side" setup clearly.');
  });
});
