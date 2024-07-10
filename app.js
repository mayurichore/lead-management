const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
app.use(express.json());
app.use(cors());
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const schedule = require('node-schedule');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const csv = require('csv-parser');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'leads_management',
  port: 3306
});

db.connect((err) => {
  if (err) {
  console.log(err, 'error');
  }
  console.log('Database is connected');
   // sendMessage();
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
  const originalFilename = file.originalname;
  const uniqueFilename = `${Date.now()}-${originalFilename}`;
  req.imageFilename = uniqueFilename;
  cb(null, uniqueFilename);
  },
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.post('/new_company', upload.single('company_logo'), (req, res) => {
  console.log(req.body, 'createData');
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
  const company_name = req.body.company_name;
  const company_email = req.body.company_email;
  const company_mobile_no = req.body.company_mobile_no;
  const company_address = req.body.company_address;
  const reg_date = formattedDate;
  const payment = req.body.payment;
  const total_user = req.body.total_user;
  const contact_person = req.body.contact_person;
  const whatsapp_count = req.body.whatsapp_count;
  const profile = req.body.profile;
  const regDateObj = new Date(reg_date);
  regDateObj.setFullYear(regDateObj.getFullYear() + 1);
  const expire_date = regDateObj.toISOString().split('T')[0]; // Format to YYYY-MM-DD
  const company_logo = req.imageFilename;
  const leadSql = `INSERT INTO tb_company(company_name, company_logo, company_email, company_mobile_no, company_address, reg_date, expire_date, payment, total_user, contact_person, whatsapp_count, profile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    leadSql,
    [company_name, company_logo, company_email, company_mobile_no, company_address, reg_date, expire_date, payment, total_user, contact_person, whatsapp_count, profile],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Error inserting data' });
      } else {
      console.log(result, 'result');
      const leadId = result.insertId;
      transporter.sendMail({
      from: 'sednainfo5@gmail.com',
      to: company_email,
      subject: 'New Lead Added',
      html: `Your Company Registration has been successfully completed on our CRM portal dated ${reg_date}. Kindly, let us know when we can reach you again by replying to this email.`
      }, (error, info) => {
      if (error) {
      console.log('Error sending email:', error);
      } else {
      console.log('Email sent:', info.response);
      }
      });
      res.status(200).json({ success: true, message: 'Data inserted successfully' });
      }
    });
 });

app.get('/displaycompanydetails', (req, res) => {
let qr = `SELECT * FROM tb_company ORDER BY reg_date DESC`;
db.query(qr, (err, result) => {
  if (err) {
    console.log(err);
    res.status(500).send({
    message: 'Internal Server Error'
    });
  } else {
  if (result.length > 0) {
    res.send({
    message: 'Get all data',
    data: result
    });
  } else {
    res.send({
    message: 'Data not found',
    data: result
    });
  }
}
});
});

app.post('/register', (req, res) => {
  console.log(req.body, 'createData');
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
  const company_code = req.body.company_code;
  const reg_date = formattedDate;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const active = req.body.active;
  const user_right = req.body.user_right;
  const countUsersSql = `SELECT COUNT(*) AS total_users FROM tb_user WHERE company_code = ?`;
  db.query(countUsersSql, [company_code], (err, countResult) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: 'Error counting users' });
    } else {
    const totalUsers = countResult[0].total_users;
    const checkTotalUserSql = `SELECT total_user FROM tb_company WHERE company_code = ?`;
      db.query(checkTotalUserSql, [company_code], (err, totalUserResult) => {
        if (err) {
          console.log(err);
          res.status(500).json({ error: 'Error fetching total_user count' });
        } else {
          const totalUserCount = totalUserResult[0].total_user;
        if (totalUsers < totalUserCount) {
        const leadSql = `INSERT INTO tb_user(company_code, reg_date, username, email, password, active, user_right) VALUES (?, ?, ?, ?, ?, ?, ?)`; 
        db.query(leadSql, [company_code, reg_date, username, email, password, active, user_right], (err, result) => {
        if (err) {
        console.log(err);
        res.status(500).json({ error: 'Error inserting data' });
        } else {
        console.log(result, 'result');
        const leadId = result.insertId;
        transporter.sendMail({
        from: 'sednainfo5@gmail.com',
        to: email,
        subject: 'New Lead Added',
        html: `Your Registration has been successfully completed on our CRM portal dated ${reg_date}. Kindly, let us know when we can reach you again by replying to this email.`
        }, (error, info) => {
        if (error) {
        console.log('Error sending email:', error);
        } else {
        console.log('Email sent:', info.response);
        }
        });
        res.status(200).json({ success: true, message: 'Data inserted successfully' });
        }
        });
        } else {
        res.status(403).json({ error: `Only ${totalUserCount} users can be added` });
        }
      }
    });
  }
});
});

app.get('/users', (req, res) => {
  const companyCode = req.query.company_code; 
  const query = `SELECT * FROM tb_user WHERE company_code = ? `;
  db.query(query, [companyCode], (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results); 
    }
  });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const query = `SELECT u.*, c.company_name, c.company_logo FROM tb_user u
    INNER JOIN tb_company c ON u.company_code = c.company_code
    WHERE u.username = '${username}' AND u.password = '${password}' AND u.active = 'yes'`;
    db.query(query, (error, result) => {
        if (error) {
            console.log('Error querying database:', error);
            res.status(500).send('Error querying database');
        } else if (result.length === 0) {
          console.log('Invalid username or password');
          res.status(401).send('Invalid username or password');
      } else if (result[0].active !== 'yes') { // Check if user is active
          console.log('User is not active');
          res.status(403).send('User is not active');
      } else {
            const userData = {
                user_id: result[0].user_id,
                username: result[0].username,
                company_data: {
                    company_code: result[0].company_code,
                    company_name: result[0].company_name,
                    company_logo: result[0].company_logo,
                }
            };
            console.log('Login successful');
            res.status(200).send({
                message: 'Login successful',
                userData: userData
            });
          }
    });
});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sednainfo5@gmail.com',
    pass: 'lqlc evyc beti nroo'
  },
    debug: true 
  });
  const scheduleRule = '2 12 * * *'; 
  const job = schedule.scheduleJob(scheduleRule, function() {
  const currentDate = new Date();
  const nextFollowUp2Months = new Date();
  nextFollowUp2Months.setMonth(currentDate.getMonth() + 2);
  const nextFollowUp1Month = new Date();
  nextFollowUp1Month.setMonth(currentDate.getMonth() + 1);
  const nextFollowUp15Days = new Date();
  nextFollowUp15Days.setDate(currentDate.getDate() + 15);
    const query = `
      SELECT f.lead_id,f.email,l.personname,l.products,l.reg_date,f.nextfollow_up_by FROM tb_followup f INNER JOIN 
      tb_lead l ON f.lead_id = l.lead_id WHERE f.nextfollow_up_by BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 MONTH)
      OR f.nextfollow_up_by BETWEEN ? AND ? OR f.nextfollow_up_by BETWEEN ? AND ?`;
    db.query(query, [nextFollowUp1Month, nextFollowUp2Months, nextFollowUp15Days, nextFollowUp1Month], function(err, results) {
      if (err) {
        console.error('Error querying database:', err);
        return;
      }    
      results.forEach(function(result) {
        if (result.email) {
          const mailOptions = {
          from: 'sednainfo5@gmail.com',
          to: result.email,
          subject: 'Follow-up Reminder',
          html: `Hello <b>${result.personname}</b>,<br>
          &nbsp;&nbsp;&nbsp;This is the gentle reminder for your requirement regarding ${result.products} registered on our CRM portal dated ${result.reg_date}.
          Kindly, let us know when can we again reach you by replying on this email.<br><br>
          <b>Best regards,</b><br>
          <b>We offer other services as:</b><br>
          - Website Design<br>
          - Website Maintenance<br> 
          - Bulk Whatsapp<br>
          - Digital Marketing<br> 
          - Google PPC Campaign <br>
          - Instagram Marketing<br>
          - Cold Calling Services<br>
          - Logo Designing / Graphic / Catalogue / Brochure Designing<br>
          - CRM Software<br>
          - Mobile Application Development<br><br>
          <b>About Us</b>:- We are Mumbai based 18+ years old development company with 20+ professional team. To further know more visit following link:<br>
          Our Location:<br>
          https://maps.app.goo.gl/ae12TDTbGZ1jwZSa8 <br> 
          Our Video Profile:<br>
          https://youtu.be/YXRGP-dCz1M <br>
            
          Our Reviews:<br>
          https://g.page/r/CX7M8mMzDKqTEB0/review <br>
            
          Our Website:<br>
          https://www.sednainfosystems.com  <br><br>
                          
          Yours Sincerely,<br>
          Poonam Mishra<br>
          Sales Team | 9920432160`
          };
          transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              console.error('Error sending email:', error);
            } else {
              console.log('Email sent:', info.response);
              const insertQuery = `
                INSERT INTO tb_automail (lead_id, email, personname, products, reg_date, send_date)
                VALUES (?, ?, ?, ?, ?, NOW())`;
              const values = [result.lead_id, result.email, result.personname, result.products, result.reg_date];
              db.query(insertQuery, values, function(err, result) {
                if (err) {
                  console.error('Error inserting into tb_automail:', err);
                } else {
                  console.log('Inserted into tb_automail:', result);
                }
              });
            }
          });
        } else {
          console.error('Error sending email: No recipient defined');
        }
      });
    });
  });
 
app.post('/addlead', (req, res) => {
  console.log(req.body, 'createData');
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
  const username = req.body.username;
  const company_code = req.body.company_code;
  const reg_date = formattedDate;
  const companyname = req.body.companyname;
  const personname = req.body.personname;
  const email = req.body.email;
  const contactno = req.body.contactno;
  const city = req.body.city;
  const designation = req.body.designation;
  const address = req.body.address;
  const source = req.body.source;
  const products = req.body.products;
  const stage = req.body.stage;
  const reminder_status = req.body.reminder_status;
  const company_vertical = req.body.company_vertical;
  const nextfollow_up_by = req.body.nextfollow_up_by;
  const remark = req.body.remark;
  const leadSql = `INSERT INTO tb_lead(username, company_code, reg_date, companyname, personname, email, contactno, city, designation, address, source, products, stage, reminder_status, company_vertical, nextfollow_up_by, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const followUpSql = `INSERT INTO tb_followup(username, company_code, lead_id, personname, email, follow_up_time, nextfollow_up_by, stage, reminder_status, remark, entry_date) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, NOW())`;
  db.query(
    leadSql,
      [username, company_code, reg_date, companyname, personname, email, contactno, city, designation, address, source, products, stage, reminder_status, company_vertical, nextfollow_up_by, remark],
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Error inserting data' });
            } else {
                console.log(result, 'result');
                const leadId = result.insertId;
  db.query(
    followUpSql,
      [username, company_code, leadId, personname, email, nextfollow_up_by, stage, reminder_status, remark],
       (followUpErr, followUpResult) => {
      if (followUpErr) {
          console.log(followUpErr);
          res.status(500).json({ error: 'Error inserting data into tb_followup' });
      } else {
          console.log(followUpResult, 'followUpResult');
          transporter.sendMail({
              from: 'sednainfo5@gmail.com',
              to: email,
              subject: 'New Lead Added',
              html: `Your Registration has been successfully completed on our CRM portal dated ${reg_date} for ${products}. Kindly, let us know when we can reach you again by replying to this email.`
          }, (error, info) => {
              if (error) {
                  console.log('Error sending email:', error);
              } else {
                  console.log('Email sent:', info.response);
              }
          });
         res.status(200).json({ success: true, message: 'Data inserted successfully' });
      }
  }
);}
});
});
 
