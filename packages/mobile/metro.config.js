// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro sees changes in packages/shared
config.watchFolders = [workspaceRoot];

// Tell Metro to look for modules in both the project root and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Resolve @inwealthment/shared to its source directly (no compilation step needed)
config.resolver.extraNodeModules = {
  '@inwealthment/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

module.exports = config;
