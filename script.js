let records = [];
let kickoffTime = null;
let homeTeam = 'SCI/RB'; // Default home team name
let awayTeam = 'Opposition'; // Default away team name

const tableName = encodeURIComponent('importedtable'); // Replace with your actual table name
const airtableApiURL = `https://api.airtable.com/v0/appY3RNdiGxzA84qh/$importedtable`; // Ensure table name is included
const personalAccessToken = "pat12jZgoYwveFLLf.e56a5e026e66929f49efc3301792103ad5327b1dfa6b0bf32c097bb426effad4";  // Replace with your actual Personal Access Token

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

// Upload data to Airtable
function uploadDataToAirtable() {
    console.log("Preparing to upload match data to Airtable...");

    const matchData = {
        fields: {
            'Home Team': homeTeam,
            'Away Team': awayTeam,
            'Records': JSON.stringify(records) // Adjust this to your field name
        }
    };

    fetch(airtableApiURL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${personalAccessToken}`, // Correct variable name
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(matchData)
    })
    .then(response => {
        console.log("Response status:", response.status);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Data uploaded successfully:", data);
        alert("Data successfully uploaded to Airtable.");
    })
    .catch(error => {
        console.error("Error occurred while uploading data:", error);
        alert("Error uploading data: " + error.message);
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
    const index = event.target.getAttribute('data-index');
    records.splice(index, 1); // Remove the record from the array
    saveRecordsToLocalStorage(); // Save updated records to localStorage
    renderTable(); // Re-render the table
}

// Function to render the records table
function renderTable() {
    const tableBody = document.querySelector('#records-table tbody');
    tableBody.innerHTML = ''; // Clear the current table

    records.forEach((record, index) => {
        addRecordToTable(record, index);
    });
}

// Function to save records to localStorage
function saveRecordsToLocalStorage() {
    localStorage.setItem('matchRecords', JSON.stringify(records));
}

// Function to load records from localStorage
function loadRecordsFromLocalStorage() {
    const storedRecords = localStorage.getItem('matchRecords');
    if (storedRecords) {
        records = JSON.parse(storedRecords);
        renderTable(); // Render the loaded records
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadRecordsFromLocalStorage(); // Load existing records on page load
    document.querySelector('#upload-btn').addEventListener('click', uploadDataToAirtable); // Attach event listener for upload button
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', handleButtonClick); // Attach event listeners for action buttons
    });
    loadTeamNamesFromLocalStorage(); // Load team names from localStorage
});
