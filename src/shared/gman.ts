import type { Feature, Vote } from './interfaces';

const featuresRange = 'Features!A:H';
const votesRange = 'Votes!A:D';
const featuresHeader = ['UUID', 'Title', 'Description', 'Timestamp', 'IsComplete', 'NeedsFeedback', 'InProgress', 'TargetRelease'];
const votesHeader = ['SHA256', 'FeatureUUID', 'Timestamp', 'Comment'];
const SPREADSHEET_ID = '1WSd0uTzOgjxFRUoQ86CgvR0WqJodDq9_XGxYTKcUW5Y';

/**
 * Appends data to Google Sheets
 * @param sheetId - The ID of the spreadsheet
 * @param range - Sheet range in A1 notation (e.g., 'Features!A:H' or just 'Features' to append to the first empty row)
 * @param values - 2D array of values to append
 * @param accessToken - OAuth 2.0 Access Token.
 * @returns Promise resolving when data is appended
 */
async function appendSheetData(
    sheetId: string,
    range: string,
    values: any[][],
    accessToken: string, // Added accessToken parameter
): Promise<void> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`, // Added Authorization header
        },
        body: JSON.stringify({ values }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Sheets API Error:', errorData);
        throw new Error(`Failed to append sheet data: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
}

/**
 * Saves a new feature to the Google Sheet.
 * @param feature - The feature object to save.
 * @param accessToken - OAuth 2.0 Access Token.
 * @param sheetId - The ID of the spreadsheet.
 * @returns Promise resolving when the feature is saved.
 */
export async function saveFeatureToSheet(feature: Feature, accessToken: string, sheetId: string = SPREADSHEET_ID): Promise<void> {
    const values = [
        [
            feature.uuid,
            feature.title,
            feature.description,
            feature.timestamp,
            feature.isComplete,
            feature.needsFeedback,
            feature.inProgress,
            feature.targetRelease || '', // Ensure targetRelease is not undefined
        ],
    ];
    // Appending to 'Features' sheet, the API will find the first empty row.
    await appendSheetData(sheetId, 'Features', values, accessToken);
}

export async function getAccessToken(clientId: string, secretKey: string, kvStore: any): Promise<string | null> {
    // Check CloudFlare KV for existing token
    const token = await kvStore.get('google_access_token');
    if (token) {
        // Decode the token to check its expiration
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        // If the token is still valid, return it
        if (expirationTime > currentTime) {
            console.log('Access token is still valid');
            return token;
        }
        // If the token is expired, log it
        console.log('Access token is expired, requesting a new one');
        // Optionally, you can delete the expired token from KV
        await kvStore.delete('google_access_token');
        // Check CloudFlare KV for existing token
        const refreshToken = await kvStore.get('google_refresh_token');
        if (refreshToken) {
            // Decode the token to check its expiration
            const decodedRefreshToken = JSON.parse(atob(refreshToken.split('.')[1]));
            const refreshExpirationTime = decodedRefreshToken.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            // If the token is still valid, return it
            if (refreshExpirationTime > currentTime) {
                console.log('Refresh token is still valid');
                return refreshToken;
            }
            // If the token is expired, log it
            console.log('Refresh token is expired, requesting a new one');
            // Optionally, you can delete the expired token from KV
            await kvStore.delete('google_refresh_token');
            // Request a new access token using the refresh token
            const newToken = await refreshAccessToken(clientId, secretKey, refreshToken);
            if (newToken) {
                // Store the new token in CloudFlare KV with a matching expiration
                const decodedToken = JSON.parse(atob(newToken.split('.')[1]));
                let expirationTtl = decodedToken.exp - Math.floor(Date.now() / 1000);
                if (expirationTtl <= 0) {
                    expirationTtl = 3600; // Default to 1 hour if the token is already expired
                }
                await kvStore.put('google_access_token', newToken, { expirationTtl });
                console.log('New access token cached');
                return newToken;
            }
            console.error('Failed to obtain access token');
            return null;
        }

        console.log('Using cached access token');
        return token;
    }
    // If no token is found, request a new one
    const pendingAuthz: boolean = await requestAccessToken(clientId, kvStore);
    if (pendingAuthz) {
        // Wait for the user to authorize the app
        console.log('Waiting for user authorization...');

        // Poll for the token every 3 seconds, up to 5 attempts
        let attempts = 0;
        const maxAttempts = 5;
        const pollingIntervalMs = 3000;
        
        while (attempts < maxAttempts) {
            // Wait for 3 seconds
            await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
            
            // Check if the token exists in KV store
            const newToken = await kvStore.get('google_access_token');
            if (newToken) {
                console.log('New access token cached');
                return newToken;
            }
            
            attempts++;
            console.log(`Waiting for authorization... Attempt ${attempts}/${maxAttempts}`);
        }
        
        console.error('Authorization timed out after 5 attempts');
        return null;
    }
    console.error('Failed to obtain access token');
    return null;
}

