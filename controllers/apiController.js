let verifyToken = require('./verifyToken');

module.exports = function(app){

    app.get('/', verifyToken, (req, res) => {

        if(req.userID && req.claim){

            let meta_meta = {
                title: 'meta/fab4',
                author: 'kevin mocorro',
                prototypes: [
                    {id: 1, protoname: 'COA'},
                    {id: 2, protoname: 'BRS'},
                    {id: 3, protoname: 'RMP'},
                    {id: 4, protoname: 'Engineering Activity'},
                    {id: 5, protoname: 'Survey App'},
                ]
            }

            res.status(200).json(meta_meta);
        }
        
        
    });

}