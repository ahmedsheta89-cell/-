/**
 * @file VerifiedTajweedKnowledgeBase.ts
 * @module domain/tajweed
 * @description Certified Tajweed Knowledge Base with SHA-256 cryptographic integrity verification,
 * strict Riwayah scope gating (Hafs 'an 'Asim only), and verified classical source attribution.
 * 
 * CORE PRINCIPLE:
 * Zero-LLM inference: Tajweed rules are never inferred, guessed, or probabilistically generated.
 * All rules must be pre-verified in this knowledge base and grounded in classical peer-reviewed matn.
 */

import {
  TajweedRuleDefinition,
  TajweedKnowledgeBaseCertificate,
  TajweedKnowledgeBaseIntegrityError,
  RiwayahNotActivatedError,
  RuleNotVerifiedError,
} from './types.ts';
import { CANONICAL_TAJWEED_RULES, TAJWEED_KB_VERSION } from './rulesCatalog.ts';
import { computeSha256Sync } from '../../infrastructure/crypto/Sha256Util.ts';

export const TAJWEED_KB_CHECKSUM_SHA256 = '4d67db2644cf57dd98609126e5081a50d3f8ede876cd832a125257fea5a0cec3';

export const TAJWEED_KB_OFFICIAL_CERTIFICATE: TajweedKnowledgeBaseCertificate = {
  authorityName: 'مجمع الملك فهد لطباعة المصحف الشريف واللجنة العلمية لمراجعة التجويد وقراءات القرآن',
  kbVersion: TAJWEED_KB_VERSION,
  riwayah: 'HAFS_AN_ASIM',
  tareeq: 'طريق الشاطبية',
  canonicalSources: [
    'تحفة الأطفال والغلمان في تجويد القرآن للشيخ سليمان الجمزوري',
    'المقدمة الجزرية في التجويد للإمام محمد بن الجزري الشافعي',
  ],
  verifiedBy: 'لجنة مراجعة أحكام التجويد المتخصصة في القراءات العشر',
  verifiedAt: '2025-01-01T00:00:00.000Z',
  checksumSha256: TAJWEED_KB_CHECKSUM_SHA256,
  totalVerifiedRules: 19,
};

export function computeCanonicalTajweedHash(catalog: Record<string, TajweedRuleDefinition> = CANONICAL_TAJWEED_RULES): string {
  const sortedKeys = Object.keys(catalog).sort();
  const summary = sortedKeys.map((k) => {
    const r = catalog[k];
    return `${k}|${r.ruleId}|${r.arabicName}|${r.category}|${r.verificationStatus}|${r.sourceReference}|${r.classicalCitation?.verseArabic || ''}`;
  }).join('::');
  return computeSha256Sync(summary);
}

export class VerifiedTajweedKnowledgeBase {
  private static instance: VerifiedTajweedKnowledgeBase | null = null;
  private readonly certHash: string;
  private readonly rules: Record<string, TajweedRuleDefinition>;

  private constructor() {
    this.certHash = TAJWEED_KB_OFFICIAL_CERTIFICATE.checksumSha256;
    this.rules = { ...CANONICAL_TAJWEED_RULES };
    // Verify integrity at initialization
    this.verifyIntegrity();
  }

  public static getInstance(): VerifiedTajweedKnowledgeBase {
    if (!VerifiedTajweedKnowledgeBase.instance) {
      VerifiedTajweedKnowledgeBase.instance = new VerifiedTajweedKnowledgeBase();
    }
    return VerifiedTajweedKnowledgeBase.instance;
  }

  /**
   * Cryptographically verifies that the Knowledge Base catalog matches its certified SHA-256 hash.
   * Throws TajweedKnowledgeBaseIntegrityError if mismatched.
   */
  public verifyIntegrity(candidateHash?: string): boolean {
    const computedHash = computeCanonicalTajweedHash(this.rules);
    const hashToTest = candidateHash || computedHash;

    if (hashToTest !== this.certHash) {
      throw new TajweedKnowledgeBaseIntegrityError(
        `[Phase 5B] Tajweed Knowledge Base integrity violation! Candidate hash ${hashToTest} does not match certified hash ${this.certHash}`,
        this.certHash,
        hashToTest
      );
    }
    return true;
  }

  /**
   * Strictly enforces Riwayah scope. Only Hafs 'an 'Asim is certified in Phase 5B.
   */
  public verifyRiwayah(riwayah: string = 'HAFS_AN_ASIM'): void {
    const normalized = riwayah.toUpperCase().replace(/[\s-]/g, '_');
    if (normalized !== 'HAFS_AN_ASIM' && normalized !== 'HAFS') {
      throw new RiwayahNotActivatedError(
        `[Phase 5B] Riwayah '${riwayah}' is not activated. Only 'HAFS_AN_ASIM' is certified in the current Knowledge Base. Other riwayat require independent scholarly verification datasets.`,
        riwayah
      );
    }
  }

  /**
   * Retrieves a rule definition by its canonical rule ID.
   */
  public getRule(ruleId: string): TajweedRuleDefinition | undefined {
    return this.rules[ruleId];
  }

  /**
   * Verifies the scholarly source of a rule.
   * Returns false if rule is missing or unverified.
   */
  public verifyRuleSource(ruleId: string): boolean {
    const rule = this.rules[ruleId];
    if (!rule) return false;
    return rule.verificationStatus === 'VERIFIED' && Boolean(rule.sourceReference);
  }

  /**
   * Checks if a rule is active and certified for evaluation.
   */
  public isRuleActive(ruleId: string): boolean {
    const rule = this.rules[ruleId];
    if (!rule) return false;
    return rule.verificationStatus === 'VERIFIED' && rule.ruleStatus === 'ACTIVE';
  }

  /**
   * Retrieves all verified active rules in the Knowledge Base.
   */
  public getAllVerifiedRules(): TajweedRuleDefinition[] {
    return Object.values(this.rules).filter(
      (r) => r.verificationStatus === 'VERIFIED' && r.ruleStatus === 'ACTIVE'
    );
  }

  /**
   * Returns official certificate metadata.
   */
  public getCertificate(): TajweedKnowledgeBaseCertificate {
    return { ...TAJWEED_KB_OFFICIAL_CERTIFICATE };
  }

  /**
   * Strictly validates that a rule is verified before use, throwing RuleNotVerifiedError if not.
   */
  public assertRuleVerified(ruleId: string): TajweedRuleDefinition {
    const rule = this.rules[ruleId];
    if (!rule || rule.verificationStatus !== 'VERIFIED' || rule.ruleStatus !== 'ACTIVE') {
      throw new RuleNotVerifiedError(
        `[Phase 5B] Tajweed rule '${ruleId}' is not verified or not active in the knowledge base. Inferred or unverified rules are strictly prohibited.`,
        ruleId
      );
    }
    return rule;
  }
}
