import amqp, { Connection, Channel, ConsumeMessage } from "amqplib";

export async function init() {
  const connection: Connection = await amqp.connect(
    'amqp://localhost:3002/'
  );

  console.log("connection success");

  const channel: Channel = await connection.createChannel();

  var msg = 'Hello world';

  const exchange = await channel.assertExchange("cart", "direct", { durable: false });

  const queue = await channel.assertQueue("cart", { durable: false });

  const message = "article_exists";

  if (channel.publish(exchange.exchange, queue.queue, Buffer.from(message))) {
    console.log("RabbitMQ Publish " + exchange.exchange + " - " + queue.queue + " : " + JSON.stringify(message));
    return Promise.resolve(message);
  } else {
    return Promise.reject(new Error("No se pudo encolar el mensaje"));
  }
  // channel.sendToQueue(queue, Buffer.from(msg));
  // console.log(" [x] Sent %s", msg);
}
