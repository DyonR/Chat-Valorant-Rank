const express = require('express');
const rateLimit = require('express-rate-limit'); // Import rate-limiting middleware

const app = express();
const port = 3000;

const HenrikDevValorantAPI = require('unofficial-valorant-api');
const vapi = new HenrikDevValorantAPI();

const fs = require('fs');

function timestamp() {
    return new Date().toISOString().replace('T', ' ').substr(0, 19);
}

const output = fs.createWriteStream('./output.txt', { flags: 'a' });
const myConsole = new console.Console(output);
function logWithTimestamp(message) {
    myConsole.log(`[${timestamp()}] ${message}`);
}

// Configure rate limiting
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: function(req, res, /*next*/) {
        res.status(429).send("Too many requests, please try again later.");
    }
});

// Apply the rate limiter to all requests
app.use(apiLimiter);

const allowedRegions = ['ap', 'br', 'eu', 'kr', 'latam', 'na'];

app.get('/', (req, res) => {
    res.send('Stop snooping around >.>');
});

app.get('/valorant/:region/:name/:tag', async (req, res, next) => {
    const { region, name, tag } = req.params;

    if (!allowedRegions.includes(region)) {
        res.status(400).send("Invalid region specified.");
        logWithTimestamp(`Invalid region attempted: ${region}`);
        return;
    }

    try {
        const mmr_data = await vapi.getMMR({
            version: 'v1',
            region: region,
            name: name,
            tag: tag,
        });

        if (mmr_data.error) {
            res.send(`Error ${mmr_data.status}`);
            logWithTimestamp(`Username: ${name}#${tag} Error: ${mmr_data.status}`);
            return;
        }

        res.send(`${name}#${tag} [${mmr_data.data.currenttierpatched}] - ${mmr_data.data.ranking_in_tier} RR`);
        logWithTimestamp(`${name}#${tag} [${mmr_data.data.currenttierpatched}] - ${mmr_data.data.ranking_in_tier} RR`);
    } catch (error) {
        res.status(500).send("An error occurred while fetching data.");
        logWithTimestamp(`Server Error: ${error.message}`);
    }
});

app.listen(port, () => {
    logWithTimestamp(`Example app listening at http://localhost:${port}`);
});