app.post('/exelupload', upload.single('file'), (req, res) => {
  const file = req.file; 
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  const leadColumns = ['username', 'company_code', 'lead_id', 'reg_date', 'companyname', 'personname', 'email', 'contactno', 'city', 'designation', 'address', 'source', 'products', 'stage', 'reminder_status', 'company_vertical', 'nextfollow_up_by', 'remark'];
  const followupColumns = ['username', 'company_code', 'lead_id', 'personname', 'email', 'nextfollow_up_by', 'stage', 'reminder_status', 'remark', 'entry_date', 'follow_up_time'];
  const leadValues = [];
  const followupValues = [];
  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', (data) => {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().slice(0, 10); 
      const formattedTime = currentDate.toLocaleTimeString(); 
      const leadId = generateLeadId(); 
      data.lead_id = leadId;
      data.reg_date = formattedDate;
      data.entry_date = formattedDate;
      data.follow_up_time = formattedTime;
      const leadData = leadColumns.map((column) => data[column]);
      const followupData = followupColumns.map((column) => data[column]);
      leadValues.push(leadData);
      followupValues.push(followupData);
    })
    .on('end', () => {
      const leadQuery = 'INSERT INTO tb_lead(username, company_code, lead_id, reg_date, companyname, personname, email, contactno, city, designation, address, source, products, stage, reminder_status, company_vertical, nextfollow_up_by, remark) VALUES ?';
      const followupQuery = 'INSERT INTO tb_followup(username, company_code, lead_id, personname, email, nextfollow_up_by, stage, reminder_status, remark, entry_date, follow_up_time) VALUES ?';
      db.query(leadQuery, [leadValues], (error, leadResults, fields) => {
        if (error) {
          console.error('Error inserting into tb_lead:', error);
          return res.status(500).send('Error inserting into tb_lead');
        }
        console.log('Inserted into tb_lead:', leadResults.affectedRows);
        const insertedLeadIds = [];
        for (let i = 0; i < leadResults.affectedRows; i++) {
          insertedLeadIds.push(leadResults.insertId + i);
        } 
        followupValues.forEach((followupData, index) => {
          followupData[2] = insertedLeadIds[index]; 
        });
        db.query(followupQuery, [followupValues], (error, followupResults, fields) => {
          if (error) {
            console.error('Error inserting into tb_followup:', error);
            return res.status(500).send('Error inserting into tb_followup');
          }
          console.log('Inserted into tb_followup:', followupResults.affectedRows);
          res.send('File uploaded successfully.');
        });
      });
    });
});
function generateLeadId() {
}


