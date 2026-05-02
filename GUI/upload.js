const fileInput = document.getElementById('cv-file');
const fileMeta = document.getElementById('file-meta');
const analyzeButton = document.getElementById('analyze-btn');
const dropzone = document.getElementById('dropzone');

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
}

function updateFileState(file) {
    if (!file) {
        fileMeta.textContent = 'No file selected.';
        analyzeButton.disabled = true;
        dropzone.classList.remove('dropzone-active');
        return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
        fileMeta.textContent = 'Invalid file type. Please choose a PDF file.';
        analyzeButton.disabled = true;
        dropzone.classList.add('dropzone-error');
        return;
    }

    dropzone.classList.remove('dropzone-error');
    dropzone.classList.add('dropzone-active');
    analyzeButton.disabled = false;
    fileMeta.textContent = `Selected: ${file.name} (${formatBytes(file.size)})`;
}

fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files;
    updateFileState(file);
});

// Prevent real submission for mockup purposes.
document.querySelector('.upload-form').addEventListener('submit', (event) => {
    event.preventDefault();
    fileMeta.textContent = 'Mockup: CV received. Analysis would start here.';
});
