const { Kafka } = require("kafkajs");

const MESSAGE_TOPIC = process.env.KAFKA_MESSAGE_TOPIC || "chat.messages";
const MESSAGE_CONSUMER_GROUP =
	process.env.KAFKA_CONSUMER_GROUP || "chatcord-message-writers";

const parseKafkaBrokers = () =>
	(process.env.KAFKA_BROKERS || "")
		.split(",")
		.map((broker) => broker.trim())
		.filter(Boolean);

const kafkaState = {
	enabled: false,
	producer: null,
	consumer: null,
	topic: MESSAGE_TOPIC,
};

const initKafka = async () => {
	const brokers = parseKafkaBrokers();
	if (!brokers.length) {
		console.log("Kafka disabled: KAFKA_BROKERS is not configured");
		return kafkaState;
	}

	const kafka = new Kafka({
		clientId: process.env.KAFKA_CLIENT_ID || "chatcord-backend",
		brokers,
		ssl: process.env.KAFKA_SSL === "true",
		sasl:
			process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD
				? {
						mechanism: process.env.KAFKA_SASL_MECHANISM || "plain",
						username: process.env.KAFKA_SASL_USERNAME,
						password: process.env.KAFKA_SASL_PASSWORD,
				  }
				: undefined,
	});

	const producer = kafka.producer();
	const consumer = kafka.consumer({
		groupId: MESSAGE_CONSUMER_GROUP,
	});
	const admin = kafka.admin();

	try {
		await admin.connect();
		await admin.createTopics({
			waitForLeaders: true,
			topics: [
				{
					topic: MESSAGE_TOPIC,
					numPartitions: 1,
					replicationFactor: 1,
				},
			],
		});

		await producer.connect();
		await consumer.connect();
		await consumer.subscribe({ topic: MESSAGE_TOPIC, fromBeginning: false });
		await admin.disconnect();
	} catch (err) {
		console.error(`Kafka disabled due to init error: ${err.message}`);
		try {
			await producer.disconnect();
		} catch (_err) {}
		try {
			await consumer.disconnect();
		} catch (_err) {}
		try {
			await admin.disconnect();
		} catch (_err) {}
		return kafkaState;
	}

	kafkaState.enabled = true;
	kafkaState.producer = producer;
	kafkaState.consumer = consumer;
	console.log(`Kafka connected. Topic: ${MESSAGE_TOPIC}`);
	return kafkaState;
};

const publishMessageEvent = async (eventPayload) => {
	if (!kafkaState.enabled || !kafkaState.producer) return false;

	try {
		await kafkaState.producer.send({
			topic: kafkaState.topic,
			messages: [{ value: JSON.stringify(eventPayload) }],
		});
		return true;
	} catch (err) {
		console.error(`Kafka publish failed: ${err.message}`);
		return false;
	}
};

const registerMessageConsumer = async (onMessageEvent) => {
	if (!kafkaState.enabled || !kafkaState.consumer) return false;

	await kafkaState.consumer.run({
		eachMessage: async ({ message }) => {
			if (!message.value) return;
			const payload = JSON.parse(message.value.toString());
			console.log("Consumed message:", payload);
			await onMessageEvent(payload);
		},
	});

	return true;
};

module.exports = {
	initKafka,
	publishMessageEvent,
	registerMessageConsumer,
};
