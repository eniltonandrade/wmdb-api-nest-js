import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { format } from 'date-fns'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body, query } = req
    const startTime = Date.now()

    const sanitizedBody = this.sanitizeSensitiveData(body)
    const originalSend = res.send
    let responseBody: string

    res.send = (data) => {
      responseBody = data
      return originalSend.call(res, data)
    }

    this.logger.log(
      `${format(new Date(), "d'/'MM'/'yyyy'|'HH:mm:ss")}|REQUEST|${method}|${originalUrl}|${JSON.stringify(query)}`,
    )
    this.logger.debug(`${JSON.stringify(sanitizedBody)}`)

    res.on('finish', () => {
      const duration = Date.now() - startTime
      this.logger.log(
        `${format(new Date(), "d'/'MM'/'yyyy'|'HH:mm:ss")}|RESPONSE|${method}|${originalUrl}|${res.statusCode}|${duration}`,
      )

      if (responseBody) {
        const sanitizedResponse = this.sanitizeSensitiveData(
          JSON.parse(responseBody),
        )
        this.logger.debug(`${JSON.stringify(sanitizedResponse)}`)
      }
    })

    next()
  }

  private sanitizeSensitiveData(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data

    const sanitized = { ...data }
    if ('password' in sanitized) sanitized.password = '****'
    if ('access_token' in sanitized) sanitized.access_token = '****'
    if ('refresh_token' in sanitized) sanitized.refresh_token = '****'

    return sanitized
  }
}
