let jwt = require('jsonwebtoken');
let config = require('../config').jwt_secret;
let mysql = require('../config').pool;

function verifyTokenRecertapp(req, res, next){
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

                function verifyExaminee(){
                    return new Promise((resolve, reject)=>{
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            // is exists.
                            connection.query({
                                sql: 'SELECT * FROM recertapp_examinee_list WHERE employeeNumber = ?',
                                values: [ decoded.claim.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};
        
                                console.log(results);
                                if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){
                                    console.log('hello.. resolved')
                                    resolve();
                                } else {
                                    console.log('hello.. reject')
                                    reject();
                                }
                
                            })
                            connection.release();
                        });
                    });
                }

                // ehere
                verifyExaminee().then(()=>{

                    req.userID = decoded.id;
                    req.claim = decoded.claim;
                    next();

                }, (err)=>{
                    //res.status(401).json({error: 'Unable to log non examinee.'});
                    next();
                });

            }
        });
    }
}

module.exports = verifyTokenRecertapp;