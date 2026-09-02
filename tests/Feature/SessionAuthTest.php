<?php

use App\Enums\UserRole;
use App\Models\TwoFactorChallenge;
use App\Models\User;
use App\Services\Auth\AuthSessionService;
use App\Services\Auth\TwoFactorChallengeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeAuthUser(array $overrides = []): User
{
    return User::create(array_merge([
        'name' => 'U',
        'email' => 'u@test.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ], $overrides));
}

function openSession(User $user, bool $remember = false): array
{
    return app(AuthSessionService::class)->issue($user, request(), $remember);
}

it('rejects a request once the idle window has passed', function () {
    $issued = openSession(makeAuthUser());
    $issued['session']->forceFill(['idle_expires_at' => now()->subMinute()])->save();

    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $issued['token']])->assertStatus(401);
});

it('rejects a request once the absolute lifetime has passed', function () {
    $issued = openSession(makeAuthUser());
    $issued['session']->forceFill(['absolute_expires_at' => now()->subMinute()])->save();

    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $issued['token']])->assertStatus(401);
});

it('rejects a revoked session', function () {
    $issued = openSession(makeAuthUser());
    app(AuthSessionService::class)->revoke($issued['session']);

    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $issued['token']])->assertStatus(401);
});

it('slides the idle window forward on use', function () {
    $issued = openSession(makeAuthUser());
    $issued['session']->forceFill(['idle_expires_at' => now()->addMinutes(5)])->save();

    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $issued['token']])->assertOk();

    expect($issued['session']->fresh()->idle_expires_at->gt(now()->addMinutes(60)))->toBeTrue();
});

it('does not rotate the token on ordinary API use', function () {
    $issued = openSession(makeAuthUser(), remember: true);
    $hash = $issued['session']->token_hash;

    $issued['session']->forceFill(['refreshed_at' => now()->subHours(2)])->save();

    $response = $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $issued['token']]);
    $response->assertOk();
    expect(collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === 'svy_session'))->toBeNull();
    expect($issued['session']->fresh()->token_hash)->toBe($hash);
});

it('refreshes a remember-me session from /auth/me after a day', function () {
    $issued = openSession(makeAuthUser(), remember: true);
    $oldHash = $issued['session']->token_hash;
    $issued['session']->forceFill(['refreshed_at' => now()->subDay()->subMinute()])->save();

    $response = $this->call('GET', '/api/auth/me', [], ['svy_session' => $issued['token']]);
    $response->assertOk()->assertJsonPath('user.email', 'u@test.com');

    $rotated = collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === 'svy_session');
    expect($rotated)->not->toBeNull();
    expect($issued['session']->fresh()->token_hash)->not->toBe($oldHash);
    expect($response->json('refresh_at'))->not->toBeNull();
});

it('does not refresh a remember-me session before a day has passed', function () {
    $issued = openSession(makeAuthUser(), remember: true);
    $hash = $issued['session']->token_hash;

    $response = $this->call('GET', '/api/auth/me', [], ['svy_session' => $issued['token']]);
    $response->assertOk();
    expect(collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === 'svy_session'))->toBeNull();
    expect($issued['session']->fresh()->token_hash)->toBe($hash);
});

it('does not refresh a browser-session login from /auth/me', function () {
    $issued = openSession(makeAuthUser());
    $issued['session']->forceFill(['refreshed_at' => now()->subDays(2)])->save();

    $response = $this->call('GET', '/api/auth/me', [], ['svy_session' => $issued['token']]);
    $response->assertOk();
    expect(collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === 'svy_session'))->toBeNull();
    expect($response->json('refresh_at'))->toBeNull();
});

it('issues a session cookie without remember me and a persistent cookie with it', function () {
    makeAuthUser();

    $sessionLogin = $this->postJson('/api/auth/login', [
        'email' => 'u@test.com',
        'password' => 'secret1',
        'remember_me' => false,
    ])->assertOk();
    $sessionCookie = collect($sessionLogin->headers->getCookies())->first(fn ($c) => $c->getName() === 'svy_session');
    expect($sessionCookie)->not->toBeNull();
    expect($sessionCookie->getExpiresTime())->toBe(0);

    $rememberLogin = $this->postJson('/api/auth/login', [
        'email' => 'u@test.com',
        'password' => 'secret1',
        'remember_me' => true,
    ])->assertOk();
    $rememberCookie = collect($rememberLogin->headers->getCookies())->first(fn ($c) => $c->getName() === 'svy_session');
    expect($rememberCookie)->not->toBeNull();
    expect($rememberCookie->getExpiresTime())->toBeGreaterThan(time() + 60 * 60 * 24 * 6);
});

