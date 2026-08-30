import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const token = request.headers['x-internal-token'];
    const expected = process.env.INTERNAL_SERVICE_TOKEN ?? 'dev-internal-token';

    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid internal service token');
    }

    return true;
  }
}
