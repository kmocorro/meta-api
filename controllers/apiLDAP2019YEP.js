
let formidable = require('formidable');
let passport = require('passport');
let LdapStrategy = require('passport-ldapauth');
let jwt = require('jsonwebtoken');
let jwt_secret = require('../config').jwt_secret;

let ldap = require('../config').ldap_config;

let mysql = require('../config').pool;

module.exports = function(app){

    app.post('/api/login2019yep', (req, res) => {
         
        const fields = req.body;
    
        passport.use(setupLDAP());

        passport.initialize();

        passport.authenticate('ldapauth', (err, user, info) => {
            if(err){
                res.json({"err": err})
            } else if(!user){
                res.json({"err": info.message});
            } else {

                let yep2019_details = [];

                function verifyInviteHeadcount(){
                    return new Promise((resolve, reject)=>{
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            // is exists.
                            connection.query({
                                sql: 'SELECT * FROM yep2019_headcount WHERE employeeNumber = ?',
                                values: [ user.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};
                                //console.log(results);
                                if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){
                                    //console.log('hello.. resolved')
                                    for(i=0;i<results.length;i++){
                                        yep2019_details.push({
                                            shift: results[i].shift,
                                            service_awardee: results[i].service_awardee,
                                            location: results[i].location,
                                        })
                                    }

                                    resolve(yep2019_details);
                                } else {
                                    //console.log('hello.. reject')
                                    reject();
                                }
                
                            })
                            connection.release();
                        });
                    });
                }

                function examineeProcess(){
                    return new Promise((resolve, reject) => {
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            // is exists.
                            connection.query({
                                sql: 'SELECT * FROM recertapp_examinee_process WHERE employeeNumber = ?',
                                values: [ user.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};
                                //console.log(results);
                                if(typeof results !== 'undefined' && results !== null && results.length > 0){
                                    for(i=0;i<results.length;i++){
                                        examineeProcessList.push({
                                            processName: results[i].processName
                                        })
                                    }

                                    resolve(examineeProcessList);
                                } else {
                                    //console.log('hello.. reject')
                                    reject();
                                }
                
                            })
                            connection.release();
                        });
                    });
                }

                verifyInviteHeadcount(yep2019_details).then(() => {
                    let token = generateJWT(user, yep2019_details);
                    let jsonToken = {token: token};

                    res.cookie('auth_jwt', token); // auth_jwt - authenticated user jsonwebtoken
                    res.status(200).json(jsonToken);

                },  (err) => {
                    res.status(200).json({err: 'Registration is only for Fab4 and selected SPT. If you think this is an error, contact Reg Martinez or Dyan Tasico immediately.'});
                })
                
            }
        })(req, res);

        // generateJWT - 
        function generateJWT(user, yep){
            let nickName_array = (user.displayName).split(" ");

            let token = jwt.sign(
                {
                    id: user.employeeID,
                    claim: {
                        employeeNumber: user.employeeNumber,
                        nickName: nickName_array[0],
                        displayName: user.displayName,
                        title: user.title,
                        department: user.department,
                        username: user.sAMAccountName,
                        yep: yep
                    }
                }, 
                jwt_secret.key
            );
            return token;
        }

        // setupLDAP - 
        function setupLDAP(){
            let LDAPSET = {
                server: {
                    url: ldap.url,
                    bindDN: ldap.bindUser,
                    bindCredentials: ldap.bindPass,
                    searchFilter: '(sAMAccountName={{username}})',
                    searchBase: ldap.searchBase,
                    connectionTimeout: ldap.connectionTimeout
                },
                credentialsLookup: function(){
                    return { username: fields.username , password: fields.password };
                }
            };

            let strategy = new LdapStrategy(LDAPSET);

            return strategy;
        }

    });
}