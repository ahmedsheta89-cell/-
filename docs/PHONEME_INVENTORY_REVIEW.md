# PHONEME INVENTORY REVIEW & SCIENTIFIC AUDIT
## Quran Recitation Phonetic System (Hafs 'an 'Asim)
**Document Status:** `ENGINEERED / NOT YET SCHOLAR-AND-PHONETICALLY-VERIFIED`  
**Classification:** Academic & Engineering Hold  
**Auditor:** Quran Recitation Audio Systems Engineer & Phonetics Auditor  
**Date:** September 2026  

---

### 1. Executive Summary & Inventory Conflict Resolution

In previous engineering documents, the inventory size of the phonetic alignment engine was reported inconsistently as **42 symbols** and **38 symbols**.

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          PHONETIC INVENTORY STATUS                                   ║
║                                                                                      ║
║     [ CLASSIFICATION: ENGINEERED / NOT YET SCHOLAR-AND-PHONETICALLY-VERIFIED ]       ║
║                                                                                      ║
║  • 42 vs 38 Inventory Conflict: RESOLVED & FROZEN UNDER FORMAL AUDIT HOLD           ║
║  • 28 Arabic Consonants (Huruf Hijaiyyah)    : RECOGNIZED PHONEMES                   ║
║  • Madd Vowels (Alif, Waw, Yaa Maddiyyah)    : SUPRASEGMENTAL PHONEMIC DURATION      ║
║  • Short Harakat (Fathah, Dammah, Kasrah)    : PHONETIC VOWELS (CURRENTLY STRIPPED)  ║
║  • Ghunnah (Ikhfa, Idgham, Iqlab)            : CO-ARTICULATORY NASALIZATION          ║
║  • Qalqalah (5 Letters)                      : ACOUSTIC PLOSIVE BURST RELEASE        ║
║  • Tajweed Realizations                      : CONTEXT-CONDITIONED ALLOPHONES        ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

**CRITICAL DIRECTIVE:**  
Neither 38 nor 42 is finalized as an established scientific or religious fact. The token set currently in the repository is an **engineered tokenization model** designed as an initial computational target, not a definitive canonical phonology endorsed by an official scholarly council (Azhar, King Fahd Complex, or scholarly Tajweed committee).

---

### 2. Dissection: Phonemes vs Allophones vs Tajweed Realizations

To prevent computational conflation, the Quranic acoustic inventory must be strictly segregated into linguistic and acoustic strata:

#### Stratum 1: Primary Consonantal Phonemes (28 Letters)
The 28 root consonants of the Arabic alphabet with distinct Quranic points of articulation (*Makharij*):
1. Hamzah ($ʔ$) — أقصى الحلق
2. Haa ($h$) — أقصى الحلق
3. 'Ayn ($ʕ$) — وسط الحلق
4. Haa' Muhmalah ($ħ$) — وسط الحلق
5. Ghayn ($ɣ$) — أدنى الحلق
6. Khaa' ($x$) — أدنى الحلق
7. Qaaf ($q$) — أقصى اللسان مع الحنك اللحمي
8. Kaaf ($k$) — أقصى اللسان مع الحنك العظمي
9. Jeem ($d͡ʒ$) — وسط اللسان
10. Sheen ($ʃ$) — وسط اللسان
11. Yaa Ghayr Maddiyyah ($j$) — وسط اللسان
12. Daad ($dˤ$) — إحدى حافتي اللسان
13. Laam ($l$) — أدنى حافتي اللسان إلى منتهى طرفه
14. Noon ($n$) — طرف اللسان تحت مخرج اللام
15. Raa ($r$) — طرف اللسان بالقرب من مخرج النون
16. Ta' Mutbaqah ($tˤ$) — طرف اللسان مع أصول الثنايا العليا
17. Daal ($d$) — طرف اللسان مع أصول الثنايا العليا
18. Taa ($t$) — طرف اللسان مع أصول الثنايا العليا
19. Saad ($sˤ$) — طرف اللسان فويق الثنايا السفلى
20. Zay ($z$) — طرف اللسان فويق الثنايا السفلى
21. Seen ($s$) — طرف اللسان فويق الثنايا السفلى
22. Dhaa' Mutbaqah ($ðˤ$) — طرف اللسان مع أطراف الثنايا العليا
23. Dhaal ($ð$) — طرف اللسان مع أطراف الثنايا العليا
24. Thaa' ($θ$) — طرف اللسان مع أطراف الثنايا العليا
25. Faa' ($f$) — بطن الشفة السفلى مع أطراف الثنايا العليا
26. Baa' ($b$) — بين الشفتين بانطباق
27. Meem ($m$) — بين الشفتين بانطباق مع غنة
28. Waw Ghayr Maddiyyah ($w$) — بين الشفتين بانضمام

