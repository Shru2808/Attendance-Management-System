
const express = require("express");
const excel = require("exceljs");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const conn = require("./conn").con;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
// app.use(cors);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/Adminlogin", (req, res) => {
  res.render("Adminlogin");
});
app.get("/adminregistration", (req, res) => {
  res.render("adminregistration");
});

// app.get("/Emplogin", (req, res) => {
//   res.render("Emplogin");
// });

//Login of the admin
app.get("/alogin", async (req, res) => {
  const { email, id, pass } = req.query;
  const sql = "select * from admin where email = ? and  id = ? and pass = ?";
  const values = [email, id, pass];
  conn.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error quering the database", +err.message);
      res.send("Error quering the database");
    } else {
      let qry1 = "select * from addnewemp";
      conn.query(qry1, (err, result) => {
        if (!err) {
          let qry2 = "select * from monitor";
          conn.query(qry2, (error, data) => {
            if (!error) {
              res.render("adminside", { cancleemp: result, attreport: data });
            } else {
              console.log(error);
            }
          });
        } else {
          console.log(err);
        }
      });
    }
  });
});

app.get("/addemp", async (req, res) => {
  try {
    const { name, empid, pass, DOJ, DOB, email, designation, place } =
      req.query;
    const qry = "INSERT INTO addnewemp VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [name, empid, pass, DOJ, DOB, email, designation, place];

    // Insert data into MySQL database
    conn.query(qry, values, async (err, results) => {
      if (err) {
        console.error(err);
        res.send("Error connecting database", err.message);
      } else {
        if (results.length > 0) {
          console.log("Employee already exists");
          res.render("adminside");
        } else {
          // Adding data into Excel
          // const exceljspath = "./emplist.xlsx";
          const workbook = new excel.Workbook();
          const emp = "./emplist.xlsx";

          await workbook.xlsx.readFile(emp);

          const worksheet = workbook.getWorksheet("List");
          const newRow = [
            name,
            empid,
            pass,
            DOJ,
            DOB,
            email,
            designation,
            place,
          ];
          worksheet.addRow(newRow);

          await workbook.xlsx.writeFile(emp);

          console.log("Excel sheet updated");
          res.send("Data inserted successfully");
        }
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/employees", (req, res) => {
  const sql = "SELECT empid, name FROM addnewemp";
  conn.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching employees:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.json(result);
    }
  });
});

app.post("/markatt", (req, res) => {
  const { empid, Name, Date, Attendance } = req.body;
  const qry =
    "INSERT INTO empattendance (empid, Name, Date, Attendance) VALUES (?, ?, ?, ?)";
  conn.query(qry, [empid, Name, Date, Attendance], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.render("adminside");
    }
  });
});
//Updating the values from the addnewemptable
app.post("/updaterecord", (req, res) => {
  const empid = req.body.empid;
  const selectQuery = "select * from addnewemp where empid = ?";
  conn.query(selectQuery, [empid], (selectErr, selectResults) => {
    if (!selectErr) {
      const selectedFields = Object.keys(req.body).filter((key) =>
        key.startsWith("employeeInfo")
      );

      let updateQuery = "UPDATE addnewemp SET ";
      const updates = [];

      selectedFields.forEach((field, index) => {
        updates.push(`${field.substring("employeeInfo_".length)} = ?`);
      });
      const values = selectedFields.map((field) => req.body[field]);
      values.push(empid);
      updateQuery += updates.join(", ");
      updateQuery += " WHERE empid = ?";
      // console.log(updateQuery);
      conn.query(updateQuery, values, (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Error updating records:", updateErr);
          res.status(500).json({ error: "Error updating records" });
        } else {
          console.log("Records updated successfully.");
          res.render("adminside");
        }
      });
    } else {
      console.log(selectErr);
      res.send("Error quering database");
    }
  });
});

