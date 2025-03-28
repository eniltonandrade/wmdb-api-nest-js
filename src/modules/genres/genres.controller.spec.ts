import { Test, TestingModule } from '@nestjs/testing'

import { AddGenreToMovieDto } from './dto/add-to-movie.dto'
import { CreateGenreDto } from './dto/create-genre.dto'
import { UpdateGenreDto } from './dto/update-genre.dto'
import { GenresController } from './genres.controller'
import { GenresService } from './genres.service'

describe('GenresController', () => {
  let controller: GenresController
  let service: GenresService

  const mockGenre = { id: '1', name: 'Action', tmdbId: 28 }

  const mockGenresService = {
    findOrCreate: jest.fn().mockResolvedValue(mockGenre),
    findAll: jest.fn().mockResolvedValue([mockGenre]),
    findOne: jest.fn().mockResolvedValue(mockGenre),
    update: jest.fn().mockResolvedValue(mockGenre),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
    addGenreToMovie: jest.fn().mockResolvedValue(mockGenre),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [{ provide: GenresService, useValue: mockGenresService }],
    }).compile()

    controller = module.get<GenresController>(GenresController)
    service = module.get<GenresService>(GenresService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should create or find a genre', async () => {
    const dto: CreateGenreDto = { name: 'Action', tmdb_id: 28 }
    const result = await controller.findOrCreate(dto)
    expect(result).toEqual({ result: mockGenre })
    expect(service.findOrCreate).toHaveBeenCalledWith({
      name: 'Action',
      tmdbId: 28,
    })
  })

  it('should get all genres', async () => {
    const result = await controller.findAll()
    expect(result).toEqual([mockGenre])
    expect(service.findAll).toHaveBeenCalled()
  })

  it('should get a single genre', async () => {
    const result = await controller.findOne('1')
    expect(result).toEqual(mockGenre)
    expect(service.findOne).toHaveBeenCalledWith('1')
  })

  it('should update a genre', async () => {
    const dto: UpdateGenreDto = { name: 'Adventure', tmdb_id: 12 }
    const result = await controller.update('1', dto)
    expect(result).toEqual(mockGenre)
    expect(service.update).toHaveBeenCalledWith('1', {
      name: 'Adventure',
      tmdbId: 12,
    })
  })

  it('should delete a genre', async () => {
    const result = await controller.remove('1')
    expect(result).toEqual({ deleted: true })
    expect(service.remove).toHaveBeenCalledWith('1')
  })

  it('should add a genre to a movie', async () => {
    const dto: AddGenreToMovieDto = { genre: { name: 'Action', tmdb_id: 28 } }
    const result = await controller.addGenreToMovie('1', dto)
    expect(result).toEqual(mockGenre)
    expect(service.addGenreToMovie).toHaveBeenCalledWith(
      { name: 'Action', tmdbId: 28 },
      '1',
    )
  })
})
