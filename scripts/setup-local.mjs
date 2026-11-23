import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const raw = execFileSync(
  process.execPath,
  ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'],
  { encoding: 'utf8' },
);
const start = raw.indexOf('{');
const status = JSON.parse(raw.slice(start));
const url = status.API_URL;
const anon = status.ANON_KEY || status.PUBLISHABLE_KEY;
const service = status.SERVICE_ROLE_KEY || status.SECRET_KEY;
if (!url || !anon || !service)
  throw new Error(
    'Supabase no devolvió la configuración necesaria. Inicia primero npm run db:start.',
  );
writeFileSync(
  '.env',
  `SUPABASE_URL=${url}\nSUPABASE_ANON_KEY=${anon}\nSUPABASE_SERVICE_ROLE_KEY=${service}\nWEB_URL=http://localhost:4310\nPORT=4311\n`,
);
writeFileSync(
  'frontend/.env.local',
  `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}\nAPI_INTERNAL_URL=http://127.0.0.1:4311\n`,
);
mkdirSync('.local', { recursive: true });
console.log('Configuración local escrita. Las claves están excluidas de Git.');
