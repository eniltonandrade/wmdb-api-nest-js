import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, baseUrl, body, query, params } = req
    const startTime = Date.now()

    const sanitizedBody = this.sanitizeSensitiveData(body)
    const originalSend = res.send
    let responseBody: string

    res.send = (data) => {
      responseBody = data
      return originalSend.call(res, data)
    }

    this.logger.log(
      `REQUEST|${method}|${baseUrl}${originalUrl}|${JSON.stringify(query)}|${JSON.stringify(params)}`,
    )
    this.logger.debug(`REQUEST|${JSON.stringify(sanitizedBody)}`)

    res.on('finish', () => {
      const duration = Date.now() - startTime
      this.logger.log(
        `RESPONSE|${method}|${originalUrl}|${res.statusCode}|${duration}`,
      )

      if (responseBody) {
        const sanitizedResponse = this.sanitizeSensitiveData(
          JSON.parse(responseBody),
        )
        this.logger.debug(`RESPONSE:${JSON.stringify(sanitizedResponse)}`)
      }
    })

    next()
  }

  private sanitizeSensitiveData(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data

    const sanitized = { ...data }
    if ('password' in sanitized) sanitized.password = '****'
    if ('access_token' in sanitized) sanitized.access_token = '****'

    return sanitized
  }
}