app.delete('/leaddelete/:lead_id', (req, res) => {
  const username = req.query.username;
  const lead_id = req.params.lead_id;
  if (!lead_id) {
    res.status(400).json({ error: 'Item ID is missing' });
    return;
  }  
  const selectSql = `
    SELECT 
      tb_lead.*, 
      tb_followup.stage, 
      tb_followup.nextfollow_up_by
    FROM 
      tb_lead
    LEFT JOIN 
      tb_followup ON tb_lead.lead_id = tb_followup.lead_id
    WHERE 
      tb_lead.lead_id = ?`;  
  db.query(selectSql, [lead_id], (selectErr, selectResult) => {
    if (selectErr) {
      console.error(selectErr);
      res.status(500).send('Error retrieving lead data');
      return;
    } 
    if (selectResult.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    const leadData = selectResult[0]; 
    const trash_date = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current date and time
    const insertSql = `
      INSERT INTO tb_trashlead (
        company_code, reg_date, lead_id, companyname, personname, email, contactno, city, designation, 
        address, source, products, stage, reminder_status, company_vertical, 
        nextfollow_up_by, remark, trash_date, username
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;    
    const insertValues = [
      leadData.company_code, leadData.reg_date, leadData.lead_id, leadData.companyname, leadData.personname, leadData.email, 
      leadData.contactno, leadData.city, leadData.designation, leadData.address, 
      leadData.source, leadData.products, leadData.stage, leadData.reminder_status, 
      leadData.company_vertical, leadData.nextfollow_up_by, leadData.remark, trash_date, username
    ];    
    db.query(insertSql, insertValues, (insertErr, insertResult) => {
      if (insertErr) {
        console.error(insertErr);
        res.status(500).send('Error inserting lead data into trash');
        return;
      }
      const deleteLeadSql = 'DELETE FROM tb_lead WHERE lead_id = ?';
      db.query(deleteLeadSql, [lead_id], (deleteLeadErr, deleteLeadResult) => {
        if (deleteLeadErr) {
          console.error(deleteLeadErr);
          res.status(500).send('Error deleting lead');
          return;
        }
        const deleteFollowUpSql = 'UPDATE tb_followup SET stage = NULL, nextfollow_up_by = NULL WHERE lead_id = ?';
        db.query(deleteFollowUpSql, [lead_id], (deleteFollowUpErr, deleteFollowUpResult) => {
          if (deleteFollowUpErr) {
            console.error(deleteFollowUpErr);
            res.status(500).send('Error deleting follow-up data');
            return;
          }
          res.status(200).json({ message: 'Lead deleted successfully' });
        });
      });
    });
  });
});

app.get('/displaytrashlead', (req, res) => {
  const companyCode = req.query.company_code;
  let qr = `
      SELECT 
          *
      FROM 
          tb_trashlead
      WHERE 
          company_code = ?
  `;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.send({
                  message: 'Fill Master table initially',
                  data: result
              });
          }
      }
  });
});

app.post('/restorelead/:lead_id', (req, res) => {
  const lead_id = req.params.lead_id; 
  const insertLeadQuery = `
    INSERT INTO tb_lead (company_code, reg_date, lead_id, companyname, personname, email, contactno, city, designation, 
      address, source, products, stage, reminder_status, company_vertical, nextfollow_up_by, remark)
    SELECT 
    company_code, reg_date, lead_id, companyname, personname, email, contactno, city, designation, 
      address, source, products, stage, reminder_status, company_vertical, 
      nextfollow_up_by, remark FROM tb_trashlead WHERE lead_id = ?;`; 
  const updateFollowUpQuery = `
  UPDATE tb_followup SET stage = (SELECT stage FROM tb_trashlead WHERE lead_id = ?),
      nextfollow_up_by = (SELECT nextfollow_up_by FROM tb_trashlead WHERE lead_id = ?)WHERE lead_id = ?;`;
  const deleteQuery = `
    DELETE FROM tb_trashlead
    WHERE lead_id = ?;`;  
  db.query(insertLeadQuery, [lead_id], (error, result) => {
    if (error) {
      console.error('Error restoring lead:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  db.query(updateFollowUpQuery, [lead_id, lead_id, lead_id], (error, result) => {
      if (error) {
        console.error('Error restoring follow-up data:', error);
      }
      db.query(deleteQuery, [lead_id], (error, result) => {
        if (error) {
          console.error('Error deleting lead from trash:', error);
        }
        res.json({ message: 'Lead restored successfully' });
      });
    });
  });
});


app.delete('/trashleaddelet/:id', (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'Item ID is missing' });
    return;
  }
  const sql = 'DELETE FROM tb_trashlead WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error deleting item');
    } else {
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'user not found' });
      } else {
        res.status(200).json({ message: 'user deleted successfully' });
      }
    }
  });
});


app.get('/displayproducts', (req, res) => {
  const companyCode = req.query.company_code;
  if (!companyCode) {
    return res.status(400).json({ error: 'Company code is required' });
  }
  let qr = `
      SELECT * FROM tb_products WHERE company_code = ? ORDER BY 
          product_name ASC; -- ASC for ascending order, DESC for descending order`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.send({
                  message: 'Fill Master table initially',
                  data: result
              });
          }
      }
  });
});

app.get('/displaysource', (req, res) => {
  const companyCode = req.query.company_code;
  if (!companyCode) {
    return res.status(400).json({ error: 'Company code is required' });
  }
  let qr = `
    SELECT * FROM tb_source
    WHERE company_code = ?
    ORDER BY source_name ASC`; 
  db.query(qr, [companyCode], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    if (result.length > 0) {
      res.json({
        message: 'Get all data',
        data: result
      });
    } else {
      res.status(404).json({
        message: 'No data found for the given company code'
      });
    }
  });
});


app.get('/displayprofile', (req, res) => {
  const companyCode = req.query.company_code;
  if (!companyCode) {
    return res.status(400).json({ error: 'Company code is required' });
  }
  let qr = `
      SELECT * FROM tb_profile  WHERE company_code = ? ORDER BY profile_name ASC; -- ASC for ascending order, DESC for descending order`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.status(404).send({
                  message: 'Fill Master table initially'
              });
          }
      }
  });
});

app.get('/displaybussiness', (req, res) => {
  const companyCode = req.query.company_code;
  if (!companyCode) {
    return res.status(400).json({ error: 'Company code is required' });
  }
  let qr = `SELECT * FROM tb_businesscategory WHERE company_code = ? ORDER BY category_name ASC; -- ASC for ascending order, DESC for descending order`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.status(404).send({
                  message: 'Fill Master table initially'
              });
          }
      }
  });
});

app.get('/displaystage', (req, res) => {
  const companyCode = req.query.company_code;
  if (!companyCode) {
    return res.status(400).json({ error: 'Company code is required' });
  }
  let qr = `
  SELECT * FROM tb_stage WHERE company_code = ? ORDER BY stage_name ASC; -- ASC for ascending order, DESC for descending order`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.status(404).send({
                  message: 'Fill Master table initially'
              });
          }
      }
  });
});

app.get('/displayreminder', (req, res) => {
  const companyCode = req.query.company_code;
  if (!companyCode) {
    return res.status(400).json({ error: 'Company code is required' });
  }
  let qr = `
      SELECT * FROM tb_reminder WHERE company_code = ? ORDER BY reminder_name ASC; -- ASC for ascending order, DESC for descending order`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.status(404).send({
                  message: 'Fill Master table initially'
              });
          }
      }
  });
});

app.get('/displayAlllead', (req, res) => {
  const companyCode = req.query.company_code; 
  let qr = `
      SELECT 
          tb_lead.lead_id,
          tb_lead.username, 
          tb_lead.personname,
          tb_lead.email, 
          tb_lead.companyname, 
          tb_lead.products, 
          tb_lead.contactno, 
          MAX(tb_followup.nextfollow_up_by) AS previous_month_follow_up,
          (SELECT nextfollow_up_by FROM tb_followup WHERE tb_followup.lead_id = tb_lead.lead_id AND status_id = (SELECT MAX(status_id) FROM tb_followup WHERE lead_id = tb_lead.lead_id)) AS next_month_follow_up,
          (SELECT stage FROM tb_followup WHERE tb_followup.lead_id = tb_lead.lead_id AND status_id = (SELECT MAX(status_id) FROM tb_followup WHERE lead_id = tb_lead.lead_id)) AS stage
      FROM 
          tb_lead
      INNER JOIN tb_followup ON tb_lead.lead_id = tb_followup.lead_id
      WHERE 
          tb_lead.company_code = ? 
          AND MONTH(tb_followup.nextfollow_up_by) BETWEEN MONTH(CURRENT_DATE()) - 1 AND MONTH(CURRENT_DATE()) + 2
      GROUP BY tb_lead.lead_id
      ORDER BY tb_lead.lead_id DESC;`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.send({
                  message: 'Data not found',
                  data: result
              });
          }
      }
  });
});

app.get('/displayAllleadby-statistics', (req, res) => {
  const companyCode = req.query.company_code; 
  let qr = `
      SELECT 
          tb_lead.lead_id,
          tb_lead.username, 
          tb_lead.personname,
          tb_lead.email,  
          tb_lead.companyname, 
          tb_lead.products, 
          tb_lead.contactno, 
          MAX(tb_followup.nextfollow_up_by) AS previous_month_follow_up,
          (SELECT nextfollow_up_by FROM tb_followup WHERE tb_followup.lead_id = tb_lead.lead_id AND status_id = (SELECT MAX(status_id) FROM tb_followup WHERE lead_id = tb_lead.lead_id)) AS next_month_follow_up,
          (SELECT stage FROM tb_followup WHERE tb_followup.lead_id = tb_lead.lead_id AND status_id = (SELECT MAX(status_id) FROM tb_followup WHERE lead_id = tb_lead.lead_id)) AS stage
      FROM 
          tb_lead
      INNER JOIN tb_followup ON tb_lead.lead_id = tb_followup.lead_id
      WHERE 
          tb_lead.company_code = ?    
      GROUP BY tb_lead.lead_id
      ORDER BY tb_lead.lead_id DESC;`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.send({
                  message: 'Data not found',
                  data: result
              });
          }
      }
  });
});


app.get('/getAlllead', (req, res) => {
  const companyCode = req.query.company_code;
  let qr = `SELECT * FROM tb_followup WHERE company_code = ?`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.send({
                  message: 'Data not found',
                  data: result
              });
          }
      }
  });
});




app.get('/leads', (req, res) => {
  const companyCode = req.query.company_code;
  let qr = `SELECT source, COUNT(*) as count FROM tb_lead WHERE company_code = ? GROUP BY source`;
  db.query(qr, [companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.send({
                  message: 'Data not found',
                  data: result
              });
          }
      }
  });
});

// // Route to fetch data from the database
// app.get('/leads', (req, res) => {
//   // Query to select data from tb_lead table
//   const query = 'SELECT source, COUNT(*) as count FROM tb_lead GROUP BY source';

//   // Execute the query
//   db.query(query, (err, results) => {
//     if (err) {
//       console.error('Error executing MySQL query: ', err);
//       res.status(500).json({ error: 'Internal Server Error' });
//       return;
//     }
//     res.json(results);
//   });
// });








app.get('/displayLead/:lead_id', (req, res) => {
  const lead_id = req.params.lead_id;
  console.log('Received request for Lead ID:', lead_id);
  let qr = 'SELECT * FROM tb_lead WHERE lead_id = ?';
  console.log('SQL Query:', qr);
  db.query(qr, [lead_id], (err, result) => {
    console.log('Query result:', result);
    if (err) {
      console.log(err);
      res.status(500).send({
        message: 'Internal Server Error',
        error: err
      });
    } else {
      if (result.length > 0) {
        res.send({
          message: 'Get single data',
          data: result[0]
        });
      } else {
        res.send({
          message: 'Data not found',
          data: null
        });
      }
    }
  });
});

app.put('/leadupdate/:lead_id', (req, res) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0];
  const lead_id  = req.params.lead_id;
  const {
  personname,
  companyname,
  email,
  contactno,
  city,
  designation,
  address,
  source,
  products,
  stage,
  reminder_status,
  company_vertical,
  nextfollow_up_by,
  remark
  } = req.body;
  const sql =
  'UPDATE tb_lead SET reg_date=?, personname=?, companyname=?, email=?, contactno=?, city=?, designation=?, address=?, source=?, products=?, stage=?, reminder_status=?, company_vertical=?, nextfollow_up_by=?, remark=?  WHERE lead_id = ?';
  db.query(sql, 
  [
    formattedDate,
    personname,
    companyname,
    email,
    contactno,
    city,
    designation,
    address,
    source,
    products,
    stage,
    reminder_status,
    company_vertical,
    nextfollow_up_by,
    remark,
    lead_id 
  ], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: 'Error updating data',
        error: err,
      });
    } else {
      console.log('SQL Result:', result);
      res.status(200).json({
        message: 'Data Updated',
        data: result,
      });
    }
  });
  });
  

app.post('/updatelead', (req, res) => {
  console.log(req.body, 'createData');
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0]; 
  const company_code = req.body.company_code;
  const lead_id = req.body.lead_id;
  const personname = req.body.personname;
  const email = req.body.email;
  const entry_date = formattedDate;
  const follow_up_time = req.body.follow_up_time;
  const nextfollow_up_by = req.body.nextfollow_up_by;
  const stage = req.body.stage;
  const OtherReason = req.body.OtherReason;
  const reminder_status = req.body.reminder_status;
  const remark = req.body.remark;
  const username = req.body.username; 
  const sqlInsert = `
    INSERT INTO tb_followup(company_code, lead_id, personname, email, entry_date, follow_up_time, nextfollow_up_by, stage, OtherReason, reminder_status, remark, username, followupcomplete) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sqlInsert,
    [company_code, lead_id, personname, email, entry_date, follow_up_time, nextfollow_up_by, stage, OtherReason, reminder_status, remark, username, 'Pending'], // Set 'Pending' instead of 'Done'
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Error inserting data' });
      } else {
        console.log('Data inserted successfully');
        const updateQuery = `
          UPDATE tb_followup AS t1
          JOIN (
            SELECT MAX(status_id) AS max_status_id
            FROM tb_followup
            WHERE lead_id = ? AND status_id <> (SELECT MAX(status_id) FROM tb_followup WHERE lead_id = ?)
          ) AS t2
          ON t1.status_id = t2.max_status_id
          SET t1.followupcomplete = 'Done'
          WHERE t1.lead_id = ?`;
        db.query(updateQuery, [lead_id, lead_id, lead_id], (updateErr, updateResult) => {
          if (updateErr) {
            console.error('Error updating followupcomplete column:', updateErr);
            res.status(500).json({ error: 'Error updating followupcomplete column' });
          } else {
            console.log('Follow-up complete column updated successfully');
            res.status(200).json({
              success: true,
              message: 'Data inserted successfully',
              lead_id: lead_id
            });
          }
        });
      }
    });
});

