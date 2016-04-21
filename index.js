'use strict';

require('jade');
require('colors');

const bodyParser    = require('body-parser');
const express       = require('express');

const service       = require('./app/service');
const logger        = require('./app/utils/logger');

const app = express();

const PORT = process.env.PORT || 8080;

app.set('view engine', 'jade');
app.set('views', './views');
app.use(express.static('./static'));

app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.render('index.jade');
});

service.subscribeApi(app);

app.use('*', (req, res) => res.status(404).end('Not found'));

app.listen(PORT, () => {
    service
        .init(app)
        .on('ready', () => logger.debug('!!!!! APPLICATION IS READY !!!!!'.rainbow))
        .on('ready', () => service.subscribe(app));

    logger.note(`Web Server started. Lstening port: ${PORT}`);
});
