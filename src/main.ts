import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { patchNestJsSwagger } from 'nestjs-zod'

import { AppModule } from './app.module'
import { EnvService } from './env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const envService = app.get(EnvService)

  patchNestJsSwagger()

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('WMDB')
    .setVersion('2.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: 'Enter your Bearer token',
    })
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      security: [{ 'access-token': [] }],
    },
  })

  const port = envService.get('PORT')

  await app.listen(port)
}
bootstrap()
