const ldap = require('../config').ldap_config;
const formidable = require('formidable');
const passport = require('passport');
const LdapStrategy = require('passport-ldapauth');
const jwt = require('jsonwebtoken');
const jwt_privkey = require('../config').jwt_privkey;

module.exports = function(app){

    app.post('/api/login', function(req, res){
        // no access token for now.
        let form = new formidable.IncomingForm();

        form.parse(req, function(err, fields){
            if(err){return res.send({err: 'form parse error.'})};

            if(fields){
                let login_data = fields;
                console.log(login_data);

                if(login_data.username && login_data.password){

                    // ldap settings
                    let OPTS = {
                        server: {
                            url: ldap.url,
                            bindDN: ldap.bindUser,
                            bindCredentials: ldap.bindPass,
                            searchFilter: '(sAMAccountName={{username}})',
                            searchBase: ldap.searchBase,
                            connectionTimeout: ldap.connectionTimeout
                        },
                        
                        credentialsLookup: function(){
                            return { 
                                username: login_data.username,
                                password: login_data.password
                            }
                        }
                    }

                    let strategy = new LdapStrategy(OPTS);
                    passport.use(strategy);
                    passport.initialize();

                    function go(){
                        passport.authenticate('ldapauth', function(err, user, info){
                            if(err){
                                res.send({err: err})
                            } else if(!user){
                                res.send({err: info.message});
                            } else {
                                console.log(user);
    
                                let nickName_array = (user.displayName).split(" ");
    
                                let token = jwt.sign(
                                    {
                                        id: '',
                                        claim: {
                                            employeeNumber: user.employeeNumber,
                                            nickName: nickName_array[0],
                                            displayName: user.displayName,
                                            title: user.title,
                                            department: user.department,
                                            username: user.sAMAccountName
                                        }
                                    }, 
                                    jwt_privkey,
                                    {algorithm: 'RS256'}
                                );
                                
                                console.log(token);
                                res.cookie('ldap_cookie', token);
                                res.status(200).send();
                            }
    
                        });
                    }

                    go();
                    

                }
            } else {
                res.send({err: 'no fields.'});
            }

        });

    });

}