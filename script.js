let records = [];
let kickoffTime = null;
let homeTeam = 'SCI/RB'; // Default home team name
let awayTeam = 'Opposition'; // Default away team name

// Webhook URL for Zapier
const zapierWebhookURL = 'https://hooks.zapier.com/hooks/catch/20364053/2m7dixf/'; // Replace with your Zapier webhook URL

// Define action categories and goal actions 
const actionCategories = {
    "Corner": ["A. Corner", "D. Opp corner"],
    "Shot": ["A. Shot off target", "A. Shot saved", "A. GOAL!", "D. Opp shot off target", "D. Opp shot saved", "D. Opp goal"],
    "Pass": ["A. Pass comp", "A. Opp pass comp", "M. Pass comp", "M. Opp pass comp", "D. Pass comp", "D. Opp pass comp"],
    "Tackle": ["A. Tackle", "A. Opp tackle", "M. Tackle", "M. Opp tackle", "D. Tackle", "D. Opp tackle"],
    "Free kick": ["Free kick", "Opp free kick"]
};

const goalActions = ["A. GOAL!", "D. Opp goal"]; // Define goal actions

// Function to set team names
function setTeamNames() {
    const home = prompt('Enter My Team Name:', homeTeam);
    const away = prompt('Enter Opposition Team Name:', awayTeam);

    if (home && away) {
        homeTeam = home;
        awayTeam = away;
        saveTeamNamesToLocalStorage(); // Save to localStorage
        alert(`Team names set: Home - ${homeTeam}, Away - ${awayTeam}`);
    } else {
        alert('Please enter valid team names for both teams.');
    }
}

// Save team names to localStorage
function saveTeamNamesToLocalStorage() {
    localStorage.setItem('homeTeam', homeTeam);
    localStorage.setItem('awayTeam', awayTeam);
}

// Load team names from localStorage
function loadTeamNamesFromLocalStorage() {
    const storedHomeTeam = localStorage.getItem('homeTeam');
    const storedAwayTeam = localStorage.getItem('awayTeam');
    if (storedHomeTeam && storedAwayTeam) {
        homeTeam = storedHomeTeam;
        awayTeam = storedAwayTeam;
    }
}

// Function to upload match data to Zapier
function uploadDataToZapier() {
    // Log the data to be uploaded
    console.log("Preparing to upload match data: ", {
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        records: records
    });

    const matchData = {
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        records: records
    };

    // Perform the fetch request to Zapier webhook
    fetch(zapierWebhookURL, {
        method: 'POST',           // This tells it to use the POST method
        mode: 'cors',             // Ensures cross-origin is handled
        headers: {
            'Content-Type': 'application/json' // Content type is JSON
        },
        body: JSON.stringify(matchData) // Send the match data as a JSON string
    })
    .then(response => {
        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
            throw new Error("Network response was not ok. Status: " + response.status);
        }
        // Log the response from Zapier (just in case)
        console.log("Response from Zapier: ", response);
        return response.text(); // Convert the response to text for further handling
    })
    .then(data => {
        // Log the actual data returned by the server (should be confirmation message)
        console.log("Data returned from server: ", data);
        alert("Data successfully uploaded to Google Sheets via Zapier.");
    })
    .catch(error => {
        // Log any errors encountered during the fetch process
        console.error("Error occurred while uploading data: ", error);
        alert("There was an error uploading the data: " + error.message);
    });
}

// Function to handle button clicks
function handleButtonClick(event) {
    const action = event.target.getAttribute('data-action');
    const timestamp = new Date();

    // If this is the first action, set kickoffTime
    if (!kickoffTime) {
        kickoffTime = timestamp;
    }

    // Calculate elapsed time in minutes since kickoff
    const elapsedMs = timestamp - kickoffTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000); // Convert ms to minutes

    // Determine the "Team" value
    const team = action.includes('Opp') ? awayTeam : homeTeam;

    // Determine the "Pitch" value
    let pitch;
    if (action.startsWith('A.')) {
        pitch = 'Attack';
    } else if (action.startsWith('M.')) {
        pitch = 'Midfield';
    } else if (action.startsWith('D.')) {
        pitch = 'Defence';
    } else {
        pitch = ''; // In case of an unhandled action, leave it empty
    }

    // Determine the "Action Category"
    let actionCategory = '';
    for (const [category, keywords] of Object.entries(actionCategories)) {
        for (const keyword of keywords) {
            if (action.includes(keyword)) {
                actionCategory = category;
                break;
            }
        }
        if (actionCategory) break;
    }

    // Determine the "Goals" value
    let goals = goalActions.includes(action) ? 1 : 0;

    // New: Ask for goalscorer name if it's a goal action
    let goalscorer = '';
    if (goals > 0) {
        goalscorer = prompt('Enter the goalscorer\'s name:');
        if (!goalscorer) {
            goalscorer = 'Unknown'; // Fallback if user cancels or leaves blank
        }
    }

    // Create the record
    const record = {
        Action: action,
        Timestamp: timestamp.toLocaleString(),
        Team: team,
        Pitch: pitch,
        "Action Category": actionCategory,
        Goals: goals,
        Goalscorer: goalscorer, // Add goalscorer field
        "Elapsed Time (min)": elapsedMinutes
    };
    records.push(record);
    console.log(`Recorded: ${action} at ${timestamp.toLocaleString()}`);
    addRecordToTable(record);
    saveRecordsToLocalStorage();
}