app.get('/displayfollowup/:lead_id', (req, res) => {
  const lead_id = req.params.lead_id;
  console.log('Received request for Lead ID:', lead_id);
  let qr = 'SELECT * FROM tb_followup WHERE lead_id = ? ORDER BY status_id DESC';
  console.log('SQL Query:', qr);
  db.query(qr, [lead_id], (err, result) => {
      console.log('Query result:', result);
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error',
              error: err
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get data for lead_id',
                  data: result
              });
          } else {
              res.send({
                  message: 'Data not found',
                  data: null
              });
          }
      }
  });
});

app.get('/followupbyedit/:status_id', (req, res) => {
const status_id = req.params.status_id;
console.log('Received request for Lead ID:', status_id);
let qr = 'SELECT * FROM tb_followup WHERE status_id = ? ';
console.log('SQL Query:', qr);
db.query(qr, [status_id], (err, result) => {
    console.log('Query result:', result);
    if (err) {
        console.log(err);
        res.status(500).send({
            message: 'Internal Server Error',
            error: err
        });
    } else {
        if (result.length > 0) {
            res.send({
                message: 'Get data for status_id',
                data: result
            });
        } else {
            res.send({
                message: 'Data not found',
                data: null
            });
        }
    }
});
});

app.put('/followupbyupdate/:status_id', (req, res) => {
const currentDate = new Date();
const formattedDate = currentDate.toISOString().split('T')[0];
const status_id = req.params.status_id;
const {
follow_up_time,
nextfollow_up_by,
stage,
reminder_status,
remark
} = req.body;
const sql =
'UPDATE tb_followup SET entry_date=?, follow_up_time=?, nextfollow_up_by=?, stage=?, reminder_status=?, remark=? WHERE status_id=?';
db.query(sql, 
[
  formattedDate,
  follow_up_time,
  nextfollow_up_by,
  stage,
  reminder_status,
  remark,
  status_id
], (err, result) => {
  if (err) {
    console.log(err);
    res.status(500).json({
      message: 'Error updating data',
      error: err,
    });
  } else {
    console.log('SQL Result:', result);
    res.status(200).json({
      message: 'Data Updated',
      data: result,
    });
  }
});
});

