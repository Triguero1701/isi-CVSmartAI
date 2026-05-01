const API_URL = 'http://127.0.0.1:5000/api/v1';

// Navigation Logic
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and views
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));

        // Add active class to clicked button
        button.classList.add('active');

        // Show corresponding view
        const targetId = button.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-view');

        // Auto-load data based on view
        if (targetId === 'users-view') loadUsers();
        if (targetId === 'skills-view') loadSkills();
        if (targetId === 'logs-view') loadLogs();
        if (targetId === 'history-view') loadHistory();
    });
});

// Format Date string helper
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
}

// Fetch and load Users
async function loadUsers() {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();
        
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No users found.</td></tr>';
            return;
        }

        data.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${user.id}</td>
                <td style="font-weight:600; color: #fff;">${user.name}</td>
                <td>${user.email}</td>
                <td><span style="color: var(--text-muted); font-size: 0.85rem">${formatDate(user.created_at)}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #f85149;">Error connecting to API. Is Flask running?</td></tr>`;
        console.error('Error fetching users:', error);
    }
}

// Fetch and load Skills
async function loadSkills() {
    const tbody = document.querySelector('#skills-table tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/skills`);
        const data = await response.json();
        
        tbody.innerHTML = '';
        data.forEach(skill => {
            const tr = document.createElement('tr');
            const categoryColor = skill.category === 'hard_skill' ? '#58a6ff' : '#a371f7';
            
            // Parse JSON aliases safely
            let aliases = '[]';
            try { aliases = JSON.parse(skill.aliases).join(', '); } catch { aliases = skill.aliases; }
            if(!aliases) aliases = 'None';

            tr.innerHTML = `
                <td>#${skill.id}</td>
                <td style="font-weight:600; color: #fff;">${skill.keyword}</td>
                <td><span style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; border-left: 2px solid ${categoryColor}; font-size: 0.8rem">${skill.category}</span></td>
                <td style="font-size: 0.85rem; color: var(--text-muted)">${aliases}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #f85149;">Error connecting to API. Is Flask running?</td></tr>`;
        console.error('Error fetching skills:', error);
    }
}

// Fetch and load Logs
async function loadLogs() {
    const tbody = document.querySelector('#logs-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/logs`);
        const data = await response.json();
        
        tbody.innerHTML = '';
        data.forEach(log => {
            const tr = document.createElement('tr');
            
            // Score styling mapping
            let scoreColor = '#3fb950'; // green
            if (log.compatibility_score < 50) scoreColor = '#f85149'; // red
            else if (log.compatibility_score < 75) scoreColor = '#d29922'; // yellow

            tr.innerHTML = `
                <td>#${log.id}</td>
                <td>${log.user_id ? `User #${log.user_id}` : '<span style="color:var(--text-muted)">Guest</span>'}</td>
                <td>
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <span style="color: ${scoreColor}; font-weight:600;">${log.compatibility_score}%</span>
                        <div style="width: 100px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow:hidden;">
                            <div style="width: ${log.compatibility_score}%; height: 100%; background: ${scoreColor};"></div>
                        </div>
                    </div>
                </td>
                <td style="font-size: 0.85rem;">${log.processing_time_ms} ms</td>
                <td><span style="color: var(--text-muted); font-size: 0.85rem">${formatDate(log.created_at)}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: #f85149;">Error connecting to API. Is Flask running?</td></tr>`;
        console.error('Error fetching logs:', error);
    }
}

// Fetch and load History
async function loadHistory() {
    const tbody = document.querySelector('#history-table tbody');
    const userIdInput = document.getElementById('history-user-id');
    let userId = userIdInput.value;
    if (!userId) userId = 1;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}/history`);
        const data = await response.json();
        
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No history found for this user.</td></tr>';
            return;
        }

        data.forEach(version => {
            const tr = document.createElement('tr');
            
            // Score styling mapping
            let scoreColor = '#3fb950'; // green
            if (version.compatibility_score < 50) scoreColor = '#f85149'; // red
            else if (version.compatibility_score < 75) scoreColor = '#d29922'; // yellow

            tr.innerHTML = `
                <td>#${version.version_id}</td>
                <td style="font-weight:bold; color: #fff;">v${version.version_number}</td>
                <td style="color: var(--text-muted);">${version.job_offer_title || 'Unknown Job'}</td>
                <td>
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <span style="color: ${scoreColor}; font-weight:600;">${version.compatibility_score}%</span>
                        <div style="width: 100px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow:hidden;">
                            <div style="width: ${version.compatibility_score}%; height: 100%; background: ${scoreColor};"></div>
                        </div>
                    </div>
                </td>
                <td><span style="color: var(--text-muted); font-size: 0.85rem">${formatDate(version.created_at)}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: #f85149;">Error connecting to API. Is Flask running?</td></tr>`;
        console.error('Error fetching history:', error);
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers(); // load the default active view
});

// ----------------- ANALYZE CV LOGIC -----------------

const dropzone = document.getElementById('cv-dropzone');
const fileInput = document.getElementById('cv-file');
const fileNameDisplay = document.getElementById('file-name-display');
const analyzeForm = document.getElementById('analyze-form');
const analyzeSubmitBtn = document.getElementById('analyze-submit-btn');

// Drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('dropzone-active'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('dropzone-active'), false);
});

