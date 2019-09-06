let jwt = require('jsonwebtoken');
let config = require('../config').jwt_secret;
let mysql = require('../config').pool;

function verifyTokenOasis(req, res, next){
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

                function verifyFAB4(){
                    return new Promise((resolve, reject)=>{
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            // is exists.
                            connection.query({
                                sql: 'SELECT * FROM tbl_employee_hc WHERE employee_number = ?',
                                values: [ decoded.claim.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};
        
                                if(typeof results !== 'undefined' && results !== null && results.length > 0){
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
                verifyFAB4().then(()=>{

                    req.userID = decoded.id;
                    req.claim = decoded.claim;
                    next();

                }, (err)=>{
                    res.status(200).json({error: 'Unable to login non fab4 employees'});
                });

            }
        });
    }
}

module.exports = verifyTokenOasis;