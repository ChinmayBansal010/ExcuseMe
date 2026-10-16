import { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0B0D11" />
        <meta name="description" content="ExcuseMoi — a practical studio for text analysis, comparison and semantic search." />
        <title>ExcuseMoi — Text Studio</title>
        <script src="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.min.js" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
