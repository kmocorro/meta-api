let verifyToken = require('./verifyToken');
let verifyTokenParams = require('./verifyTokenParams');
let formidable = require('formidable');
let XLSX = require('xlsx');
let mysql = require('../config').pool;
let moment = require('moment');

module.exports = function(app){

    app.get('/api/dashboard/:token', verifyTokenParams, (req, res) => {

        if(req.userID && req.claim){
            
            function cycletime_today(){
                return new Promise((resolve, reject) => {
                    mysql.getConnection((err, connection) => {
                        if(err){return reject(err)};

                        connection.query({
                            sql: 'SELECT * FROM meta_dashboard_cycletime ORDER BY id DESC LIMIT 1'
                        },  (err, results) => {
                            if(err){return reject(err)};

                            if(typeof results !== 'undefined' && results !== null && results.length > 0){

                                let cycletime = {
                                    new : {
                                        id: results[0].id,
                                        data_date: results[0].data_date,
                                        upload_date: results[0].upload_date,
                                        total_ave: results[0].total_ave,
                                        value: ((results[0].total_ave)/24).toFixed(2)
                                    }
                                }

                                resolve(cycletime);

                            } else {

                                let cycletime = {
                                    new : {
                                        id: 0,
                                        data_date: 0,
                                        upload_date: 0,
                                        total_ave: 0,
                                    }
                                }

                                resolve(cycletime);
                            }

                        });

                        connection.release();
                    });
                });
            }

            function cycletime_yesterday(){
                return new Promise((resolve, reject) => {
                    mysql.getConnection((err, connection) => {
                        if(err){return reject(err)};

                        connection.query({
                            sql: 'SELECT * FROM meta_dashboard_cycletime ORDER BY id DESC LIMIT 1,1'
                        },  (err, results) => {
                            if(err){return reject(err)};

                            if(typeof results !== 'undefined' && results !== null && results.length > 0){

                                let cycletime = {
                                    old : {
                                        id: results[0].id,
                                        data_date: results[0].data_date,
                                        upload_date: results[0].upload_date,
                                        total_ave: results[0].total_ave,
                                        value: ((results[0].total_ave)/24).toFixed(2)
                                    }
                                }

                                resolve(cycletime);

                            } else {

                                let cycletime = {
                                    old : {
                                        id: 0,
                                        data_date: 0,
                                        upload_date: 0,
                                        total_ave: 0,
                                    }
                                }

                                resolve(cycletime);
                            }

                        });

                        connection.release();
                    });
                });
            }

            function cycletime_trend(){
                return new Promise((resolve, reject) => {
                    mysql.getConnection((err, connection) => {
                        if(err){return reject(err)};

                        let cyc_trend_arr = [];

                        connection.query({
                            sql: 'SELECT * FROM meta_dashboard_cycletime ORDER BY id DESC LIMIT 7'
                        },  (err, results) => {
                            if(err){return reject(err)};

                            if(typeof results !== 'undefined' && results !== null && results.length > 0){

                                for(let i=0; i<results.length; i++){
                                    cyc_trend_arr.push({
                                        label: results[i].data_date,
                                        data: results[i].data_date
                                    });
                                }

                                resolve(cyc_trend_arr);

                            } else {

                                resolve(cyc_trend_arr);
                            }

                        });

                        connection.release();
                    });
                });
            }

            cycletime_today().then((cycletime_today) => {
                return cycletime_yesterday().then((cycletime_yesterday) => {
                    return cycletime_trend().then((cycletime_trend) => {

                        let metaDashboard = { 
                            dashboard: {
                                code: 1,
                                title: 'meta/fab4',
                                author: 'kevinmocorro',
                                claim: req.claim,
                                dash: [
                                    {id: 1, name: 'Median Efficiency', value: 25.58, old_value: 24.50},
                                    {id: 2, name: 'Bin NE', value: 65.5, old_value: 60.2},
                                    {id: 3, name: 'Cosmetics', value: 92.0, old_value: 91.0},
                                    {id: 4, name: 'Cycletime', value: cycletime_today.new.value, old_value: cycletime_yesterday.old.value}
                                ],
                                cycletime_trend: cycletime_trend
                            }
                            
                        }
    
                        console.log(metaDashboard);
                
                        res.status(200).json(metaDashboard);
    
                    }, (err) => (console.log(err)));
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

    // rmp uploader
    app.post('/api/uploader/rmp', verifyToken, (req, res) => {

        let form = new formidable.IncomingForm();
        let user_details = {
            username: req.claim.username,
            title: req.claim.title
        }

        console.log(user_details);
        form.maxFileSize = 10 * 1024 * 1024 // 10mb max :P

        form.parse(req, (err, fields, file) => {
            if(err){return res.send(err)};
            
            if(file){
                
                let excelFile = {
                    date_upload: new Date(),
                    path: file.file.path,
                    name: file.file.name,
                    type: file.file.type,
                    data_modified: file.file.lastModifiedDate
                }
                
                let workbook = XLSX.readFile(excelFile.path);
                
                let RBT0_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['RBT0'], {header: 'A'});
                let RBT0_clean = [];

                let FOURPB_Metal_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['4PB-Metal'], {header: 'A'});
                let FOURPB_Metal_clean = [];

                let RTUV_HiUV_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['RTUV-HiUV'], {header: 'A'});
                let RTUV_HiUV_clean = [];

                let ACL72_Pre_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['ACL72_Pre'], {header: 'A'});
                let ACL72_Pre_clean = [];

                let ACL72_Post_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['ACL72_Post'], {header: 'A'});
                let ACL72_Post_clean = [];

                let worksheetsOk = [];
                let worksheetsErr = [];

                // RBT0 Uploader
                if(RBT0_Worksheet){

                    for(let i=1; i<RBT0_Worksheet.length; i++){ // cleaner
                        if(RBT0_Worksheet[i].A || RBT0_Worksheet[i].B || RBT0_Worksheet[i].C){
                            RBT0_clean.push(
                                [   
                                    excelFile.date_upload || null,
                                    RBT0_Worksheet[i].A || null,
                                    RBT0_Worksheet[i].B || null,
                                    RBT0_Worksheet[i].C || null,
                                    RBT0_Worksheet[i].D || null,
                                    RBT0_Worksheet[i].E || null,
                                    RBT0_Worksheet[i].F || null,
                                    RBT0_Worksheet[i].G || null,
                                    RBT0_Worksheet[i].H || null,
                                    RBT0_Worksheet[i].I || null,
                                    RBT0_Worksheet[i].J || null,
                                    RBT0_Worksheet[i].K || null,
                                    RBT0_Worksheet[i].L || null,
                                    RBT0_Worksheet[i].M || null,
                                    RBT0_Worksheet[i].N || null,
                                    RBT0_Worksheet[i].O || null,
                                    RBT0_Worksheet[i].P || null,
                                    RBT0_Worksheet[i].Q || null,
                                    RBT0_Worksheet[i].R || null,
                                    RBT0_Worksheet[i].S || null,
                                ]
                            )
                        }
                    }

                }

                // FOURPB_Metal Uploader
                if(FOURPB_Metal_Worksheet){

                    for(let i=1; i<FOURPB_Metal_Worksheet.length; i++){
                        if(FOURPB_Metal_Worksheet[i].A || FOURPB_Metal_Worksheet[i].B || FOURPB_Metal_Worksheet[i].C){
                            FOURPB_Metal_clean.push(
                                [
                                    excelFile.date_upload,
                                    FOURPB_Metal_Worksheet[i].A || null,
                                    FOURPB_Metal_Worksheet[i].B || null,
                                    FOURPB_Metal_Worksheet[i].C || null,
                                    FOURPB_Metal_Worksheet[i].D || null,
                                    FOURPB_Metal_Worksheet[i].E || null,
                                    FOURPB_Metal_Worksheet[i].F || null,
                                    FOURPB_Metal_Worksheet[i].G || null,
                                    FOURPB_Metal_Worksheet[i].H || null,
                                    FOURPB_Metal_Worksheet[i].I || null,
                                    FOURPB_Metal_Worksheet[i].J || null,
                                    FOURPB_Metal_Worksheet[i].K || null,
                                ]
                            )
                        }
                    }

                }

                // RTUV_HiUV Uploader
                if(RTUV_HiUV_Worksheet){

                    for(let i=1; i<RTUV_HiUV_Worksheet.length; i++){
                        if(RTUV_HiUV_Worksheet[i].A || RTUV_HiUV_Worksheet[i].B || RTUV_HiUV_Worksheet[i].C){
                            RTUV_HiUV_clean.push(
                                [
                                    excelFile.date_upload,
                                    RTUV_HiUV_Worksheet[i].A || null,
                                    RTUV_HiUV_Worksheet[i].B || null,
                                    RTUV_HiUV_Worksheet[i].C || null,
                                    RTUV_HiUV_Worksheet[i].D || null,
                                    RTUV_HiUV_Worksheet[i].E || null,
                                    RTUV_HiUV_Worksheet[i].F || null,
                                    RTUV_HiUV_Worksheet[i].G || null,
                                    RTUV_HiUV_Worksheet[i].H || null,
                                    RTUV_HiUV_Worksheet[i].I || null,
                                    RTUV_HiUV_Worksheet[i].J || null,
                                    RTUV_HiUV_Worksheet[i].K || null,
                                    RTUV_HiUV_Worksheet[i].L || null,
                                    RTUV_HiUV_Worksheet[i].M || null,
                                    RTUV_HiUV_Worksheet[i].N || null,
                                    RTUV_HiUV_Worksheet[i].O || null,
                                    RTUV_HiUV_Worksheet[i].P || null,
                                    RTUV_HiUV_Worksheet[i].Q || null,
                                    RTUV_HiUV_Worksheet[i].R || null,
                                    RTUV_HiUV_Worksheet[i].S || null,
                                    RTUV_HiUV_Worksheet[i].T || null,
                                    RTUV_HiUV_Worksheet[i].U || null,
                                ]
                            )
                        }
                    }

                }
                
                // ACL72_Pre Uploader
                if(ACL72_Pre_Worksheet){
                    for(let i=1; i<ACL72_Pre_Worksheet.length;i++){
                        if(ACL72_Pre_Worksheet[i].A || ACL72_Pre_Worksheet[i].B || ACL72_Pre_Worksheet[i].C){
                            ACL72_Pre_clean.push(
                                [
                                excelFile.date_upload || null,
                                ACL72_Pre_Worksheet[i].A || null,
                                ACL72_Pre_Worksheet[i].B || null,
                                ACL72_Pre_Worksheet[i].C || null,
                                ACL72_Pre_Worksheet[i].D || null,
                                ACL72_Pre_Worksheet[i].E || null,
                                ACL72_Pre_Worksheet[i].F || null,
                                ACL72_Pre_Worksheet[i].G || null,
                                ACL72_Pre_Worksheet[i].H || null,
                                ACL72_Pre_Worksheet[i].I || null,
                                ACL72_Pre_Worksheet[i].J || null,
                                ACL72_Pre_Worksheet[i].K || null,
                                ACL72_Pre_Worksheet[i].L || null,
                                new Date((ACL72_Pre_Worksheet[i].M - (25567 + 2))*86400*1000) || null, // im doing this because excel serialized the date
                                ACL72_Pre_Worksheet[i].N || null,
                                ACL72_Pre_Worksheet[i].O || null,
                                ACL72_Pre_Worksheet[i].P || null,
                                ACL72_Pre_Worksheet[i].Q || null,
                                ACL72_Pre_Worksheet[i].R || null,
                                ACL72_Pre_Worksheet[i].S || null,
                                ACL72_Pre_Worksheet[i].T || null,
                                ACL72_Pre_Worksheet[i].U || null,
                                ACL72_Pre_Worksheet[i].V || null,
                                ACL72_Pre_Worksheet[i].W || null,
                                ACL72_Pre_Worksheet[i].X || null,
                                ACL72_Pre_Worksheet[i].Y || null,
                                ACL72_Pre_Worksheet[i].Z || null,
                                ACL72_Pre_Worksheet[i].AA || null,
                                ACL72_Pre_Worksheet[i].AB || null,
                                ACL72_Pre_Worksheet[i].AC || null,
                                ACL72_Pre_Worksheet[i].AD || null,
                                ACL72_Pre_Worksheet[i].AE || null,
                                ACL72_Pre_Worksheet[i].AF || null,
                                ACL72_Pre_Worksheet[i].AG || null,
                                ACL72_Pre_Worksheet[i].AH || null,
                                ACL72_Pre_Worksheet[i].AI || null,
                                ACL72_Pre_Worksheet[i].AJ || null,
                                ACL72_Pre_Worksheet[i].AK || null,
                                ACL72_Pre_Worksheet[i].AL || null,
                                ACL72_Pre_Worksheet[i].AM || null,
                                ACL72_Pre_Worksheet[i].AN || null,
                                ACL72_Pre_Worksheet[i].AO || null,
                                ACL72_Pre_Worksheet[i].AP || null,
                                ACL72_Pre_Worksheet[i].AQ || null,
                                ACL72_Pre_Worksheet[i].AR || null,
                                ACL72_Pre_Worksheet[i].AS || null,
                                ACL72_Pre_Worksheet[i].AT || null,
                                ACL72_Pre_Worksheet[i].AU || null,
                                ACL72_Pre_Worksheet[i].AV || null,
                                ACL72_Pre_Worksheet[i].AW || null,
                                ACL72_Pre_Worksheet[i].AX || null,
                                ACL72_Pre_Worksheet[i].AY || null,
                                ACL72_Pre_Worksheet[i].AZ || null,
                                ACL72_Pre_Worksheet[i].BA || null,
                                ACL72_Pre_Worksheet[i].BB || null,
                                ACL72_Pre_Worksheet[i].BC || null,
                                ACL72_Pre_Worksheet[i].BD || null,
                                ACL72_Pre_Worksheet[i].BE || null,
                                ACL72_Pre_Worksheet[i].BF || null,
                                ACL72_Pre_Worksheet[i].BG || null,
                                ACL72_Pre_Worksheet[i].BH || null,
                                ACL72_Pre_Worksheet[i].BI || null,
                                ACL72_Pre_Worksheet[i].BJ || null,
                                ACL72_Pre_Worksheet[i].BK || null,
                                ACL72_Pre_Worksheet[i].BL || null,
                                ACL72_Pre_Worksheet[i].BM || null,
                                ACL72_Pre_Worksheet[i].BN || null,
                                ACL72_Pre_Worksheet[i].BO || null,
                                ACL72_Pre_Worksheet[i].BP || null,
                                ACL72_Pre_Worksheet[i].BQ || null,
                                ACL72_Pre_Worksheet[i].BR || null,
                                ACL72_Pre_Worksheet[i].BS || null,
                                ACL72_Pre_Worksheet[i].BT || null,
                                ACL72_Pre_Worksheet[i].BU || null,
                                ACL72_Pre_Worksheet[i].BV || null,
                                ACL72_Pre_Worksheet[i].BW || null,
                                ACL72_Pre_Worksheet[i].BX || null,
                                ACL72_Pre_Worksheet[i].BY || null,
                                ACL72_Pre_Worksheet[i].BZ || null,
                                ACL72_Pre_Worksheet[i].CA || null,
                                ACL72_Pre_Worksheet[i].CB || null,
                                ACL72_Pre_Worksheet[i].CC || null,
                                ACL72_Pre_Worksheet[i].CD || null,
                                ACL72_Pre_Worksheet[i].CE || null,
                                ACL72_Pre_Worksheet[i].CF || null,
                                ACL72_Pre_Worksheet[i].CG || null,
                                ACL72_Pre_Worksheet[i].CH || null,
                                ACL72_Pre_Worksheet[i].CI || null,
                                ACL72_Pre_Worksheet[i].CJ || null,
                                ACL72_Pre_Worksheet[i].CK || null,
                                ACL72_Pre_Worksheet[i].CL || null,
                                ACL72_Pre_Worksheet[i].CM || null,
                                ACL72_Pre_Worksheet[i].CN || null,
                                ACL72_Pre_Worksheet[i].CO || null,
                                ACL72_Pre_Worksheet[i].CP || null,
                                ACL72_Pre_Worksheet[i].CQ || null,
                                ACL72_Pre_Worksheet[i].CR || null,
                                ACL72_Pre_Worksheet[i].CS || null,
                                ACL72_Pre_Worksheet[i].CT || null,
                                ACL72_Pre_Worksheet[i].CU || null,
                                ACL72_Pre_Worksheet[i].CV || null,
                                ACL72_Pre_Worksheet[i].CW || null,
                                ACL72_Pre_Worksheet[i].CX || null,
                                ACL72_Pre_Worksheet[i].CY || null,
                                ACL72_Pre_Worksheet[i].CZ || null,
                                ACL72_Pre_Worksheet[i].DA || null,
                                ACL72_Pre_Worksheet[i].DB || null,
                                ACL72_Pre_Worksheet[i].DC || null,
                                ACL72_Pre_Worksheet[i].DD || null,
                                ACL72_Pre_Worksheet[i].DE || null,
                                ACL72_Pre_Worksheet[i].DF || null,
                                ACL72_Pre_Worksheet[i].DG || null,
                                ACL72_Pre_Worksheet[i].DH || null,
                                ACL72_Pre_Worksheet[i].DI || null,
                                ACL72_Pre_Worksheet[i].DJ || null,
                                ACL72_Pre_Worksheet[i].DK || null,
                                ACL72_Pre_Worksheet[i].DL || null,
                                ACL72_Pre_Worksheet[i].DM || null,
                                new Date((ACL72_Pre_Worksheet[i].DN - (25567 + 2))*86400*1000) || null, // im doing this because excel serialized the date
                                ACL72_Pre_Worksheet[i].DO || null,
                                ACL72_Pre_Worksheet[i].DP || null,
                                ]
                            )
                        }
                    }
                }
                
                // ACL72_Post Uploader
                if(ACL72_Post_Worksheet){
                    for(let i=1; i<ACL72_Post_Worksheet.length;i++){
                        if(ACL72_Post_Worksheet[i].A || ACL72_Post_Worksheet[i].B || ACL72_Post_Worksheet[i].C){
                            ACL72_Post_clean.push(
                                [
                                    excelFile.date_upload,
                                    ACL72_Post_Worksheet[i].A,
                                    ACL72_Post_Worksheet[i].B,
                                    ACL72_Post_Worksheet[i].C,
                                    ACL72_Post_Worksheet[i].D,
                                    ACL72_Post_Worksheet[i].E,
                                    ACL72_Post_Worksheet[i].F,
                                    ACL72_Post_Worksheet[i].G,
                                    ACL72_Post_Worksheet[i].H,
                                    ACL72_Post_Worksheet[i].I,
                                    ACL72_Post_Worksheet[i].J,
                                    ACL72_Post_Worksheet[i].K,
                                    ACL72_Post_Worksheet[i].L,
                                    new Date((ACL72_Post_Worksheet[i].M, - (25567 + 2))*86400*1000), // im doing this because excel serialized the date
                                    ACL72_Post_Worksheet[i].N,
                                    ACL72_Post_Worksheet[i].O,
                                    ACL72_Post_Worksheet[i].P,
                                    ACL72_Post_Worksheet[i].Q,
                                    ACL72_Post_Worksheet[i].R,
                                    ACL72_Post_Worksheet[i].S,
                                    ACL72_Post_Worksheet[i].T,
                                    ACL72_Post_Worksheet[i].U,
                                    ACL72_Post_Worksheet[i].V,
                                    ACL72_Post_Worksheet[i].W,
                                    ACL72_Post_Worksheet[i].X,
                                    ACL72_Post_Worksheet[i].Y,
                                    ACL72_Post_Worksheet[i].Z,
                                    ACL72_Post_Worksheet[i].AA,
                                    ACL72_Post_Worksheet[i].AB,
                                    ACL72_Post_Worksheet[i].AC,
                                    ACL72_Post_Worksheet[i].AD,
                                    ACL72_Post_Worksheet[i].AE,
                                    ACL72_Post_Worksheet[i].AF,
                                    ACL72_Post_Worksheet[i].AG,
                                    ACL72_Post_Worksheet[i].AH,
                                    ACL72_Post_Worksheet[i].AI,
                                    ACL72_Post_Worksheet[i].AJ,
                                    ACL72_Post_Worksheet[i].AK,
                                    ACL72_Post_Worksheet[i].AL,
                                    ACL72_Post_Worksheet[i].AM,
                                    ACL72_Post_Worksheet[i].AN,
                                    ACL72_Post_Worksheet[i].AO,
                                    ACL72_Post_Worksheet[i].AP,
                                    ACL72_Post_Worksheet[i].AQ,
                                    ACL72_Post_Worksheet[i].AR,
                                    ACL72_Post_Worksheet[i].AS,
                                    ACL72_Post_Worksheet[i].AT,
                                    ACL72_Post_Worksheet[i].AU,
                                    ACL72_Post_Worksheet[i].AV,
                                    ACL72_Post_Worksheet[i].AW,
                                    ACL72_Post_Worksheet[i].AX,
                                    ACL72_Post_Worksheet[i].AY,
                                    ACL72_Post_Worksheet[i].AZ,
                                    ACL72_Post_Worksheet[i].BA,
                                    ACL72_Post_Worksheet[i].BB,
                                    ACL72_Post_Worksheet[i].BC,
                                    ACL72_Post_Worksheet[i].BD,
                                    ACL72_Post_Worksheet[i].BE,
                                    ACL72_Post_Worksheet[i].BF,
                                    ACL72_Post_Worksheet[i].BG,
                                    ACL72_Post_Worksheet[i].BH,
                                    ACL72_Post_Worksheet[i].BI,
                                    ACL72_Post_Worksheet[i].BJ,
                                    ACL72_Post_Worksheet[i].BK,
                                    ACL72_Post_Worksheet[i].BL,
                                    ACL72_Post_Worksheet[i].BM,
                                    ACL72_Post_Worksheet[i].BN,
                                    ACL72_Post_Worksheet[i].BO,
                                    ACL72_Post_Worksheet[i].BP,
                                    ACL72_Post_Worksheet[i].BQ,
                                    ACL72_Post_Worksheet[i].BR,
                                    ACL72_Post_Worksheet[i].BS,
                                    ACL72_Post_Worksheet[i].BT,
                                    ACL72_Post_Worksheet[i].BU,
                                    ACL72_Post_Worksheet[i].BV,
                                    ACL72_Post_Worksheet[i].BW,
                                    ACL72_Post_Worksheet[i].BX,
                                    ACL72_Post_Worksheet[i].BY,
                                    ACL72_Post_Worksheet[i].BZ,
                                    ACL72_Post_Worksheet[i].CA,
                                    ACL72_Post_Worksheet[i].CB,
                                    ACL72_Post_Worksheet[i].CC,
                                    ACL72_Post_Worksheet[i].CD,
                                    ACL72_Post_Worksheet[i].CE,
                                    ACL72_Post_Worksheet[i].CF,
                                    ACL72_Post_Worksheet[i].CG,
                                    ACL72_Post_Worksheet[i].CH,
                                    ACL72_Post_Worksheet[i].CI,
                                    ACL72_Post_Worksheet[i].CJ,
                                    ACL72_Post_Worksheet[i].CK,
                                    ACL72_Post_Worksheet[i].CL,
                                    ACL72_Post_Worksheet[i].CM,
                                    ACL72_Post_Worksheet[i].CN,
                                    ACL72_Post_Worksheet[i].CO,
                                    ACL72_Post_Worksheet[i].CP,
                                    ACL72_Post_Worksheet[i].CQ,
                                    ACL72_Post_Worksheet[i].CR,
                                    ACL72_Post_Worksheet[i].CS,
                                    ACL72_Post_Worksheet[i].CT,
                                    ACL72_Post_Worksheet[i].CU,
                                    ACL72_Post_Worksheet[i].CV,
                                    ACL72_Post_Worksheet[i].CW,
                                    ACL72_Post_Worksheet[i].CX,
                                    ACL72_Post_Worksheet[i].CY,
                                    ACL72_Post_Worksheet[i].CZ,
                                    ACL72_Post_Worksheet[i].DA,
                                    ACL72_Post_Worksheet[i].DB,
                                    ACL72_Post_Worksheet[i].DC,
                                    ACL72_Post_Worksheet[i].DD,
                                    ACL72_Post_Worksheet[i].DE,
                                    ACL72_Post_Worksheet[i].DF,
                                    ACL72_Post_Worksheet[i].DG,
                                    ACL72_Post_Worksheet[i].DH,
                                    ACL72_Post_Worksheet[i].DI,
                                    ACL72_Post_Worksheet[i].DJ,
                                    ACL72_Post_Worksheet[i].DK,
                                    ACL72_Post_Worksheet[i].DL,
                                    ACL72_Post_Worksheet[i].DM,
                                    new Date((ACL72_Post_Worksheet[i].DN, - (25567 + 2))*86400*1000), // im doing this because excel serialized the date
                                    ACL72_Post_Worksheet[i].DO,
                                    ACL72_Post_Worksheet[i].DP,
                                ]
                            )
                        }
                    }
                }

                return insertRBT0(RBT0_clean).then((fileStatus) => {
                       
                    let upload_details = [];

                    if(fileStatus){
                        worksheetsOk.push(['RBT0']);

                        upload_details.push([
                            excelFile.date_upload,
                            'RBT0',
                            user_details.username,
                        ]);

                    } else {

                        worksheetsOk.push(['RBT0 - Empty. Proceeding...']);

                        upload_details.push([
                            excelFile.date_upload,
                            'RBT0 - Empty - No data to be uploaded.',
                            user_details.username,
                        ]);
                        
                    }

                    return rmpUploadHistory(upload_details).then(() => {
                        return insertFOURPB_Metal(FOURPB_Metal_clean).then((fileStatus) => {
                            
                            let upload_details = [];

                            if(fileStatus){
                                worksheetsOk.push(['FOURPB_Metal']);
        
                                upload_details.push([
                                    excelFile.date_upload,
                                    'FOURPB_Metal',
                                    user_details.username,
                                ]);
        
                            } else {
        
                                worksheetsOk.push(['FOURPB_Metal - Empty. Proceeding...']);
        
                                upload_details.push([
                                    excelFile.date_upload,
                                    'FOURPB_Metal - Empty - No data to be uploaded.',
                                    user_details.username,
                                ]);
                                
                            }
    
                            return rmpUploadHistory(upload_details).then(() => {
                                return insertRTUV_HiUV(RTUV_HiUV_clean).then((fileStatus) => {
                                    
                                    let upload_details = [];

                                    if(fileStatus){
                                        worksheetsOk.push(['RTUV_HiUV']);
                
                                        upload_details.push([
                                            excelFile.date_upload,
                                            'RTUV_HiUV',
                                            user_details.username,
                                        ]);
                
                                    } else {
                
                                        worksheetsOk.push(['RTUV_HiUV - Empty. Proceeding...']);
                
                                        upload_details.push([
                                            excelFile.date_upload,
                                            'RTUV_HiUV - Empty - No data to be uploaded.',
                                            user_details.username,
                                        ]);
                                        
                                    }
            
                                    return rmpUploadHistory(upload_details).then(() => {
                                        return insertACL72_Pre(ACL72_Pre_clean).then((fileStatus) => {
                                            
                                            let upload_details = [];

                                            if(fileStatus){
                                                worksheetsOk.push(['ACL72_Pre']);
                        
                                                upload_details.push([
                                                    excelFile.date_upload,
                                                    'ACL72_Pre',
                                                    user_details.username,
                                                ]);
                        
                                            } else {
                        
                                                worksheetsOk.push(['ACL72_Pre - Empty. Proceeding...']);
                        
                                                upload_details.push([
                                                    excelFile.date_upload,
                                                    'ACL72_Pre - Empty - No data to be uploaded.',
                                                    user_details.username,
                                                ]);
                                                
                                            }
                    
                                            return rmpUploadHistory(upload_details).then(() => {
                                                return insertACL72_Post(ACL72_Post_clean).then((fileStatus) => {
                                                    
                                                    let upload_details = [];

                                                    if(fileStatus){
                                                        worksheetsOk.push(['ACL72_Post']);
                                
                                                        upload_details.push([
                                                            excelFile.date_upload,
                                                            'ACL72_Post',
                                                            user_details.username,
                                                        ]);
                                
                                                    } else {
                                
                                                        worksheetsOk.push(['ACL72_Post - Empty. Proceeding...']);
                                
                                                        upload_details.push([
                                                            excelFile.date_upload,
                                                            'ACL72_Post - Empty - No data to be uploaded.',
                                                            user_details.username,
                                                        ]);
                                                        
                                                    }

                                                    return rmpUploadHistory(upload_details).then(() => {
                                                        
                                                        let upload_status = {
                                                            OK: worksheetsOk,
                                                            ERR: worksheetsErr
                                                        }

                                                        return res.status(200).json(upload_status);

                                                    },  (err) => {
                                                        console.log(err);
                                                        
                                                    });
                            
                                                }, (err) => {
                                                    console.log(err.code);
                                                    worksheetsErr.push(['ACL72_Post - ' + err.code ]);

                                                    let upload_status = {
                                                        OK: worksheetsOk,
                                                        ERR: worksheetsErr
                                                    }

                                                    return res.status(200).json(upload_status);
                                                })

                                            },  (err) => {
                                                console.log(err);
                                            });
                    
                                        }, (err) => {
                                            console.log(err.code);
                                            worksheetsErr.push(['ACL72_Pre - ' + err.code ]);

                                            let upload_status = {
                                                OK: worksheetsOk,
                                                ERR: worksheetsErr
                                            }

                                            return res.status(200).json(upload_status);
                                        });

                                    },  (err) => {
                                        console.log(err);
                                    });
                                    
                                },  (err) => {
                                    console.log(err.code);
                                    worksheetsErr.push(['RTUV_HiUV - ' + err.code ]);
                                    let upload_status = {
                                        OK: worksheetsOk,
                                        ERR: worksheetsErr
                                    }

                                    return res.status(200).json(upload_status);
                                });

                            },  (err) => {
                                console.log(err);
                            });
                        },  (err) => {
                            console.log(err.code);
                            worksheetsErr.push(['FOURPB_Metal - ' + err.code ]);
                            let upload_status = {
                                OK: worksheetsOk,
                                ERR: worksheetsErr
                            }

                            return res.status(200).json(upload_status);
                        });
                        
                    },  (err) => {
                        console.log(err);
                    });

                },  (err) => {
                    console.log(err.code);
                    worksheetsErr.push(['RBT0 - ' + err.code ]);

                    let upload_status = {
                        OK: worksheetsOk,
                        ERR: worksheetsErr
                    }

                    return res.status(200).json(upload_status);
                });


                function insertRBT0(RBT0_clean){
                    return new Promise((resolve, reject) => {

                        let fileStatus = false;

                        if(RBT0_clean.length > 0){
                            mysql.getConnection((err, connection) => {
                                if(err){return reject(err)};
                                
                                connection.query({
                                    sql: 'INSERT INTO rbt0_data (upload_date, year, workweek, batch, day, line, bin, remarks, lot_id, tag, coupon_id, start_voltage, end_voltage,  severity, jv, jv_change, min_t_dc, max_t_dc, ave_t_dc, disposition) VALUES ?',
                                    values: [RBT0_clean]
                                },  (err, results) => {
                                    if(err){return reject(err)};

                                    fileStatus = true;
    
                                    resolve(fileStatus);
                                });
    
                                connection.release();
    
                            });
                        } else {
                            resolve(fileStatus);
                        }
                        

                    });
                }

                function insertFOURPB_Metal(FOURPB_Metal_clean){
                    return new Promise((resolve, reject) => {

                        let fileStatus = false;

                        if(FOURPB_Metal_clean.length > 0){
                            
                            mysql.getConnection((err, connection) => {
                                if(err){return reject(err)};
    
                                connection.query({
                                    sql: 'INSERT into fourpb_metal_data (upload_date, year, workweek, batch, day, line, bin, coupon_id, cell_location, force_breakage, disposition, remarks) VALUES ?',
                                    values: [FOURPB_Metal_clean]
                                },  (err, results) => {
                                    if(err){return reject(err)};
    
                                    fileStatus = true;
    
                                    resolve(fileStatus);
                                });
    
                                connection.release();
    
                            });

                        } else {
                            resolve(fileStatus);
                        }

                    });
                }

                function insertRTUV_HiUV(RTUV_HiUV_clean){
                    return new Promise((resolve, reject) => {

                        let fileStatus = false;

                        if(RTUV_HiUV_clean.length > 0){

                            mysql.getConnection((err, connection) => {
                                if(err){return reject(err)};
    
                                connection.query({
                                    sql: 'INSERT INTO rtuv_hiuv_data (upload_date, year, workweek, batch, day, line, remarks, timestamp, username, location, sampling_day, bin, cell_technology, sample_id, num_of_measured_spots, cut_off, pl_degradation, num_of_inverted_spots, disposition, dvoc_hiuv3, dvoc_hiuv7, dvoc_hiuv14) VALUES ?',
                                    values: [RTUV_HiUV_clean]
                                },  (err, results) => {
                                    if(err){return reject(err)};
    
                                    fileStatus = true;
    
                                    resolve(fileStatus);
                                });
    
                                connection.release();
    
                            });

                        } else {
                            resolve(fileStatus);
                        }

                    });
                }

                function insertACL72_Pre(ACL72_Pre_clean){
                    return new Promise((resolve, reject) => {

                        let fileStatus = false;

                        if(ACL72_Pre_clean.length){

                            mysql.getConnection((err, connection) => {
                                if(err){return reject(err)};
    
                                connection.query({
                                    sql: 'INSERT INTO acl72_pre_data (upload_date, year, workweek, batch, day, line, bin, test_id, cell_id, remarks, user_id, batch_id, sample_id, measurement_date, isc_a, voc_v, imp_a, vmp_v, pmp_w, ff_percent, efficiency_percent, rsh_ohm, rs_ohm, jsc_acm2, voc_vcell, jmp_acm2, vmp_vcell, pmp_wcm2, cell_efficiency_percent, rsh_ohmcm2, rs_ohmcm2, iload_a, vload_v, ffload_percent, pload_w, effload_percent,rsload_ohm, jload_acm2, vload_vcell, pload_wcm2, cell_effload_percent, rsload_ohmcm2, rs_modulation_ohmcm2, measured_temperature, total_test_time, pjmp_acm2, pvmp_vcell, ppmp_wcm2, pff_percent, pefficiency_percent, n_at_1_sun, n_at_110_suns, jo1_acm2, jo2_acm2, jo_facm2, est_bulk_lifetime, brr_hz, lifetime_at_vmp, doping_cm3, measured_resistivity_ohmcm, lifetime_fit_r2, max_intensity_suns, intensity_flash_cutoff_suns, v_at_isc_v, dvdt, v_pad_0_v, v_pad_1_v, v_pad_2_v, v_pad_3_v, v_pad_4_v, pmpe, resistivity_ohmcm, sample_type, thickness_cm, cell_area_cm2, total_area_cm2, num_of_cells_per_string, num_of_strings, temperature_c, intensity_suns, analysis_type, nominal_load_voltage_mvcell, rs_modulation_target_ohmcm2, reference_constant_vsun, voltage_temperature_coefficient_mvc, temperature_offset_c, power_per_sun_wm2, conductivity_modulation_ohmcm2v, auger_coefficent, auger_method, band_gap_narrowing, fit_method, carrier_density_center_point_cm3, percent_fit, lower_bond_cm3, upper_bond_cm3, rsh_lifetime_correction, rsh_measurement_method, sunsvoc_rsh_voltage_v, do_dark_break_measurement, temperature_measurement_method, number_of_drsh_points, drsh_output_vlimit_v, current_transfer, voltage_transfer, temperature_transfer, final_bin, bin_index, tester_id, do_doping_measurement, doping_sample_time, doping_measurement_length, measurement_type, comments, calibration, dbreak_v, dbreak_a, dark_break_interpolated, measurement_date_time_string, software_version, recipe_filename) VALUES ?',
                                    values: [ACL72_Pre_clean]
                                },  (err, results) => {
                                    if(err){return reject(err)};
    
                                    fileStatus = true;
    
                                    resolve(fileStatus);
                                });
    
                                connection.release();
    
                            });

                        } else {
                            resolve(fileStatus);
                        }

                    });
                }

                function insertACL72_Post(ACL72_Post_clean){
                    return new Promise((resolve, reject) => {

                        let fileStatus = false;

                        if(ACL72_Post_clean.length){

                            mysql.getConnection((err, connection) => {
                                if(err){return reject(err)};
    
                                connection.query({
                                    sql: 'INSERT INTO acl72_post_data (upload_date, year, workweek, batch, day, line, bin, test_id, cell_id, remarks, user_id, batch_id, sample_id, measurement_date, isc_a, voc_v, imp_a, vmp_v, pmp_w, ff_percent, efficiency_percent, rsh_ohm, rs_ohm, jsc_acm2, voc_vcell, jmp_acm2, vmp_vcell, pmp_wcm2, cell_efficiency_percent, rsh_ohmcm2, rs_ohmcm2, iload_a, vload_v, ffload_percent, pload_w, effload_percent,rsload_ohm, jload_acm2, vload_vcell, pload_wcm2, cell_effload_percent, rsload_ohmcm2, rs_modulation_ohmcm2, measured_temperature, total_test_time, pjmp_acm2, pvmp_vcell, ppmp_wcm2, pff_percent, pefficiency_percent, n_at_1_sun, n_at_110_suns, jo1_acm2, jo2_acm2, jo_facm2, est_bulk_lifetime, brr_hz, lifetime_at_vmp, doping_cm3, measured_resistivity_ohmcm, lifetime_fit_r2, max_intensity_suns, intensity_flash_cutoff_suns, v_at_isc_v, dvdt, v_pad_0_v, v_pad_1_v, v_pad_2_v, v_pad_3_v, v_pad_4_v, pmpe, resistivity_ohmcm, sample_type, thickness_cm, cell_area_cm2, total_area_cm2, num_of_cells_per_string, num_of_strings, temperature_c, intensity_suns, analysis_type, nominal_load_voltage_mvcell, rs_modulation_target_ohmcm2, reference_constant_vsun, voltage_temperature_coefficient_mvc, temperature_offset_c, power_per_sun_wm2, conductivity_modulation_ohmcm2v, auger_coefficent, auger_method, band_gap_narrowing, fit_method, carrier_density_center_point_cm3, percent_fit, lower_bond_cm3, upper_bond_cm3, rsh_lifetime_correction, rsh_measurement_method, sunsvoc_rsh_voltage_v, do_dark_break_measurement, temperature_measurement_method, number_of_drsh_points, drsh_output_vlimit_v, current_transfer, voltage_transfer, temperature_transfer, final_bin, bin_index, tester_id, do_doping_measurement, doping_sample_time, doping_measurement_length, measurement_type, comments, calibration, dbreak_v, dbreak_a, dark_break_interpolated, measurement_date_time_string, software_version, recipe_filename) VALUES ?',
                                    values: [ACL72_Post_clean]
                                },  (err, results) => {
                                    if(err){return reject(err)};
    
                                    fileStatus = true;
    
                                    resolve(fileStatus);
                                });
    
                                connection.release();
    
                            });

                        } else {
                            resolve(fileStatus);
                        }

                    });
                }

                function rmpUploadHistory(upload_details){
                    return new Promise((resolve, reject) => {

                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            
                            connection.query({
                                sql: 'INSERT INTO rmp_upload_history (upload_date, worksheet_name, username) VALUES ?',
                                values: [upload_details]
                            },  (err, results) => {
                                if(err){return reject(err)};

                                resolve(results.insertID);

                            });

                            connection.release();

                        });
                        
                    });
                }
                
            }
                
        });

    });

}