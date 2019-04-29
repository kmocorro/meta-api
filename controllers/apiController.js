let verifyToken = require('./verifyToken');

module.exports = function(app){

    app.get('/', verifyToken, (req, res) => {
        
        res.send('this is home you have been redirected!');
    });

}