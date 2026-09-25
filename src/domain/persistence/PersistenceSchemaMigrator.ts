/**
 * @file PersistenceSchemaMigrator.ts
 * @module domain/persistence
 * @description Schema migration framework and version validator for persistent learning records (Section 14).
 * 
 * CORE GUARANTEES:
 * - Deterministic Schema Validation: Validates that all records contain known schemaVersion.
 * - Migration Pipeline: Chains stepwise migrations (e.g. 1.0.0 -> 1.1.0 -> 2.0.0).
 * - Safe Rollback: Fails closed on unsupported schemas or migration errors (PERSIST-003).
 * - No Silent Mutation: Every record upgrade is explicit and auditable.
 */

import { CURRENT_PERSISTENCE_SCHEMA_VERSION, PersistentMemorizationEvent, PersistentProfileSnapshot } from './types.ts';
import { SchemaMismatchError } from './errorRegistry.ts';

export type MigrationFunction<TInput = unknown, TOutput = unknown> = (record: TInput) => TOutput;

export class PersistenceSchemaMigrator {
  public static readonly CURRENT_VERSION = CURRENT_PERSISTENCE_SCHEMA_VERSION;

  private static readonly migrationRegistry: Map<string, MigrationFunction> = new Map();

  /**
   * Registers a stepwise migration function from one schema version to another.
   */
  public static registerMigration(
    fromVersion: string,
    toVersion: string,
    migrator: MigrationFunction
  ): void {
    const key = `${fromVersion}->${toVersion}`;
    this.migrationRegistry.set(key, migrator);
  }

  /**
   * Validates that a record's schema version matches the expected version.
   */
  public static validateSchemaVersion(
    record: { schemaVersion?: string },
    expectedVersion: string = this.CURRENT_VERSION
  ): void {
    if (!record || typeof record !== 'object') {
      throw new SchemaMismatchError(expectedVersion, 'undefined-or-null');
    }

    if (!record.schemaVersion) {
      throw new SchemaMismatchError(expectedVersion, 'missing-schema-version');
    }

    if (record.schemaVersion !== expectedVersion) {
      throw new SchemaMismatchError(expectedVersion, record.schemaVersion);
    }
  }

  /**
   * Migrates a generic record to the target version if a migration path exists.
   */
  public static migrateRecord<T extends { schemaVersion: string }>(
    record: T,
    targetVersion: string = this.CURRENT_VERSION
  ): T {
    if (record.schemaVersion === targetVersion) {
      return record;
    }

    let currentVersion = record.schemaVersion;
    let currentRecord: unknown = record;

    // Limit maximum migration hops to prevent infinite loops
    let hops = 0;
    const maxHops = 10;

    while (currentVersion !== targetVersion && hops < maxHops) {
      // Look for direct or next hop
      const directKey = `${currentVersion}->${targetVersion}`;
      if (this.migrationRegistry.has(directKey)) {
        const migrator = this.migrationRegistry.get(directKey)!;
        currentRecord = migrator(currentRecord);
        currentVersion = targetVersion;
        break;
      }

      // Find any transition from currentVersion
      let nextHop: { to: string; fn: MigrationFunction } | null = null;
      for (const [key, fn] of this.migrationRegistry.entries()) {
        if (key.startsWith(`${currentVersion}->`)) {
          const to = key.split('->')[1];
          nextHop = { to, fn };
          break;
        }
      }

      if (!nextHop) {
        throw new SchemaMismatchError(
          targetVersion,
          currentVersion,
          { details: `No migration path found from version '${currentVersion}' to '${targetVersion}'` }
        );
      }

      currentRecord = nextHop.fn(currentRecord);
      currentVersion = nextHop.to;
      hops++;
    }

    if (currentVersion !== targetVersion) {
      throw new SchemaMismatchError(
        targetVersion,
        currentVersion,
        { details: `Exceeded maximum migration hops (${maxHops}) or failed to reach target version.` }
      );
    }

    return currentRecord as T;
  }

  /**
   * Resets registry (primarily for isolated test fixtures).
   */
  public static resetRegistry(): void {
    this.migrationRegistry.clear();
  }
}
