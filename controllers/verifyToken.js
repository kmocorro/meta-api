let jwt = require('jsonwebtoken');
let config = require('../config').jwt_secret;

function verifyToken(req, res, next){
    let token = req.cookies.auth_jwt;

    console.log(req.body);

    if(!token){
        console.log('error: no token');
    } else {
        jwt.verify(token, config.key, (err, decoded) => {
            if(err){
                console.log('error: ', err);
            } else {
                req.userID = decoded.id;
                req.claim = decoded.claim;
                next();
            }
        });
    }
}

module.exports = verifyToken;