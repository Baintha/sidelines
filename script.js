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
    fetch('https://hooks.zapier.com/hooks/catch/20364053/2mjhftg/', {
    method: 'POST',
    body: JSON.stringify(data) // Remove `Content-Type` header and rely on defaults
}).then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}).then(result => {
    console.log('Success:', result);
}).catch(error => {
    console.error('Error uploading data:', error);
});

// Add an event listener for the set team names button
document.getElementById('set-teams-btn').addEventListener('click', setTeamNames);

// Function to add an event listener to each action button
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const action = btn.getAttribute('data-action');
        const timestamp = new Date().toLocaleTimeString(); // Get the current time as a string
        const currentPitch = getCurrentPitch(action);
        const actionCategory = getActionCategory(action);
        const goals = checkGoals(action);
        const goalscorer = getGoalscorer(action);
        const elapsedTime = getElapsedTime();

        // Add the new record to the records array
        records.push({ action, timestamp, team: homeTeam, pitch: currentPitch, actionCategory, goals, goalscorer, elapsedTime });

        // Log the new record to the console
        console.log('New record added:', { action, timestamp, team: homeTeam, pitch: currentPitch, actionCategory, goals, goalscorer, elapsedTime });

        // Update the records table
        updateRecordsTable();
    });
});

// Function to get the current pitch based on the action
function getCurrentPitch(action) {
    if (action.startsWith('A.')) return 'Attack'; // Actions starting with A. are in the attack
    if (action.startsWith('M.')) return 'Midfield'; // Actions starting with M. are in the midfield
    if (action.startsWith('D.')) return 'Defence'; // Actions starting with D. are in the defence
    return 'Unknown'; // If the action doesn't match, return Unknown
}

// Function to get action category
function getActionCategory(action) {
    for (const category in actionCategories) {
        if (actionCategories[category].includes(action)) {
            return category; // Return the category name if found
        }
    }
    return 'Unknown'; // If not found, return Unknown
}

// Function to check if the action is a goal
function checkGoals(action) {
    return goalActions.includes(action) ? 1 : 0; // Return 1 if it's a goal action, otherwise 0
}

// Function to get the goalscorer if the action is a goal
function getGoalscorer(action) {
    if (action === 'A. GOAL!') {
        return prompt('Enter goalscorer name:'); // Prompt for goalscorer name
    }
    return ''; // Return an empty string if it's not a goal
}

// Function to get elapsed time (this is a placeholder; implement your own logic)
function getElapsedTime() {
    const currentTime = new Date();
    if (!kickoffTime) {
        kickoffTime = currentTime; // Set kickoff time on the first action
    }
    const elapsedTimeInMinutes = Math.floor((currentTime - kickoffTime) / 60000); // Calculate elapsed time in minutes
    return elapsedTimeInMinutes;
}

// Function to update the records table
function updateRecordsTable() {
    const tbody = document.querySelector('#records-table tbody');
    tbody.innerHTML = ''; // Clear the table body first
    records.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.action}</td>
            <td>${record.timestamp}</td>
            <td>${record.team}</td>
            <td>${record.pitch}</td>
            <td>${record.actionCategory}</td>
            <td>${record.goals}</td>
            <td>${record.goalscorer}</td>
            <td>${record.elapsedTime}</td>
            <td><button class="delete-btn" data-index="${index}">Delete</button></td>
        `;
        tbody.appendChild(row);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = btn.getAttribute('data-index');
            deleteRecord(index);
        });
    });
}

// Function to delete a record
function deleteRecord(index) {
    records.splice(index, 1); // Remove the record from the array
    updateRecordsTable(); // Update the table to reflect the deletion
}

// Event listener for download button
document.getElementById('download-btn').addEventListener('click', function () {
    const csvData = records.map(record => `${record.action},${record.timestamp},${record.team},${record.pitch},${record.actionCategory},${record.goals},${record.goalscorer},${record.elapsedTime}`).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'match_stats.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Event listener for clear data button
document.getElementById('clear-btn').addEventListener('click', function () {
    if (confirm('Are you sure you want to clear all data?')) {
        records = []; // Clear the records array
        updateRecordsTable(); // Update the table to reflect the clearing of data
    }
});

// Event listener for upload button
document.getElementById('upload-btn').addEventListener('click', uploadDataToZapier);

// Load team names from local storage when the page loads
loadTeamNamesFromLocalStorage();
