const db = require('./db');

async function checkConnection() {
    try {
        const tables = ['presets', 'device_logs', 'sensor_data'];

        for (const table of tables) {
            const [rows] = await db.query(
                `SELECT COUNT(*) AS total FROM ${table}`
            );

            console.log(`${table}: ${rows[0].total}`);
        }

        console.log('MySQL connection successful!');
    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await db.end();
    }
}

checkConnection();