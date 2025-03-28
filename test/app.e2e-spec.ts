import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!')
  })
})

describe('CompaniesController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('/POST companies (create or find)', () => {
    return request(app.getHttpServer())
      .post('/companies')
      .send({ name: 'Test Company', tmdb_id: 123, logo_path: '/logo.png' })
      .expect(201)
      .then((response) => {
        expect(response.body.result).toHaveProperty('id')
      })
  })

  it('/GET companies (find all)', () => {
    return request(app.getHttpServer())
      .get('/companies')
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('total')
        expect(response.body).toHaveProperty('results')
      })
  })

  it('/GET companies/:id (find one)', () => {
    return request(app.getHttpServer())
      .get('/companies/1')
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('id', '1')
      })
  })

  afterAll(async () => {
    await app.close()
  })
})
