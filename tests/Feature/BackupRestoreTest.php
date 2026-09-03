<?php

use App\Enums\UserRole;
use App\Models\Backup;
use App\Models\User;
use App\Services\BackupService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    cleanupProbeMigrations();

    $this->originalSqliteDatabase = config('database.connections.sqlite.database');
    $this->originalJournalMode = config('database.connections.sqlite.journal_mode');
    $this->originalBackupPath = config('backup.path');

    $this->workDir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'savvy-backup-'.uniqid();
    File::ensureDirectoryExists($this->workDir.'/backups');

    $dbPath = $this->workDir.DIRECTORY_SEPARATOR.'database.sqlite';
    touch($dbPath);

    config([
        'database.connections.sqlite.database' => $dbPath,
        'database.connections.sqlite.journal_mode' => 'DELETE',
        'backup.path' => $this->workDir.DIRECTORY_SEPARATOR.'backups',
    ]);

    DB::purge('sqlite');
    DB::reconnect('sqlite');
    $this->artisan('migrate', ['--force' => true]);

    $this->user = User::create([
        'name' => 'Backup Tester',
        'email' => 'backup-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::Admin,
    ]);
});

afterEach(function () {
    cleanupProbeMigrations();

    DB::disconnect('sqlite');
    File::deleteDirectory($this->workDir);

    config([
        'database.connections.sqlite.database' => $this->originalSqliteDatabase,
        'database.connections.sqlite.journal_mode' => $this->originalJournalMode,
        'backup.path' => $this->originalBackupPath,
    ]);

    DB::purge('sqlite');
    DB::reconnect('sqlite');
});

function backupService(): BackupService
{
    return app(BackupService::class);
}

function cleanupProbeMigrations(): void
{
    foreach (glob(database_path('migrations/2099_01_01_000000_create_backup_inspect_probe_*_table.php')) ?: [] as $file) {
        unlink($file);
    }
}

/** @return array{0: string, 1: string} */
function writeProbeMigration(): array
{
    $suffix = str_replace('.', '', uniqid('', true));
    $table = 'backup_inspect_probe_'.$suffix;
    $file = database_path("migrations/2099_01_01_000000_create_{$table}_table.php");

    File::put($file, <<<PHP
<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('{$table}', function (Blueprint \$table) {
            \$table->id();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('{$table}');
    }
};
PHP);

    return [$file, $table];
}

function insertUnknownMigration(string $path, string $name = '2099_12_31_999999_from_the_future'): void
{
    $pdo = new \PDO('sqlite:'.$path);
    $pdo->exec("INSERT INTO migrations (migration, batch) VALUES ('{$name}', 99)");
}

it('inspects a current backup as compatible without pending migrations', function () {
    $backup = backupService()->create('current');

    $response = callAs('GET', "/api/backups/{$backup->id}/inspect", [], $this->user);

    $response->assertOk()
        ->assertJsonPath('valid', true)
        ->assertJsonPath('compatible', true)
        ->assertJsonPath('pendingCount', 0)
        ->assertJsonPath('unknownCount', 0);
});

it('detects pending migrations without modifying the backup file', function () {
    $backup = backupService()->create('old');
    $path = backupService()->getPath($backup->filename);
    $hash = hash_file('sha256', $path);

    writeProbeMigration();

    $response = callAs('GET', "/api/backups/{$backup->id}/inspect", [], $this->user);

    $response->assertOk()
        ->assertJsonPath('compatible', true)
        ->assertJsonPath('pendingCount', 1);

    expect(hash_file('sha256', $path))->toBe($hash);
    expect(File::exists($path.'-wal'))->toBeFalse();
    expect(File::exists($path.'-shm'))->toBeFalse();
});

it('rejects a backup from a newer schema', function () {
    $backup = backupService()->create('future');
    insertUnknownMigration(backupService()->getPath($backup->filename));

    $inspect = callAs('GET', "/api/backups/{$backup->id}/inspect", [], $this->user);
    $inspect->assertOk()
        ->assertJsonPath('compatible', false)
        ->assertJsonPath('unknownCount', 1);

    $email = $this->user->email;

    $restore = callAs('POST', "/api/backups/{$backup->id}/restore", ['migrate' => true], $this->user);
    $restore->assertStatus(422)
        ->assertJsonPath('message', __('messages.backup.newer'));

    expect(User::where('email', $email)->exists())->toBeTrue();
});

