import { createLogger, format, transports, Logform } from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Definisikan tipe untuk printf
interface CustomLogInfo extends Logform.TransformableInfo {
  requestId?: string;
}

const logFormat = format.printf(({ level, message, timestamp, requestId }: CustomLogInfo) => {
  return `${timestamp} [${level}] [${requestId || 'N/A'}]: ${message}`;
});

export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), logFormat),
  transports: [new transports.Console()],
});

// Middleware untuk inject requestId
import { Request, Response, NextFunction } from 'express';

export const requestIdMiddleware = (
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
) => {
  req.requestId = uuidv4();
  next();
};
