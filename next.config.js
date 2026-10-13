/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode surfaces double-render bugs early; standalone ships a self-contained Node build.
  reactStrictMode: true,
  output: "standalone",
};

module.exports = nextConfig;
