import pkg from "../package.json";

// Bundled into the compiled binary at build time (Bun inlines JSON imports).
export const VERSION: string = pkg.version;
