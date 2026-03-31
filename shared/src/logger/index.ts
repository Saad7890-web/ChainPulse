import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  name: env.SERVICE_NAME,
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});
