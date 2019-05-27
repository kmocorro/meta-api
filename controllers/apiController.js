let verifyToken = require('./verifyToken');
let verifyTokenParams = require('./verifyTokenParams');
let formidable = require('formidable');
let XLSX = require('xlsx');
let mysql = require('../config').pool;
let moment = require('moment');

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

                        })
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

    // rmp uploader -- DEPRECATED -TRANSFERED TO server port 8081

}