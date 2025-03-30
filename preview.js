document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const reportList = document.getElementById('reportList');
    const cleanedTablePreview = document.getElementById('cleanedTablePreview');
    const processingInfo = document.getElementById('processingInfo');
    const downloadBtn = document.getElementById('downloadBtn');

    // Get data from localStorage
    const cleanedData = JSON.parse(localStorage.getItem('cleanedData'));
    const report = JSON.parse(localStorage.getItem('cleaningReport'));
    const fileName = localStorage.getItem('fileName');
    const headers = JSON.parse(localStorage.getItem('headers'));

    if (!cleanedData || !headers) {
        alert('No cleaned data found. Please go back and clean a file first.');
        return;
    }

    // Display cleaning report
    if (report && report.length > 0) {
        report.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            reportList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No cleaning actions were applied';
        reportList.appendChild(li);
    }

    // Display preview table
    let tableHTML = '<table><thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Show first 50 rows for preview
    const previewRows = cleanedData.slice(0, 50);
    previewRows.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            if (value === null) value = '';
            tableHTML += `<td>${value}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    cleanedTablePreview.innerHTML = tableHTML;

    // Display processing info
    processingInfo.textContent = `Processed ${cleanedData.length} rows from ${fileName}`;

    // Download button event
    downloadBtn.addEventListener('click', function() {
        const format = document.querySelector('input[name="format"]:checked').value;
        downloadFile(cleanedData, headers, fileName, format);
    });
});

// Download the cleaned file
function downloadFile(data, headers, fileName, format) {
    const baseName = fileName.split('.').slice(0, -1).join('.');

    if (format === 'csv') {
        // Convert to CSV
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    let value = row[header] !== undefined ? row[header] : '';
                    // Escape quotes and wrap in quotes if contains commas
                    if (typeof value === 'string') {
                        value = value.replace(/"/g, '""');
                        if (value.includes(',')) {
                            value = `"${value}"`;
                        }
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${baseName}_cleaned.csv`);
        link.click();
    } else {
        // Convert to Excel
        const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Data');
        XLSX.writeFile(workbook, `${baseName}_cleaned.xlsx`);
    }
}
