<?php

namespace App\Models;

use App\Enums\BackupSchemaStatus;
use Illuminate\Database\Eloquent\Model;

class Backup extends Model
{
    protected $fillable = [
        'filename',
        'size',
        'note',
        'app_version',
        'schema_migrations',
    ];

    protected $casts = [
        'size' => 'integer',
        'schema_migrations' => 'array',
    ];

    public function schemaStatus(?array $availableMigrations = null): BackupSchemaStatus
    {
        if (! is_array($this->schema_migrations)) {
            return BackupSchemaStatus::Unknown;
        }

        $available = $availableMigrations ?? array_keys(
            app('migrator')->getMigrationFiles(database_path('migrations'))
        );
        $ran = $this->schema_migrations;

        if (array_diff($ran, $available) !== []) {
            return BackupSchemaStatus::Newer;
        }

        if (array_diff($available, $ran) !== []) {
            return BackupSchemaStatus::Outdated;
        }

        return BackupSchemaStatus::Current;
    }
}
