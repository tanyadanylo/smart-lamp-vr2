const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');
const { getRedis } = require('./cache');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';
const CACHE_TTL = 40; 
const CACHE_KEY = 'presets:all';

let cacheHits = 0;
let cacheMisses = 0;
let dbReads = 0;
let cacheErrors = 0;

async function invalidatePresetsCache() {
    if (!CACHE_ENABLED) return true;

    try {
        const redis = await getRedis();
        await redis.del(CACHE_KEY);
        return true;
    } catch (error) {
        cacheErrors++;
        console.error('Redis invalidation error:', error.message);
        return false;
    }
}

const ENABLE_ESP = process.env.ENABLE_ESP === 'true';
const ESP_IP = process.env.ESP_IP || 'http://192.168.4.1';

app.use(cors());
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '../frontend')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

let isLampOn = true;
let isNightMode = false;
let nightThreshold = 30;

app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(503).json({ status: 'error' });
    }
});

app.get('/api/presets', async (req, res) => {
    try {
        if (CACHE_ENABLED) {
            try {
                const redis = await getRedis();
                const cached = await redis.get(CACHE_KEY);

                if (cached !== null) {
                    const presets = JSON.parse(cached);
                    cacheHits++;

                    return res.json(presets);
                }
            } catch (error) {
                cacheErrors++;
                console.error('Redis read error:', error.message);
            }
        }

        cacheMisses++;
        dbReads++;

        const [rows] = await db.query(
            'SELECT * FROM presets ORDER BY id'
        );

        if (CACHE_ENABLED) {
            try {
                const redis = await getRedis();

                await redis.set(
                    CACHE_KEY,
                    JSON.stringify(rows),
                    { EX: CACHE_TTL }
                );
            } catch (error) {
                cacheErrors++;
                console.error('Redis write error:', error.message);
            }
        }

        res.json(rows);
    } catch (error) {
        console.error('GET /api/presets:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cache-stats', (req, res) => {
    const total = cacheHits + cacheMisses;

    res.json({
        cacheEnabled: CACHE_ENABLED,
        cacheType: CACHE_ENABLED ? 'redis' : 'disabled',
        ttlSeconds: CACHE_TTL,
        statsScope: 'current ECS task',
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: total > 0
            ? Number((cacheHits / total * 100).toFixed(2))
            : 0,
        dbReads: dbReads,
        cacheErrors: cacheErrors
    });
});

app.post('/api/presets', async (req, res) => {
    const { name, color, brightness } = req.body;
    const value = Number(brightness);

    if (
        typeof name !== 'string' ||
        !name.trim() ||
        typeof color !== 'string' ||
        !color.trim() ||
        !Number.isInteger(value) ||
        value < 0 || value > 100
    ) {
        return res.status(400).json({
            error: 'Invalid preset data'
        });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO presets (name, color, brightness) VALUES (?, ?, ?)',
            [name.trim(), color, value]
        );

        const invalidated = await invalidatePresetsCache();

        if (!invalidated) {
            console.warn(
                'Preset created, but Redis cache was not invalidated'
            );
        }

        res.status(201).json({
            id: result.insertId,
            cacheInvalidated: invalidated
        });
    } catch (error) {
        console.error('POST /api/presets:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/presets/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid ID'
        });
    }

    try {
        const [result] = await db.execute(
            'DELETE FROM presets WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Preset not found'
            });
        }

        const invalidated = await invalidatePresetsCache();

        if (!invalidated) {
            console.warn(
                'Preset deleted, but Redis cache was not invalidated'
            );
        }

        res.json({
            status: 'deleted',
            cacheInvalidated: invalidated
        });
    } catch (error) {
        console.error('DELETE /api/presets:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/command', async (req, res) => {
    const { command } = req.body;

    if (typeof command !== 'string' || !command.trim()) {
        return res.status(400).json({
            error: 'Command is required'
        });
    }

    try {
        await db.execute(
            'INSERT INTO device_logs (action_type) VALUES (?)',
            [command]
        );

        if (command === 'POWER_ON') isLampOn = true;
        if (command === 'POWER_OFF') isLampOn = false;

        if (ENABLE_ESP) {
            await axios.get(`${ESP_IP}/command`, {
                params: { value: command },
                timeout: 3000
            });
        }

        res.json({
            status: 'ok',
            mode: ENABLE_ESP ? 'physical' : 'simulation'
        });
    } catch (error) {
        console.error('Command error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/device-logs', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM device_logs ORDER BY id DESC LIMIT 50'
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sensor', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM sensor_data ORDER BY id DESC LIMIT 20'
        );

        res.json(rows.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sensor', async (req, res) => {
    const value = Number(req.body.light_level_percent);

    if (
        req.body.light_level_percent == null ||
        !Number.isInteger(value) ||
        value < 0 || value > 100
    ) {
        return res.status(400).json({
            error: 'Invalid light level'
        });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO sensor_data (light_level_percent) VALUES (?)',
            [value]
        );

        res.status(201).json({
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/nightmode', (req, res) => {
    const { enabled, threshold } = req.body;

    isNightMode = Boolean(enabled);

    if (threshold !== undefined) {
        const value = Number(threshold);

        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 100
        ) {
            return res.status(400).json({
                error: 'Invalid threshold'
            });
        }

        nightThreshold = value;
    }

    res.json({
        status: 'ok',
        enabled: isNightMode,
        threshold: nightThreshold
    });
});

if (ENABLE_ESP) {
    setInterval(async () => {
        try {
            const response = await axios.get(
                `${ESP_IP}/sensor`,
                { timeout: 3000 }
            );

            const lightLevel = Number(
                response.data.light_level_percent
            );

            if (!Number.isFinite(lightLevel)) {
                throw new Error('Invalid sensor response');
            }

            await db.execute(
                'INSERT INTO sensor_data (light_level_percent) VALUES (?)',
                [lightLevel]
            );

            if (
                isNightMode &&
                lightLevel <= nightThreshold &&
                !isLampOn
            ) {
                await axios.get(`${ESP_IP}/command`, {
                    params: { value: 'POWER_ON' },
                    timeout: 3000
                });

                isLampOn = true;
            }
        } catch (error) {
            console.error('ESP error:', error.message);
        }
    }, 10000);
}

async function startServer() {
    try {
        await db.query('SELECT 1');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Backend running on port ${PORT}`);
            console.log(
                `ESP mode: ${ENABLE_ESP ? 'enabled' : 'disabled'}`
            );
            console.log(
                `Cache: ${CACHE_ENABLED ? 'Redis enabled' : 'disabled'}`
            );
            console.log(`Cache TTL: ${CACHE_TTL} seconds`);
        });
    } catch (error) {
        console.error('MySQL connection error:', error.message);
        process.exit(1);
    }
}

startServer();
