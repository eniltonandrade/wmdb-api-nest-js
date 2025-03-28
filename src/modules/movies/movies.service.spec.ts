import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Movie } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'

import { MoviesService } from './movies.service'

const mockMovie: Movie = {
  id: '1',
  title: 'Test Movie',
  originalTitle: 'Test Movie Original',
  posterPath: 'test.jpg',
  backdropPath: 'backdrop.jpg',
  releaseDate: new Date('2023-01-01'),
  runtime: 120,
  imdbId: 'tt123456',
  tmdbId: 12345,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('MoviesService', () => {
  let service: MoviesService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: PrismaService,
          useValue: {
            movie: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<MoviesService>(MoviesService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('get', () => {
    it('should return a movie if found', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(mockMovie)
      const result = await service.get('1')
      expect(result).toEqual(mockMovie)
    })

    it('should throw NotFoundException if movie is not found', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null)

      await expect(service.get('1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getByTmdbId', () => {
    it('should return a movie if found', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(mockMovie)
      const result = await service.getByTmdbId(12345)
      expect(result).toEqual(mockMovie)
    })

    it('should throw NotFoundException if movie is not found', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null)
      await expect(service.getByTmdbId(12345)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('findAll', () => {
    it('should return all movies with total count', async () => {
      jest.spyOn(prisma, '$transaction').mockResolvedValue([[mockMovie], 1])
      const result = await service.findAll()
      expect(result).toEqual({ total: 1, results: [mockMovie] })
    })
  })

  describe('create', () => {
    it('should create and return a new movie', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null)
      jest.spyOn(prisma.movie, 'create').mockResolvedValue(mockMovie)

      const result = await service.create({
        ...mockMovie,
        releaseDate: '2023-01-01',
      })
      expect(result).toEqual({ created: true, id: '1' })
    })

    it('should return existing movie if it already exists', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(mockMovie)
      const result = await service.create({
        ...mockMovie,
        releaseDate: '2023-01-01',
      })
      expect(result).toEqual({ created: false, id: '1' })
    })
  })

  describe('update', () => {
    it('should update a movie if it exists', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(mockMovie)
      jest.spyOn(prisma.movie, 'update').mockResolvedValue({
        ...mockMovie,
        title: 'Updated Title',
      })

      await expect(
        service.update(12345, { title: 'Updated Title' }),
      ).resolves.toBeUndefined()
    })

    it('should throw NotFoundException if movie does not exist', async () => {
      jest.spyOn(prisma.movie, 'findUnique').mockResolvedValue(null)
      await expect(
        service.update(12345, { title: 'Updated Title' }),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