//Delete the employee
app.get("/delemp/:empid", async (req, res) => {
  try {
    const empid = req.params.empid;
    let qry = "select * from addnewemp where empid=?";
    conn.query(qry, [empid], (err, result) => {
      if (!err) {
        let qry1 = "delete from addnewemp where empid=?";
        conn.query(qry1, [empid], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            res.send("deleted the data");
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

//Rejecting the leave of employee
// app.get("/delete/:empid", async (req, res) => {
//   try {
//     const empid = req.params.empid;
//     let qry = "delete from leaveappl where empid=?";
//     conn.query(qry, [empid], (err, results) => {
//       if (!err) {
//         res.send("deleted");
//       } else {
//         console.log(err);
//       }
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

//Accepting the leaves of the employees and then inserting them in new table and deleting them from previous table
// app.get("/accept/:empid", (req, res) => {
//   const empid = req.params.empid;
//   const { leavetype, noofdays, startdate, enddate } = req.body;
//   let qry1 =
//     "INSERT INTO acceptedleaves (empid, leavetype, noofdays, startdate, enddate) SELECT la.empid, la.leavetype, la.noofdays, la.startdate, la.enddate FROM leaveappl AS la";
//   conn.query(
//     qry1,
//     [empid, leavetype, noofdays, startdate, enddate],
//     (err, result) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send("Error accepting leave");
//       } else {
//         const qry2 = "delete from leaveappl where empid=?";
//         conn.query(qry2, [empid], (delerr, results) => {
//           if (delerr) {
//             console.error(err);
//             res.status(500).send("Error accepting leave");
//           } else {
//             res.render("adminside");
//           }
//         });
//       }
//     }
//   );
// });
// Adminside seeing the leaves calculated
// app.get("/calculateleaves", (req, res) => {
//   const empid = req.query.empid;
//   const sql =
//     "select empid, remaining_sick_leaves, remaining_paid_leaves from paidleavestatus where empid=?";
//   conn.query(sql, [empid], (err, results) => {
//     if (!err) {
//       if (results.length == 0) {
//         res.send("Employee not present in the paidleavestatus table");
//       } else {
//         res.render("search_results", { leaves: results });
//       }
//     } else {
//       res.send("Error quering database");
//       console.log(err);
//     }
//   });
// });

//Rendering the present monthly days.
// app.get("/monthlyreport", (req, res) => {
//   const empid = req.body;
//   const Name = req.body;

//   const qry =
//     "select * from monitorattendance where empid=? and year=? and month=?";
//   conn.query(qry, [empid, year, month], (err, results) => {
//     if (!err) {
//       if (results.length == 0) {
//         res.render("Empdashboard");
//       } else {
//         res.render("empmonitoratt", { monitoratt: results });
//       }
//     } else {
//       console.log(err);
//       res.send("Error quering database");
//     }
//   });
// });

// async function fetchDataFromDatabase(conn) {
//   try {
//     const [rows] = await conn.query("SELECT * FROM monitor");
//     return rows || [];
//   } catch (error) {
//     console.error("Error fetching data from the database:", error.message);
//     throw error; // Re-throw the error to be caught in the calling code
//   }
// }

app.post("/monthlyreport", async (req, res) => {
  try {
    const Month = req.body.Month;
    const sundaycount = req.body.sundaycount;
    const holiday = req.body.holiday;
    conn.beginTransaction(async (err) => {
      if (err) {
        console.error("Error beginning transaction", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      const qry =
        "update monitor set sundaycount = ? ,holiday = ? where Month = ?";
      conn.query(qry, [sundaycount, holiday, Month], async (err, results) => {
        if (err) {
          console.error("Error quering database", err);
          conn.rollback(() => {
            res.status(500).send("Internal Server Error");
          });
          return;
        }
        const sql = "SELECT * FROM monitor";

        conn.query(sql, async (err, results) => {
          const rows = results;
          if (!rows || rows.length === 0) {
            res.status(404).send("No data found");
            return;
          }
          // Create Excel workbook and worksheet
          const workbook = new excel.Workbook();
          const worksheet = workbook.addWorksheet("Monitor Data");

          // Add data to the worksheet
          worksheet.columns = [
            { header: "ID", key: "empid", width: 10 },
            { header: "Name", key: "Name", width: 30 },
            { header: "Present Days", key: "present_days", width: 15 },
            { header: "Half Day", key: "hfa", width: 15 },
            { header: "CL", key: "CL", width: 15 },
            { header: "SL", key: "SL", width: 15 },
            { header: "PL", key: "PL", width: 15 },
            { header: "Compoff", key: "Compoff", width: 15 },
            { header: "Unpaid Leave", key: "unpaid_leave", width: 15 },
            { header: "WFH", key: "wfh", width: 15 },
            { header: "Sunday Count", key: "sundaycount", width: 20 },
            {
              header: "Total Present Days",
              key: "total_present_days",
              width: 30,
            },
            {
              header: "Holidays",
              key: "holiday",
              width: 30,
            },
          ];

          worksheet.addRows(rows);

          // Set up the response headers
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=monthly-report.xlsx"
          );

          // Send the Excel file as a response
          conn.commit(() => {
            workbook.xlsx.write(res).then(() => {
              const deleteQuery = "DELETE FROM monitor";
              conn.query(deleteQuery, (err, results) => {
                if (err) {
                  console.error("Error deleting data from monitor table", err);
                  return;
                }
                console.log("Data deleted from monitor table");
              });
              res.end();
            });
          });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
//EMPLOYEE SIDE

//Login of the user
// app.get("/emp", (req, res) => {
//   const empid = req.query.empid;
//   const pass = req.query.pass;
//   const sql = "select * from addnewemp where empid=? and pass=?";

//   conn.query(sql, [empid, pass], (err, results) => {
//     if (err) {
//       console.error("Error quering the database", +err.message);
//       res.send("Error quering the database");
//     } else {
//       if (results.length > 0) {
//         let qry1 =
//           "select remaining_sick_leaves, remaining_paid_leaves from paidleavestatus where empid=?";
//         conn.query(qry1, [empid], (err, data) => {
//           const empid = results[0].empid;
//           if (!err) {
//             if (data.length == 0) {
//               res.render("Empdashboard", { empid });
//             } else {
//               res.render("Empdashboard", { leaves: data, empid: empid });
//             }
//           } else {
//             console.log(err);
//           }
//         });
//         //User authentication
//       } else {
//         res.send("Invalid id or passwrod"); //Autentication failed
//       }
//     }
//   });
// });

//Mark attendance of an employee
// app.post("/markattendance", async (req, res) => {
//   const { empid, Attendance, Location, Date } = req.body;
//   const qry = "insert into empattendance values (?,?,?,?)";
//   conn.query(qry, [empid, Attendance, Location, Date], (err, results) => {
//     if (!err) {
//       res.render("Empdashboard");
//     } else {
//       console.log(err);
//     }
//   });
// });

// //Leave Application for employee side
// app.post("/application", (req, res) => {
//   const { empid, leavetype, noofdays, startdate, enddate } = req.body;
//   const qry = "select * from leaveappl where empid=? and startdate";
//   const values = [empid, leavetype, noofdays, startdate, enddate];

//   conn.query(qry, [empid, startdate], (err, results) => {
//     if (err) {
//       console.log(err);
//     } else {
//       if (results.length > 0) {
//         res.render("Empdashboard");
//       } else {
//         let qry1 = "insert into leaveappl values (?,?,?,?,?)";
//         conn.query(qry1, values, (err, results) => {
//           if (err) {
//             console.log(err);
//           } else {
//             res.render("Empdashboard");
//           }
//         });
//       }
//     }
//   });
// });

app.listen(4000, () => {
  console.log(`Connected 4000`);
});


