import { Test, TestingModule } from '@nestjs/testing'
import { Movie } from '@prisma/client'

import { CreateMovieDTO } from './dto/create-movie.dto'
import { UpdateMovieDto } from './dto/update-movie.dto'
import { MoviesController } from './movies.controller'
import { MoviesService } from './movies.service'

describe('MoviesController', () => {
  let controller: MoviesController
  let moviesService: MoviesService

  const mockMovie: Movie = {
    id: '1',
    imdbId: 'tt1234567',
    originalTitle: 'Original Title',
    releaseDate: new Date('2022-01-01'),
    title: 'Test Movie',
    tmdbId: 12345,
    backdropPath: 'path/to/backdrop',
    posterPath: 'path/to/poster',
    runtime: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockMoviesService = {
    create: jest.fn().mockResolvedValue(mockMovie),
    get: jest.fn().mockResolvedValue(mockMovie),
    getByTmdbId: jest.fn().mockResolvedValue(mockMovie),
    findAll: jest.fn().mockResolvedValue({ results: [mockMovie], count: 1 }),
    update: jest.fn().mockResolvedValue(mockMovie),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile()

    controller = module.get<MoviesController>(MoviesController)
    moviesService = module.get<MoviesService>(MoviesService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('find or create a movie', () => {
    it('should create a new movie', async () => {
      const dto: CreateMovieDTO = {
        backdrop_path: 'path/to/backdrop',
        imdb_id: 'tt1234567',
        original_title: 'Original Title',
        poster_path: 'path/to/poster',
        release_date: new Date('2022-01-01').toLocaleDateString(),
        runtime: 120,
        title: 'Test Movie',
        tmdb_id: 12345,
      }

      expect(await controller.findOrCreate(dto)).toEqual({ result: mockMovie })
      expect(moviesService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tmdbId: 12345 }),
      )
    })
  })

  describe('get', () => {
    it('should return a movie by id', async () => {
      expect(await controller.get('1')).toEqual(mockMovie)
      expect(moviesService.get).toHaveBeenCalledWith('1')
    })
  })

  describe('getByTmdbId', () => {
    it('should return a movie by tmdb id', async () => {
      expect(await controller.getByTmdbId('12345')).toEqual(mockMovie)
      expect(moviesService.getByTmdbId).toHaveBeenCalledWith(12345)
    })
  })

  describe('findAll', () => {
    it('should return all movies', async () => {
      expect(await controller.findAll()).toEqual({
        results: [mockMovie],
        count: 1,
      })
      expect(moviesService.findAll).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update a movie', async () => {
      const dto: UpdateMovieDto = {
        backdrop_path: 'path/to/backdrop',
        imdb_id: 'tt1234567',
        original_title: 'Original Title',
        poster_path: 'path/to/poster',
        release_date: new Date('2022-01-01').toLocaleDateString(),
        runtime: 120,
        title: 'Updated Movie',
        tmdb_id: 12345,
      }

      expect(await controller.update('12345', dto)).toEqual(mockMovie)
      expect(moviesService.update).toHaveBeenCalledWith(
        12345,
        expect.objectContaining({ title: 'Updated Movie' }),
      )
    })
  })
})
