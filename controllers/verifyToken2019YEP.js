let jwt = require('jsonwebtoken');
let config = require('../config').jwt_secret;
let mysql = require('../config').pool;

function verifyToken2019YEP(req, res, next){
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

                function verifyEmployeeHeadcount(){
                    return new Promise((resolve, reject)=>{
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            // is exists.
                            connection.query({
                                sql: 'SELECT * FROM yep2019_headcount WHERE employeeNumber = ?',
                                values: [ decoded.claim.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};
        
                                if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){
                                    
                                    resolve();
                                } else {
                                
                                    reject();
                                }
                
                            })
                            connection.release();
                        });
                    });
                }

                // ehere
                verifyEmployeeHeadcount().then(()=>{

                    req.userID = decoded.id;
                    req.claim = decoded.claim;
                    next();

                }, (err)=>{
                    res.status(200).json({error: 'Unabled to login.'});
                });

            }
        });
    }
}

module.exports = verifyToken2019YEP;