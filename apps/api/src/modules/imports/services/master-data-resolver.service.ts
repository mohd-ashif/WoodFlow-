import { prisma } from '../../../config/prisma.js';
import { ResolvedMaster, MasterDataSummary } from '../types/import.types.js';

export class MasterDataResolverService {
  /**
   * Single normalization function as per specification:
   * Trims whitespace, collapses internal whitespace sequences to a single space, and lowercases.
   */
  public normalizeMasterName(value?: string): string {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  /**
   * Cleans display name preserving original casing (trim + collapse multi-spaces).
   */
  public cleanDisplayName(value?: string): string {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Derive a clean short code for a unit (e.g., "Running Feet" -> "RF", "Piece" -> "Pcs")
   */
  public deriveShortCode(name: string): string {
    const clean = this.cleanDisplayName(name);
    if (!clean) return 'Pcs';
    const words = clean.split(' ').filter(Boolean);
    if (words.length > 1) {
      return words.map((w) => w[0].toUpperCase()).join('').slice(0, 5);
    }
    if (clean.length <= 4) return clean;
    return clean.slice(0, 4);
  }

  /**
   * Bulk resolve categories for a company without N+1 queries.
   */
  public async bulkResolveCategories(
    client: any,
    companyId: string,
    rawCategoryNames: string[],
    isReadonlyPreview = false
  ): Promise<{ map: Map<string, ResolvedMaster>; summary: MasterDataSummary['categories'] }> {
    const dbClient = client || prisma;
    const categoryMap = new Map<string, ResolvedMaster>();

    // Step 1: Extract unique normalized names and map to clean display names
    const uniqueTargets = new Map<string, { raw: string; clean: string; isDefault: boolean }>();

    for (const raw of rawCategoryNames) {
      const clean = this.cleanDisplayName(raw);
      const norm = this.normalizeMasterName(raw);

      if (!norm) {
        // Fallback default category
        const defaultNorm = 'general';
        if (!uniqueTargets.has(defaultNorm)) {
          uniqueTargets.set(defaultNorm, { raw: 'General', clean: 'General', isDefault: true });
        }
      } else {
        if (!uniqueTargets.has(norm)) {
          uniqueTargets.set(norm, { raw: raw || 'General', clean, isDefault: false });
        }
      }
    }

    if (uniqueTargets.size === 0) {
      uniqueTargets.set('general', { raw: 'General', clean: 'General', isDefault: true });
    }

    // Step 2: Fetch existing categories in bulk for companyId
    const existingList = await dbClient.category.findMany({
      where: { companyId },
      select: { id: true, name: true }
    });

    const existingMap = new Map<string, { id: string; name: string }>();
    existingList.forEach((cat: { id: string; name: string }) => {
      const norm = this.normalizeMasterName(cat.name);
      existingMap.set(norm, cat);
    });

    const namesToCreate: string[] = [];
    const existingNames: string[] = [];
    let tempIdx = 1;

    // Step 3 & 4: Resolve each category
    for (const [norm, info] of uniqueTargets.entries()) {
      if (existingMap.has(norm)) {
        const match = existingMap.get(norm)!;
        existingNames.push(match.name);
        categoryMap.set(norm, {
          id: match.id,
          name: match.name,
          normalizedName: norm,
          created: false,
          isDefault: info.isDefault
        });
      } else {
        namesToCreate.push(info.clean);
        if (isReadonlyPreview) {
          // Read-only preview: generate preview ID without touching database
          categoryMap.set(norm, {
            id: `preview_cat_${tempIdx++}`,
            name: info.clean,
            normalizedName: norm,
            created: true,
            isDefault: info.isDefault
          });
        } else {
          // Execution phase: create category in database with concurrency safety
          let createdCat;
          try {
            createdCat = await dbClient.category.create({
              data: {
                companyId,
                name: info.clean
              }
            });
          } catch (err) {
            // Concurrency catch: if created concurrently, fetch existing
            createdCat = await dbClient.category.findFirst({
              where: { companyId, name: { equals: info.clean, mode: 'insensitive' } }
            });
          }

          if (createdCat) {
            categoryMap.set(norm, {
              id: createdCat.id,
              name: createdCat.name,
              normalizedName: norm,
              created: true,
              isDefault: info.isDefault
            });
          }
        }
      }
    }

    return {
      map: categoryMap,
      summary: {
        existingCount: existingNames.length,
        toCreateCount: namesToCreate.length,
        namesToCreate,
        existingNames
      }
    };
  }

  /**
   * Bulk resolve units for a company without N+1 queries.
   */
  public async bulkResolveUnits(
    client: any,
    companyId: string,
    rawUnitNames: string[],
    isReadonlyPreview = false
  ): Promise<{ map: Map<string, ResolvedMaster>; summary: MasterDataSummary['units'] }> {
    const dbClient = client || prisma;
    const unitMap = new Map<string, ResolvedMaster>();

    const uniqueTargets = new Map<string, { raw: string; clean: string; shortCode: string; isDefault: boolean }>();

    for (const raw of rawUnitNames) {
      const clean = this.cleanDisplayName(raw);
      const norm = this.normalizeMasterName(raw);

      if (!norm) {
        const defaultNorm = 'piece';
        if (!uniqueTargets.has(defaultNorm)) {
          uniqueTargets.set(defaultNorm, { raw: 'Piece', clean: 'Piece', shortCode: 'Pcs', isDefault: true });
        }
      } else {
        if (!uniqueTargets.has(norm)) {
          const shortCode = this.deriveShortCode(clean);
          uniqueTargets.set(norm, { raw: raw || 'Piece', clean, shortCode, isDefault: false });
        }
      }
    }

    if (uniqueTargets.size === 0) {
      uniqueTargets.set('piece', { raw: 'Piece', clean: 'Piece', shortCode: 'Pcs', isDefault: true });
    }

    // Fetch existing units in bulk
    const existingList = await dbClient.unit.findMany({
      where: { companyId },
      select: { id: true, name: true, shortCode: true }
    });

    const existingMap = new Map<string, { id: string; name: string; shortCode: string }>();
    existingList.forEach((u: { id: string; name: string; shortCode: string }) => {
      const normName = this.normalizeMasterName(u.name);
      const normCode = this.normalizeMasterName(u.shortCode);
      existingMap.set(normName, u);
      existingMap.set(normCode, u);
    });

    const namesToCreate: string[] = [];
    const existingNames: string[] = [];
    let tempIdx = 1;

    for (const [norm, info] of uniqueTargets.entries()) {
      if (existingMap.has(norm)) {
        const match = existingMap.get(norm)!;
        existingNames.push(match.name);
        unitMap.set(norm, {
          id: match.id,
          name: match.name,
          shortCode: match.shortCode,
          normalizedName: norm,
          created: false,
          isDefault: info.isDefault
        });
      } else {
        namesToCreate.push(info.clean);
        if (isReadonlyPreview) {
          unitMap.set(norm, {
            id: `preview_unit_${tempIdx++}`,
            name: info.clean,
            shortCode: info.shortCode,
            normalizedName: norm,
            created: true,
            isDefault: info.isDefault
          });
        } else {
          let createdUnit;
          try {
            createdUnit = await dbClient.unit.create({
              data: {
                companyId,
                name: info.clean,
                shortCode: info.shortCode
              }
            });
          } catch (err) {
            createdUnit = await dbClient.unit.findFirst({
              where: {
                companyId,
                OR: [
                  { name: { equals: info.clean, mode: 'insensitive' } },
                  { shortCode: { equals: info.shortCode, mode: 'insensitive' } }
                ]
              }
            });
          }

          if (createdUnit) {
            unitMap.set(norm, {
              id: createdUnit.id,
              name: createdUnit.name,
              shortCode: createdUnit.shortCode,
              normalizedName: norm,
              created: true,
              isDefault: info.isDefault
            });
          }
        }
      }
    }

    return {
      map: unitMap,
      summary: {
        existingCount: existingNames.length,
        toCreateCount: namesToCreate.length,
        namesToCreate,
        existingNames
      }
    };
  }

  /**
   * Combined master resolution helper for categories and units.
   */
  public async bulkResolveMasters(
    client: any,
    companyId: string,
    categoryNames: string[],
    unitNames: string[],
    isReadonlyPreview = false
  ): Promise<{
    categoryMap: Map<string, ResolvedMaster>;
    unitMap: Map<string, ResolvedMaster>;
    summary: MasterDataSummary;
  }> {
    const { map: categoryMap, summary: categorySummary } = await this.bulkResolveCategories(
      client,
      companyId,
      categoryNames,
      isReadonlyPreview
    );

    const { map: unitMap, summary: unitSummary } = await this.bulkResolveUnits(
      client,
      companyId,
      unitNames,
      isReadonlyPreview
    );

    return {
      categoryMap,
      unitMap,
      summary: {
        categories: categorySummary,
        units: unitSummary
      }
    };
  }

  /**
   * Helper to resolve a single category (useful for single row or fallback)
   */
  public async resolveCategory(client: any, companyId: string, categoryName: string): Promise<ResolvedMaster> {
    const { map } = await this.bulkResolveCategories(client, companyId, [categoryName], false);
    const norm = this.normalizeMasterName(categoryName) || 'general';
    return map.get(norm)!;
  }

  /**
   * Helper to resolve a single unit
   */
  public async resolveUnit(client: any, companyId: string, unitName: string): Promise<ResolvedMaster> {
    const { map } = await this.bulkResolveUnits(client, companyId, [unitName], false);
    const norm = this.normalizeMasterName(unitName) || 'piece';
    return map.get(norm)!;
  }
}

export const masterDataResolverService = new MasterDataResolverService();
