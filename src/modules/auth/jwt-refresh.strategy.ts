import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'

import { EnvService } from '../../env/env.service'

const tokenPayloadSchema = z.object({
  sub: z.string(),
  refreshToken: z.string(),
})

export type RefreshPayload = z.infer<typeof tokenPayloadSchema>

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: EnvService) {
    const secret = config.get('JWT_REFRESH_SECRET')
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      algorithms: ['HS256'],
      ignoreExpiration: false,
      passReqToCallback: true,
    })
  }

  validate(req: Request, payload: RefreshPayload): { refreshToken: string } {
    const refreshToken = req.get('Authorization')!.replace('Bearer', '').trim()
    return { ...payload, refreshToken }
  }
}