export async function refreshAccessToken(clientId: string, secretKey: string, refreshToken: string): Promise<string | null> {
    const url = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: secretKey,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    })
    if (!response.ok) {
        const raw = await response.text();
        console.error('Google OAuth Error:', raw);
        return null;
    }
    const data = await response.json();
    console.log('Google OAuth Response Data', data);
    if (!data.access_token) {
        console.error('No access token received:', data);
        return null;
    }
    // Return the access token
    return data.access_token;
}

export async function requestAccessToken(clientId: string, kvStore: any): Promise<boolean> {
    // Generate a random state value for security (to prevent CSRF)
    const state = Math.random().toString(36).substring(2, 15);
    // Store the state in CloudFlare KV for later verification
    await kvStore.put('google_oauth_csrf', state, { expirationTtl: 60 }); // minimum ttl of 60 seconds

    // Define the authorization URL with all required parameters
    const authUrl = new URL(`https://accounts.google.com/o/oauth2/v2/auth`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', encodeURIComponent('https://roadmap.vulnetix.com/oauth/callback'));
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', encodeURIComponent('https://www.googleapis.com/auth/spreadsheets'));
    authUrl.searchParams.append('prompt', 'none');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('include_granted_scopes', 'true');

    console.log(`Authorization URL: GET ${authUrl.toString()}`);
    const response = await fetch(authUrl.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const raw = await response.text();
    console.log('Google OAuth Response:', raw);
    console.error(`Google OAuth Error: ${response.status} ${response.statusText}`);
    if (!response.ok) {
        return false;
    }
    // Frontend should wait for the callback, retry the call
    // so that the KV may hold the token
    return response.ok
}

/**
 * Saves a new vote to the Google Sheet.
 * @param vote - The vote object to save.
 * @param accessToken - OAuth 2.0 Access Token.
 * @param sheetId - The ID of the spreadsheet.
 * @returns Promise resolving when the vote is saved.
 */
export async function saveVoteToSheet(vote: Vote, accessToken: string, sheetId: string = SPREADSHEET_ID): Promise<void> {
    const values = [
        [
            vote.sha256,
            vote.featureUuid,
            vote.timestamp,
            vote.comment,
        ],
    ];
    // Appending to 'Votes' sheet, the API will find the first empty row.
    await appendSheetData(sheetId, 'Votes', values, accessToken);
}

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
    }));
}

/**
 * Converts raw Google Sheets data into Vote objects
 * @param rawData - Raw data from Google Sheets
 * @returns Array of Vote objects
 */
export function parseVotes(rawData: any[][]): Vote[] {
    // Skip the header row if it matches our expected header
    const startIndex = 
        rawData.length > 0 && 
        JSON.stringify(rawData[0]) === JSON.stringify(votesHeader) ? 1 : 0;
    
    return rawData.slice(startIndex).map(row => ({
        sha256: row[0] || '',
        featureUuid: row[1] || '',
        timestamp: parseInt(row[2], 10) || null,
        comment: row[3] || '',
    }));
}

/**
 * Fetches all features from Google Sheets
 * @returns Promise resolving to Feature objects
 */
export async function fetchFeatures(): Promise<Feature[]> {
    const rawData = await fetchSheetData(featuresRange);
    return parseFeatures(rawData);
}

/**
 * Fetches all votes from Google Sheets
 * @returns Promise resolving to Vote objects
 */
export async function fetchVotes(): Promise<Vote[]> {
    const rawData = await fetchSheetData(votesRange);
    return parseVotes(rawData);
}

/**
 * Fetches both features and votes from Google Sheets
 * @returns Promise resolving to an object containing features and votes
 */
export async function fetchRoadmapData(): Promise<{
    features: Feature[];
    votes: Vote[];
}> {
    const [features, votes] = await Promise.all([
        fetchFeatures(),
        fetchVotes()
    ]);
    
    return { features, votes };
}