app.delete('/followupdelet/:status_id', (req, res) => {
const status_id = req.params.status_id;
if (!status_id) {
res.status(400).json({ error: 'Item ID is missing' });
return;
}
const sql = 'DELETE FROM tb_followup WHERE status_id = ?';
db.query(sql, [status_id], (err, result) => {
if (err) {
  console.log(err);
  res.status(500).send('Error deleting item');
} else {
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'user not found' });
  } else {
    res.status(200).json({ message: 'user deleted successfully' });
  }
}
});
});

app.get('/client/:personname', (req, res) => {
  const companyCode = req.query.company_code; // Retrieve company code from the logged-in user
  const personname = req.params.personname;
  const query = `SELECT * FROM tb_lead WHERE personname = ? AND company_code = ?`;
  db.query(query, [personname, companyCode], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ error: 'Client not found' });
      }
    }
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/companylogo', (req, res) => {
  const companyCode = req.query.company_code;

  const qr = `SELECT company_logo FROM tb_company WHERE company_code = ?`;
  db.query(qr, [companyCode], (err, result) => {
    if (err) {
      console.error('Error fetching company logo:', err);
      return res.status(500).send('Internal server error');
    }
    if (result.length === 0) {
      return res.status(404).send('Company not found');
    }
    const imagePath = path.join(__dirname, 'uploads', result[0].company_logo);
    res.sendFile(imagePath);
  });
});

app.post('/reset-password', (req, res) => {
  const email = req.body.email;
  const query = `SELECT * FROM tb_user WHERE email = ?`;
  db.query(query, [email], (error, results, fields) => {
  if (error) {
   console.error(error);
   res.status(500).send('Error occurred while checking email.');
   return;
  }
  if (results.length === 0) {
   res.status(404).send('Email not found.'); 
   return;
  }
  const userPassword = results[0].password;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: 'sednainfo5@gmail.com',
    pass: 'lqlc evyc beti nroo'
    }
    });
  const mailOptions = {
    from: 'sednainfo5@gmail.com',
    to: email,
    subject: 'Your Password',
    text: `Your password is: ${userPassword}. Please keep it secure and consider changing it for security reasons.`
    };
    transporter.sendMail(mailOptions, (emailError, info) => {
  if (emailError) {
    console.error('Email sending error:', emailError);
    res.status(500).json({ error: 'Error occurred while sending email.' });
    return;
  }
  console.log('Email sent: ' + info.response);
  res.json({ message: 'Password sent to your email.' });
  });
});
});
 
app.post('/send-email', (req, res) => {
  const { email } = req.body;
  const query = `SELECT personname, products, reg_date FROM tb_lead WHERE email = ?`;
  db.query(query, [email], (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching data');
    } else {
      if (results.length > 0) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'sednainfo5@gmail.com',
            pass: 'lqlc evyc beti nroo'
          }
        });
        const mailOptions = {
          from: 'sednainfo5@gmail.com',
          to: email,
          subject: 'Test Email',
          html: `Hello <b>${results[0].personname}</b>,<br>
            &nbsp;&nbsp;&nbsp;This is the gentle reminder for your requirement regarding ${results[0].products} registered on our CRM portal dated ${results[0].reg_date}.
            Kindly, let us know when can we again reach you by replying on this email.<br><br>
            <b>Best regards,</b><br>
            <b>We offer other services as:</b><br>
            - Website Design<br>
            - Website Maintenance<br> 
            - Bulk Whatsapp<br>
            - Digital Marketing<br> 
            - Google PPC Campaign <br>
            - Instagram Marketing<br>
            - Cold Calling Services<br>
            - Logo Designing / Graphic / Catalogue / Brochure Designing<br>
            - CRM Software<br>
            - Mobile Application Development<br><br>
            <b>About Us</b>:- We are Mumbai based 18+ years old development company with 20+ professional team. To further know more visit following link:<br>
            Our Location:<br>
            https://maps.app.goo.gl/ae12TDTbGZ1jwZSa8 <br>
            
            Our Video Profile:<br>
            https://youtu.be/YXRGP-dCz1M <br>
            
            Our Reviews:<br>
            https://g.page/r/CX7M8mMzDKqTEB0/review <br>
            
            Our Website:<br>
            https://www.sednainfosystems.com  <br><br>
                            
            Yours Sincerely,<br>
            Poonam Mishra<br>
            Sales Team | 9920432160`
        };
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Error sending email');
          } else {
            console.log('Email sent successfully:', info.response);
            res.status(200).send('Email sent successfully');
          }
        });
      } else {
        res.status(404).send('No data found for the provided email');
      }
    }
  });
});

app.get('/displayautoemail', (req, res) => {
  let qr = `
      SELECT 
          *
      FROM 
       tb_automail ORDER BY send_date DESC
  `;
  db.query(qr, (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error'
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get all data',
                  data: result
              });
          } else {
              res.send({
                  message: 'Fill Master table initially',
                  data: result
              });
          }
      }
  });
});

