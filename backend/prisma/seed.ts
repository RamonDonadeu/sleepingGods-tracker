import { PrismaClient } from '@prisma/client';

import { TOTEM_NAMES } from './data/totems.js';

const prisma = new PrismaClient();

/** Nombres antiguos sin artículo → nombre corregido. */
const TOTEM_RENAMES: Record<string, string> = {
  'Piedra de sangre': 'Piedra de la sangre',
  'Piedra de venganza': 'Piedra de la venganza',
  'Piedra de cadenas': 'Piedra de las cadenas',
  'Piedra de negociaciones': 'Piedra de las negociaciones',
  'Piedra de pesadillas': 'Piedra de las pesadillas',
  'Piedra de profundidades': 'Piedra de las profundidades',
  'Piedra de salomas': 'Piedra de las salomas',
  'Piedra de tormentas': 'Piedra de las tormentas',
  'Piedra de acertijos': 'Piedra de los acertijos',
  'Piedra de calamares': 'Piedra de los calamares',
  'Piedra de desplazamientos': 'Piedra de los desplazamientos',
  'Piedra de dientes': 'Piedra de los dientes',
  'Piedra de espejos': 'Piedra de los espejos',
  'Piedra de espíritus': 'Piedra de los espíritus',
  'Piedra de gatos': 'Piedra de los gatos',
  'Piedra de gritos': 'Piedra de los gritos',
  'Piedra de lamentos terrenales': 'Piedra de los lamentos terrenales',
  'Piedra de músculos': 'Piedra de los músculos',
  'Piedra de no-muertos': 'Piedra de los no-muertos',
  'Piedra de perdidos': 'Piedra de los perdidos',
  'Piedra de pigmentos': 'Piedra de los pigmentos',
  'Piedra de terremotos': 'Piedra de los terremotos',
  'Piedra de ojos incontables': 'Piedra de los ojos incontables',
};

async function renameLegacyTotems() {
  let renamed = 0;

  for (const [oldName, newName] of Object.entries(TOTEM_RENAMES)) {
    const legacy = await prisma.totem.findUnique({ where: { name: oldName } });
    if (!legacy) continue;

    const target = await prisma.totem.findUnique({ where: { name: newName } });
    if (target) {
      await prisma.totem.delete({ where: { id: legacy.id } });
    } else {
      await prisma.totem.update({
        where: { id: legacy.id },
        data: { name: newName },
      });
    }
    renamed += 1;
  }

  if (renamed > 0) {
    console.log(`Tótems renombrados: ${renamed}.`);
  }
}

async function main() {
  await renameLegacyTotems();

  let created = 0;
  let existing = 0;

  for (const name of TOTEM_NAMES) {
    const found = await prisma.totem.findUnique({ where: { name } });
    if (found) {
      existing += 1;
      continue;
    }

    await prisma.totem.create({
      data: { name, discovered: false },
    });
    created += 1;
  }

  console.log(
    `Tótems: ${TOTEM_NAMES.length} en catálogo (${created} nuevos, ${existing} ya existían).`,
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
