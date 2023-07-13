/** @type {import('next').NextConfig} */

// Need to transpile typescript from shared workspace
// const withTM = require('next-transpile-modules')([
//     '@memory-cards/shared',
// ]);

const nextConfig = {
    transpilePackages: ['@memory-cards/shared',],
}

module.exports = nextConfig