app.get('/notifications', (req, res) => {
  const currentDate = new Date().toISOString().split('T')[0];
  const companyCode = req.query.company_code; 
  let qr = `SELECT
          tb_lead.personname,
          tb_followup.nextfollow_up_by,
          tb_followup.follow_up_time FROM tb_followup JOIN tb_lead ON tb_followup.lead_id = tb_lead.lead_id WHERE
          DATE(tb_followup.nextfollow_up_by) = ? 
          AND tb_followup.followupcomplete <> 'done'
          AND tb_lead.company_code = ?;`;
  db.query(qr, [currentDate, companyCode], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error',
              error: err,
          });
      } else {
          res.json({ notifications: result });
      }
  });
});

function sendEmail(leadDetails) {
  if (!leadDetails || leadDetails.length === 0) {
    console.log('No lead details provided.');
    return;
  }
let emailText = `
<!DOCTYPE html>
<html>
<head>
  <style>
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid black;
      padding: 8px;
      text-align: center;
    }
    th {
      background-color: #264796;
      color: #fff;
    }
    
    tr:hover {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <h2>follow-up Details </h2>
  <table>
    <thead>
      <tr>
        <th>Lead ID</th>
        <th>Person Name</th>
        <th>Follow-up Time</th>
      </tr>
    </thead>
    <tbody>`;
leadDetails.forEach((lead) => {
  const formattedTime = formatFollowUpTime(lead.follow_up_time);
  emailText += `
      <tr>
        <td>${lead.lead_id}</td>
        <td>${lead.personname}</td>
        <td>${formattedTime}</td>
      </tr>`;
});
emailText += `
    </tbody>
  </table>
</body>
</html>`;
function formatFollowUpTime(time) {
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2].split('.')[0], 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
}
  const mailOptions = {
    from: 'sednainfo5@gmail.com',
    to: 'sednainfo5@gmail.com',
    subject: 'Todays Follow-up Reminder',
    html: emailText,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}
// Schedule the task to run daily at 11:50 AM
schedule.scheduleJob('42 14 * * *', () => {
  // Get the current date in MySQL format (YYYY-MM-DD)
  const currentDate = new Date().toISOString().slice(0, 10);
  // Query the database to check for entries with the current date in "nextfollow_up_by" column
  const sql = `SELECT * FROM tb_followup WHERE nextfollow_up_by = '${currentDate}'`;
  db.query(sql, (err, results) => {
    if (err) {
      console.log('Error querying database:', err);
    } else {
      if (results.length > 0) {
        // Send email with lead details if there are matching entries
        sendEmail(results);
      } else {
        console.log('No entries found for today.');
      }
    }
  });
});

app.get('/allfollowup/:lead_id', (req, res) => {
  const lead_id = req.params.lead_id;
  const query = `SELECT * FROM tb_followup WHERE lead_id = ? ORDER BY status_id DESC`;
  db.query(query, [lead_id], (error, results, fields) => {
      if (error) {
          console.error('Error fetching data from database:', error);
          res.status(500).json({ error: 'An internal server error occurred' });
          return;
      }
      if (results.length === 0) {
          res.status(404).json({ error: 'No data found for the specified lead ID' });
          return;
      }
      res.json(results); 
  });
});

