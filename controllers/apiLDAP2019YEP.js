
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

                let yep2019_participated = [];
                let yep2019_details = [];

                function isRegistered(){
                    return new Promise((resolve, reject) => {
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};

                            connection.query({
                                sql: 'SELECT * FROM yep2019_registration WHERE employeeNumber = ?',
                                values: [ user.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};

                                if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){

                                    for(let i=0;i<results.length;i++){
                                        yep2019_participated.push({
                                            dt: results[0].dt,
                                            transportation: results[0].transportation,
                                            incomingRoute: results[0].incomingRoute,
                                            outgoingRoute: results[0].outgoingRoute,
                                            reason: results[0].reason
                                        })
                                    }

                                    resolve(yep2019_participated);

                                } else {

                                    yep2019_participated.push({
                                        dt: '',
                                        transportation: '',
                                        incomingRoute: '',
                                        outgoingRoute: '',
                                        reason: ''
                                    });

                                    resolve(yep2019_participated)

                                }
                            });

                            connection.release();
                        })
                    });
                }

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
                                    for(let i=0;i<results.length;i++){
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

                verifyInviteHeadcount().then((yep2019_details) => {
                    return isRegistered().then((yep2019_participated) => {

                        let token = generateJWT(user, yep2019_details, yep2019_participated);
                        let jsonToken = {token: token};
    
                        res.cookie('auth_jwt', token); // auth_jwt - authenticated user jsonwebtoken
                        res.status(200).json(jsonToken);

                    },  (err) => {
                        res.status(200).json({err: 'There\'s an error while checking your registration. Please contact Kevin Mocorro. '});
                    })
                },  (err) => {
                    res.status(200).json({err: 'Registration is only for Fab4 and selected SPT. If you think this is an error, contact Reg Martinez or Dyan Tasico immediately.'});
                })
                
            }
        })(req, res);

        // generateJWT - 
        function generateJWT(user, yep, yep_participated){
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
                        yep: yep,
                        participated: yep_participated
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