document.addEventListener("DOMContentLoaded", async function () {
  const currentDateElement = document.getElementById("current-date");
  const employeeTableBody = document.querySelector("#employee-table tbody");

  // Set the current date
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split("T")[0];
  currentDateElement.value = formattedDate;

  try {
    // Fetch employees from the server
    const response = await fetch("/employees");
    const data = await response.json();

    data.forEach((employee) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${employee.name}</td>
        
        <td class="status-options-container">
          <select class="status-options" name="Attendance">
            <option value="" disabled selected>Select an option</option>
            <option value="Present">Present</option>
            <option value="Wfh">WFH</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Privilege Leave">Privilege Leave</option>
            <option value="Compensatory Leave">Compensatory Leave</option>
            <option value="Unpaid Leave">Unpaid Leave</option>
            <option value="Hfa">Half Day</option>
          </select>
        </td>
        <td>
          <button class="submit-button" data-employee="${employee.name}">Mark</button>
        </td>
      `;

      const submitButton = row.querySelector(".submit-button");
      submitButton.addEventListener("click", async function () {
        // Remove the row from the table
        const statusOptions = row.querySelector(".status-options");
        const attendanceStatus = statusOptions.value;
        row.remove();

        // Send a request to the server to record attendance status
        try {
          const markAttResponse = await fetch("/markatt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              empid: employee.empid,
              Name: employee.name,
              Date: formattedDate,
              Attendance: attendanceStatus,
            }),
          });
          try {
            if (!markAttResponse.ok) {
              // Check for HTTP error status
              throw new Error(`HTTP error! Status: ${markAttResponse.status}`);
            }

            const markAttData = await markAttResponse.json();
            console.log("Attendance recorded successfully:", markAttData);
          } catch (error) {
            console.error("Error recording attendance:", error.message);
          }
        } catch (error) {
          console.error("Error recording attendance:", error);
        }
      });

      // Append the row inside the forEach loop
      employeeTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
});
