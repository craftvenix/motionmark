// Self-hosted faces are declared in src/fonts.css. Canvas rendering does not
// wait for webfonts automatically, so make sure the selected family is ready
// before an export captures its first frame.
export async function ensureFontFamily(family: string) {
  if (typeof document === 'undefined' || !document.fonts) return
  const name = family.replace(/["']/g, '').trim()
  if (!name) return
  try {
    await Promise.all([
      document.fonts.load(`400 16px "${name}"`),
      document.fonts.load(`500 72px "${name}"`),
      document.fonts.load(`700 72px "${name}"`),
    ])
    await document.fonts.ready
  } catch {
    // Keep the CSS fallback stack if a face cannot be loaded.
  }
}
