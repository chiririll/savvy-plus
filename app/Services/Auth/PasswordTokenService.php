<?php

namespace App\Services\Auth;

use App\Models\PasswordToken;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class PasswordTokenService
{
    /**
     * @return array{token: string, expiresAt: Carbon}
     */
    public function issue(User $user): array
    {
        $this->revokeActive($user);

        $token = Str::random(64);
        $expiresAt = now()->addSeconds((int) config('auth.password_token_ttl', 604800));

        PasswordToken::create([
            'user_id' => $user->id,
            'token_hash' => $this->hash($token),
            'expires_at' => $expiresAt,
        ]);

        return ['token' => $token, 'expiresAt' => $expiresAt];
    }

    public function preview(string $token): ?PasswordToken
    {
        return $this->findValid($token);
    }

    /**
     * Atomically consume a token exactly once. Returns the row or null.
     */
    public function consume(string $token): ?PasswordToken
    {
        $hash = $this->hash($token);

        $affected = PasswordToken::where('token_hash', $hash)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->update(['consumed_at' => now()]);

        if ($affected !== 1) {
            return null;
        }

        return PasswordToken::where('token_hash', $hash)->first();
    }

    public function revokeActive(User $user): void
    {
        PasswordToken::where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);
    }

    private function findValid(string $token): ?PasswordToken
    {
        return PasswordToken::where('token_hash', $this->hash($token))
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }
}
