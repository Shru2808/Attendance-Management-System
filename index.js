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

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/Adminlogin", (req, res) => {
  res.render("Adminlogin");
});
app.get("/Adminregistration", (req, res) => {
  res.render("Adminregistration");
});

// app.get("/Emplogin", (req, res) => {
//   res.render("Emplogin");
// });

//Registration of new admin
app.get("/adminsignup", (req, res) => {
  const { Name, empid, email, pass, DOB, DOJ, Designation, Location } =
    req.query;

  // Check if empid already exists
  const selectQuery = "SELECT * FROM admin WHERE empid = ?";
  conn.query(selectQuery, [empid], (err, results) => {
    if (err) {
      console.log("Error checking empid:", err);
      res.status(500).send("Internal Server Error");
    } else {
      if (results.length > 0) {
        console.log("Empid already exists");
        res.status(409).send("Empid already exists");
      } else {
        // If empid doesn't exist, insert the new record
        const insertQuery = "INSERT INTO admin VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        conn.query(
          insertQuery,
          [Name, empid, email, pass, DOB, DOJ, Designation, Location],
          (err, result) => {
            if (err) {
              console.log("Error inserting data:", err);
              res.status(500).send("Internal Server Error");
            } else {
              console.log("Data inserted successfully");
              res.send("Data inserted successfully");
            }
          }
        );
      }
    }
  });
});

//Login of the admin
app.get("/alogin", async (req, res) => {
  const { email, empid, pass } = req.query;
  const sql = "select * from admin where email = ? and  empid = ? and pass = ?";
  const values = [email, empid, pass];
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

  // Validate empid (you can add more validation as needed)
  if (!empid || isNaN(empid)) {
    return res.status(400).json({ error: "Invalid or missing empid" });
  }

  const selectQuery = "SELECT * FROM addnewemp WHERE empid = ?";

  conn.query(selectQuery, [empid], (selectErr, selectResults) => {
    if (selectErr) {
      console.error("Error querying database:", selectErr);
      return res.status(500).json({ error: "Error querying database" });
    }

    if (selectResults.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    //console.log(selectResults);
    const selectedFields = Object.keys(req.body).filter((key) =>
      key.startsWith("employeeInfo")
    );
    console.log(selectedFields);
    if (selectedFields.length === 0) {
      // No fields selected for update
      return res.status(400).json({ error: "No fields selected for update" });
    }

    // Use parameterized queries to prevent SQL injection
    let updateQuery = "UPDATE addnewemp SET ";
    const updates = selectedFields.map(
      (field) => `${field.substring("employeeInfo_".length)} = ?`
    );
    const values = selectedFields.map((field) => req.body[field]);
    values.push(empid);

    updateQuery += updates.join(", ");
    updateQuery += " WHERE empid = ?";

    // Use a transaction if needed
    conn.beginTransaction((beginTransactionErr) => {
      if (beginTransactionErr) {
        console.error("Error starting transaction:", beginTransactionErr);
        return res.status(500).json({ error: "Error starting transaction" });
      }

      // Execute the update query
      conn.query(updateQuery, values, (updateErr, updateResults) => {
        if (updateErr) {
          console.error("Error updating records:", updateErr);
          // Rollback the transaction in case of an error
          conn.rollback(() => {
            res.status(500).json({ error: "Error updating records" });
          });
        } else {
          // Commit the transaction if the update is successful
          conn.commit((commitErr) => {
            if (commitErr) {
              console.error("Error committing transaction:", commitErr);
              res.status(500).json({ error: "Error committing transaction" });
            } else {
              console.log("Records updated successfully.");
              res.render("adminside");
            }
          });
        }
      });
    });
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

app.listen(4000, () => {
  console.log(`Connected 4000`);
});
