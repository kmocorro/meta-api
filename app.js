const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const apiLDAP = require('./controllers/apiLDAP');
const apiController = require('./controllers/apiController');

const app = express();
const port = process.env.PORT || 8080;

app.use(cookieParser());
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));

app.use('/', express.static(__dirname + '/public'));

apiLDAP(app);
apiController(app);

app.listen(port, () => {
    console.log('listening to port ' + port);
});
