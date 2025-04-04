import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.movie.deleteMany()
  await prisma.person.deleteMany()
  await prisma.company.deleteMany()
  await prisma.genre.deleteMany()
}
main()
