let records = [];
let kickoffTime = null;

// Define action categories and goal actions
const actionCategories = {
    "Corner": ["Corner"],
    "Shot": ["Shot off target", "Shot saved", "GOAL!", "Opp goal"],
    "Pass": ["Pass comp", "Opp pass comp"],
    "Tackle": ["Tackle", "Opp tackle"]
};

const goalActions = ["F3. GOAL!", "D. Opp goal"];

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
    const team = action.includes('Opp') ? 'Opposition' : 'SCI/RB';

    // Determine the "Pitch" value
    let pitch;
    if (action.startsWith('F3')) {
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
    const goals = goalActions.includes(action) ? 1 : 0;

    const record = {
        Action: action,
        Timestamp: timestamp.toLocaleString(),
        Team: team,
        Pitch: pitch,
        "Action Category": actionCategory,
        Goals: goals,
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
        alert('No data to download!');
        return;
    }

    const header = Object.keys(records[0]).join(',');
    const rows = records.map(record => {
        const action = `"${record.Action.replace(/"/g, '""')}"`;
        const timestamp = `"${record.Timestamp.replace(/"/g, '""')}"`;
        const team = `"${record.Team.replace(/"/g, '""')}"`;
        const pitch = `"${record.Pitch.replace(/"/g, '""')}"`;
        const actionCategory = `"${record["Action Category"].replace(/"/g, '""')}"`;
        const goals = record.Goals;
        const elapsed = record["Elapsed Time (min)"];
        return [action, timestamp, team, pitch, actionCategory, goals, elapsed].join(',');
    });
    const csvContent = [header, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
    downloadLink.setAttribute('download', `football_stats_${dateStr}.csv`);
    downloadLink.style.visibility = 'hidden';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Function to clear data
function clearData() {
    if (confirm('Are you sure you want to clear all recorded data?')) {
        records = [];
        kickoffTime = null;
        localStorage.removeItem('footballStatsRecords');
        localStorage.removeItem('kickoffTime');
        // Clear the table
        const tableBody = document.querySelector('#records-table tbody');
        tableBody.innerHTML = '';
        alert('Data cleared.');
    }
}

// Function to save records to localStorage
function saveRecordsToLocalStorage() {
    localStorage.setItem('footballStatsRecords', JSON.stringify(records));
    localStorage.setItem('kickoffTime', kickoffTime ? kickoffTime.toISOString() : null);
}

// Function to load records from localStorage
function loadRecordsFromLocalStorage() {
    const storedRecords = localStorage.getItem('footballStatsRecords');
    const storedKickoff = localStorage.getItem('kickoffTime');
    if (storedRecords) {
        records = JSON.parse(storedRecords);
        // Restore kickoffTime
        if (storedKickoff) {
            kickoffTime = new Date(storedKickoff);
        }
        renderTable(); // Render table after loading records
    }
}

// Attach event listeners to all action buttons
const actionButtons = document.querySelectorAll('.btn.blue, .btn.pink');
actionButtons.forEach(button => {
    button.addEventListener('click', handleButtonClick);
});

// Attach event listeners to download and clear buttons
document.getElementById('download-btn').addEventListener('click', downloadCSV);
document.getElementById('clear-btn').addEventListener('click', clearData);

// Load records from localStorage when the page loads
window.addEventListener('DOMContentLoaded', loadRecordsFromLocalStorage);