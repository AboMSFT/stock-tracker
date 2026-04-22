// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro sees changes in packages/shared
config.watchFolders = [workspaceRoot];

// Force Metro to resolve packages only from nodeModulesPaths (not hierarchical lookup).
// This prevents the workspace root's react@19.2.x from shadowing mobile's react@19.0.0
// when files inside packages/shared traverse up the directory tree.
config.resolver.disableHierarchicalLookup = true;

// Resolve modules from mobile first, then workspace root as fallback
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Resolve @inwealthment/shared to its source directly (no compilation step needed)
config.resolver.extraNodeModules = {
  '@inwealthment/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

module.exports = config;
