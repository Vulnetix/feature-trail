import type { Feature, FeatureMap } from './interfaces';
import { FeatureObject } from './interfaces';
import Papa from 'papaparse';

/**
 * Fetches data from Google Sheets as a public spreadsheet
 * @param spreadsheetId - Google Sheets ID
 * @param range - Sheet range in A1 notation
 * @returns Promise resolving to the sheet values
 */
export async function fetchSheetData(
    spreadsheetId: string,
    range: string
): Promise<any[][]> {
    if (!spreadsheetId || !range) {
        throw new Error('Spreadsheet ID and cell range are required');
    }
    // Convert Google Sheets URL to export format for CSV
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(range.split('!')[0])}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    // Parse CSV text using a common CSV parser library
    const parsedResult = Papa.parse<string[]>(csvText, {
        delimiter: ',',
        dynamicTyping: true,
        skipEmptyLines: true
    });

    if (parsedResult.errors && parsedResult.errors.length > 0) {
        console.error('CSV parsing errors:', parsedResult.errors);
        throw new Error(`Failed to parse CSV data: ${parsedResult.errors[0].message}`);
    }

    const rows = parsedResult.data;
    if (rows.length === 0) {
        throw new Error('No data found in the specified range');
    }
    return rows;
}

/**
 * Checks if a string is a valid JSON string
 * @param str - String to check
 * @returns True if the string is valid JSON, false otherwise
 */
export const isJSONString = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Converts raw Google Sheets data into Feature objects
 * @param rawData - Raw data from Google Sheets
 * @param featuresMapping - Mapping of headers to Feature properties, 
 * @returns Array of Feature objects
 */
export function parseFeatures(rawData: any[][], featuresMapping: FeatureMap): Feature[] {
    const features: Feature[] = [];
    const expectededHeaders = Object.values(featuresMapping).map((header: string) => header.trim());
    const headerRow = rawData[0].map((header: string) => header.trim());

    // Check if the header row contains the expected headers
    const startIndex = headerRow.findIndex((header: string) => expectededHeaders.includes(header.trim()));
    if (startIndex === -1) {
        throw new Error(`Invalid features mapping, no matching header found in the sheet. headerRow: ${headerRow}, expectededHeaders: ${expectededHeaders}`);
    }
    // Skip the header row
    const dataRows = rawData.slice(1);
    // Hydrate the feature objects
    for (const row of dataRows) {
        const feature: Partial<Feature> = {};
        for (const [key, value] of Object.entries(featuresMapping)) {
            const index = headerRow.indexOf(value);
            if (index !== -1 && row[index] !== undefined) {
                feature[key as keyof Feature] = row[index];
            }
        }
        // Ensure the feature object has all required properties
        if (!feature?.uuid || !feature?.title || !feature.description) {
            throw new Error(`Invalid feature object: ${JSON.stringify(feature)}`);
        }
        features.push(feature as Feature);
    }    

    return features;
}

/**
 * Validates the features mapping JSON
 * @param mapping - Mapping of headers to Feature properties
 * @returns True if the mapping is valid, false otherwise
 */
export const validateFeatureMapping = (mapping: FeatureMap): boolean => {
    try {
        // Define required keys based on the Feature interface, excluding optional properties
        type FeaturePropsArray = Array<keyof Feature>;

        // Props array itself!
        const checkKeys: FeaturePropsArray = Object.keys(new FeatureObject()) as FeaturePropsArray;

        // Check if all values in the mapping are strings
        for (const value of Object.values(mapping)) {
            if (typeof value !== 'string') {
                console.error(`Invalid mapping value: ${value}`);
                return false;
            }
            // Check if the value is a valid header name (non-empty string)
            if (value.trim() === '') {
                console.error("Empty header names are not allowed in the mapping");
                return false;
            }
        }
        // Check if all required keys are present in the mapping
        for (const key of checkKeys) {
            if (!mapping[key]) {
                console.error(`Missing mapping for key: ${key}`);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error validating features mapping:', error);
        return false;
    }
};

/**
 * Fetches all features from Google Sheets
 * @param featuresRange - Range of the sheet to fetch
 * @param spreadsheetId - Google Sheets ID
 * @param featuresMappingJson - Mapping of headers to Feature properties in JSON format
 * @throws Error if the spreadsheet ID or features mapping is invalid
 * @returns Promise resolving to Feature objects
 */
export async function fetchFeatures(featuresRange: string, spreadsheetId: string, featuresMappingJson: string): Promise<Feature[]> {
    if (!isJSONString(featuresMappingJson)) {
        throw new Error('Features mapping JSON is required');
    }
    const featuresMapping = JSON.parse(featuresMappingJson);
    if (typeof featuresMapping !== 'object' || Array.isArray(featuresMapping)) {
        throw new Error('Invalid features mapping JSON');
    }
    if (!validateFeatureMapping(featuresMapping)) {
        throw new Error('Features mapping JSON is not valid, check the README for the correct format');
    }
    const rawData = await fetchSheetData(spreadsheetId, featuresRange);
    return parseFeatures(rawData, featuresMapping);
}
