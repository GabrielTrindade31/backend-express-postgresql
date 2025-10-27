import { config } from 'dotenv';

config();

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  mongoUri: string;
}

const resolveMongoUri = (): string => {
  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production') {
    return process.env.MONGO_URI_PROD ?? '';
  }
  return process.env.MONGO_URI ?? '';
};

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? '',
  mongoUri: resolveMongoUri(),
};

export const validateEnv = (): void => {
  const missing: string[] = [];

  if (!env.mongoUri) {
    missing.push(env.nodeEnv === 'production' ? 'MONGO_URI_PROD' : 'MONGO_URI');
  }

  if (!env.jwtSecret) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
};
