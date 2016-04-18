'use strict';

require('jade');

const bodyParser    = require('body-parser');
const express       = require('express');
const service       = require('./app/service');

const app = express();

const PORT = process.env.HTTP_PORT || 5000;

app.set('view engine', 'jade');
app.set('views', './views');
app.use(express.static('./static'));

app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.render('index.jade');
});

service.subscribe(app);

app.use('*', (req, res) => res.status(404).end('Not found'));

app.listen(PORT, () => {
    service.init(app);
    console.log(`listening ${PORT}`);
});
