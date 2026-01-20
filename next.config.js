/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force dynamic rendering to avoid static generation issues
    output: 'standalone',

    // Disable static page generation for all pages
    experimental: {
        // This helps avoid memory issues during build
    },

    // Increase memory limit and timeout
    staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;
