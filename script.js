// Global variables
let rawData = [];
let headers = [];
let fileName = '';
let fileType = '';

// DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewSection = document.getElementById('previewSection');
const tablePreview = document.getElementById('tablePreview');
const optionsSection = document.getElementById('optionsSection');
const cleanBtn = document.getElementById('cleanBtn');
const columnFormatsSection = document.getElementById('columnFormatsSection');
const columnFormatControls = document.getElementById('columnFormatControls');
const handleEmptyValues = document.getElementById('handleEmptyValues');
const emptyValueReplacement = document.getElementById('emptyValueReplacement');
const removeSpecialChars = document.getElementById('removeSpecialChars');
const specialCharsColumns = document.getElementById('specialCharsColumns');

// Event listeners
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
cleanBtn.addEventListener('click', processAndCleanData);
handleEmptyValues.addEventListener('change', function() {
  const container = document.getElementById('emptyValueContainer');
  container.style.display = this.checked ? 'block' : 'none';
  emptyValueReplacement.disabled = !this.checked;
});
// Update the event listener for removeSpecialChars checkbox
removeSpecialChars.addEventListener('change', function() {
    const container = document.getElementById('specialCharsContainer');
    container.style.display = this.checked ? 'block' : 'none';
    if (this.checked) {
        specialCharsColumns.style.display = 'block';
    }
});

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
}

// Process the uploaded file
function processFile(file) {
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds 50MB limit. Please choose a smaller file.');
        return;
    }

    fileName = file.name;
    fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'csv') {
        parseCSV(file);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
        parseExcel(file);
    } else {
        alert('Unsupported file type. Please upload a CSV or Excel file.');
    }
}

// Parse CSV file
function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data.length === 0) {
                alert('The file appears to be empty or could not be parsed.');
                return;
            }

            rawData = results.data;
            headers = results.meta.fields || Object.keys(results.data[0]);
            displayPreview();
        },
        error: function(error) {
            alert('Error parsing CSV file: ' + error.message);
        }
    });
}

// Parse Excel file
function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length === 0) {
            alert('The Excel sheet appears to be empty.');
            return;
        }

        headers = jsonData[0];
        rawData = jsonData.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] !== undefined ? row[i] : '';
            });
            return obj;
        });

        displayPreview();
    };
    reader.readAsArrayBuffer(file);
}

// Display file preview
function displayPreview() {
    // Show preview section
    previewSection.style.display = 'block';
    optionsSection.style.display = 'block';

    // Create table
    let tableHTML = '<table><thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Show first 10 rows for preview
    const previewRows = rawData.slice(0, 10);
    previewRows.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<td>${row[header] !== undefined ? row[header] : ''}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    tablePreview.innerHTML = tableHTML;

    // Create column format controls
    createColumnFormatControls();

    // Populate special characters columns dropdown
    specialCharsColumns.innerHTML = '';
    headers.forEach(header => {
        if (!header.toLowerCase().includes('email')) {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            option.selected = true;
            specialCharsColumns.appendChild(option);
        }
    });
}

