import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["three", "@azzo/avatar"],
  allowedDevOrigins: ["127.0.0.1"],
};
export default config;
