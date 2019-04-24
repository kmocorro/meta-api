
let formidable = require('formidable');
let passport = require('passport');
let LdapStrategy = require('passport-ldapauth');
let jwt = require('jsonwebtoken');
let jwt_secret = require('../config').jwt_secret;

let ldap = require('../config').ldap_config;

module.exports = function(app){

    app.post('/api/login', (req, res) => {
        
        let form = new formidable.IncomingForm();

        form.parse(req, (err, fields) => {
            if(err){return res.send(err)};

            if(fields){
                
                passport.use(setupLDAP());

                passport.initialize();
                passport.authenticate('ldapauth', (err, user, info) => {
                    if(err){
                        res.json({"err": err})
                    } else if(!user){
                        res.json({"err": info.message});
                    } else {

                        let token = generateJWT();
                        
                        return res.status(200).json({
                            "token": token
                        });
                    }

                    // generateJWT - 
                    function generateJWT(){
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

                })(req, res);

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

            }
        });

    });

}