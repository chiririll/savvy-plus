<?php

return [

    // Base name of the httpOnly cookie carrying the opaque session token.
    // On HTTPS it is prefixed with __Host- (browser-enforced hardening).
    'cookie' => env('AUTH_SESSION_COOKIE', 'svy_session'),

    // Readable companion cookie holding the CSRF token (double-submit).
    'csrf_cookie' => env('AUTH_SESSION_CSRF_COOKIE', 'svy_csrf'),

    // Header the SPA echoes the CSRF token back in.
    'csrf_header' => 'X-CSRF-Token',

    // Browser-session login (no "remember me"): server-side lifetime in minutes.
    // The cookie itself is a session cookie and dies when the browser closes.
    'session_ttl' => (int) env('AUTH_SESSION_TTL', 60 * 24),

    // "Remember me" lifetime in minutes. Slides by one window on a daily /auth/me refresh.
    'remember_ttl' => (int) env('AUTH_SESSION_REMEMBER_TTL', 60 * 24 * 7),

    // Pre-auth 2FA challenge lifetime (minutes).
    'challenge_ttl' => (int) env('AUTH_SESSION_CHALLENGE_TTL', 5),
];
