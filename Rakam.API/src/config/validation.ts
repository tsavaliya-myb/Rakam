import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvVars {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  // @IsNumber()
  @IsOptional()
  PORT = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  DIRECT_URL?: string;

  @IsString()
  REDIS_HOST = 'localhost';

  // @IsNumber()
  @IsOptional()
  REDIS_PORT = 6379;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;
}

export function validate(config: Record<string, unknown>) {
  const parsed = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(parsed, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return parsed;
}
