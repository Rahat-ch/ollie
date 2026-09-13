import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is what the Dockerfile copies into the runtime image.
  output: "standalone",
  // No image optimisation: it needs `sharp`, whose libvips binary is LGPL
  // (prohibited by the hackathon terms), and Ollie ships SVG, not raster.
  // The matching pnpm override that removes `sharp` is in pnpm-workspace.yaml.
  images: { unoptimized: true },
  // Ollie's bundled lines are named after a hash of what they say, so a file
  // at one name never changes: a device fetches each line once, ever.
  headers() {
    return Promise.resolve([
      {
        source: "/voice/:path*",
        headers: [{ key: "cache-control", value: "public, max-age=31536000, immutable" }],
      },
    ]);
  },
};

export default nextConfig;