// Function to add a record to the table with a delete button
function addRecordToTable(record, index = records.length - 1) {
    const tableBody = document.querySelector('#records-table tbody');
    const row = document.createElement('tr');

    const actionCell = document.createElement('td');
    actionCell.textContent = record.Action;
    row.appendChild(actionCell);

    const timestampCell = document.createElement('td');
    timestampCell.textContent = record.Timestamp;
    row.appendChild(timestampCell);

    const teamCell = document.createElement('td');
    teamCell.textContent = record.Team;
    row.appendChild(teamCell);

    const pitchCell = document.createElement('td');
    pitchCell.textContent = record.Pitch;
    row.appendChild(pitchCell);

    const actionCategoryCell = document.createElement('td');
    actionCategoryCell.textContent = record["Action Category"];
    row.appendChild(actionCategoryCell);

    const goalsCell = document.createElement('td');
    goalsCell.textContent = record.Goals;
    row.appendChild(goalsCell);

    const goalscorerCell = document.createElement('td'); // New goalscorer cell
    goalscorerCell.textContent = record.Goalscorer || ''; // Only show if it's a goal action
    row.appendChild(goalscorerCell);

    const elapsedCell = document.createElement('td');
    elapsedCell.textContent = record["Elapsed Time (min)"];
    row.appendChild(elapsedCell);

    // Add delete button
    const deleteCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-btn');
    deleteButton.setAttribute('data-index', index); // Set index for delete reference
    deleteButton.addEventListener('click', handleDeleteRow);
    deleteCell.appendChild(deleteButton);
    row.appendChild(deleteCell);

    tableBody.appendChild(row);
}

// Function to handle row deletion
function handleDeleteRow(event) {
    const index = event.target.getAttribute('data-index'); // Get index from data attribute
    if (index !== null && confirm('Are you sure you want to delete this row?')) {
        records.splice(index, 1); // Remove the record from the array
        saveRecordsToLocalStorage(); // Save updated records to localStorage
        renderTable(); // Re-render the table
    }
}

// Function to render the table (used after deleting a row)
function renderTable() {
    const tableBody = document.querySelector('#records-table tbody');
    tableBody.innerHTML = ''; // Clear the table
    records.forEach((record, index) => {
        addRecordToTable(record, index); // Re-populate the table with updated records
    });
}

// Function to download CSV
function downloadCSV() {
    if (records.length === 0) {
        alert('No data to download.');
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
        + "Action,Timestamp,Team,Pitch,Action Category,Goals,Goalscorer,Elapsed Time (min)\n" // CSV header
        + records.map(record => [
            record.Action,
            record.Timestamp,
            record.Team,
            record.Pitch,
            record["Action Category"],
            record.Goals,
            record.Goalscorer,
            record["Elapsed Time (min)"]
        ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "match_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Save records to localStorage
function saveRecordsToLocalStorage() {
    localStorage.setItem('matchRecords', JSON.stringify(records));
}

// Load records from localStorage
function loadRecordsFromLocalStorage() {
    const storedRecords = localStorage.getItem('matchRecords');
    if (storedRecords) {
        records = JSON.parse(storedRecords);
        renderTable(); // Render loaded records in the table
    }
}

// Add event listeners to buttons
document.querySelectorAll('.action-btn').forEach(button => {
    button.addEventListener('click', handleButtonClick);
});

// Upload button
document.getElementById('upload-btn').addEventListener('click', uploadDataToZapier);

// Load team names and records when the page is loaded
window.addEventListener('load', () => {
    loadTeamNamesFromLocalStorage(); // Load team names
    loadRecordsFromLocalStorage(); // Load match records
});
