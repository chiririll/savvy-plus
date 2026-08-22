<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /** @var list<string> */
    private const SUPPORTED = ['en', 'ru'];

    public function handle(Request $request, Closure $next): Response
    {
        $raw = $request->header('X-Locale') ?: $request->getPreferredLanguage(self::SUPPORTED) ?: 'en';
        $locale = strtolower(explode('-', $raw)[0]);

        if (! in_array($locale, self::SUPPORTED, true)) {
            $locale = config('app.fallback_locale', 'en');
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
