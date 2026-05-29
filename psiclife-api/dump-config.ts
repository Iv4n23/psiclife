import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.sys_configuracion.findMany().then(c => {
  console.log(JSON.stringify(c, null, 2));
  prisma.$disconnect();
});