dropzone.addEventListener('drop', (e) => {
    let dt = e.dataTransfer;
    let files = dt.files;
    if (files.length) {
        fileInput.files = files;
        updateFileName(files[0].name);
    }
});

// Click to upload
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        updateFileName(this.files[0].name);
    }
});

function updateFileName(name) {
    fileNameDisplay.textContent = "Selected: " + name;
    dropzone.classList.remove('dropzone-error');
}

// Form Submit
analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!fileInput.files || fileInput.files.length === 0) {
        dropzone.classList.add('dropzone-error');
        return;
    }

    const jobOfferText = document.getElementById('job-offer-text').value;
    const userId = document.getElementById('analyze-user-id').value;
    const file = fileInput.files[0];

    // Create form data
    const formData = new FormData();
    formData.append('cv_file', file);
    formData.append('job_offer_text', jobOfferText);
    if (userId) formData.append('user_id', userId);

    // Swap UI to loading state
    const originalBtnText = analyzeSubmitBtn.innerHTML;
    analyzeSubmitBtn.innerHTML = '<span class="dot" style="display:inline-block; margin-right:8px; background-color:#fff; box-shadow:none;"></span> Analyzing (Google AI)...';
    analyzeSubmitBtn.disabled = true;
    
    // Hide results if showing
    document.getElementById('analyze-results-panel').style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            renderAnalysisResults(data);
        } else {
            alert('Error analyzing CV: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error in analyze API:', error);
        alert('Connection error resolving API.');
    } finally {
        analyzeSubmitBtn.innerHTML = originalBtnText;
        analyzeSubmitBtn.disabled = false;
    }
});

function renderAnalysisResults(data) {
    // Show panel
    const panel = document.getElementById('analyze-results-panel');
    panel.style.display = 'flex';
    
    // 1. Score
    const score = data.compatibility_score;
    const scoreNum = document.getElementById('result-score-number');
    const scoreGauge = document.getElementById('result-score-gauge');
    
    let scoreColor = '#3fb950'; // green
    if (score < 50) scoreColor = '#f85149'; // red
    else if (score < 75) scoreColor = '#d29922'; // yellow
    
    scoreNum.textContent = `${score}%`;
    scoreNum.style.color = scoreColor;
    scoreGauge.style.background = `conic-gradient(${scoreColor} ${score}%, rgba(255,255,255,0.1) 0%)`;

    // 2. Extracted Text Preview
    document.getElementById('result-text-preview').textContent = data.extracted_text_preview || "No text extracted.";

    // 3. Matched Skills
    const matchedContainer = document.getElementById('result-matched-skills');
    matchedContainer.innerHTML = '';
    (data.analysis?.matched_skills || []).forEach(skill => {
        const badge = document.createElement('span');
        badge.textContent = skill;
        badge.style.cssText = 'background: rgba(63, 185, 80, 0.15); color: #3fb950; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(63, 185, 80, 0.2);';
        matchedContainer.appendChild(badge);
    });

    // 4. Missing Keywords
    const missingContainer = document.getElementById('result-missing-keywords');
    missingContainer.innerHTML = '';
    (data.analysis?.missing_keywords || []).forEach(skill => {
        const badge = document.createElement('span');
        badge.textContent = skill;
        badge.style.cssText = 'background: rgba(248, 81, 73, 0.15); color: #f85149; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(248, 81, 73, 0.2);';
        missingContainer.appendChild(badge);
    });

    // 5. Improvements
    const listContainer = document.getElementById('result-improvements');
    listContainer.innerHTML = '';
    (data.analysis?.priority_improvements || []).forEach(imp => {
        const li = document.createElement('li');
        li.textContent = imp;
        listContainer.appendChild(li);
    });
    
    // Smooth scroll down to results
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
