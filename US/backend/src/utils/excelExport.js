'use strict';

const XLSX = require('xlsx');

/**
 * Format data rows according to column configurations
 * @param {Array} data Array of objects
 * @param {Array<{key: string, header: string}>} columns Column definitions
 * @returns {Array<Object>} Formatted rows with header keys
 */
function mapDataToColumns(data, columns) {
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const formatted = {};
    for (const col of columns) {
      formatted[col.header] = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '';
    }
    return formatted;
  });
}

/**
 * Export data to Excel workbook buffer
 * @param {Array} data
 * @param {Array<{key: string, header: string}>} columns
 * @param {string} sheetName
 * @returns {Buffer}
 */
function exportToExcel(data, columns, sheetName = 'Sheet1') {
  const formattedData = mapDataToColumns(data, columns);
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Export data to CSV string
 * @param {Array} data
 * @param {Array<{key: string, header: string}>} columns
 * @returns {string}
 */
function exportToCSV(data, columns) {
  const formattedData = mapDataToColumns(data, columns);
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  return XLSX.utils.sheet_to_csv(worksheet);
}

module.exports = {
  exportToExcel,
  exportToCSV
};

