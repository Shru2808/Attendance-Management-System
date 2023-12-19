document.getElementById("updateForm").addEventListener("change", function () {
  updateInputFields();
});

function updateInputFields() {
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  var container = document.getElementById("inputFieldsContainer");

  checkboxes.forEach(function (checkbox) {
    var inputField = document.getElementById("employeeInfo_" + checkbox.value);

    if (checkbox.checked) {
      // If the checkbox is checked, show the associated input field
      if (!inputField) {
        // If the input field doesn't exist, create it
        inputField = document.createElement("input");
        inputField.type = "text";
        inputField.className = "form-control";
        inputField.id = "employeeInfo_" + checkbox.value;
        inputField.name = "employeeInfo_" + checkbox.value;
        inputField.placeholder = "Enter information for " + checkbox.value;
        container.appendChild(inputField);
      }
      inputField.style.display = "block";
    } else {
      // If the checkbox is unchecked, hide and clear the associated input field
      if (inputField) {
        inputField.style.display = "none";
        inputField.value = ""; // Clear the input field
      }
    }
  });
}

document
  .getElementById("updateForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    // Collect form data, including dynamically generated input fields
    var formData = new FormData(this);

    // Convert FormData to a plain object
    var formObject = {};
    formData.forEach(function (value, key) {
      formObject[key] = value;
    });

    // Log or process the collected form data
    console.log("Collected Form Data:", formObject);

    // Send the form data to the server using fetch or XMLHttpRequest
    fetch("/updaterecord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Server response:", data);
        // Optionally, handle the server response
      })
      .catch((error) => console.error("Error:", error));
  });

// Initial setup to create all potential input fields
updateInputFields();
