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

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers(); // load the default active view
});
