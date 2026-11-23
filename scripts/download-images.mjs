import { mkdir, writeFile } from 'node:fs/promises';
const images = {
  chair: 'photo-1567538096630-e0c55bd6374c',
  camera: 'photo-1516035069371-29a1b244cc32',
  headphones: 'photo-1546435770-a3e426bf472b',
  bike: 'photo-1485965120184-e220f721d03e',
  guitar: 'photo-1510915361894-db8b60106cb1',
  shoes: 'photo-1542291026-7eec264c27ff',
  books: 'photo-1495446815901-a7297e633e8d',
  lamp: 'photo-1507473885765-e6ed057f782c',
};
await mkdir('frontend/public/images', { recursive: true });
await Promise.all(
  Object.entries(images).map(async ([name, id]) => {
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Imagen ${name}: ${response.status}`);
    await writeFile(
      `frontend/public/images/${name}.jpg`,
      Buffer.from(await response.arrayBuffer()),
    );
  }),
);
await writeFile(
  'frontend/public/images/sources.json',
  JSON.stringify(
    Object.fromEntries(
      Object.entries(images).map(([k, v]) => [`${k}.jpg`, `https://images.unsplash.com/${v}`]),
    ),
    null,
    2,
  ),
);
console.log('8 fotografías descargadas y fuentes registradas.');
