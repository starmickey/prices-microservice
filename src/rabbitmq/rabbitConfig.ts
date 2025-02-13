import amqp, { Channel, Connection } from 'amqplib';
import { Config, getConfig } from '../config';

export class Rabbit {
  private static instance: Rabbit;
  private connection: Connection | null = null;
  private notificationsChannel: Channel | null = null;
  private config: Config = getConfig();

  private constructor() {
    this.connect();
  }

  public static getInstance(): Rabbit {
    if (!Rabbit.instance) {
      Rabbit.instance = new Rabbit();
    }
    return Rabbit.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.rabbitUrl);
      this.connection.on('close', () => this.handleConnectionClose());
      this.connection.on('error', (err) => this.handleConnectionError(err));
      await this.setupChannels();
      console.log('Connected to RabbitMQ');
    } catch (err) {
      console.error(`Error connecting to RabbitMQ: ${err}`);
      this.retryConnection();
    }
  }

  private async setupChannels(): Promise<void> {
    if (!this.connection) {
      throw new Error('Rabbit connection failed');
    }
    this.notificationsChannel = await this.connection.createChannel();
    await this.notificationsChannel.assertQueue(this.config.notificationsQueue); // Connects with catalog microservice

    // Consume channels
    //  this.catalogChannel.consume(this.config.notificationsQueue, ((msg: any) => console.log("RECEIVED", JSON.parse(msg.content.toString()))), { noAck: true });
  }

  public async sendMessage(message: any, queue: string): Promise<void> {
    if (!this.notificationsChannel) {
      throw new Error('Rabbit connection failed');
    }
    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.notificationsChannel.sendToQueue(queue, messageBuffer);
      console.info(`--> Message sent to queue ${queue}`);
    } catch (err) {
      console.error(`Error sending message to RabbitMQ: ${err}`);
    }
  }

  private handleConnectionClose(): void {
    console.error('Connection to RabbitMQ closed');
    this.retryConnection();
  }

  private handleConnectionError(err: Error): void {
    console.error(`Connection error to RabbitMQ: ${err}`);
    this.retryConnection();
  }

  private retryConnection(): void {
    setTimeout(() => {
      this.connect().catch((err) => {
        console.error(`Error retrying connection to RabbitMQ: ${err}`);
      });
    }, 5000);
  }

  public async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }
}