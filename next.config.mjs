/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY,
    OLLAMA_URL: process.env.OLLAMA_URL,
  },
};

export default nextConfig;
