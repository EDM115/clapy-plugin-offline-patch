import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Robust path resolution across platforms (Windows/Linux/Mac)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const srcDir = __dirname;
export const backendDir = resolve(__dirname, '..');
export const rootDir = resolve(backendDir, '..');
// local-gen-clapy is a sibling of the monorepo folder (local-gen-clapy from rootDir)
export const localGenClapyDir = resolve(rootDir, /* '..',*/ 'local-gen-clapy');
export const pluginDir = resolve(rootDir, 'figma-plugin-clapy');
// Container mount path for plugin components (keep posix style for Docker target)
export const dockerPluginCompDir = `/plugin/components`;

export const exportTemplatesDir = resolve(backendDir, 'export-templates');
