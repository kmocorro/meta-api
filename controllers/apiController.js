let verifyToken = require('./verifyToken');

module.exports = function(app){

    app.get('/', (req, res) => {
        
        console.log(req.body);
        console.log(req.cookies.auth_jwt);

        res.send('this is home you have been redirected!');
    });

}