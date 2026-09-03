<?php

namespace App\Services;

use App\Enums\BackupSchemaStatus;
use App\Models\Backup;
use Carbon\Carbon;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use PDO;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class BackupService
{
    public function create(?string $note = null): Backup
    {
        $filename = $this->makeFilename();
        $path = config('backup.path');

        File::ensureDirectoryExists($path);
        File::copy(config('database.connections.sqlite.database'), "$path/$filename");
        $this->stampBackupFile("$path/$filename", $note);

        return $this->syncFile("$path/$filename");
    }

    public function upload(UploadedFile $file, ?string $note = null): Backup
    {
        $filename = $this->makeFilename();
        $path = config('backup.path');

        File::ensureDirectoryExists($path);
        $file->move($path, $filename);

        try {
            $this->readBackupFile("$path/$filename");
        } catch (DomainException $e) {
            File::delete("$path/$filename");
            throw $e;
        }

        $this->stampBackupFile("$path/$filename", $note ?? 'Uploaded');

        return $this->syncFile("$path/$filename");
    }

    public function list(): Collection
    {
        return $this->scan();
    }

    public function download(Backup $backup): StreamedResponse
    {
        $path = $this->getPath($backup->filename);

        return response()->streamDownload(function () use ($path) {
            readfile($path);
        }, $backup->filename, [
            'Content-Type' => 'application/x-sqlite3',
        ]);
    }

    public function inspect(Backup $backup): BackupInspection
    {
        $ran = $this->readBackupFile($this->backupFilePath($backup))['migrations'];
        $available = $this->availableMigrations();

        return new BackupInspection(
            pendingMigrations: array_values(array_diff($available, $ran)),
            unknownMigrations: array_values(array_diff($ran, $available)),
        );
    }

    public function restore(Backup $backup): void
    {
        $inspection = $this->inspect($backup);

        if (! $inspection->compatible()) {
            throw new DomainException(__('messages.backup.newer'));
        }

        $backupPath = $this->getPath($backup->filename);
        $dbPath = config('database.connections.sqlite.database');

        DB::disconnect();
        File::copy($backupPath, $dbPath);

        foreach (['-wal', '-shm'] as $suffix) {
            File::delete($dbPath.$suffix);
        }

        DB::reconnect();

        if ($inspection->needsMigration()) {
            Artisan::call('migrate', ['--force' => true]);
        }
    }

    public function delete(Backup $backup): void
    {
        $path = $this->getPath($backup->filename);

        if (File::exists($path)) {
            File::delete($path);
        }

        $backup->delete();
    }

    public function getPath(string $filename): string
    {
        return config('backup.path').'/'.$filename;
    }

    private function makeFilename(): string
    {
        return 'backup-'.now()->format('Y-m-d-H-i-s').'-'.bin2hex(random_bytes(3)).'.sqlite';
    }

    private function ensureBackupsTable(): void
    {
        if (! Schema::hasTable('backups')) {
            Schema::create('backups', function ($table) {
                $table->id();
                $table->string('filename');
                $table->bigInteger('size');
                $table->string('note')->nullable();
                $table->string('app_version')->nullable();
                $table->json('schema_migrations')->nullable();
                $table->timestamps();
            });

            return;
        }

        if (! Schema::hasColumn('backups', 'app_version')) {
            Schema::table('backups', function ($table) {
                $table->string('app_version')->nullable();
            });
        }

        if (! Schema::hasColumn('backups', 'schema_migrations')) {
            Schema::table('backups', function ($table) {
                $table->json('schema_migrations')->nullable();
            });
        }
    }

    private function scan(): Collection
    {
        $this->ensureBackupsTable();

        $path = config('backup.path');
        File::ensureDirectoryExists($path);

        $keep = [];

        foreach (File::files($path) as $file) {
            if (strtolower($file->getExtension()) !== 'sqlite') {
                continue;
            }

            $keep[] = $this->syncFile($file->getPathname())->id;
        }

        if ($keep === []) {
            Backup::query()->delete();
        } else {
            Backup::query()->whereNotIn('id', $keep)->delete();
        }

        $available = $this->availableMigrations();

        return Backup::orderByDesc('created_at')->get()->each(function (Backup $backup) use ($available) {
            $backup->setAttribute('schema_status', $backup->schemaStatus($available)->value);
        });
    }

    private function syncFile(string $path): Backup
    {
        $this->ensureBackupsTable();

        $filename = basename($path);

        try {
            $info = $this->readBackupFile($path);
            $migrations = $info['migrations'];
            $note = $info['note'];
        } catch (DomainException) {
            $migrations = null;
            $note = null;
        }

        $backup = Backup::query()->firstOrNew(['filename' => $filename]);
        $backup->size = File::size($path);
        $backup->app_version = $this->schemaVersionFromMigrations($migrations);
        $backup->schema_migrations = $migrations;

        if ($note !== null || ! $backup->exists) {
            $backup->note = $note;
        }

        if (! $backup->exists) {
            $backup->created_at = $this->timestampFromFilename($filename) ?? now();
        }

        $backup->save();
        $backup->setAttribute('schema_status', $this->statusFromMigrations($migrations)->value);

        return $backup;
    }

    /**
     * @param  list<string>|null  $migrations
     */
    private function schemaVersionFromMigrations(?array $migrations): ?string
    {
        if ($migrations === null || $migrations === []) {
            return null;
        }

        $latest = collect($migrations)->sort()->last();

        if (! is_string($latest) || ! preg_match('/^(\d{4})_(\d{2})_(\d{2})_(\d{6})/', $latest, $matches)) {
            return $latest;
        }

        return sprintf('%s-%s-%s.%s', $matches[1], $matches[2], $matches[3], $matches[4]);
    }

    private function statusFromMigrations(?array $ran): BackupSchemaStatus
    {
        $backup = new Backup(['schema_migrations' => $ran]);

        return $backup->schemaStatus($this->availableMigrations());
    }

    private function timestampFromFilename(string $filename): ?Carbon
    {
        if (! preg_match('/backup-(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})(?:-[a-f0-9]+)?\.sqlite$/', $filename, $matches)) {
            return null;
        }

        return Carbon::createFromFormat('Y-m-d-H-i-s', $matches[1]) ?: null;
    }

    /**
     * @return list<string>
     */
    private function availableMigrations(): array
    {
        return array_keys(app('migrator')->getMigrationFiles(database_path('migrations')));
    }

    private function backupFilePath(Backup $backup): string
    {
        $path = $this->getPath($backup->filename);

        if (! File::isFile($path)) {
            throw new DomainException(__('messages.backup.missing'));
        }

        return $path;
    }

    private function stampBackupFile(string $path, ?string $note = null): void
    {
        if ($note === null) {
            return;
        }

        $pdo = new PDO('sqlite:'.$path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        $pdo->exec('PRAGMA journal_mode=DELETE');
        $pdo->exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT)');

        $statement = $pdo->prepare(
            'INSERT INTO settings (key, value) VALUES (:key, :value)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value'
        );
        $statement->execute([
            'key' => 'backup_note',
            'value' => json_encode($note),
        ]);
    }

    /**
     * @return array{migrations: list<string>, note: ?string}
     */
    private function readBackupFile(string $path): array
    {
        if (! File::isFile($path)) {
            throw new DomainException(__('messages.backup.missing'));
        }

        try {
            $pdo = new PDO('sqlite:'.$path, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::SQLITE_ATTR_OPEN_FLAGS => PDO::SQLITE_OPEN_READONLY,
            ]);
        } catch (Throwable) {
            throw new DomainException(__('messages.backup.invalid'));
        }

        try {
            $pdo->query('SELECT 1');

            return [
                'migrations' => $this->readMigrations($pdo),
                'note' => $this->readSetting($pdo, 'backup_note'),
            ];
        } catch (DomainException $e) {
            throw $e;
        } catch (Throwable) {
            throw new DomainException(__('messages.backup.invalid'));
        }
    }

    /**
     * @return list<string>
     */
    private function readMigrations(PDO $pdo): array
    {
        $hasTable = $pdo->query(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'migrations'"
        )->fetchColumn();

        if (! $hasTable) {
            return [];
        }

        return $pdo->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);
    }

    private function readSetting(PDO $pdo, string $key): ?string
    {
        $hasTable = $pdo->query(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'settings'"
        )->fetchColumn();

        if (! $hasTable) {
            return null;
        }

        $statement = $pdo->prepare('SELECT value FROM settings WHERE key = :key');
        $statement->execute(['key' => $key]);
        $value = $statement->fetchColumn();

        if (! is_string($value) || $value === '') {
            return null;
        }

        $decoded = json_decode($value, true);

        return is_string($decoded) ? $decoded : $value;
    }
}
