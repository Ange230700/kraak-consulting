<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

    <xsl:template match="/">
        <html lang="fr">
            <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <title>Sitemap KRAAK</title>
                <style>
          :root {
            color-scheme: light;
            --bg: #f5f7fb;
            --panel: #ffffff;
            --text: #12223a;
            --muted: #53637a;
            --accent: #0f6d8a;
            --line: #dbe2ee;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: "Segoe UI", "Noto Sans", sans-serif;
            color: var(--text);
            background: radial-gradient(circle at top right, #e6eefc, var(--bg) 35%);
          }

          main {
            max-width: 980px;
            margin: 2.5rem auto;
            padding: 0 1rem;
          }

          h1 {
            margin: 0 0 0.5rem;
            font-size: 2rem;
            letter-spacing: 0.02em;
          }

          p {
            margin: 0;
            color: var(--muted);
          }

          .card {
            margin-top: 1.5rem;
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 14px 32px rgba(9, 34, 66, 0.08);
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            text-align: left;
            padding: 0.8rem 1rem;
            border-bottom: 1px solid var(--line);
            vertical-align: top;
            font-size: 0.95rem;
          }

          th {
            background: #edf2fb;
            color: #24354f;
            font-weight: 700;
          }

          tr:last-child td {
            border-bottom: none;
          }

          a {
            color: var(--accent);
            text-decoration: none;
            word-break: break-all;
          }

          a:hover,
          a:focus-visible {
            text-decoration: underline;
          }

          @media (max-width: 720px) {
            main {
              margin: 1rem auto;
            }

            h1 {
              font-size: 1.4rem;
            }

            th,
            td {
              padding: 0.65rem 0.75rem;
              font-size: 0.9rem;
            }
          }
                </style>
            </head>
            <body>
                <main>
                    <h1>Sitemap XML KRAAK</h1>
                    <p>
            Nombre d'URLs: <strong>
                        <xsl:value-of select="count(s:urlset/s:url)"/>
                    </strong>
                </p>

                <section class="card" aria-label="Liste des URLs du sitemap">
                    <table>
                        <thead>
                            <tr>
                                <th>URL</th>
                                <th>Frequence</th>
                                <th>Priorite</th>
                            </tr>
                        </thead>
                        <tbody>
                            <xsl:for-each select="s:urlset/s:url">
                                <xsl:sort select="s:loc" data-type="text" order="ascending"/>
                                <tr>
                                    <td>
                                        <a href="{s:loc}">
                                            <xsl:value-of select="s:loc"/>
                                        </a>
                                    </td>
                                    <td>
                                        <xsl:value-of select="s:changefreq"/>
                                    </td>
                                    <td>
                                        <xsl:value-of select="s:priority"/>
                                    </td>
                                </tr>
                            </xsl:for-each>
                        </tbody>
                    </table>
                </section>
            </main>
        </body>
    </html>
</xsl:template>
</xsl:stylesheet>
