<?php

namespace App\Http\Concerns;

use App\Models\AuthSession;
use App\Models\User;
use App\Services\Auth\AuthCookies;
use App\Services\Auth\AuthSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait IssuesAuthSession
{
    protected function issueSession(User $user, Request $request, int $status = 200, ?bool $rememberMe = null): JsonResponse
    {
        $remember = $rememberMe ?? $request->boolean('remember_me');
        $issued = app(AuthSessionService::class)->issue($user, $request, $remember);

        $response = response()->json($this->sessionPayload($user, $issued['session']), $status);

        foreach (app(AuthCookies::class)->make($request, $issued['token'], $issued['csrf'], $remember) as $cookie) {
            $response->withCookie($cookie);
        }

        return $response;
    }

    /**
     * @return array{user: array<string, mixed>, expires_at: string, refresh_at: string|null}
     */
    protected function sessionPayload(User $user, AuthSession $session): array
    {
        return [
            'user' => $this->sessionUser($user),
            ...app(AuthSessionService::class)->clientTimes($session),
        ];
    }

    protected function sessionUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
