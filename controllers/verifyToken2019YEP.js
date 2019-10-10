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

                let token_user_participated = [];

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

                function verifyRegistration(){
                    return new Promise((resolve, reject) => {
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            // is exists.
                            connection.query({
                                sql: 'SELECT * FROM yep2019_registration WHERE employeeNumber = ?',
                                values: [ decoded.claim.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};
        
                                if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){

                                    for(let i=0; i<results.length;i++){
                                        token_user_participated.push({
                                            dt: results[0].dt,
                                            isAccepted: results[0].isAccepted,
                                            transportation: results[0].transportation,
                                            incomingRoute: results[0].incomingRoute,
                                            outgoingRoute: results[0].outgoingRoute,
                                            reason: results[0].reason
                                        })
                                    }

                                    resolve(token_user_participated);
                                } else {
                                    
                                    yep2019_participated.push({
                                        dt: '',
                                        isAccepted: '',
                                        transportation: '',
                                        incomingRoute: '',
                                        outgoingRoute: '',
                                        reason: ''
                                    });

                                    resolve(token_user_participated)
                                }
                
                            })
                            connection.release();
                        });
                    })
                }

                // ehere
                verifyEmployeeHeadcount().then(() => {
                    return verifyRegistration().then((token_user_participated) => {

                        req.userID = decoded.id;
                        req.claim = decoded.claim;
                        req.registration = {updated_token: token_user_participated};
                        next();
                    })


                }, (err)=>{
                    res.status(200).json({error: 'Unabled to login.'});
                });

            }
        });
    }
}

module.exports = verifyToken2019YEP;