// Create column format controls
function createColumnFormatControls() {
    columnFormatControls.innerHTML = '';

    headers.forEach((header, index) => {
        const div = document.createElement('div');
        div.className = 'format-control';

        const label = document.createElement('label');
        label.textContent = header;
        label.htmlFor = `format-${index}`;
        label.className = 'format-label';

        const select = document.createElement('select');
        select.id = `format-${index}`;
        select.name = `format-${index}`;
        select.className = 'format-select';

        const options = [
            { value: 'auto', text: 'Auto-detect' },
            { value: 'text', text: 'Text' },
            { value: 'number', text: 'Number' },
            { value: 'date', text: 'Date' }
        ];

        options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.text;
            select.appendChild(optElement);
        });

        // Date format dropdown (hidden by default)
        const dateFormatDiv = document.createElement('div');
        dateFormatDiv.id = `date-format-${index}`;
        dateFormatDiv.className = 'option-extra';
        dateFormatDiv.style.display = 'none';

        const dateFormatLabel = document.createElement('label');
        dateFormatLabel.textContent = 'Date format: ';
        dateFormatLabel.htmlFor = `date-format-select-${index}`;

        const dateFormatSelect = document.createElement('select');
        dateFormatSelect.id = `date-format-select-${index}`;
        dateFormatSelect.name = `date-format-select-${index}`;

        const dateFormats = [
            { value: 'yyyy-mm-dd', text: 'YYYY-MM-DD' },
            { value: 'mm/dd/yyyy', text: 'MM/DD/YYYY' },
            { value: 'dd/mm/yyyy', text: 'DD/MM/YYYY' },
            { value: 'mm-dd-yyyy', text: 'MM-DD-YYYY' },
            { value: 'yyyy/mm', text: 'YYYY/MM' },
            { value: 'mm/yyyy', text: 'MM/YYYY' },
            { value: 'yyyy-mm', text: 'YYYY-MM' },
            { value: 'mm-yyyy', text: 'MM-YYYY' }
        ];

        dateFormats.forEach(format => {
            const opt = document.createElement('option');
            opt.value = format.value;
            opt.textContent = format.text;
            dateFormatSelect.appendChild(opt);
        });

        dateFormatDiv.appendChild(dateFormatLabel);
        dateFormatDiv.appendChild(dateFormatSelect);

        // Show/hide date format dropdown when date is selected
        select.addEventListener('change', function() {
            dateFormatDiv.style.display = this.value === 'date' ? 'block' : 'none';
        });

        div.appendChild(label);
        div.appendChild(select);
        div.appendChild(dateFormatDiv);
        columnFormatControls.appendChild(div);
    });
}

// Process and clean the data
function processAndCleanData() {
    const cleaningOptions = {
        removeDuplicates: document.getElementById('removeDuplicates').checked,
        trimWhitespace: document.getElementById('trimWhitespace').checked,
        removeSpecialChars: document.getElementById('removeSpecialChars').checked,
        specialCharsColumns: Array.from(document.getElementById('specialCharsColumns').selectedOptions).map(opt => opt.value),
        handleEmptyValues: document.getElementById('handleEmptyValues').checked,
        emptyValueReplacement: document.getElementById('emptyValueReplacement').value,
        removeExtraSpaces: document.getElementById('removeExtraSpaces').checked
    };

    // Get column formats
    const columnFormats = {};
    const columnDateFormats = {};
    headers.forEach((header, index) => {
        const select = document.getElementById(`format-${index}`);
        columnFormats[header] = select.value;

        if (select.value === 'date') {
            const dateFormatSelect = document.getElementById(`date-format-select-${index}`);
            columnDateFormats[header] = dateFormatSelect.value;
        }
    });

    // Start processing
    let cleanedData = [...rawData];
    let report = [];

    // Remove duplicates
    if (cleaningOptions.removeDuplicates) {
        const beforeCount = cleanedData.length;
        cleanedData = removeDuplicates(cleanedData);
        const afterCount = cleanedData.length;
        const removed = beforeCount - afterCount;
        if (removed > 0) {
            report.push(`Removed ${removed} duplicate rows`);
        }
    }

    // Apply column formats
    cleanedData = applyColumnFormats(cleanedData, columnFormats, columnDateFormats, report);

    // Trim whitespace
    if (cleaningOptions.trimWhitespace) {
        cleanedData = cleanedData.map(row => {
            const newRow = {};
            for (const key in row) {
                if (typeof row[key] === 'string') {
                    newRow[key] = row[key].trim();
                } else {
                    newRow[key] = row[key];
                }
            }
            return newRow;
        });
        report.push('Trimmed whitespace from all columns');
    }

    // Remove special characters from selected columns
    if (cleaningOptions.removeSpecialChars && cleaningOptions.specialCharsColumns.length > 0) {
        cleanedData = cleanedData.map(row => {
            const newRow = {};
            for (const key in row) {
                if (cleaningOptions.specialCharsColumns.includes(key) && typeof row[key] === 'string') {
                    newRow[key] = row[key].replace(/[^\w\s]/gi, '');
                } else {
                    newRow[key] = row[key];
                }
            }
            return newRow;
        });
        report.push(`Removed special characters from: ${cleaningOptions.specialCharsColumns.join(', ')}`);
    }

    // Handle empty values
    if (cleaningOptions.handleEmptyValues && cleaningOptions.emptyValueReplacement) {
        const replacement = cleaningOptions.emptyValueReplacement;
        cleanedData = cleanedData.map(row => {
            const newRow = {};
            for (const key in row) {
                if (row[key] === null || row[key] === undefined || row[key] === '') {
                    newRow[key] = replacement;
                } else {
                    newRow[key] = row[key];
                }
            }
            return newRow;
        });
        report.push(`Replaced empty values with "${replacement}"`);
    }

    // Remove extra spaces between words
    if (cleaningOptions.removeExtraSpaces) {
        cleanedData = cleanedData.map(row => {
            const newRow = {};
            for (const key in row) {
                if (typeof row[key] === 'string') {
                    newRow[key] = row[key].replace(/\s+/g, ' ');
                } else {
                    newRow[key] = row[key];
                }
            }
            return newRow;
        });
        report.push('Removed extra spaces between words');
    }

    // Store cleaned data and report for the preview page
    localStorage.setItem('cleanedData', JSON.stringify(cleanedData));
    localStorage.setItem('cleaningReport', JSON.stringify(report));
    localStorage.setItem('fileName', fileName);
    localStorage.setItem('headers', JSON.stringify(headers));

    // Open preview in new tab
    window.open('preview.html', '_blank');
}

