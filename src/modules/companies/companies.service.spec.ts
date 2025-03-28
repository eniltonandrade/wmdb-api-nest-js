import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from '@/database/prisma/prisma.service'

import { CompaniesService } from './companies.service'

const mockCompany = {
  id: '1',
  name: 'Test Company',
  tmdbId: 123,
  logoPath: '/logo.png',
}

describe('CompaniesService', () => {
  let service: CompaniesService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniesService, PrismaService],
    }).compile()

    service = module.get<CompaniesService>(CompaniesService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOrCreate', () => {
    it('should return a company when found or created', async () => {
      jest.spyOn(prisma.company, 'upsert').mockResolvedValue(mockCompany)
      await expect(
        service.findOrCreate({ name: 'Test', tmdbId: 123 }),
      ).resolves.toEqual(mockCompany)
    })
  })

  describe('findAll', () => {
    it('should return a list of companies with total count', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([[mockCompany], 1])
      await expect(service.findAll()).resolves.toEqual({
        results: [mockCompany],
        total: 1,
      })
    })
  })

  describe('findOne', () => {
    it('should return a company when found', async () => {
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue(mockCompany)
      await expect(service.findOne('1')).resolves.toEqual(mockCompany)
    })

    it('should throw NotFoundException if company is not found', async () => {
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue(null)
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a company', async () => {
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue(mockCompany)
      jest.spyOn(prisma.company, 'update').mockResolvedValue(mockCompany)
      await expect(
        service.update('1', { name: 'Updated' }),
      ).resolves.toBeUndefined()
    })

    it('should throw NotFoundException if company does not exist', async () => {
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue(null)
      await expect(service.update('1', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should delete a company', async () => {
      jest.spyOn(prisma.company, 'delete').mockResolvedValue(mockCompany)
      await expect(service.remove('1')).resolves.toBeUndefined()
    })
  })

  describe('addCompanyToMovie', () => {
    it('should add a company to a movie', async () => {
      jest.spyOn(prisma.company, 'upsert').mockResolvedValue(mockCompany)
      await expect(
        service.addCompanyToMovie(
          { name: 'Test', tmdbId: 123, logoPath: '/logo.png' },
          'movieId',
        ),
      ).resolves.toBeUndefined()
    })
  })
})
