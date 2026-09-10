import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is what the Dockerfile copies into the runtime image.
  output: "standalone",
  // No image optimisation: it needs `sharp`, whose libvips binary is LGPL
  // (prohibited by the hackathon terms), and Ollie ships SVG, not raster.
  // The matching pnpm override that removes `sharp` is in pnpm-workspace.yaml.
  images: { unoptimized: true },
};

export default nextConfig;
