const express = require('express');
const cors = require('cors');
const axios = require('axios');
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    const timestamp = Date.now().toString();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(timestamp);
});

app.get(/^\/10(\/[0-9]{1,4}){2}\.png$/, (req, res) => {
    const query = req.url.split(/\/|\.png/);
    query.shift();
    query.pop();
    axios(`https://tile.openweathermap.org/map/precipitation_new/${query[0]}/${query[1]}/${query[2]}.png?appid=${API_KEY}`, {
        responseType: "stream"
    })
    .then(response => {
        const maxAge = Math.floor((3600000 - (Date.now() % 3600000)) / 1000);
        res.setHeader('Cache-Control', `max-age=${maxAge}, stale-if-error=86400`);
        res.setHeader('Content-Type', 'image/png');
        res.status(200);
        response.data.pipe(res);
    })
    .catch(error => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(res.statusCode).send(error);
        console.error(error);
    });    
});

app.post('/', (req, res) => {
    const body = req.body;
    const type = body.type;
    const value = body.value;
    let url;
    switch (type) {
        case 'coords':
            url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${value.lat}&lon=${value.lon}&limit=1&appid=${API_KEY}`;
            break;
        case 'city':
            url = `http://api.openweathermap.org/geo/1.0/direct?q=${value}&limit=5&appid=${API_KEY}`;
            break;
        case 'zip':
            url = `http://api.openweathermap.org/geo/1.0/zip?zip=${value}&appid=${API_KEY}`;
            break;
    };
    axios(url)
    .then(response => {
        const data = (type === 'coords')
                    ? response.data[0]
                    : response.data;
        res.status(200).send(data);
    })
    .catch(error => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(res.statusCode).send(error);
        console.error(error);
    })
    .finally(() => {
        console.log(`POST ${value}`);
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
