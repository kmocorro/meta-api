let verifyToken = require('./verifyToken');
let formidable = require('formidable');
let XLSX = require('xlsx');
let mysql = require('../config').pool;

module.exports = function(app){

    app.get('/', verifyToken, (req, res) => {
    
        if(req.userID && req.claim){

            let meta_meta = {
                title: 'meta/fab4',
                author: 'kevin mocorro',
                prototypeList: [
                    {id: 1, name: 'COA'},
                    {id: 2, name: 'BRS'},
                    {id: 3, name: 'RMP'},
                    {id: 4, name: 'Engineering Activity'},
                    {id: 5, name: 'Survey App'},
                ]
            }

            res.status(200).json(meta_meta);
        }
        
        
    });

    // rmp uploader
    app.post('/api/uploader/rmp', verifyToken, (req, res) => {

        let form = new formidable.IncomingForm();
        let user_details = {
            username: req.claim.username,
            title: req.claim.title
        }
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
                



                console.log(file);

                let workbook = XLSX.readFile(excelFile.path);
                
                let RBT0_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['RBT0'], {header: 'A'});
                let RBT0_clean = [];

                let FOURPB_Metal_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['4PB-Metal'], {header: 'A'});
                let FOURPB_Metal_clean = [];

                let RTUV_HiUV_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['RTUV-HiUV'], {header: 'A'});
                let RTUV_HiUV_clean = [];

                let ACL72_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['ACL72'], {header: 'A'});
                let ACL72_clean = [];

                // RBT0 Uploader
                if(RBT0_Worksheet){

                    for(let i=1; i<RBT0_Worksheet.length; i++){ // cleaner
                        if(RBT0_Worksheet[i].A){
                            RBT0_clean.push(
                                [   
                                    excelFile.date_upload,
                                    RBT0_Worksheet[i].A,
                                    RBT0_Worksheet[i].B,
                                    RBT0_Worksheet[i].C,
                                    RBT0_Worksheet[i].D,
                                    RBT0_Worksheet[i].E,
                                    RBT0_Worksheet[i].F,
                                    RBT0_Worksheet[i].G,
                                    RBT0_Worksheet[i].H,
                                    RBT0_Worksheet[i].I,
                                    RBT0_Worksheet[i].J,
                                    RBT0_Worksheet[i].K,
                                    RBT0_Worksheet[i].L,
                                    RBT0_Worksheet[i].M,
                                    RBT0_Worksheet[i].N,
                                    RBT0_Worksheet[i].O,
                                    RBT0_Worksheet[i].P,
                                    RBT0_Worksheet[i].Q,
                                    RBT0_Worksheet[i].R,
                                    RBT0_Worksheet[i].S,
                                ]
                            )
                        }
                    }

                    insertRBT0(RBT0_clean).then((resultID) => {
                        console.log(resultID);
                        
                        let upload_details = [
                            excelFile.date_upload,
                            'RBT0',
                            user_details.username,
                        ]

                        return rmpUploadHistory(upload_details);
                    },  (err) => {
                        console.log(err);
                    });

                }

                // FOURPB_Metal Uploader
                if(FOURPB_Metal_Worksheet){

                    for(let i=1; i<FOURPB_Metal_Worksheet.length; i++){
                        if(FOURPB_Metal_Worksheet[i].A){
                            FOURPB_Metal_clean.push(
                                [
                                    excelFile.date_upload,
                                    FOURPB_Metal_Worksheet[i].A,
                                    FOURPB_Metal_Worksheet[i].B,
                                    FOURPB_Metal_Worksheet[i].C,
                                    FOURPB_Metal_Worksheet[i].D,
                                    FOURPB_Metal_Worksheet[i].E,
                                    FOURPB_Metal_Worksheet[i].F,
                                    FOURPB_Metal_Worksheet[i].G,
                                    FOURPB_Metal_Worksheet[i].H,
                                    FOURPB_Metal_Worksheet[i].I,
                                    FOURPB_Metal_Worksheet[i].J,
                                    FOURPB_Metal_Worksheet[i].K,
                                ]
                            )
                        }
                    }

                    insertFOURPB_Metal(FOURPB_Metal_clean).then((resultID) => {
                        console.log(resultID);
                        
                        let upload_details = [
                            excelFile.date_upload,
                            'FOURPB_Metal',
                            user_details.username,
                        ]

                        return rmpUploadHistory(upload_details);
                    },  (err) => {
                        console.log(err);
                    });

                }

                // RTUV_HiUV Uploader
                if(RTUV_HiUV_Worksheet){

                    for(let i=1; i<RTUV_HiUV_Worksheet.length; i++){
                        if(RTUV_HiUV_Worksheet[i].A){
                            RTUV_HiUV_clean.push(
                                [
                                    excelFile.date_upload,
                                    RTUV_HiUV_Worksheet[i].A,
                                    RTUV_HiUV_Worksheet[i].B,
                                    RTUV_HiUV_Worksheet[i].C,
                                    RTUV_HiUV_Worksheet[i].D,
                                    RTUV_HiUV_Worksheet[i].E,
                                    RTUV_HiUV_Worksheet[i].F,
                                    RTUV_HiUV_Worksheet[i].G,
                                    RTUV_HiUV_Worksheet[i].H,
                                    RTUV_HiUV_Worksheet[i].I,
                                    RTUV_HiUV_Worksheet[i].J,
                                    RTUV_HiUV_Worksheet[i].K,
                                    RTUV_HiUV_Worksheet[i].L,
                                    RTUV_HiUV_Worksheet[i].M,
                                    RTUV_HiUV_Worksheet[i].N,
                                    RTUV_HiUV_Worksheet[i].O,
                                    RTUV_HiUV_Worksheet[i].P,
                                    RTUV_HiUV_Worksheet[i].Q,
                                    RTUV_HiUV_Worksheet[i].R,
                                    RTUV_HiUV_Worksheet[i].S,
                                    RTUV_HiUV_Worksheet[i].T,
                                    RTUV_HiUV_Worksheet[i].U,
                                ]
                            )
                        }
                    }

                    insertRTUV_HiUV(RTUV_HiUV_clean).then((resultID) => {
                        console.log(resultID);
                        
                        let upload_details = [
                            excelFile.date_upload,
                            'RTUV_HiUV',
                            user_details.username,
                        ]

                        return rmpUploadHistory(upload_details);
                    },  (err) => {
                        console.log(err);
                    });

                }

                // ACL72 Uploader
                if(ACL72_Worksheet){
                    for(let i=1; i<ACL72_Worksheet.length;i++){
                        if(ACL72_Worksheet[i].A){
                            ACL72_clean.push(
                                [
                                    excelFile.date_upload,
                                    ACL72_Worksheet[i].A,
                                    ACL72_Worksheet[i].B,
                                    ACL72_Worksheet[i].C,
                                    ACL72_Worksheet[i].D,
                                    ACL72_Worksheet[i].E,
                                    ACL72_Worksheet[i].F,
                                    ACL72_Worksheet[i].G,
                                    ACL72_Worksheet[i].H,
                                    ACL72_Worksheet[i].I,
                                    ACL72_Worksheet[i].J,
                                    ACL72_Worksheet[i].K,
                                    ACL72_Worksheet[i].L,
                                    new Date((ACL72_Worksheet[i].M, - (25567 + 1))*86400*1000), // im doing this because excel serialized the date
                                    ACL72_Worksheet[i].N,
                                    ACL72_Worksheet[i].O,
                                    ACL72_Worksheet[i].P,
                                    ACL72_Worksheet[i].Q,
                                    ACL72_Worksheet[i].R,
                                    ACL72_Worksheet[i].S,
                                    ACL72_Worksheet[i].T,
                                    ACL72_Worksheet[i].U,
                                    ACL72_Worksheet[i].V,
                                    ACL72_Worksheet[i].W,
                                    ACL72_Worksheet[i].X,
                                    ACL72_Worksheet[i].Y,
                                    ACL72_Worksheet[i].Z,
                                    ACL72_Worksheet[i].AA,
                                    ACL72_Worksheet[i].AB,
                                    ACL72_Worksheet[i].AC,
                                    ACL72_Worksheet[i].AD,
                                    ACL72_Worksheet[i].AE,
                                    ACL72_Worksheet[i].AF,
                                    ACL72_Worksheet[i].AG,
                                    ACL72_Worksheet[i].AH,
                                    ACL72_Worksheet[i].AI,
                                    ACL72_Worksheet[i].AJ,
                                    ACL72_Worksheet[i].AK,
                                    ACL72_Worksheet[i].AL,
                                    ACL72_Worksheet[i].AM,
                                    ACL72_Worksheet[i].AN,
                                    ACL72_Worksheet[i].AO,
                                    ACL72_Worksheet[i].AP,
                                    ACL72_Worksheet[i].AQ,
                                    ACL72_Worksheet[i].AR,
                                    ACL72_Worksheet[i].AS,
                                    ACL72_Worksheet[i].AT,
                                    ACL72_Worksheet[i].AU,
                                    ACL72_Worksheet[i].AV,
                                    ACL72_Worksheet[i].AW,
                                    ACL72_Worksheet[i].AX,
                                    ACL72_Worksheet[i].AY,
                                    ACL72_Worksheet[i].AZ,
                                    ACL72_Worksheet[i].BA,
                                    ACL72_Worksheet[i].BB,
                                    ACL72_Worksheet[i].BC,
                                    ACL72_Worksheet[i].BD,
                                    ACL72_Worksheet[i].BE,
                                    ACL72_Worksheet[i].BF,
                                    ACL72_Worksheet[i].BG,
                                    ACL72_Worksheet[i].BH,
                                    ACL72_Worksheet[i].BI,
                                    ACL72_Worksheet[i].BJ,
                                    ACL72_Worksheet[i].BK,
                                    ACL72_Worksheet[i].BL,
                                    ACL72_Worksheet[i].BM,
                                    ACL72_Worksheet[i].BN,
                                    ACL72_Worksheet[i].BO,
                                    ACL72_Worksheet[i].BP,
                                    ACL72_Worksheet[i].BQ,
                                    ACL72_Worksheet[i].BR,
                                    ACL72_Worksheet[i].BS,
                                    ACL72_Worksheet[i].BT,
                                    ACL72_Worksheet[i].BU,
                                    ACL72_Worksheet[i].BV,
                                    ACL72_Worksheet[i].BW,
                                    ACL72_Worksheet[i].BX,
                                    ACL72_Worksheet[i].BY,
                                    ACL72_Worksheet[i].BZ,
                                    ACL72_Worksheet[i].CA,
                                    ACL72_Worksheet[i].CB,
                                    ACL72_Worksheet[i].CC,
                                    ACL72_Worksheet[i].CD,
                                    ACL72_Worksheet[i].CE,
                                    ACL72_Worksheet[i].CF,
                                    ACL72_Worksheet[i].CG,
                                    ACL72_Worksheet[i].CH,
                                    ACL72_Worksheet[i].CI,
                                    ACL72_Worksheet[i].CJ,
                                    ACL72_Worksheet[i].CK,
                                    ACL72_Worksheet[i].CL,
                                    ACL72_Worksheet[i].CM,
                                    ACL72_Worksheet[i].CN,
                                    ACL72_Worksheet[i].CO,
                                    ACL72_Worksheet[i].CP,
                                    ACL72_Worksheet[i].CQ,
                                    ACL72_Worksheet[i].CR,
                                    ACL72_Worksheet[i].CS,
                                    ACL72_Worksheet[i].CT,
                                    ACL72_Worksheet[i].CU,
                                    ACL72_Worksheet[i].CV,
                                    ACL72_Worksheet[i].CW,
                                    ACL72_Worksheet[i].CX,
                                    ACL72_Worksheet[i].CY,
                                    ACL72_Worksheet[i].CZ,
                                    ACL72_Worksheet[i].DA,
                                    ACL72_Worksheet[i].DB,
                                    ACL72_Worksheet[i].DC,
                                    ACL72_Worksheet[i].DD,
                                    ACL72_Worksheet[i].DE,
                                    ACL72_Worksheet[i].DF,
                                    ACL72_Worksheet[i].DG,
                                    ACL72_Worksheet[i].DH,
                                    ACL72_Worksheet[i].DI,
                                    ACL72_Worksheet[i].DJ,
                                    ACL72_Worksheet[i].DK,
                                    ACL72_Worksheet[i].DL,
                                    ACL72_Worksheet[i].DM,
                                    new Date((ACL72_Worksheet[i].DN, - (25567 + 1))*86400*1000), // im doing this because excel serialized the date
                                    ACL72_Worksheet[i].DO,
                                    ACL72_Worksheet[i].DP,
                                ]
                            )
                        }
                    }

                    insertACL72(ACL72_clean).then((resultID) => {
                        console.log(resultID);
                        
                        let upload_details = [
                            excelFile.date_upload,
                            'ACL72',
                            user_details.username,
                        ]

                        return rmpUploadHistory(upload_details);

                    }, (err) => {
                        console.log(err);
                    });
                }

                function insertRBT0(RBT0_clean){
                    return new Promise((resolve, reject) => {
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            
                            connection.query({
                                sql: 'INSERT INTO rbt0_data (upload_date, year, workweek, batch, day, line, remarks, lot_id, tag, coupon_id, start_voltage, end_voltage, bin, severity, jv, jv_change, min_t_dc, max_t_dc, ave_t_dc, disposition)',
                                values: [RBT0_clean]
                            },  (err, results) => {
                                if(err){return reject(err)};

                                resolve(results.insertID);
                            });

                            connection.release();

                        });

                    });
                }

                function insertFOURPB_Metal(FOURPB_Metal_clean){
                    return new Promise((resolve, reject) => {
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};

                            connection.query({
                                sql: 'INSERT into fourpb_metal_data (upload_date, year, workweek, batch, day, line, bin, coupon_id, cell_location, force_breakage, disposition, remarks)',
                                values: [FOURPB_Metal_clean]
                            },  (err, results) => {
                                if(err){return reject(err)};

                                resolve(results.insertID);
                            });

                            connection.release();

                        });

                    });
                }

                function insertRTUV_HiUV(RTUV_HiUV_clean){
                    return new Promise((resolve, reject) => {
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};

                            connection.query({
                                sql: 'INSERT INTO rtuv_hiuv_data (upload_date, year, workweek, batch, day, line, remarks, timestamp, username, location, sampling_day, bin, cell_technology, sample_id, num_of_measured_spots, cut_off, pl_degradation, num_of_inverted_spots, disposition, dvoc_hiuv3, dvoc_hiuv7, dvoc_hiuv14',
                                values: [RTUV_HiUV_clean]
                            },  (err, results) => {
                                if(err){return reject(err)};

                                resolve(results.insertID);
                            });

                            connection.release();

                        });

                    });
                }

                function insertACL72(ACL72_clean){
                    return new Promise((resolve, reject) => {
                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};

                            connection.query({
                                sql: 'INSERT INTO acl72_data (upload_date, test_stage, year, workweek, batch, day, line, bin, remarks, id_data, user_id, batch_id, sample_id, measurement_date, isc_a, voc_v, imp_a, vmp_v, pmp_w, ff_percent, efficiency_percent, rsh_ohm, rs_ohm, jsc_acm2, voc_vcell, jmp_acm2, vmp_vcell, pmp_wcm2, cell_efficiency_percent, rsh_ohmcm2, rs_ohmcm2, iload_a, vload_v, ffload_percent, pload_w, effload_percent,rsload_ohm, jload_acm2, vload_vcell, pload_wcm2, cell_effload_percent, rsload_ohmcm2, rs_modulation_ohmcm2, measured_temperature, total_test_time, pjmp_acm2, pvmp_vcell, ppmp_wcm2, pff_percent, pefficiency_percent, n_at_1_sun, n_at_110_suns, jo1_acm2, jo2_acm2, jo_facm2, est_bulk_lifetime, brr_hz, lifetime_at_vmp, doping_cm3, measured_resistivity_ohmcm, lifetime_fit_r2, max_intensity_suns, intensity_flash_cutoff_suns, v_at_isc_v, dvdt, v_pad_0_v, v_pad_1_v, v_pad_2_v, v_pad_3_v, v_pad_4_v, pmpe, resistivity_ohmcm, sample_type, thickness_cm, cell_area_cm2, total_area_cm2, num_of_cells_per_string, num_of_strings, temperature_c, intensity_suns, analysis_type, nominal_load_voltage_mvcell, rs_modulation_target_ohmcm2, reference_constant_vsun, voltage_temperature_coefficient_mvc, temperature_offset_c, power_per_sun_wm2, conductivity_modulation_ohmcm2v, auger_coefficent, auger_method, band_gap_narrowing, fit_method, carrier_density_center_point_cm3, percent_fit, lower_bond_cm3, upper_bond_cm3, rsh_lifetime_correction, rsh_measurement_method, sunsvoc_rsh_voltage_v, do_dark_break_measurement, temperature_measurement_method, number_of_drsh_points, drsh_output_vlimit_v, current_transfer, voltage_transfer, temperature_transfer, final_bin, bin_index, tester_id, do_doping_measurement, doping_sample_time, doping_measurement_length, measurement_type, comments, calibration, dbreak_v, dbreak_a, dark_break_interpolated, measurement_date_time_string, software_version, recipe_filename)',
                                values: [ACL72_clean]
                            },  (err, results) => {
                                if(err){return reject(err)};

                                resolve(results.insertID);
                            });

                            connection.release();

                        });

                    });
                }

                function rmpUploadHistory(upload_details){
                    return new Promise((resolve, reject) => {

                        mysql.getConnection((err, connection) => {
                            if(err){return reject(err)};
                            
                            connection.query({
                                sql: 'INSERT INTO rmp_upload_history (upload_date, worksheet_name, username)',
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