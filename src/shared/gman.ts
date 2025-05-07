import type { Feature } from './interfaces';

const featuresRange = 'Features!A:H';
const featuresHeader = ['UUID', 'Title', 'Description', 'Timestamp', 'IsComplete', 'NeedsFeedback', 'InProgress', 'TargetRelease'];
const SPREADSHEET_ID = '1WSd0uTzOgjxFRUoQ86CgvR0WqJodDq9_XGxYTKcUW5Y';

/**
 * Fetches data from Google Sheets as a public spreadsheet
 * @param range - Sheet range in A1 notation
 * @returns Promise resolving to the sheet values
 */
export async function fetchSheetData(
    range: string
): Promise<any[][]> {
    // Convert Google Sheets URL to export format for CSV
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(range.split('!')[0])}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    return rows;
}

/**
 * Parse CSV text into a 2D array, ignoring the header row
 * @param csvText - CSV text to parse
 * @returns 2D array of values (excluding header row)
 */
function parseCSV(csvText: string): string[][] {
    const rows = csvText.split('\n');
    
    // Skip the header row by starting from index 1
    const dataRows = rows.slice(1);
    
    return dataRows.map(row => {
        // Handle quoted values containing commas
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.replace(/""/g, '"'));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // Add the last value
        values.push(currentValue.replace(/""/g, '"'));
        
        // Clean up quotes at the beginning and end of each value
        return values.map(value => {
            if (value.startsWith('"') && value.endsWith('"')) {
                return value.substring(1, value.length - 1);
            }
            return value;
        });
    });
}

/**
 * Converts raw Google Sheets data into Feature objects
 * @param rawData - Raw data from Google Sheets
 * @returns Array of Feature objects
 */
export function parseFeatures(rawData: any[][]): Feature[] {
    // Skip the header row if it matches our expected header
    const startIndex = 
        rawData.length > 0 && 
        JSON.stringify(rawData[0]) === JSON.stringify(featuresHeader) ? 1 : 0;
    
    return rawData.slice(startIndex).map(row => ({
        uuid: row[0] || '',
        title: row[1] || '',
        description: row[2] || '',
        timestamp: parseInt(row[3], 10) || null,
        isComplete: row[4] === 'TRUE',
        needsFeedback: row[5] === 'TRUE',
        inProgress: row[6] === 'TRUE',
        targetRelease: row[7] || '',
    } as Feature));
}

/**
 * Fetches all features from Google Sheets
 * @returns Promise resolving to Feature objects
 */
export async function fetchFeatures(): Promise<Feature[]> {
    const rawData = await fetchSheetData(featuresRange);
    return parseFeatures(rawData);
}
