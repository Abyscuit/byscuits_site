/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    DISCORD_CLIENTID: process.env.DISCORD_CLIENTID,
    DISCORD_SECRET: process.env.DISCORD_SECRET,
    DISCORD_OAUTH: process.env.DISCORD_OAUTH,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
