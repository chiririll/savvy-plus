<?php

namespace App\Support;

class LocalizedName
{
    public static function key(string $name): ?string
    {
        $name = trim($name);

        if (preg_match('/^#[A-Z][A-Z0-9_]*$/', $name) !== 1) {
            return null;
        }

        return substr($name, 1);
    }

    public static function display(string $name, string $group = 'categories'): string
    {
        $key = self::key($name);

        if ($key === null) {
            return $name;
        }

        $translationKey = "messages.defaults.{$group}.{$key}";
        $translated = __($translationKey);

        return $translated === $translationKey ? $name : $translated;
    }
}
