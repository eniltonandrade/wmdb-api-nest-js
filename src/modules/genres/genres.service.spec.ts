import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Genre } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'

import { GenresService } from './genres.service'

const mockGenre: Genre = {
  id: '1',
  name: 'Test Genre',
  tmdbId: 12345,
}

describe('GenresService', () => {
  let service: GenresService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: PrismaService,
          useValue: {
            genre: {
              upsert: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<GenresService>(GenresService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOrCreate', () => {
    it('should create or return an existing genre', async () => {
      const genreData = { name: 'Action', tmdbId: 1 }
      const genreResult = { id: '123', ...genreData }
      jest.spyOn(prisma.genre, 'upsert').mockResolvedValue(genreResult)

      const result = await service.findOrCreate(genreData)
      expect(result).toEqual(genreResult)
      expect(prisma.genre.upsert).toHaveBeenCalledWith({
        create: genreData,
        update: {},
        where: { tmdbId: 1 },
      })
    })
  })

  describe('findAll', () => {
    it('should return a list of genres', async () => {
      const genres = [{ id: '123', name: 'Action', tmdbId: 1 }]
      jest
        .spyOn(prisma, '$transaction')
        .mockResolvedValue([genres, genres.length])

      const result = await service.findAll()
      expect(result).toEqual({ total: 1, results: genres })
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      const genre = { id: '123', name: 'Action', tmdbId: 1 }
      jest.spyOn(prisma.genre, 'findUnique').mockResolvedValue(genre)

      const result = await service.findOne('123')
      expect(result).toEqual(genre)
      expect(prisma.genre.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      })
    })

    it('should throw NotFoundException if genre does not exist', async () => {
      jest.spyOn(prisma.genre, 'findUnique').mockResolvedValue(null)
      await expect(service.findOne('123')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a genre', async () => {
      jest.spyOn(prisma.genre, 'findUnique').mockResolvedValue(mockGenre)
      jest.spyOn(prisma.genre, 'update').mockResolvedValue(mockGenre)

      await service.update('123', { name: 'Adventure', tmdbId: 2 })
      expect(prisma.genre.update).toHaveBeenCalledWith({
        data: { name: 'Adventure', tmdbId: 2 },
        where: { id: '123' },
      })
    })

    it('should throw NotFoundException if genre does not exist', async () => {
      jest.spyOn(prisma.genre, 'findUnique').mockResolvedValue(null)
      await expect(
        service.update('123', { name: 'Adventure', tmdbId: 2 }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete a genre', async () => {
      jest.spyOn(prisma.genre, 'delete').mockResolvedValue(mockGenre)
      await service.remove('123')
      expect(prisma.genre.delete).toHaveBeenCalledWith({ where: { id: '123' } })
    })
  })

  describe('addGenreToMovie', () => {
    it('should add a genre to a movie', async () => {
      const genreData = { name: 'Action', tmdbId: 1 }
      jest.spyOn(prisma.genre, 'upsert').mockResolvedValue(mockGenre)

      await service.addGenreToMovie(genreData, 'movie123')
      expect(prisma.genre.upsert).toHaveBeenCalledWith({
        where: { tmdbId: 1 },
        update: {
          name: 'Action',
          movies: { create: { movieId: 'movie123' } },
        },
        create: {
          name: 'Action',
          tmdbId: 1,
          movies: { create: { movieId: 'movie123' } },
        },
      })
    })
  })
})