app.get('/inpipelinecount', (req, res) => { 
  const companyCode = req.query.company_code; 
  const query = `
    SELECT COUNT(status_id) as count, stage
    FROM tb_followup
    WHERE stage IN ('Quotation Followup', 'Quotation High', 'Quotation To Send', 'Verbal Discussion')
    AND company_code = ?  
    GROUP BY stage;`;
  db.query(query, [companyCode], (err, results) => {
    if (err) {
      console.error('Error fetching stages count:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/underprocesscount', (req, res) => { 
  const companyCode = req.query.company_code;
  const query = `
  SELECT COUNT(status_id) as count, stage
  FROM tb_followup
  WHERE stage IN ('Order Received', 'Order Closed', 'Lead Cancel')
  AND company_code = ?  
  GROUP BY stage;`;
  db.query(query, [companyCode], (err, results) => {
    if (err) {
      console.error('Error fetching stages count:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/renewalcount', (req, res) => { 
  const companyCode = req.query.company_code;
  const query = `
  SELECT COUNT(status_id) as count, stage
  FROM tb_followup
  WHERE stage IN ('Renewal Follow Up', 'Invalid Lead', 'Other Reason')
  AND company_code = ?  
  GROUP BY stage;`;
  db.query(query, [companyCode], (err, results) => {
    if (err) {
      console.error('Error fetching stages count:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/invalidcount', (req, res) => { 
  const companyCode = req.query.company_code;
  const query = `
  SELECT COUNT(status_id) as count, stage
  FROM tb_followup
  WHERE stage IN ('Invoice Pending')
  AND company_code = ?  
  GROUP BY stage;`;
  db.query(query, [companyCode], (err, results) => {
    if (err) {
      console.error('Error fetching stages count:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/stagecount', (req, res) => {
  const selectedStage = req.query.stage; 
  const query = `
    SELECT COUNT(status_id) as count, stage
    FROM tb_followup
    WHERE stage = ?;`; 
  db.query(query, [selectedStage], (err, results) => {
    if (err) {
      console.error('Error fetching stages count:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/stageDetails', (req, res) => {
  const selectedStage = req.query.stage;
  const companyCode = req.query.company_code; 
  const query = `
    SELECT * 
    FROM tb_followup
    WHERE stage = ? AND company_code = ?;`; 
  db.query(query, [selectedStage, companyCode], (err, results) => {
    if (err) {
      console.error('Error fetching stage details:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

async function sendMessage(number, token) {
  if (number && !number.startsWith('91')) {
    number = '91' + number;
  }
  try {
    const url = 'https://int.chatway.in/api/send-msg';
    const params = {
      username: 'sedna', 
      number: number, 
      message: 'hii i am mayuri from sedna', 
      token: token 
    };
    const response = await axios.get(url, { params });
    console.log('Message sent successfully to', number);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Error sending message to', number, ':', error.response.data);
    } else {
      console.error('Error sending message to', number, ':', error.message);
    }
  }
}

function fetchContactNumbers() {
  return new Promise((resolve, reject) => {
    const currentDate = new Date().toISOString().slice(0, 10); 
    const query = `
      SELECT l.contactno, l.company_code
      FROM tb_lead l
      INNER JOIN tb_followup f ON l.lead_id = f.lead_id
      WHERE f.nextfollow_up_by = ?`;
    db.query(query, [currentDate], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
async function sendMessagesToLeads() {
  try {
    const contacts = await fetchContactNumbers();
    const promises = contacts.map(async (contact) => {
      const { contactno, company_code } = contact;
      const token = determineToken(company_code);
      await sendMessage(contactno, token);
    });
    await Promise.all(promises);
    console.log('All messages sent successfully');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    db.end(); 
  }
}

function determineToken(companyCode) {
  const tokens = {
    '1001': 'cVowZjZQZjEvNUFueExlaWIwZGpOdz09',
    '1002': 'cVowZjZQZjEvNUFueExlaWIwZGpOdz09'
  };
  return tokens[companyCode] || null;
}
// Schedule the main function to run at 12:50 PM every day
schedule.scheduleJob({ hour: 18, minute: 28 }, function() {
  console.log('Scheduled message sending job starting at 1:02 PM');
  sendMessagesToLeads();
});



app.get('/count', (req, res) => {
  const { month, company_code } = req.query;

  if (!month || !company_code) {
    console.error('Month or company_code parameter is missing');
    res.status(400).json({ error: 'Month or company_code parameter is missing' });
    return;
  }

  const [selectedMonth, selectedYear] = month.split('-');
  const startDate = `${selectedYear}-${selectedMonth}-01`;
  const endDate = `${selectedYear}-${selectedMonth}-31`;

  const query = `SELECT COUNT(*) AS leadCount FROM tb_lead WHERE company_code = ? AND reg_date >= ? AND reg_date <= ?`;
  db.query(query, [company_code, startDate, endDate], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err.stack);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    const leadCount = results[0].leadCount;
    res.json({ leadCount });
  });
});

app.get('/data', (req, res) => {
  const sortBy = req.query.sort_by;
  let tableName;

  if (sortBy === 'company_code') {
    const companyCode = req.query.company_code;
    tableName = getTableNameByCompanyCode(companyCode);
    if (!tableName) {
      res.status(400).json({ error: 'Invalid company_code' });
      return;
    }
  } else {
    switch (sortBy) {
      case 'source':
        tableName = 'tb_source';
        break;
      case 'products':
        tableName = 'tb_products';
        break;
      case 'stage':
        tableName = 'tb_stage';
        break;
      case 'profile':
        tableName = 'tb_profile';
        break;
      case 'business_category':
        tableName = 'tb_businesscategory';
        break;
      case 'reminder':
        tableName = 'tb_reminder';
        break;
      default:
        res.status(400).json({ error: 'Invalid sort_by parameter' });
        return;
    }
  }

  const query = `SELECT * FROM ${tableName} WHERE company_code = ?;`;
  db.query(query, [req.query.company_code], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Error fetching data' });
      return;
    }
    res.json(results);
  });
});

// Function to map company_code to table name
function getTableNameByCompanyCode(companyCode) {
  switch (companyCode) {
    case 'source':
      return 'tb_source'; 
    case 'products':
      return 'tb_products'; 
    case 'stage':
      return 'tb_stage';
    case 'profile':
      return 'tb_profile';
    case 'business_category':
      return 'tb_businesscategory';
    case 'reminder':
      return 'tb_reminder';
    default:
      return null; // Handle unknown company codes appropriately
  }
}


app.post('/insertdata', (req, res) => {
  const selectedOption = req.body.selectedOption;
  const inputValue = req.body.inputValue;
  const companyCode = req.body.company_code; // Adding company_code

  // Validate required fields
  if (!selectedOption || !inputValue || !companyCode) {
    res.status(400).json({ error: 'Please provide selectedOption, inputValue, and company_code in the request body' });
    return;
  }

  let tableName;
  let columnName;

  switch (selectedOption) {
    case 'source':
      tableName = 'tb_source';
      columnName = 'source_name';
      break;
    case 'products':
      tableName = 'tb_products';
      columnName = 'product_name';
      break;
    case 'stage':
      tableName = 'tb_stage';
      columnName = 'stage_name';
      break;
    case 'profile':
      tableName = 'tb_profile';
      columnName = 'profile_name';
      break;
    case 'business_category':
      tableName = 'tb_businesscategory';
      columnName = 'category_name';
      break;
    case 'reminder':
      tableName = 'tb_reminder';
      columnName = 'reminder_name';
      break;
    default:
      res.status(400).json({ error: 'Invalid selectedOption' });
      return;
  }

  const query = `INSERT INTO ${tableName} (${columnName}, company_code) VALUES (?, ?)`;
  db.query(query, [inputValue, companyCode], (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).json({ error: 'Error inserting data' });
      return;
    }
    res.status(200).json({ message: 'Data inserted successfully' });
  });
});

app.get('/:timeframe/:companyCode', (req, res) => {
  const { timeframe, companyCode } = req.params;
  let fromDate;
  switch (timeframe) {
    case 'last_one_month':
      fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
      break;
    case 'last_six_month':
      fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 6);
      break;
    case 'one_year':
      fromDate = new Date();
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    case 'all':
      break;
    default:
      return res.status(400).json({ error: 'Invalid timeframe' });
  }
  
  let query = 'SELECT * FROM tb_lead';
  const params = [];

  if (companyCode) {
    query += ' WHERE company_code = ?';
    params.push(companyCode);
  }

  if (fromDate) {
    if (params.length > 0) {
      query += ` AND reg_date >= '${fromDate.toISOString().split('T')[0]}'`;
    } else {
      query += ` WHERE reg_date >= '${fromDate.toISOString().split('T')[0]}'`;
    }
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(result);
  });
});

app.delete('/delete/:option/:id', (req, res) => {
  const option = req.params.option;
  const id = req.params.id;
  let tableName, columnName;
  switch (option) {
      case 'source':
          tableName = 'tb_source';
          columnName = 'id';
          break;
      case 'products':
          tableName = 'tb_products';
          columnName = 'id';
          break;
      case 'stage':
          tableName = 'tb_stage';
          columnName = 'id';
          break;
      case 'profile':
          tableName = 'tb_profile';
          columnName = 'id';
          break;
      case 'business_category':
          tableName = 'tb_businesscategory';
          columnName = 'id';
          break;
    case 'reminder':
          tableName = 'tb_reminder';
          columnName = 'id';
          break;
      default:
          return res.status(400).json({ error: 'Invalid option' });
  }
  const sql = `DELETE FROM ${tableName} WHERE ${columnName} = ?`;
  db.query(sql, [id], (err, results) => {
      if (err) {
          console.error('Error deleting item:', err);
          return res.status(500).json({ error: 'Error deleting item' });
      }
      res.status(200).json({ message: 'Item deleted successfully' });
  });
});


app.get('/useredit/:user_id', (req, res) => {
  const user_id  = req.params.user_id ;
  console.log('Received request for Lead ID:', user_id);
  let qr = 'SELECT * FROM tb_user WHERE user_id = ? ';
  console.log('SQL Query:', qr);
  db.query(qr, [user_id], (err, result) => {
      console.log('Query result:', result);
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error',
              error: err
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get data for status_id',
                  data: result
              });
          } else {
              res.send({
                  message: 'Data not found',
                  data: null
              });
          }
      }
  });
  });


  app.put('/userupdate/:user_id', (req, res) => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const user_id  = req.params.user_id ;
    const {
    company_code,
    username,
    email,
    password,
    active,
    reg_date,
    user_right
    } = req.body;
    const sql =
    'UPDATE tb_user SET company_code=?, username=?, email=?, password=?, active=?, reg_date=?, user_right=?  WHERE user_id = ?';
    db.query(sql, 
    [
      company_code,
      username,
      email,
      password,
      active,
      formattedDate,
      user_right,
      user_id 
    ], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({
          message: 'Error updating data',
          error: err,
        });
      } else {
        console.log('SQL Result:', result);
        res.status(200).json({
          message: 'Data Updated',
          data: result,
        });
      }
    });
    });
    
app.delete('/userdelet/:user_id', (req, res) => {
  const user_id = req.params.user_id;
  if (!user_id) {
  res.status(400).json({ error: 'Item ID is missing' });
  return;
  }
  const sql = 'DELETE FROM tb_user WHERE user_id = ?';
    db.query(sql, [user_id], (err, result) => {
    if (err) {
    console.log(err);
    res.status(500).send('Error deleting item');
    } else {
    if (result.affectedRows === 0) {
    res.status(404).json({ error: 'user not found' });
    } else {
    res.status(200).json({ message: 'user deleted successfully' });
    }
    }
  });
});


app.post('/insertSource', (req, res) => {
  const { source_name, company_code } = req.body;
  // Validate required fields
  if (!source_name || !company_code) {
    res.status(400).json({ message: 'Please provide both source_name and company_code' });
    return;
  }
  const sql = `INSERT INTO tb_source (source_name, company_code) VALUES (?, ?)`;
  db.query(sql, [source_name, company_code], (err, result) => {
    if (err) {
      console.error('Error inserting source:', err);
      res.status(500).json({ message: 'Error inserting source' });
    } else {
      console.log('Source inserted:', result);
      res.status(200).json({ message: 'Source inserted successfully' });
    }
  });
});

app.post('/insertStage', (req, res) => {
  const { stage_name, company_code } = req.body;
  if (!stage_name || !company_code) {
    res.status(400).json({ message: 'Please provide both stage_name and company_code' });
    return;
  }
  const sql = `INSERT INTO tb_stage (stage_name, company_code) VALUES (?, ?)`;
  db.query(sql, [stage_name, company_code], (err, result) => {
    if (err) {
      console.error('Error inserting source:', err);
      res.status(500).json({ message: 'Error inserting source' });
    } else {
      console.log('Source inserted:', result);
      res.status(200).json({ message: 'Source inserted successfully' });
    }
  });
});

app.post('/insertprofile', (req, res) => {
  const { profile_name, company_code } = req.body;
  if (!profile_name || !company_code) {
    res.status(400).json({ message: 'Please provide both profile_name and company_code' });
    return;
  }
  const sql = `INSERT INTO tb_profile (profile_name, company_code) VALUES (?, ?)`;
  db.query(sql, [profile_name, company_code], (err, result) => {
    if (err) {
      console.error('Error inserting source:', err);
      res.status(500).json({ message: 'Error inserting source' });
    } else {
      console.log('Source inserted:', result);
      res.status(200).json({ message: 'Source inserted successfully' });
    }
  });
});

app.post('/insertproducts', (req, res) => {
  const { product_name, company_code } = req.body;
  if (!product_name || !company_code) {
    res.status(400).json({ message: 'Please provide both product_name and company_code' });
    return;
  }
  const sql = `INSERT INTO tb_products (product_name, company_code) VALUES (?, ?)`;
  db.query(sql, [product_name, company_code], (err, result) => {
    if (err) {
      console.error('Error inserting source:', err);
      res.status(500).json({ message: 'Error inserting source' });
    } else {
      console.log('Source inserted:', result);
      res.status(200).json({ message: 'Source inserted successfully' });
    }
  });
});

app.post('/insertbussinesscategory', (req, res) => {
  const { category_name, company_code } = req.body;
  if (!category_name || !company_code) {
    res.status(400).json({ message: 'Please provide both category_name and company_code' });
    return;
  }
  const sql = `INSERT INTO tb_businesscategory (category_name, company_code) VALUES (?, ?)`;
  db.query(sql, [category_name, company_code], (err, result) => {
    if (err) {
      console.error('Error inserting source:', err);
      res.status(500).json({ message: 'Error inserting source' });
    } else {
      console.log('Source inserted:', result);
      res.status(200).json({ message: 'Source inserted successfully' });
    }
  });
});


app.post('/check-lead', (req, res) => {
  const { personname, company_code } = req.body;
  if (!personname || !company_code) {
    res.status(400).json({ error: 'Please provide both personname and company_code' });
    return;
  }
  const sql = `SELECT * FROM tb_lead WHERE personname = ? AND company_code = ?`;
  db.query(sql, [personname, company_code], (err, result) => {
    if (err) {
      console.error('Error checking lead:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (result.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  });
});

app.get('/products', (req, res) => {
  const query = `SELECT * FROM products`;
  db.query(query,  (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results); 
    }
  });
});

app.post('/addproducts', (req, res) => {
  console.log(req.body, 'createData');
  const name = req.body.name;
  const price = req.body.price;
  const category = req.body.category;
  const sqlInsert = `
    INSERT INTO products(name, price, category) 
    VALUES (?, ?, ?)`;
  db.query(
    sqlInsert,
    [name, price, category], // Set 'Pending' instead of 'Done'
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Error inserting data' });
      } else {
        console.log('Data inserted successfully');
      }
    });
});


app.get('/productedit/:id', (req, res) => {
  const id = req.params.id;
  console.log('Received request for Lead ID:', id);
  let qr = 'SELECT * FROM products WHERE id = ? ';
  console.log('SQL Query:', qr);
  db.query(qr, [id], (err, result) => {
      console.log('Query result:', result);
      if (err) {
          console.log(err);
          res.status(500).send({
              message: 'Internal Server Error',
              error: err
          });
      } else {
          if (result.length > 0) {
              res.send({
                  message: 'Get data for status_id',
                  data: result
              });
          } else {
              res.send({
                  message: 'Data not found',
                  data: null
              });
          }
      }
  });
  });

  app.put('/productupdate/:id', (req, res) => {
    const id  = req.params.id;
    const {
    name,
    price,
    category
    } = req.body;
    const sql =
    'UPDATE products SET name=?, price=?, category=?  WHERE id = ?';
    db.query(sql, 
    [
      name,
      price,
      category,
      id 
    ], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({
          message: 'Error updating data',
          error: err,
        });
      } else {
        console.log('SQL Result:', result);
        res.status(200).json({
          message: 'Data Updated',
          data: result,
        });
      }
    });
    });

    app.delete('/productdelet/:id', (req, res) => {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'Item ID is missing' });
        return;
      }
      const sql = 'DELETE FROM products WHERE id = ?';
      db.query(sql, [id], (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error deleting item');
        } else {
          if (result.affectedRows === 0) {
            res.status(404).json({ error: 'user not found' });
          } else {
            res.status(200).json({ message: 'user deleted successfully' });
          }
        }
      });
    });

const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });













   
  

 
 

  

    

    
   
















// IndiaMart API credentials
/*const indiaMartApiKey = 'mRyyEr1s5XbISPep5nyM7liHplPNmjhkWA==';
app.get('/apii/indiamart-leads', async (req, res) => {
    try {
        const response = await axios.get('https://seller.indiamart.com/messagecentre/', {
            headers: {
                'Authorization': `Bearer ${indiaMartApiKey}`
            }
        });
        const leads = response.data;
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




const cheerio = require('cheerio');

async function fetchLeads() {
    try {
        const apiKey = 'mRyyEr1s5XbISPep5nyM7liHplPNmjhkWA==';
        const url = 'https://seller.indiamart.com/bltxn/?pref=relevant';

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });

        const html = response.data; // HTML response

        // Load the HTML into cheerio
        const $ = cheerio.load(html);

        // Select the HTML elements containing the lead data and extract relevant information
        const leads = [];

        $('your-html-element-selector').each((index, element) => {
            const lead = {
                // Extract relevant data from the HTML element
                // For example:
                name: $(element).find('.lead-name').text(),
                email: $(element).find('.lead-email').text(),
                // Add more fields as needed
            };
            leads.push(lead);
        });

        // Convert leads array to JSON
        const leadsJSON = JSON.stringify(leads);

        console.log('Leads:', leadsJSON);

        return leadsJSON;
    } catch (error) {
        console.error('Error fetching leads:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Call the fetchLeads function
fetchLeads(); */
