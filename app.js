const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiLDAP = require('./controllers/apiLDAP');

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));

apiLDAP(app);

app.listen(port, () => {
    console.log('listening to port ' + port);
});
