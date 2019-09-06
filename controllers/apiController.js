let verifyToken = require('./verifyToken');
let verifyTokenParams = require('./verifyTokenParams');
let verifyTokenOasis = require('./verifyTokenOasis');
let formidable = require('formidable');
let XLSX = require('xlsx');
let mysql = require('../config').pool;
let moment = require('moment');
let csv = require("csvtojson/v2");

module.exports = function(app){

    app.get('/api/dashboard/:token', verifyTokenParams, (req, res) => {

        if(req.userID && req.claim){

            function cycletime_trend(){
                return new Promise((resolve, reject) => {
                    mysql.getConnection((err, connection) => {
                        if(err){return reject(err)};

                        let cyc_trend = [];

                        connection.query({
                            sql: 'SELECT * FROM meta_dashboard_cycletime ORDER BY id DESC LIMIT 14'
                        },  (err, results) => {
                            if(err){return reject(err)};

                            if(typeof results !== 'undefined' && results !== null && results.length > 0){

                                for(let i=0; i<results.length; i++){
                                    cyc_trend.push({
                                        label: moment(results[i].data_date).format('ll'),
                                        data: ((results[i].total_ave)/24).toFixed(2)
                                    });
                                }
                                
                                let day = {
                                    new : {
                                        id: results[0].id,
                                        data_date: results[0].data_date,
                                        upload_date: results[0].upload_date,
                                        total_ave: results[0].total_ave,
                                        value: ((results[0].total_ave)/24).toFixed(2)
                                    },

                                    old : {
                                        id: results[1].id,
                                        data_date: results[1].data_date,
                                        upload_date: results[1].upload_date,
                                        total_ave: results[1].total_ave,
                                        value: ((results[1].total_ave)/24).toFixed(2)
                                    }
                                }

                                let cycletime_dashboard = {
                                    day,
                                    trend: cyc_trend
                                }

                                resolve(cycletime_dashboard);

                            } else {

                                let day = {
                                    new : {
                                        id: 0,
                                        data_date: 0,
                                        upload_date: 0,
                                        total_ave: 0,
                                        value: 0
                                    },

                                    old : {
                                        id: 0,
                                        data_date: 0,
                                        upload_date: 0,
                                        total_ave: 0,
                                        value: 0
                                    }
                                }

                                let cycletime_dashboard = {
                                    day,
                                    trend: cyc_trend
                                }

                                resolve(cycletime_dashboard);
                            }

                        });

                        connection.release();
                    });
                });
            }

            function median_efficiency_and_ne3_trend(){
                return new Promise((resolve, reject) => {
                    mysql.getConnection((err, connection) => {
                        if(err){return reject(err)};

                        let median_and_ne3_trend = [];

                        connection.query({
                            sql: 'SELECT * FROM meta_dashboard_eff_and_bin ORDER BY id DESC LIMIT 14'
                        },  (err, results) => {
                            if(err){return reject(err)};

                            if(typeof results !== 'undefined' && results !== null && results.length > 0){

                                for(let i=0; i<results.length;i++){
                                    median_and_ne3_trend.push({
                                        label: results[i].ww + '.' + results[i].wwday,
                                        median_efficiency: results[i].median_efficiency,
                                        ne3: results[i].ne3
                                    })
                                }

                                let day = {
                                    new: {
                                        id: results[0].id,
                                        ww: results[0].ww,
                                        wwday: results[0].wwday,
                                        median_efficiency: results[0].median_efficiency,
                                        ne3: results[0].ne3
                                    },

                                    old: {
                                        id: results[1].id,
                                        ww: results[1].ww,
                                        wwday: results[1].wwday,
                                        median_efficiency: results[1].median_efficiency,
                                        ne3: results[1].ne3
                                    }
                                }

                                let efficiency_and_ne3 = {
                                    day,
                                    trend: median_and_ne3_trend
                                }

                                resolve(efficiency_and_ne3);

                            } else {

                                let day = {
                                    new: {
                                        id: 0,
                                        ww: 0,
                                        wwday: 0,
                                        median_efficiency: 0,
                                        ne3: 0
                                    },

                                    old: {
                                        id: 0,
                                        ww: 0,
                                        wwday: 0,
                                        median_efficiency: 0,
                                        ne3: 0
                                    }
                                }

                                let efficiency_and_ne3 = {
                                    day,
                                    trend: median_and_ne3_trend
                                }

                                resolve(efficiency_and_ne3);

                            }

                        });

                        connection.release();

                    });
                });
            }

            return cycletime_trend().then((cycletime_dashboard) => {
                return median_efficiency_and_ne3_trend().then((median_efficiency_and_binning_dashboard) => {

                    let metaDashboard = { 
                        dashboard: {
                            code: 1,
                            title: 'meta/fab4',
                            author: 'kevinmocorro',
                            claim: req.claim,
                            dash: [
                                {id: 1, name: 'Median Efficiency', value: median_efficiency_and_binning_dashboard.day.new.median_efficiency, old_value: median_efficiency_and_binning_dashboard.day.old.median_efficiency},
                                {id: 2, name: 'Bin NE', value: median_efficiency_and_binning_dashboard.day.new.ne3, old_value: median_efficiency_and_binning_dashboard.day.old.ne3},
                                {id: 3, name: 'Cosmetics', value: 0, old_value: 0},
                                {id: 4, name: 'Cycletime', value: cycletime_dashboard.day.new.value, old_value: cycletime_dashboard.day.old.value}
                            ],
                            cycletime_trend: cycletime_dashboard.trend.reverse(),
                            eff_and_bin_trend: median_efficiency_and_binning_dashboard.trend.reverse()
                        }
                        
                    }
    
                    console.log(metaDashboard);
            
                    res.status(200).json(metaDashboard);

                    
                }, (err) => (console.log(err)));
 
                

            }, (err) => (console.log(err)));
        
            
        }

    });

    app.get('/api/spares', (req, res) => {
        let csvFilePath_spares_details = 'public/spares_db/Details.csv';
        let csvFilePath_spares_summary = 'public/spares_db/Summary.csv';

        csv().fromFile(csvFilePath_spares_details)
        .then((spares_details) => {
            csv().fromFile(csvFilePath_spares_summary)
            .then((spares_summary) => {
                let data = {
                    summary: spares_summary,
                    details: spares_details
                }

                console.log(data);
                
                res.status(200).json(data);
            });
        });
    });

    app.get('/api/oee', (req, res) => {
        let csvFilePath_oee = 'public/OEE/OEE.csv';

        csv().fromFile(csvFilePath_oee)
        .then((oee_details) => {
            let data = {
                oee: oee_details
            }

            res.status(200).json(data);
        })
    })

    // RMP Upload History
    app.get('/api/rmp/:token', verifyTokenParams, (req, res) => {

        if(req.userID && req.claim){

            let rmp_history = [];

            function rmphistoryQuery(){
                return new Promise((resolve, reject) => {
                    mysql.getConnection((err, connection) => {
                        if(err){return reject(err)};

                        connection.query({
                            sql: 'SELECT * FROM rmp_upload_history ORDER BY id DESC'
                        },  (err, results) => {
                            if(err){return reject(err)};

                            if(typeof results !== 'undefined' && results !== null && results.length > 0){

                                for(let i=0; i < results.length; i++){
                                    rmp_history.push({
                                        upload_date: moment(results[i].upload_date).calendar(),
                                        worksheet_name: results[i].worksheet_name,
                                        username: results[i].username
                                    });
                                }

                                resolve(rmp_history);
                            } else {
                                resolve(rmp_history);
                            }

                        });
                        connection.release();
                    });
                });
            }

            return rmphistoryQuery().then((rmp_data) => {
                
                if(rmp_data){
                    let rmpHistoryLogs = { 
                        rmp: {
                            code: 1,
                            title: 'meta/fab4',
                            author: 'kevinmocorro',
                            claim: req.claim,
                            rmp_logs: rmp_data
                        }
                    }
    
                    res.status(200).json(rmpHistoryLogs);
                } else {
                    let rmpHistoryLogs = { 
                        rmp: {
                            code: 1,
                            title: 'meta/fab4',
                            author: 'kevinmocorro',
                            claim: req.claim,
                            rmp_logs: []
                        }
                    }

                    res.status(200).json(rmpHistoryLogs);
                }
                
                
            });

        }

    });

    // oasis login...
    app.get('/api/oasis/:token', verifyTokenOasis, (req, res) => {

        if(req.userID && req.claim){
            res.status(200).json(req.claim);
        } else {
            res.status(200).json({err: 'Invalid token.'});
        }

    });

    // oasis save post  
    app.post('/api/yepsurvey', (req, res) => {
        
        console.log(req.body);

        //check if already voted.
        function isVoted(){
            return new Promise((resolve, reject) => {
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};
                    // is exists.
                    connection.query({
                        sql: 'SELECT * FROM yep_survey_participants WHERE employee_number = ?',
                        values: [ req.body.employeeNumber ]
                    },  (err, results) => {
                        if(err){return reject(err)};

                        if(typeof results !== 'undefined' && results !== null && results.length > 0){
                            res.status(200).json({success: 'Already voted.'})
                        } else {
                            resolve();
                        }
        
                    })
                    connection.release();
                });
            });
        }

        function insertToYEP_data_table(){
            return new Promise((resolve, reject) => {
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};
                    // is exists.
                    connection.query({
                        sql: 'INSERT INTO yep_survey_data SET employee_number = ?, survey_id = ?',
                        values: [ req.body.employeeNumber, req.body.survey_id ]
                    },  (err, results) => {
                        
                        if(err){reject(err)}
                        if(results){
                            resolve();
                        }
                        
                    })
                    connection.release();
                });
            });
        }

        function insertToYEP_participants_table(){
            return new Promise((resolve, reject) => {
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};
                    // is exists.
                    connection.query({
                        sql: 'INSERT INTO yep_survey_participants SET employee_number = ?',
                        values: [ req.body.employeeNumber ]
                    },  (err, results) => {
                        
                        if(err){reject(err)}
                        if(results){
                            resolve();
                        }
                        
                    })
                    connection.release();
                });
            });
        }

        isVoted().then(()=>{
            insertToYEP_data_table().then(()=>{
                insertToYEP_participants_table().then(() => {
                    res.status(200).json({success: 'Voted succesfully.'});
                }, (err)=>{
                    res.status(200).json({error: err});
                })
            }, (err)=>{
                res.status(200).json({error: err});
            })
        }, (err)=>{
            res.status(200).json({error: err});
        });

    })

    // Vehicle QR
    app.get('/api/vehicle', (req, res) => {
        let plate_number = req.query.plate;

        //console.log(plate_number);
        res.status(200).json({message: plate_number});
    })

    // rmp uploader -- DEPRECATED -TRANSFERED TO server port 8081

}