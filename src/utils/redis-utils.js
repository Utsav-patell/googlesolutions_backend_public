const redisClient = require("../config/redis");


const getFromRedis = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error("Redis Get Error:", err);
        return null;
    }
};
  
  
const setToRedis = async (key, value, expiry = 3600) => {
    try {
        await redisClient.setEx(key, expiry, JSON.stringify(value));
    } catch (err) {
        console.error("Redis Set Error:", err);
    }
};

  module.exports = { getFromRedis, setToRedis };