---

#### Stratum 2: Short Vowels (*Harakat*) — Currently Deficient
- **Fathah** ($a$)
- **Dammah** ($u$)
- **Kasrah** ($i$)

**Code Audit Finding:**  
In `QuranPhonemeLexicon.wordToPhonemes()`, regex stripping `replace(/[\u064B-\u0652]/g, '')` deletes all short harakat from the target phone stream. As a result, the word `بِسْمِ` generates only `[BAA, SEEN, MEEM]`. This causes the forced alignment trellis to search for consonants only, ignoring 50% of the speech duration represented by vowels.

---

#### Stratum 3: Long Vowels & Madd (*Alif, Waw, Yaa Maddiyyah*)
- **Alif Maddiyyah** ($aː$) — مخرج الجوف
- **Waw Maddiyyah** ($uː$) — مخرج الجوف
- **Yaa Maddiyyah** ($iː$) — مخرج الجوف
- **Madd Durations**: $2$ harakat (Tabee'ee), $4-5$ harakat (Muttasil/Munfasil), $6$ harakat (Laazim).  
*Classification:* Duration-extended allophones governed by suprasegmental acoustic rules, requiring temporal interval boundaries rather than isolated discrete token IDs.

---

#### Stratum 4: Nasal Resonance (*Ghunnah*)
- **Noon Sakinah / Tanween**:
  - Idgham with Ghunnah (ي، ن، م، و)
  - Ikhfa' Haqiqi (15 letters)
  - Iqlab (ب)
- **Noon and Meem Mushaddadatayn** ($nː$, $mː$)
*Acoustic Reality:* Ghunnah is an acoustic co-articulation phenomenon occurring simultaneously with oral constriction, yielding a nasal formant cluster ($F_{N1} \approx 250\text{ Hz}, F_{N2} \approx 1000\text{ Hz}$). Treating Ghunnah as an isolated sequential token without nasal formant modeling is an engineering approximation.

---

#### Stratum 5: Acoustic Burst Release (*Qalqalah*)
- Letters: **ق، ط، ب، ج، د** when Sakinah.
- Sughra (Mid-word) vs Kubra (Waqf).
*Acoustic Reality:* A high-pressure plosive acoustic burst release following oral occlusion. It is not an independent phoneme, but an acoustic state transition (*Plosive Burst Phase*).

---

### 3. Recommendations for Scholarly & Scientific Verification

1. **Formal Joint Council**: Convene a committee consisting of:
   - Certified Quranic Reciters (حاملي الإجازات القرآنية بالسند المتصل).
   - Acoustic Phonetics Researchers specializing in Semitic languages.
2. **Multi-tier Token Representation**:
   - Tier A: Base phoneme sequence (Consonants + Harakat).
   - Tier B: Suprasegmental Tajweed overlays (Madd intervals, Ghunnah durations, Tafkheem/Tarqeeq resonances).
3. **Strict Ban on Fiqh Autonomy**:
   - No algorithmic decision shall penalize a user or mark a religious defect based on the unverified 38/42 symbol token inventories.

---

### 4. Phase 4D Update — Empirical Real-World Token Observations

During Phase 4D empirical neural execution of the `Zipformer2-CTC` Quranic model (`models/saboorhsn/quran-stt-int8.onnx`), the model emitted tokens from a **251-symbol inventory** combining consonants with vowels and tajweed diacritics directly (e.g. `بِ`, `س`, `مِ`, `للَاا`, `هِ`, `ررَ`, `حمَاا`, `نِ`, `ررَ`, `حِۦۦۦۦ`, `م`).

**Key Architectural Insights:**
- The empirical CTC model avoids the manual stripping of short vowels that crippled earlier lexicons: it explicitly recognizes diacritized syllables (`بِ`, `مِ`, `نِ`).
- Madd letters are modeled as repeated duration units (e.g., `ۦۦۦۦ` for extended madd in Basmalah).
- The inventory remains classified as `ENGINEERING_DRAFT / EMPIRICALLY_VERIFIED_ACOUSTIC_ONLY` pending scholarly council endorsement for religious evaluation. The acoustic model serves strictly as an acoustic alignment guide, not a source of Quranic doctrinal truth.

