<?php

namespace App\Http\Controllers;

use App\Http\Concerns\IssuesAuthSession;
use App\Services\Auth\AuthSessionService;
use App\Services\Auth\PasswordTokenService;
use App\Services\Auth\TwoFactorChallengeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PasswordTokenController extends Controller
{
    use IssuesAuthSession;

    public function __construct(
        private PasswordTokenService $tokens,
        private AuthSessionService $sessions,
        private TwoFactorChallengeService $challenges,
    ) {}

    public function preview(string $token): JsonResponse
    {
        $row = $this->tokens->preview($token);

        if (! $row) {
            return response()->json(['message' => __('messages.users.password_token_invalid')], 404);
        }

        $user = $row->user;

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'isInactive' => $user->isInactive(),
            'expiresAt' => $row->expires_at?->toISOString(),
        ]);
    }

    public function accept(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $row = $this->tokens->consume($token);

        if (! $row) {
            return response()->json(['message' => __('messages.users.password_token_invalid')], 404);
        }

        $user = $row->user;
        $user->password = $data['password'];
        $user->save();

        $this->sessions->revokeAllFor($user);

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'requires_2fa' => true,
                'two_factor_token' => $this->challenges->issue($user),
            ]);
        }

        return $this->issueSession($user, $request, rememberMe: true);
    }
}
