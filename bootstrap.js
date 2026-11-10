// Compile the small JSX modules in the browser for this zero-install demo.
// React, icons, Babel, and Tailwind are loaded from their public CDNs in index.html.
const moduleUrls = new Map();

async function loadModule(modulePath) {
  const url = new URL(modulePath, location.href).href;
  if (moduleUrls.has(url)) return moduleUrls.get(url);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${new URL(url).pathname} (${response.status})`);
  let source = await response.text();
  const importPattern = /((?:from\s*|import\s*)['"])(\.\.?\/[^'"]+)(['"])/g;
  const imports = [...source.matchAll(importPattern)];

  for (const match of imports) {
    const importedUrl = await loadModule(new URL(match[2], url).href);
    source = source.replace(match[0], `${match[1]}${importedUrl}${match[3]}`);
  }

  const compiled = Babel.transform(source, {
    presets: [['react', { runtime: 'automatic' }]],
    sourceType: 'module',
  }).code;
  const blobUrl = URL.createObjectURL(new Blob([compiled], { type: 'text/javascript' }));
  moduleUrls.set(url, blobUrl);
  return blobUrl;
}

try {
  await import(await loadModule('./main.jsx'));
} catch (error) {
  console.error(error);
  document.getElementById('root').innerHTML = `<main style="max-width:640px;margin:15vh auto;padding:24px;font:14px sans-serif;color:#26382e"><h1>Wayfinder could not start</h1><p>${error.message}</p><p>Check that you are online so the React, Babel, and Tailwind CDN files can load.</p></main>`;
}