// Remove duplicate rows
function removeDuplicates(data) {
    const uniqueKeys = new Set();
    return data.filter(row => {
        const key = JSON.stringify(row);
        if (uniqueKeys.has(key)) {
            return false;
        }
        uniqueKeys.add(key);
        return true;
    });
}

// Apply column formats
// Modified applyColumnFormats() function:
function applyColumnFormats(data, formats, dateFormats, report) {
    const formatChanges = {};
    const dateValidationErrors = [];

    const result = data.map(row => {
        const newRow = {};
        for (const key in row) {
            const format = formats[key] || 'auto';
            const value = row[key];

            if (format === 'auto') {
                newRow[key] = value;
                continue;
            }

            try {
                if (format === 'number') {
                    // ... (existing number formatting code)
                } else if (format === 'date') {
                    const dateFormat = dateFormats[key] || 'yyyy-mm-dd';
                    const date = new Date(value);

                    // Skip empty values
                    if (!value) {
                        newRow[key] = value;
                        continue;
                    }

                    // Validate date
                    if (isNaN(date.getTime())) {
                        dateValidationErrors.push(key);
                        newRow[key] = value; // Keep original value
                        continue;
                    }

                    // Format the date
                    let formattedDate;
                    const month = (date.getMonth()+1).toString().padStart(2, '0');
                    const year = date.getFullYear();

                    switch (dateFormat) {
                        // ... existing date cases ...
                        case 'yyyy/mm':
                            formattedDate = `${year}/${month}`;
                            break;
                        case 'mm/yyyy':
                            formattedDate = `${month}/${year}`;
                            break;
                        case 'yyyy-mm':
                            formattedDate = `${year}-${month}`;
                            break;
                        case 'mm-yyyy':
                            formattedDate = `${month}-${year}`;
                            break;
                        default:
                            formattedDate = date.toISOString().split('T')[0];
                    }
                    newRow[key] = formattedDate;
                    formatChanges[key] = `date (${dateFormat})`;
                } else {
                    newRow[key] = value;
                }
            } catch (e) {
                newRow[key] = value;
            }
        }
        return newRow;
    });

    // Show error if date validation failed
    if (dateValidationErrors.length > 0) {
        const uniqueErrors = [...new Set(dateValidationErrors)];
        alert(`These columns contain non-date values but were marked as date:\n\n${uniqueErrors.join(', ')}\n\nPlease check your column format selections.`);
    }

    // Add format changes to report
    for (const key in formatChanges) {
        report.push(`Formatted ${key} as ${formatChanges[key]}`);
    }

    return result;
}

// Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Check saved preference or system preference
const currentTheme = localStorage.getItem('theme') ||
                     (prefersDarkScheme.matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', currentTheme);

// Toggle function
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  const newTheme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});
