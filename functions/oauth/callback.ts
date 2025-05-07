import type { PagesFunction, EventContext } from "@/shared/interfaces";

/**
 * Handles the GET request to /oauth/callback.
 * This function is invoked by Google after the user grants authorization.
 * It exchanges the received authorization code for an access token and stores it.
 */
export const onRequestGet: PagesFunction = async (context: EventContext) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get(`code`);
    const error = url.searchParams.get(`error`);

    if (error) {
        console.error(`OAuth Error received from Google: ${error}`);
        return new Response(`OAuth Error: ${error}. Please try again or contact support.`, {
            status: 400,
            headers: { 'Content-Type': `text/html` },
        });
    }

    if (!code) {
        return new Response(`Authorization code is missing in the request.`, {
            status: 400,
            headers: { 'Content-Type': `text/html` },
        });
    }

    const tokenUrl = `https://oauth2.googleapis.com/token`;

    const params = new URLSearchParams();
    params.append(`code`, code);
    params.append(`client_id`, env.GOOGLE_CLIENT_ID);
    params.append(`client_secret`, env.GOOGLE_CLIENT_SECRET);
    params.append(`redirect_uri`, encodeURIComponent(`https://roadmap.vulnetix.com/oauth/callback`));
    params.append(`grant_type`, `authorization_code`);

    try {
        const response = await fetch(tokenUrl, {
            method: `POST`,
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`,
            },
            body: params.toString(),
        });

        const responseBody = await response.json();

        if (!response.ok) {
            console.error(`Google Token API Error:`, responseBody);
            const errorMessage = responseBody.error_description || JSON.stringify(responseBody);
            return new Response(`Failed to exchange authorization code for token: ${response.statusText} - ${errorMessage}`, {
                status: response.status,
                headers: { 'Content-Type': `text/html` },
            });
        }

        const accessToken = responseBody.access_token;
        const expiresIn = responseBody.expires_in; // TTL in seconds
        const refreshToken = responseBody.refresh_token; // Present if access_type=offline and it's the first authorization

        if (!accessToken || expiresIn === undefined) {
            console.error(`Access token or expires_in missing in Google's response:`, responseBody);
            return new Response(`Invalid token data received from Google.`, {
                status: 500,
                headers: { 'Content-Type': `text/html` },
            });
        }
        const csrfToken = await env.KV_STORE.get(`csrf_token`);
        if (!csrfToken) {
            console.error(`CSRF token not found in KV store.`);
            return new Response(`CSRF token not found. Please try again.`, {
                status: 400,
                headers: { 'Content-Type': `text/html` },
            });
        }
        // Verify the CSRF token
        const csrfTokenFromRequest = responseBody.state;
        if (csrfToken !== csrfTokenFromRequest) {
            console.error(`CSRF token mismatch. Possible CSRF attack.`);
            return new Response(`CSRF token mismatch. Please try again.`, {
                status: 403,
                headers: { 'Content-Type': `text/html` },
            });
        }

        // Store the access token in KV. Consider a user-specific key if multiple users.
        // For this example, using a generic key.
        const accessTokenKey = `google_access_token`;
        await env.KV_STORE.put(accessTokenKey, accessToken, {
            expirationTtl: expiresIn, // The token will automatically be removed from KV after this many seconds
        });

        // If a refresh token is received, it should be stored securely and persistently
        // as it does not expire quickly and is used to obtain new access tokens.
        if (refreshToken) {
            const refreshTokenKey = `google_refresh_token`;
            // KV is suitable for refresh tokens as well. They don't have an expiry from Google's side in the same way access tokens do.
            await env.KV_STORE.put(refreshTokenKey, refreshToken);
            console.log(`Refresh token stored successfully.`);
        }

        // Respond to the user. A redirect to the main application is usually preferred.
        // For example: return Response.redirect(new URL(`/`, url.origin).toString(), 302);
        return new Response(`Authentication successful! Access token has been stored. You can now close this page.`, {
            status: 200,
            headers: { 'Content-Type': `text/html` },
        });

    } catch (e: any) {
        console.error(`Error in OAuth callback processing:`, e);
        return new Response(`An internal error occurred during OAuth callback processing: ${e.message}`, {
            status: 500,
            headers: { 'Content-Type': `text/html` },
        });
    }
};
