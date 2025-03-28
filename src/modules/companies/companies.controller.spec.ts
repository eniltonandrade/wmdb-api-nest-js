import { Test, TestingModule } from '@nestjs/testing'

import { CompaniesController } from './companies.controller'
import { CompaniesService } from './companies.service'
import { AddCompanyToMovieDto } from './dto/add-to-movie.dtos'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'

describe('CompaniesController', () => {
  let controller: CompaniesController
  let service: CompaniesService

  const mockCompany = {
    id: '1',
    name: 'Test Company',
    tmdbId: 123,
    logoPath: '/logo.png',
  }

  const mockService = {
    findOrCreate: jest.fn().mockResolvedValue(mockCompany),
    findAll: jest.fn().mockResolvedValue({ total: 1, results: [mockCompany] }),
    findOne: jest.fn().mockResolvedValue(mockCompany),
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    addCompanyToMovie: jest.fn().mockResolvedValue(undefined),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [{ provide: CompaniesService, useValue: mockService }],
    }).compile()

    controller = module.get<CompaniesController>(CompaniesController)
    service = module.get<CompaniesService>(CompaniesService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call findOrCreate and return a company', async () => {
    const dto: CreateCompanyDto = {
      name: 'Test',
      tmdb_id: 123,
      logo_path: '/logo.png',
    }
    await expect(controller.findOrCreate(dto)).resolves.toEqual({
      result: mockCompany,
    })
    expect(service.findOrCreate).toHaveBeenCalledWith({
      name: dto.name,
      tmdbId: dto.tmdb_id,
      logoPath: dto.logo_path,
    })
  })

  it('should call findAll and return a list of companies', async () => {
    await expect(controller.findAll()).resolves.toEqual({
      total: 1,
      results: [mockCompany],
    })
    expect(service.findAll).toHaveBeenCalled()
  })

  it('should call findOne and return a company', async () => {
    await expect(controller.findOne('1')).resolves.toEqual(mockCompany)
    expect(service.findOne).toHaveBeenCalledWith('1')
  })

  it('should call update with correct parameters', async () => {
    const dto: UpdateCompanyDto = {
      name: 'Updated',
      tmdb_id: 456,
      logo_path: '/new-logo.png',
    }
    await expect(controller.update('1', dto)).resolves.toBeUndefined()
    expect(service.update).toHaveBeenCalledWith('1', {
      name: dto.name,
      tmdbId: dto.tmdb_id,
      logoPath: dto.logo_path,
    })
  })

  it('should call remove and return nothing', async () => {
    await expect(controller.remove('1')).resolves.toBeUndefined()
    expect(service.remove).toHaveBeenCalledWith('1')
  })

  it('should call addCompanyToMovie with correct parameters', async () => {
    const dto: AddCompanyToMovieDto = {
      company: { name: 'Test', tmdb_id: 123, logo_path: '/logo.png' },
    }
    await expect(
      controller.addCompanyToMovie('1', dto),
    ).resolves.toBeUndefined()
    expect(service.addCompanyToMovie).toHaveBeenCalledWith(
      {
        name: dto.company.name,
        tmdbId: dto.company.tmdb_id,
        logoPath: dto.company.logo_path,
      },
      '1',
    )
  })
})
