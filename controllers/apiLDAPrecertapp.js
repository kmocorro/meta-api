
let formidable = require('formidable');
let passport = require('passport');
let LdapStrategy = require('passport-ldapauth');
let jwt = require('jsonwebtoken');
let jwt_secret = require('../config').jwt_secret;

let ldap = require('../config').ldap_config;

let mysql = require('../config').pool;

module.exports = function(app){

    app.post('/api/loginrecertapp', (req, res) => {
         
        const fields = req.body;
    
        passport.use(setupLDAP());

        passport.initialize();

        passport.authenticate('ldapauth', (err, user, info) => {
            if(err){
                res.json({"err": err})
            } else if(!user){
                res.json({"err": info.message});
            } else {

                let token = generateJWT(user);
                let jsonToken = {token: token};

                function verifyExaminee(){
                    return new Promise((resolve, reject)=>{
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            // is exists.
                            connection.query({
                                sql: 'SELECT * FROM recertapp_examinee_list WHERE employeeNumber = ?',
                                values: [ user.employeeNumber ]
                            },  (err, results) => {
                                if(err){return reject(err)};
                                //console.log(results);
                                if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){
                                    //console.log('hello.. resolved')
                                    resolve();
                                } else {
                                    //console.log('hello.. reject')
                                    reject();
                                }
                
                            })
                            connection.release();
                        });
                    });
                }

                verifyExaminee().then(() => {
                    res.cookie('auth_jwt', token); // auth_jwt - authenticated user jsonwebtoken
                    res.status(200).json(jsonToken);
                },  (err) => {
                    res.status(200).json({err: 'Login not available for non-examinee.'});
                })
                
            }
        })(req, res);

        // generateJWT - 
        function generateJWT(user){
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
                        username: user.sAMAccountName
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