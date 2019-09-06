let jwt = require('jsonwebtoken');
let config = require('../config').jwt_secret;

function verifyTokenParams(req, res, next){
    let token = req.params.token;

    if(!token){
        let unauthorized = {
            code: 0,
            message: 'Unauthorized'
        }

        res.status(200).json(unauthorized);
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

module.exports = verifyTokenParams;