it('rejects an invalid backup file before touching the live database', function () {
    File::put(backupService()->getPath('evil.sqlite'), 'not a database');
    $backup = Backup::create([
        'filename' => 'evil.sqlite',
        'size' => 14,
        'note' => 'bad',
    ]);

    $email = $this->user->email;

    callAs('GET', "/api/backups/{$backup->id}/inspect", [], $this->user)
        ->assertStatus(422)
        ->assertJsonPath('message', __('messages.backup.invalid'));

    callAs('POST', "/api/backups/{$backup->id}/restore", [], $this->user)
        ->assertStatus(422)
        ->assertJsonPath('message', __('messages.backup.invalid'));

    expect(User::where('email', $email)->exists())->toBeTrue();
});

it('always applies pending migrations on restore', function () {
    $backup = backupService()->create('plain');
    $path = backupService()->getPath($backup->filename);
    $hash = hash_file('sha256', $path);

    [, $table] = writeProbeMigration();

    callAs('POST', "/api/backups/{$backup->id}/restore", [], $this->user)
        ->assertOk();

    expect(Schema::hasTable($table))->toBeTrue();
    expect(hash_file('sha256', $path))->toBe($hash);
});

it('stores schema version from the latest migration', function () {
    $backup = backupService()->create('versioned');
    $latest = collect($backup->schema_migrations)->sort()->last();

    expect($latest)->toMatch('/^\d{4}_\d{2}_\d{2}_\d{6}/');
    expect($backup->app_version)->toMatch('/^\d{4}-\d{2}-\d{2}\.\d{6}$/');

    $response = callAs('GET', '/api/backups', [], $this->user);
    $response->assertOk()
        ->assertJsonPath('data.0.schemaVersion', $backup->app_version)
        ->assertJsonPath('data.0.schemaStatus', 'current');
});

it('marks a stored catalog entry as outdated after the app gains migrations', function () {
    backupService()->create('older');
    writeProbeMigration();

    callAs('GET', '/api/backups', [], $this->user)
        ->assertOk()
        ->assertJsonPath('data.0.schemaStatus', 'outdated');
});

it('keeps backup catalog and files after restore', function () {
    $first = backupService()->create('first');
    $second = backupService()->create('second');

    callAs('POST', "/api/backups/{$first->id}/restore", [], $this->user)
        ->assertOk();

    $response = callAs('GET', '/api/backups', [], $this->user);
    $response->assertOk();

    $filenames = collect($response->json('data'))->pluck('filename')->sort()->values()->all();
    expect($filenames)->toBe(collect([$first->filename, $second->filename])->sort()->values()->all());
    expect(File::isFile(backupService()->getPath($first->filename)))->toBeTrue();
    expect(File::isFile(backupService()->getPath($second->filename)))->toBeTrue();
});

it('registers orphan backup files when listing', function () {
    $orphan = backupService()->create('will-orphan');
    $filename = $orphan->filename;
    $path = backupService()->getPath($filename);
    $orphan->delete();

    expect(File::isFile($path))->toBeTrue();
    expect(\App\Models\Backup::count())->toBe(0);

    $response = callAs('GET', '/api/backups', [], $this->user);
    $response->assertOk();
    expect($response->json('data.0.filename'))->toBe($filename);
    expect($response->json('data.0.schemaStatus'))->toBe('current');
});

it('applies migrations only to the restored database', function () {
    $backup = backupService()->create('migrate-me');
    $path = backupService()->getPath($backup->filename);
    $hash = hash_file('sha256', $path);

    [$file, $table] = writeProbeMigration();

    callAs('POST', "/api/backups/{$backup->id}/restore", [], $this->user)
        ->assertOk();

    expect(Schema::hasTable($table))->toBeTrue();
    expect(hash_file('sha256', $path))->toBe($hash);

    $pdo = new \PDO('sqlite:'.$path);
    $ran = $pdo->query('SELECT migration FROM migrations')->fetchAll(\PDO::FETCH_COLUMN);
    expect($ran)->not->toContain(basename($file, '.php'));
});
