let verifyToken = require('./verifyToken');
let verifyTokenParams = require('./verifyTokenParams');
let verifyTokenOasis = require('./verifyTokenOasis');
let verifyTokenRecertapp = require('./verifyTokenRecertapp');
let verifyToken2019YEP = require('./verifyToken2019YEP');
let formidable = require('formidable');
let XLSX = require('xlsx');
let mysql = require('../config').pool;
let mysqlTrace = require('../config').poolTrace;
let mysqlRPi = require('../config').poolRPi;
let mysqlImageRPi = require('../config').poolImageRPi;
let moment = require('moment');
let csv = require("csvtojson/v2");
let URLSafeBase64 = require('urlsafe-base64');

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
                            res.status(200).json({error: 'Already voted.'})
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
                        sql: 'INSERT INTO yep_survey_data SET employee_number = ?, survey_id = ?, dt = ?',
                        values: [ req.body.employeeNumber, req.body.survey_id, new Date() ]
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
                        sql: 'INSERT INTO yep_survey_participants SET employee_number = ?, dt = ?',
                        values: [ req.body.employeeNumber, new Date()  ]
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

        if(req.body.employeeNumber && req.body.survey_id){
            isVoted().then(()=>{
                insertToYEP_data_table().then(()=>{
                    insertToYEP_participants_table().then(() => {
                        res.status(200).json({success: 'Thank you for voting!'});
                    }, (err)=>{
                        res.status(200).json({error: err});
                    })
                }, (err)=>{
                    res.status(200).json({error: err});
                })
            }, (err)=>{
                res.status(200).json({error: err});
            });
        } else {
            res.status(200).json({error: 'Unable to submit. Refresh the page and make sure you are logged in'})
        }
        

    })

    app.post('/api/csatsurvey', (req, res) => {
        console.log(req.body);

        // check if sid exists.
        function isSidExists(){
            return new Promise((resolve, reject) => {
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};
                    // is exists.
                    connection.query({
                        sql: 'SELECT * FROM csat_stakeholders WHERE sid = ?',
                        values: [ req.body.sid ]
                    },  (err, results) => {
                        if(err){return reject(err)};

                        if(typeof results !== 'undefined' && results !== null && results.length > 0){
                            resolve();
                        } else {
                            res.status(200).json({error: 'SID does not exists.'})
                        }
        
                    })
                    connection.release();
                });
            })
        }

        // check if bid exists.
        function isBidExists(){
            return new Promise((resolve, reject) => {
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};
                    // is exists.
                    connection.query({
                        sql: 'SELECT * FROM csat_buyers WHERE bid = ?',
                        values: [ req.body.bid ]
                    },  (err, results) => {
                        if(err){return reject(err)};

                        if(typeof results !== 'undefined' && results !== null && results.length > 0){
                            resolve();
                        } else {
                            res.status(200).json({error: 'BID does not exists.'})
                        }
        
                    })
                    connection.release();
                });
            })
        }

        // insert to database...
        function insertToCSAT_ratings(){
            return new Promise((resolve, reject) => {
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};

                    connection.query({
                        sql: 'INSERT INTO csat_ratings SET dt=?, sid=?, bid=?, question_1=?, question_2=?, question_3=?, recommendation=?',
                        values: [ new Date(), req.body.sid, req.body.bid, req.body.question_1, req.body.question_2, req.body.question_3, req.body.recommendation ]
                    }, (err, results) => {
                        
                        if(err){reject(err)}
                        if(results){
                            resolve();
                        }

                    });

                    connection.release();

                });
            });
        }

        if(req.body.sid && req.body.bid){
            if(req.body.question_1 && req.body.question_2 && req.body.question_3){
                isSidExists().then(() => {
                    isBidExists().then(() => {
                        insertToCSAT_ratings().then(() => {
                            res.status(200).json({success: 'Your feedback has been submitted. Thank you!'});
                        },  (err) => {
                            res.status(200).json({error: err});
                        })
                    }, (err) => {
                        res.status(200).json({error: err});
                    })
                }, (err) => {
                    res.status(200).json({error: err});
                })
            } else {
                res.status(200).json({error: 'Unable to submit. Fields might be incomplete...'})
            }
        } else {
            res.status(200).json({error: 'Unable to submit. SID or BID is incorrect...'})
        }

    })

    // WTS POLY TUBE Traceability API
    app.post('/api/polywts22', (req, res) => {
        console.log(req.body);

        function insertWTSTube(){
            return new Promise((resolve, reject) => {
                // using traceability database
                mysqlTrace.getConnection((err, connection) => {
                    if(err){return reject(err)};

                    connection.query({
                        sql: 'INSERT INTO polywts_tube_mapping SET dt=?, setID=?, tubeID=?, username=?',
                        values: [ new Date(), req.body.setID, req.body.tubeID, req.body.username ]
                    }, (err, results) => {
                        
                        if(err){reject(err)}
                        if(results){
                            resolve();
                        }

                    });

                    connection.release();

                });
            })
        }

        if(req.body.setID && req.body.tubeID){
            insertWTSTube().then(() => {
                res.status(200).json({success: 'Thank you! SetID and TubeID has been saved.'});
            }, (err) => {
                res.status(200).json({error: err});
            })
        } else {
            res.status(200).json({error: 'Unable to submit. Fields might be incomplete...'})
        }

    })

    // RECERTIFICATION WEB APP API
    app.get('/api/recertapp/:token', verifyTokenRecertapp, (req, res) => {

        if(req.userID && req.claim){
            res.status(200).json(req.claim);
        } else {
            res.status(200).json({err: 'Invalid token.'});
        }

    });

    //  2019 YEP web app api
    app.get('/api/yep2019/:token', verifyToken2019YEP, (req, res) => {
	
	console.log(req.userID);
	console.log(req.claim);
	console.log(req.registration);	

        if(req.claim && req.registration){
            let data = Object.assign(req.claim, req.registration);
            res.status(200).json(data);
        } else {
            res.status(200).json({err: 'Invalid token.'});
        }

    });

    app.post('/api/yes', (req, res) => {
        console.log(req.body);


        function insertYES2invite(){
            return new Promise((resolve, reject) => {
                // using traceability database
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};

                    connection.query({
                        sql: 'INSERT INTO yep2019_registration SET dt=?, employeeNumber=?, isAccepted=?, transportation=?, incomingRoute=?, outgoingRoute=?, reason=?',
                        values: [ new Date(), req.body.employeeNumber, req.body.isAccepted, req.body.transportation, req.body.incomingRoute, req.body.outgoingRoute, req.body.reason ]
                    }, (err, results) => {
                        
                        if(err){reject(err)}
                        if(results){
                            resolve();
                        }

                    });

                    connection.release();

                });
            })
        }

        if(req.body.employeeNumber && req.body.isAccepted === 1 && req.body.transportation !== '') {
            insertYES2invite().then(() => {
                res.status(200).json({success: 'Thank you!'});
            },  (err) => {
                res.status(200).json({error: err});
            })
        }
        
    });

    app.post('/api/no', (req, res) => {
        console.log(req.body);

        function insertNO2invite(){
            return new Promise((resolve, reject) => {
                // using traceability database
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)};

                    connection.query({
                        sql: 'INSERT INTO yep2019_registration SET dt=?, employeeNumber=?, isAccepted=?, transportation=?, incomingRoute=?, outgoingRoute=?, reason=?',
                        values: [ new Date(), req.body.employeeNumber, req.body.isAccepted, req.body.transportation, req.body.incomingRoute, req.body.outgoingRoute, req.body.reason ]
                    }, (err, results) => {
                        
                        if(err){reject(err)}
                        if(results){
                            resolve();
                        }

                    });

                    connection.release();

                });
            })
        }

        if(req.body.employeeNumber && req.body.isAccepted === 0 && req.body.transportation == '') {
            insertNO2invite().then(() => {
                res.status(200).json({success: 'Thank you. You have declined the inivation'});
            },  (err) => {
                res.status(200).json({error: err});
            })
        }
    });

    // Vehicle QR
    app.get('/api/vehicle', (req, res) => {
        let plate_number = req.query.plate;

        //console.log(plate_number);
        res.status(200).json({message: plate_number});
    })

    // rmp uploader -- DEPRECATED -TRANSFERED TO server port 8081
    
    /*
    app.get('/api/tesseract/:token', verifyTokenParams, (req, res) => {

        function loadImages(){ // query to traceability local database---
            return new Promise((resolve, reject) => {
                mysqlRPi.getConnection((err, connection) => {
                    if(err){return reject(err)};

                    connection.query({
                        sql: 'SELECT * FROM rpi_poly_wts WHERE FINAL_SIC_ID IS NULL ORDER BY ID DESC LIMIT 16'
                    },  (err, results) => {
                        if(err){reject(err)}
                        
                        let poly_boatid = [];

                        if(results){

                            for(let i=0; i<results.length;i++){
                                poly_boatid.push({
                                    id: results[i].ID,
                                    insert_time: moment(results[i].INSERT_TIME).calendar(),
                                    sic_id: results[i].SIC_ID,
                                    read_time: results[i].READ_TIME,
                                    match_value: results[i].MATCH_VALUE,
                                    base64_sic_id_image: results[i].SIC_ID_IMAGE.toString('base64'),
                                    urlsafe_sic_id_image: URLSafeBase64.encode(results[i].SIC_ID_IMAGE.toString('base64')),
                                    buffer_sic_id_image: results[i].SIC_ID_IMAGE,
                                    final_sic_id: results[i].FINAL_SIC_ID
                                })
                            }

                            resolve(poly_boatid);

                        } else {

                            poly_boatid.push({
                                id: '',
                                insert_time: '',
                                sic_id: '',
                                read_time: '',
                                match_value: '',
                                sic_id_image: '',
                                base64_sic_id_image: '',
                                urlsafe_sic_id_image: '',
                                buffer_sic_id_image: '',
                                final_sic_id: ''
                            })
                        }
                    });

                    connection.release();

                });
                
            })
        }

        if(req.userID && req.claim){

            loadImages().then((poly_boatid) => {

                //console.log(poly_boatid);
                let data = Object.assign(req.claim, {data: poly_boatid});
                res.status(200).json(data);
            }, (err) => {
                res.status(501).json({err: err});
            })

        } else {
            res.status(401).json({err: 'Invalid Token'});
        }

    });
    */

    app.get('/api/tesseract/:token', verifyTokenParams, (req, res) => {

        function loadImages(){ // query to traceability local database---
            return new Promise((resolve, reject) => {
                mysqlRPi.getConnection((err, connection) => {
                    if(err){return reject(err)};

                    connection.query({
                        sql: 'SELECT * FROM matched_rpi WHERE FINAL_SIC_ID IS NULL'
                    },  (err, results) => {
                        if(err){reject(err)}
                        
                        let poly_boatid = [];

                        if(results){

                            for(let i=0; i<results.length;i++){
                                poly_boatid.push({
                                    boat_loadtime: results[i].BOAT_LOADTIME,
                                    wafer_count: results[i].WAFER_COUNT,
                                    boat_id: results[i].BOAT_ID,
                                    rpi_record_id: results[i].RPI_RECORD_ID,
                                    id: results[i].ID,
                                    insert_time: moment(results[i].INSERT_TIME).calendar(),
                                    sic_id: results[i].SIC_ID,
                                    read_time: results[i].READ_TIME,
                                    match_value: results[i].MATCH_VALUE,
                                    base64_sic_id_image: results[i].SIC_ID_IMAGE.toString('base64'),
                                    urlsafe_sic_id_image: URLSafeBase64.encode(results[i].SIC_ID_IMAGE.toString('base64')),
                                    buffer_sic_id_image: results[i].SIC_ID_IMAGE,
                                    final_sic_id: results[i].FINAL_SIC_ID,
                                    transfer_type: results[i].TRANSFER_TYPE
                                })
                            }

                            resolve(poly_boatid);

                        } else {

                            poly_boatid.push({
                                boat_loadtime: '',
                                wafer_count: '',
                                boat_id: '',
                                rpi_record_id: '',
                                id: '',
                                insert_time: '',
                                sic_id: '',
                                read_time: '',
                                match_value: '',
                                sic_id_image: '',
                                base64_sic_id_image: '',
                                urlsafe_sic_id_image: '',
                                buffer_sic_id_image: '',
                                final_sic_id: '',
                                transfer_type: ''
                            })
                        }
                    });

                    connection.release();

                });
                
            })
        }

        if(req.userID && req.claim){

            loadImages().then((poly_boatid) => {

                //console.log(poly_boatid);
                let data = Object.assign(req.claim, {data: poly_boatid});
                res.status(200).json(data);
            }, (err) => {
                res.status(501).json({err: err});
            })

        } else {
            res.status(401).json({err: 'Invalid Token'});
        }

    });
    
    app.post('/api/updatesicboat', (req, res) => {

        let fields = req.body;
        console.log(fields);

        if(fields.id){
            UpdateSicBoat().then(data => {
                res.status(200).json({success: 'Final SiC ID successfully updated!'});
            })
        } else {
            res.status(200).json({error: 'Final SiC ID did not update.'});
        }

        function UpdateSicBoat(){
            return new Promise((resolve, reject) => {
                mysqlImageRPi.getConnection((err, connection) => {
                    if(err){return reject(err)}
                    connection.query({
                        sql: 'UPDATE rpi_poly_wts SET FINAL_SIC_ID = ? WHERE ID = ?',
                        values: [ 'DE-46778' + fields.final_sic_id, fields.id ]
                    },  (err, results) => {
                        if(err){return reject(err)}
                        resolve(results);
                    });
                    connection.release();
                });
            })
        }

    })

    app.get('/api/themetrohub/:token',  verifyTokenParams, (req, res) => {

        if(req.userID && req.claim){
            TheMetrohub().then((themetrohub_data) => {
                let data = Object.assign({user: req.claim}, {themetrohub: themetrohub_data})
                console.log(data);
                res.status(200).json(data);
            })
        }

        function TheMetrohub(){
            return new Promise((resolve, reject) => {
                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)}
                    connection.query({
                        sql: 'SELECT * FROM themetrohub'
                    },  (err, results) => {
                        if(err){return reject(err)}
                        let data = [];
                        if(typeof results !== 'undefined' && results !== null && results.length > 0){
                            for(let i=0; i<results.length; i++){
                                data.push({
                                    id: results[i].id,
                                    created_dt: results[i].created_dt,
                                    status_dt: results[i].status_dt,
                                    qual: results[i].qual,
                                    qty: results[i].qty,
                                    mode: results[i].mode,
                                    status: results[i].status,
                                    username: results[i].username
                                })
                            }

                            resolve(data);
                        } else {
                            
                            resolve(data);
                        }
                    });
                    connection.release();
                })
            })
        }

    });

    app.get('/api/mh/onepager', (req, res) => {

        TheMetrohubSummary().then(data => {
            res.status(200).json(data);
        },  (err) => {
            res.status(200).json({err: err});
        })

        function TheMetrohubSummary(){
            return new Promise((resolve, reject) => {

                mysql.getConnection((err, connection) => {
                    if(err){return reject(err)}

                    connection.query({
                        sql: 'SELECT qual, mode, status, SUM(qty) as qty FROM themetrohub GROUP BY qual, status, mode'
                    },  (err, results)=> {
                        if(err){return reject(err)}
                        let approved_inventory = [];
                        let pending_inventory = [];
                        let approved_withdraw = [];
                        let pending_withdraw = [];

                        if(typeof results !== 'undefined' && results !== null && results.length > 0){
                            //console.log(results);
                            for(let i=0; i<results.length;i++){
                                if(results[i].mode === 'add' &&  results[i].status === 'approved'){
                                    approved_inventory.push({
                                        qual: results[i].qual,
                                        mode: results[i].mode,
                                        status: results[i].status,
                                        qty: results[i].qty
                                    })
                                } else if (results[i].mode === 'add' &&  results[i].status === 'pending') {
                                    pending_inventory.push({
                                        qual: results[i].qual,
                                        mode: results[i].mode,
                                        status: results[i].status,
                                        qty: results[i].qty
                                    })
                                } else if (results[i].mode === 'withdraw' &&  results[i].status === 'approved'){
                                    approved_withdraw.push({
                                        qual: results[i].qual,
                                        mode: results[i].mode,
                                        status: results[i].status,
                                        qty: results[i].qty
                                    })
                                } else if (results[i].mode === 'withdraw' &&  results[i].status === 'pending') {
                                    pending_withdraw.push({
                                        qual: results[i].qual,
                                        mode: results[i].mode,
                                        status: results[i].status,
                                        qty: results[i].qty
                                    })
                                }
                            }

                            let data = {
                                approved_inventory: approved_inventory,
                                pending_inventory: pending_inventory,
                                approved_withdraw: approved_withdraw,
                                pending_withdraw: pending_withdraw
                            };
                            //console.log(data);

                            resolve(data);
                        } else {
                            
                            let data = {
                                approved_inventory: approved_inventory,
                                pending_inventory: pending_inventory,
                                approved_withdraw: approved_withdraw,
                                pending_withdraw: pending_withdraw
                            };

                            resolve(data);
                        }

                    });
                    connection.release();
                })

            })
        }

    })

    app.post('/api/mh/addinventory', (req, res) => {

        console.log(req.body);

    })

}
