const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const corsOrigins = require('./config').corsOrigins;

const apiLDAP = require('./controllers/apiLDAP');
const apiLDAPrecertapp = require('./controllers/apiLDAPrecertapp');
const apiLDAP2019YEP = require('./controllers/apiLDAP2019YEP');
const apiController = require('./controllers/apiController');
 
const app = express();
const port = process.env.PORT || 8080;


app.use(cookieParser());
/*
app.use(cors(
    { 
        credentials: true,
        origin: [corsOrigins.dev, corsOrigins.prod]
    })
);
*/


app.use(cors())
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('combined'));

app.use('/', express.static(__dirname + '/public'));

apiLDAP(app);
apiLDAPrecertapp(app);
apiLDAP2019YEP(app);
apiController(app);

app.listen(port, () => {
    console.log('listening to port ' + port);
});
