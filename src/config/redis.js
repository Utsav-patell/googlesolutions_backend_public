const redis = require("redis");
const dotenv = require("dotenv");

dotenv.config();

// Create Redis client
const redisClient = redis.createClient({
  username:process.env.REDIS_USERNAME,
  password:process.env.REDIS_PASSWORD,
  url: process.env.REDIS_URL,
},);

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

// Connect to Redis
redisClient.connect().then(() => {
  console.log("Connected to Redis");
});

module.exports = redisClient;