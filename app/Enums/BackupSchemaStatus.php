<?php

namespace App\Enums;

enum BackupSchemaStatus: string
{
    case Current = 'current';
    case Outdated = 'outdated';
    case Newer = 'newer';
    case Unknown = 'unknown';
}
