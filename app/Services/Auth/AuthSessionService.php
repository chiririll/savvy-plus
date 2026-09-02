<?php

namespace App\Services\Auth;

use App\Models\AuthSession;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthSessionService
{
    /**
     * Open a new server-side session and return the raw token + csrf to hand
     * to the browser (only their hashes/values are persisted server-side).
     *
     * @return array{token: string, csrf: string, session: AuthSession}
     */
    public function issue(User $user, Request $request, bool $rememberMe = false): array
    {
        $token = Str::random(48);
        $csrf = Str::random(40);
        $ttl = $this->ttlMinutes($rememberMe);

        $session = AuthSession::create([
            'user_id' => $user->id,
            'token_hash' => $this->hash($token),
            'csrf' => $csrf,
            'ip' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
            'remember_me' => $rememberMe,
            'last_used_at' => now(),
            'refreshed_at' => now(),
            'idle_expires_at' => now()->addMinutes($ttl),
            'absolute_expires_at' => now()->addMinutes($ttl),
        ]);

        return ['token' => $token, 'csrf' => $csrf, 'session' => $session];
    }

    public function resolve(string $token): ?AuthSession
    {
        $session = AuthSession::where('token_hash', $this->hash($token))->first();

        return $session?->isActive() ? $session : null;
    }

    /**
     * Slide idle forward (capped by the absolute lifetime). Does not rotate.
     */
    public function touch(AuthSession $session): void
    {
        $idle = now()->addMinutes($this->ttlMinutes((bool) $session->remember_me));

        $session->forceFill([
            'last_used_at' => now(),
            'idle_expires_at' => $idle->min($session->absolute_expires_at),
        ])->save();
    }

    /**
     * Remember-me only: once a day, issue a new token and slide the 7-day window.
     *
     * @return array{token: string, csrf: string}|null
     */
    public function maybeRefresh(AuthSession $session): ?array
    {
        if (! $session->remember_me) {
            $this->touch($session);

            return null;
        }

        $refreshedAt = $session->refreshed_at ?? $session->created_at;
        if ($refreshedAt->gt(now()->subDay())) {
            $this->touch($session);

            return null;
        }

        return $this->refresh($session);
    }

    /**
     * @return array{token: string, csrf: string}
     */
    public function refresh(AuthSession $session): array
    {
        $token = Str::random(48);
        $csrf = Str::random(40);
        $ttl = $this->ttlMinutes(true);

        $session->forceFill([
            'token_hash' => $this->hash($token),
            'csrf' => $csrf,
            'last_used_at' => now(),
            'refreshed_at' => now(),
            'idle_expires_at' => now()->addMinutes($ttl),
            'absolute_expires_at' => now()->addMinutes($ttl),
        ])->save();

        return ['token' => $token, 'csrf' => $csrf];
    }

    /**
     * @return array{expires_at: string, refresh_at: string|null}
     */
    public function clientTimes(AuthSession $session): array
    {
        $refreshAt = null;
        if ($session->remember_me) {
            $from = $session->refreshed_at ?? $session->created_at;
            $refreshAt = $from->copy()->addDay()->min($session->absolute_expires_at)->toIso8601String();
        }

        return [
            'expires_at' => $session->absolute_expires_at->toIso8601String(),
            'refresh_at' => $refreshAt,
        ];
    }

    public function revoke(AuthSession $session): void
    {
        $session->forceFill(['revoked_at' => now()])->save();
    }

    public function revokeAllFor(User $user): void
    {
        AuthSession::where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    public function purgeExpired(): int
    {
        return AuthSession::where('absolute_expires_at', '<', now())
            ->orWhere(fn ($q) => $q->whereNotNull('revoked_at')->where('revoked_at', '<', now()->subDay()))
            ->delete();
    }

    public function ttlMinutes(bool $rememberMe): int
    {
        return (int) config($rememberMe ? 'auth_session.remember_ttl' : 'auth_session.session_ttl');
    }

    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }
}
