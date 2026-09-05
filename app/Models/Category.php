<?php

namespace App\Models;

use App\Support\LocalizedName;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'type', 'icon', 'color'];

    public function displayName(): string
    {
        return LocalizedName::display($this->name);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function budgets(): BelongsToMany
    {
        return $this->belongsToMany(Budget::class);
    }
}
