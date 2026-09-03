<?php

use App\Enums\UserRole;
use App\Models\PasswordToken;
use App\Models\User;
use App\Services\Auth\AuthSessionService;
use App\Services\Auth\PasswordTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function tokenAdmin(array $overrides = []): User
{
    return User::create(array_merge([
        'name' => 'Admin',
        'email' => 'admin@test.com',
        'password' => 'secret1',
        'role' => UserRole::Admin,
    ], $overrides));
}

function tokenSession(User $user): array
{
    return app(AuthSessionService::class)->issue($user, request());
}

function tokenCall(string $method, string $uri, array $session, array $data = [])
{
    return test()->call(
        $method,
        $uri,
        $data,
        ['svy_session' => $session['token']],
        [],
        ['HTTP_X_CSRF_TOKEN' => $session['csrf']],
    );
}

it('creates a user with a password and does not issue a token', function () {
    $session = tokenSession(tokenAdmin());

    $response = tokenCall('POST', '/api/users', $session, [
        'name' => 'Active',
        'email' => 'active@test.com',
        'password' => 'password1',
        'role' => 'read-only',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.email', 'active@test.com')
        ->assertJsonPath('data.isInactive', false)
        ->assertJsonMissingPath('data.token');

    expect(User::where('email', 'active@test.com')->first()->password)->not->toBeNull();
});

it('creates an inactive user and returns a one-time token', function () {
    $session = tokenSession(tokenAdmin());

    $response = tokenCall('POST', '/api/users', $session, [
        'name' => 'Invited',
        'email' => 'invited@test.com',
        'role' => 'read-write',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.email', 'invited@test.com')
        ->assertJsonPath('data.isInactive', true)
        ->assertJsonStructure(['data' => ['token', 'expiresAt']]);

    $user = User::where('email', 'invited@test.com')->first();
    expect($user->password)->toBeNull();
    expect(PasswordToken::where('user_id', $user->id)->count())->toBe(1);
});

it('forbids non-admins from creating users', function () {
    $session = tokenSession(tokenAdmin(['role' => UserRole::ReadWrite, 'email' => 'rw@test.com']));

    tokenCall('POST', '/api/users', $session, [
        'name' => 'Nope',
        'email' => 'nope@test.com',
    ])->assertForbidden();
});

it('blocks login for an inactive user without a TypeError', function () {
    User::create([
        'name' => 'Pending',
        'email' => 'pending@test.com',
        'password' => null,
        'role' => UserRole::ReadOnly,
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'pending@test.com',
        'password' => 'anything1',
    ])->assertStatus(422);
});

it('previews a valid token and rejects expired or consumed ones', function () {
    $user = User::create([
        'name' => 'Invited',
        'email' => 'invited@test.com',
        'password' => null,
        'role' => UserRole::ReadOnly,
    ]);

    $issued = app(PasswordTokenService::class)->issue($user);

    $this->getJson('/api/auth/password/'.$issued['token'])
        ->assertOk()
        ->assertJsonPath('email', 'invited@test.com')
        ->assertJsonPath('isInactive', true);

    $this->getJson('/api/auth/password/not-a-real-token')->assertNotFound();

    $row = PasswordToken::where('user_id', $user->id)->first();
    $row->forceFill(['expires_at' => now()->subMinute()])->save();
    $this->getJson('/api/auth/password/'.$issued['token'])->assertNotFound();
});

it('accepts a token, sets the password, logs in, and is single-use', function () {
    $user = User::create([
        'name' => 'Invited',
        'email' => 'invited@test.com',
        'password' => null,
        'role' => UserRole::ReadOnly,
    ]);

    $issued = app(PasswordTokenService::class)->issue($user);

    $this->postJson('/api/auth/password/'.$issued['token'], [
        'password' => 'newpass12',
        'password_confirmation' => 'newpass12',
    ])->assertOk()->assertJsonPath('user.email', 'invited@test.com');

    $user->refresh();
    expect($user->isInactive())->toBeFalse();
    expect(Hash::check('newpass12', $user->password))->toBeTrue();

    $this->postJson('/api/auth/password/'.$issued['token'], [
        'password' => 'otherpass',
        'password_confirmation' => 'otherpass',
    ])->assertNotFound();

    $this->postJson('/api/auth/login', [
        'email' => 'invited@test.com',
        'password' => 'newpass12',
    ])->assertOk();
});

it('issues a reset token, revokes the previous one, and refuses self or sso-only', function () {
    $admin = tokenAdmin();
    $session = tokenSession($admin);

    $target = User::create([
        'name' => 'Target',
        'email' => 'target@test.com',
        'password' => 'oldpass12',
        'role' => UserRole::ReadOnly,
    ]);

    $first = app(PasswordTokenService::class)->issue($target);

    $response = tokenCall('POST', "/api/users/{$target->id}/password-token", $session);
    $response->assertOk()->assertJsonStructure(['data' => ['token']]);

    $newToken = $response->json('data.token');
    expect($newToken)->not->toBe($first['token']);

    $this->getJson('/api/auth/password/'.$first['token'])->assertNotFound();
    $this->getJson('/api/auth/password/'.$newToken)->assertOk()->assertJsonPath('isInactive', false);

    tokenCall('POST', "/api/users/{$admin->id}/password-token", $session)
        ->assertStatus(422);

    $sso = User::create([
        'name' => 'Sso',
        'email' => 'sso@test.com',
        'password' => 'x',
        'role' => UserRole::ReadOnly,
        'is_sso_only' => true,
    ]);

    tokenCall('POST', "/api/users/{$sso->id}/password-token", $session)
        ->assertStatus(422);
});

it('activates an inactive user and revokes tokens when an admin sets a password', function () {
    $session = tokenSession(tokenAdmin());

    $user = User::create([
        'name' => 'Invited',
        'email' => 'invited@test.com',
        'password' => null,
        'role' => UserRole::ReadOnly,
    ]);

    $issued = app(PasswordTokenService::class)->issue($user);

    tokenCall('PATCH', "/api/users/{$user->id}", $session, [
        'password' => 'setbyadmin',
    ])->assertOk()->assertJsonPath('data.isInactive', false);

    $this->getJson('/api/auth/password/'.$issued['token'])->assertNotFound();
    expect($user->fresh()->isInactive())->toBeFalse();
});
