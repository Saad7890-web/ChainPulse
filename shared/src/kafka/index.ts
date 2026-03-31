import { Consumer, Kafka, Producer, logLevel } from "kafkajs";
import { env } from "../config/env";
import { logger } from "../logger";

const brokers = env.KAFKA_BROKERS.split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

if (brokers.length === 0) {
  throw new Error("KAFKA_BROKERS must contain at least one broker");
}

const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers,
  logLevel: env.NODE_ENV === "production" ? logLevel.ERROR : logLevel.INFO,
});

export async function createProducer(): Promise<Producer> {
  const producer = kafka.producer();

  await producer.connect();
  logger.info({ brokers }, "Kafka producer connected");

  return producer;
}

export async function createConsumer(groupId: string): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  logger.info({ groupId }, "Kafka consumer connected");

  return consumer;
}

type PublishEventParams<T> = {
  topic: string;
  message: T;
  key?: string;
};

export async function publishEvent<T>({
  topic,
  message,
  key,
}: PublishEventParams<T>): Promise<void> {
  const producer = await createProducer();

  try {
    await producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(message),
        },
      ],
    });

    logger.info({ topic, key }, "Kafka event published");
  } finally {
    await producer.disconnect();
  }
}

type SubscribeParams<T> = {
  groupId: string;
  topic: string;
  fromBeginning?: boolean;
  handler: (payload: T) => Promise<void>;
};

export async function subscribe<T>({
  groupId,
  topic,
  fromBeginning = false,
  handler,
}: SubscribeParams<T>): Promise<void> {
  const consumer = await createConsumer(groupId);

  await consumer.subscribe({ topic, fromBeginning });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const payload = JSON.parse(message.value.toString()) as T;
      await handler(payload);
    },
  });
}
