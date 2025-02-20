import { dfs, dpath } from "../../deps.ts";

export async function plugins(source: string) {
  // Check if the source is a URL
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const module = await import(source);
    module.default?.();
  } else {
    // Handle local directory logic
    const entries = dfs.walk(source, {
      match: [/\.ts$/, /\.js$/],
      maxDepth: 1,
    });
    for await (const entry of entries) {
      if (entry.isFile) {
        const module = await import(dpath.toFileUrl(entry.path).toString());
        module.default?.();
      }
    }
  }
}
