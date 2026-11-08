const { createClient } = require('redis');

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

let client = null;

async function getRedis() {
    if (!CACHE_ENABLED) return null;

    if (!client) {
        client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: retries => Math.min(retries * 100, 3000)
            }
        });

        client.on('error', error => {
            console.error('Redis error:', error.message);
        });
    }

    if (!client.isOpen) {
        await client.connect();
    }

    return client;
}

module.exports = { getRedis };