it('slides the idle window on /auth/me', function () {
    $issued = openSession(makeAuthUser());
    $issued['session']->forceFill(['idle_expires_at' => now()->addMinutes(5)])->save();

    $this->call('GET', '/api/auth/me', [], ['svy_session' => $issued['token']])
        ->assertOk()
        ->assertJsonPath('user.email', 'u@test.com');

    expect($issued['session']->fresh()->idle_expires_at->gt(now()->addMinutes(60)))->toBeTrue();
});

it('enforces CSRF on mutating authenticated requests', function () {
    $issued = openSession(makeAuthUser());

    $this->call('POST', '/api/auth/logout', [], ['svy_session' => $issued['token']])->assertStatus(419);

    $this->call('POST', '/api/auth/logout', [], ['svy_session' => $issued['token']], [], ['HTTP_X_CSRF_TOKEN' => $issued['csrf']])
        ->assertOk();
});

it('blocks password login for SSO-only accounts', function () {
    makeAuthUser(['email' => 'sso@test.com', 'is_sso_only' => true]);

    $this->postJson('/api/auth/login', ['email' => 'sso@test.com', 'password' => 'secret1'])->assertStatus(422);
});

it('returns a 2FA challenge instead of a session when 2FA is enabled', function () {
    makeAuthUser(['two_factor_enabled' => true, 'two_factor_confirmed' => true, 'two_factor_secret' => 'SECRET']);

    $response = $this->postJson('/api/auth/login', ['email' => 'u@test.com', 'password' => 'secret1'])
        ->assertOk()
        ->assertJsonPath('requires_2fa', true);

    expect($response->json('two_factor_token'))->not->toBeNull();
    expect(TwoFactorChallenge::count())->toBe(1);
    expect(collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === 'svy_session'))->toBeNull();
});

it('keeps the 2FA challenge usable after a wrong code (peek, not consume)', function () {
    $svc = app(TwoFactorChallengeService::class);
    $user = makeAuthUser();
    $token = $svc->issue($user);

    expect($svc->resolve($token)->id)->toBe($user->id);
    expect($svc->resolve($token))->not->toBeNull();
});

it('consumes a 2FA challenge exactly once', function () {
    $svc = app(TwoFactorChallengeService::class);
    $token = $svc->issue(makeAuthUser());

    expect($svc->consume($token))->not->toBeNull();
    expect($svc->consume($token))->toBeNull();
});

it('does not resolve an expired 2FA challenge', function () {
    $svc = app(TwoFactorChallengeService::class);
    $token = $svc->issue(makeAuthUser());
    TwoFactorChallenge::query()->update(['expires_at' => now()->subMinute()]);

    expect($svc->resolve($token))->toBeNull();
});

it('revokes other sessions when the password is changed', function () {
    $user = makeAuthUser();
    $current = openSession($user);
    $other = openSession($user);

    $this->call(
        'PUT',
        '/api/auth/password',
        [
            'current_password' => 'secret1',
            'password' => 'newsecret1',
            'password_confirmation' => 'newsecret1',
        ],
        ['svy_session' => $current['token']],
        [],
        ['HTTP_X_CSRF_TOKEN' => $current['csrf']],
    )->assertOk();

    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $current['token']])->assertOk();
    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $other['token']])->assertStatus(401);
    expect(Hash::check('newsecret1', $user->fresh()->password))->toBeTrue();
});

it('does not revoke sessions when the current password is wrong', function () {
    $user = makeAuthUser();
    $current = openSession($user);
    $other = openSession($user);

    $this->call(
        'PUT',
        '/api/auth/password',
        [
            'current_password' => 'wrong-password',
            'password' => 'newsecret1',
            'password_confirmation' => 'newsecret1',
        ],
        ['svy_session' => $current['token']],
        [],
        ['HTTP_X_CSRF_TOKEN' => $current['csrf']],
    )->assertStatus(422);

    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $other['token']])->assertOk();
    expect(Hash::check('secret1', $user->fresh()->password))->toBeTrue();
});

it('rejects a password change for SSO-only accounts', function () {
    $issued = openSession(makeAuthUser(['email' => 'sso@test.com', 'is_sso_only' => true]));

    $this->call(
        'PUT',
        '/api/auth/password',
        [
            'current_password' => 'secret1',
            'password' => 'newsecret1',
            'password_confirmation' => 'newsecret1',
        ],
        ['svy_session' => $issued['token']],
        [],
        ['HTTP_X_CSRF_TOKEN' => $issued['csrf']],
    )->assertStatus(422);
});

it('revokes other sessions from logout-others and keeps the current one', function () {
    $user = makeAuthUser();
    $current = openSession($user);
    $other = openSession($user);

    $this->call(
        'POST',
        '/api/auth/logout-others',
        [],
        ['svy_session' => $current['token']],
        [],
        ['HTTP_X_CSRF_TOKEN' => $current['csrf']],
    )->assertOk()->assertJsonPath('revoked', 1);

    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $current['token']])->assertOk();
    $this->call('GET', '/api/auth/2fa/status', [], ['svy_session' => $other['token']])->assertStatus(401);
});
