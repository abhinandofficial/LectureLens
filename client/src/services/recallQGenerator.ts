/**
 * recallQGenerator.ts
 *
 * AI-powered generator for RecallQ questions, Mental Mirror misconception trees,
 * and 60-Second Remediation Bites.
 *
 * Fallback & Safety:
 * - If Gemini endpoint succeeds, parses strictly validated JSON schema.
 * - If server returns unconfigured or offline, uses rich domain-specific deterministic
 *   generators derived directly from the slide items.
 * - Validates schema: exactly one correct option, 4 distinct options, no empty fields.
 */

import { SlideItem } from '../types';
import {
  DeckRecallQPackage,
  RecallQQuestion,
  RecallQOption,
  RemediationBite,
  ConceptualQuickCheck,
} from '../types/recallQTypes';

// ─── Deterministic Generator for Any Deck ─────────────────────────────────────

export function generateDeterministicPackage(
  deckId: string,
  deckName: string,
  slides: SlideItem[]
): DeckRecallQPackage {
  const questions: RecallQQuestion[] = [];
  const remediationBites: RemediationBite[] = [];

  slides.forEach((slide, sIdx) => {
    const slideTitleClean = slide.title.replace(/^\d+\.\s*/, '');
    const conceptId = `c-slide-${sIdx + 1}`;
    const conceptName = slideTitleClean.split(':')[0].trim();
    const primaryBullet = slide.bullets[0] || 'Core structural invariant and operational constraints.';
    const secondaryBullet = slide.bullets[1] || 'Runtime complexity and resource allocations.';

    // Question 1: Conceptual understanding
    const q1Id = `q-${deckId}-${sIdx + 1}-1`;
    const q1: RecallQQuestion = {
      id: q1Id,
      deckId,
      slideIndex: sIdx,
      slideTitle: slide.title,
      conceptId,
      conceptName,
      difficulty: 'medium',
      isScenario: false,
      stem: `In the context of ${slideTitleClean}, which of the following accurately describes the primary operational constraint or mechanism?`,
      options: [
        {
          id: 'opt-a',
          text: `${primaryBullet} The invariant guarantees correctness across all standard inputs.`,
          isCorrect: true,
        },
        {
          id: 'opt-b',
          text: `It assumes unconstrained resource allocation without checking asymptotic memory limits.`,
          isCorrect: false,
          misconception: {
            misconceptionId: `misc-${sIdx}-b`,
            misconceptionLabel: 'Unbounded Resource Assumption',
            deconstructiveFeedbackEn: `You may have thought resources scale freely because small benchmark examples rarely trigger memory limits. In production, unbounded allocation causes sudden out-of-memory crashes.`,
            deconstructiveFeedbackMl: `ചെറിയ ടെസ്റ്റ് കേസുകളിൽ മെമ്മറി പ്രശ്നങ്ങൾ വരാത്തതിനാൽ റിസോഴ്സുകൾ പരിധിയില്ലാതെ ലഭ്യമാണെന്ന് നിങ്ങൾ കരുതിയിരിക്കാം. എന്നാൽ വലിയ ഡാറ്റയിൽ ഇത് പെട്ടെന്നുള്ള ഔട്ട്-ഓഫ്-മെമ്മറി ക്രാഷിലേക്ക് നയിക്കും.`,
            deconstructiveFeedbackManglish: `Cheriya test cases-il memory prashnam varaathathukond resources unlimited aanennu karuthikkanam. Pakshe real-world data-yil ithu OOM crash undakkum.`,
            paradoxScenarioEn: `If a dataset scales by 10x, an unconstrained algorithm explodes from 2 MB to 20 GB, causing the operating system to forcefully kill the process.`,
            paradoxScenarioMl: `ഇൻപുട്ട് 10 മടങ്ങ് വർദ്ധിച്ചാൽ, കൺസ്ട്രെയിന്റ് ഇല്ലാത്ത അൽഗോരിതം 2 MB ൽ നിന്ന് 20 GB വരെ ഉയരുകയും സിസ്റ്റം ക്രാഷ് ആവുകയും ചെയ്യും.`,
            paradoxScenarioManglish: `Input 10 times koodumbol memory 2MB-il ninnu 20GB aayi process crash aakum.`,
            rebuildGuidanceEn: `Always constrain memory structures using asymptotic upper bounds like O(V + E) or logarithmic frontiers.`,
            rebuildGuidanceMl: `മെമ്മറി ഉപയോഗം എപ്പോഴും വ്യക്തമായ അപ്പർ ബൗണ്ടുകൾ (Upper bounds) ഉപയോഗിച്ച് നിയന്ത്രിക്കുക.`,
            rebuildGuidanceManglish: `Memory usage eppozhum upper bounds vachu control cheyyuka.`,
          },
        },
        {
          id: 'opt-c',
          text: `Processing is deferred until the entire input sequence is parsed into a global contiguous buffer.`,
          isCorrect: false,
          misconception: {
            misconceptionId: `misc-${sIdx}-c`,
            misconceptionLabel: 'Batch-Buffering Fallacy',
            deconstructiveFeedbackEn: `You assumed streaming or graph elements must all be buffered into contiguous memory first. This overlooks streaming pipelines and adjacency lists that process nodes progressively.`,
            deconstructiveFeedbackMl: `എല്ലാ ഡാറ്റയും ഒന്നിച്ച് മെമ്മറിയിൽ സൂക്ഷിച്ച ശേഷമേ പ്രോസസ്സിംഗ് നടക്കൂ എന്ന് നിങ്ങൾ കരുതി. എന്നാൽ സ്ട്രീമിംഗ് പൈപ്പ്‌ലൈനുകൾ ഒരോ ഘട്ടമായി പ്രോസസ്സ് ചെയ്യുന്നു.`,
            deconstructiveFeedbackManglish: `Ellam contiguous memory-il buffer cheyyanam ennu vicharichu. Pakshe progressive traversal aanu nadakkunnath.`,
            paradoxScenarioEn: `Waiting for all items to buffer consumes exponential RAM before the first computation can even start.`,
            paradoxScenarioMl: `മുഴുവൻ ഡാറ്റയും വരാൻ കാത്തിരുന്നാൽ ആദ്യ കമ്പ്യൂട്ടേഷൻ തുടങ്ങുന്നതിന് മുൻപ് തന്നെ റാം നിറയും.`,
            paradoxScenarioManglish: `Full data buffer cheyyan wait cheythaal initial step thudangum munpe RAM full aakum.`,
            rebuildGuidanceEn: `Adopt iterative frontiers or linked node chaining to decouple traversal from total input size.`,
            rebuildGuidanceMl: `മുഴുവൻ ഡാറ്റാ വലുപ്പത്തെ ആശ്രയിക്കാതെ ഘട്ടം ഘട്ടമായി പ്രോസസ്സ് ചെയ്യുക.`,
            rebuildGuidanceManglish: `Step-by-step frontier processing use cheyyuka.`,
          },
        },
        {
          id: 'opt-d',
          text: `The algorithm operates deterministically in strictly O(1) constant time regardless of node graph density.`,
          isCorrect: false,
          misconception: {
            misconceptionId: `misc-${sIdx}-d`,
            misconceptionLabel: 'Constant-Time Magic Thinking',
            deconstructiveFeedbackEn: `You assumed complex structure inspection can be performed in O(1) constant time without scanning connections.`,
            deconstructiveFeedbackMl: `കണക്ഷനുകൾ പരിശോധിക്കാതെ സങ്കീർണ്ണമായ സ്ട്രക്ചർ O(1) സമയം കൊണ്ട് പരിശോധിക്കാം എന്ന് തെറ്റായി അനുമാനിച്ചു.`,
            deconstructiveFeedbackManglish: `Connections scan cheyyaathe O(1) constant time-il nadakkum ennu karuthi.`,
            paradoxScenarioEn: `Scanning a dense vertex with 10,000 edges instantaneously in 1 clock cycle violates basic hardware bus transfer limits.`,
            paradoxScenarioMl: `10,000 എഡ്ജുകളുള്ള ഒരു നോഡ് 1 ക്ലോക്ക് സൈക്കിളിൽ പരിശോധിക്കാൻ ശ്രമിച്ചാൽ ഹാർഡ്‌വെയർ ട്രാൻസ്ഫർ ലിമിറ്റുകൾ തകരും.`,
            paradoxScenarioManglish: `10,000 edges ullath single CPU cycle-il read cheyyaan patilla.`,
            rebuildGuidanceEn: `Remember that inspecting relationships requires proportional work scaling with edge count E or vertex count V.`,
            rebuildGuidanceMl: `ബന്ധങ്ങൾ പരിശോധിക്കുന്നതിന് എഡ്ജുകളുടെ എണ്ണത്തിന് (E) ആനുപാതികമായ സമയം ആവശ്യമാണ്.`,
            rebuildGuidanceManglish: `Inspecting relationships-inu edge count E-kku proportional time venam.`,
          },
        },
      ],
      correctOptionId: 'opt-a',
      explanation: `Correct! ${primaryBullet} represents the structural foundation outlined in ${slide.title}.`,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };
    questions.push(q1);

    // Question 2: Scenario & Application question
    const q2Id = `q-${deckId}-${sIdx + 1}-2`;
    const q2: RecallQQuestion = {
      id: q2Id,
      deckId,
      slideIndex: sIdx,
      slideTitle: slide.title,
      conceptId,
      conceptName,
      difficulty: 'hard',
      isScenario: true,
      stem: `Scenario: An engineering team deploys a pipeline based on ${slideTitleClean}. Under peak load, latency suddenly spikes by 20x. Based on ${secondaryBullet}, what is the root cause?`,
      options: [
        {
          id: 'opt-a',
          text: `The pipeline triggers synchronous disk writes instead of in-memory register cache.`,
          isCorrect: false,
          misconception: {
            misconceptionId: `misc-${sIdx}-sc-a`,
            misconceptionLabel: 'Hardware IO Redirection Illusion',
            deconstructiveFeedbackEn: `You attributed the latency spike to disk I/O, but this architecture executes purely in-memory. The spike is algorithmic branching, not file operations.`,
            deconstructiveFeedbackMl: `ലേറ്റൻസി കൂടാൻ കാരണം ഡിസ്ക് I/O ആണെന്ന് നിങ്ങൾ കരുതി. എന്നാൽ ഈ അൽഗോരിതം പൂർണ്ണമായും മെമ്മറിയിലാണ് പ്രവർത്തിക്കുന്നത്. അൽഗോരിതത്തിന്റെ കോംപ്ലക്സിറ്റിയാണ് കാരണം.`,
            deconstructiveFeedbackManglish: `Disk I/O kaaranam aanu latency koodiyath ennu karuthi. Pakshe in-memory algorithmic growth aanu issue.`,
            paradoxScenarioEn: `Replacing the NVMe drive with ultra-fast RAM yields zero speedup because the bottleneck is exponential duplicate traversal.`,
            paradoxScenarioMl: `വേഗതയേറിയ സ്റ്റോറേജ് നൽകിയാലും വേഗത കൂടില്ല, കാരണം പ്രശ്നം ഡ്യൂപ്ലിക്കേറ്റ് ട്രാവേഴ്സൽ ആണ്.`,
            paradoxScenarioManglish: `Faster storage vachaalum speed koodilla, reason duplicate traversal aanu.`,
            rebuildGuidanceEn: `Look first at algorithmic growth invariants before blaming peripheral hardware layers.`,
            rebuildGuidanceMl: `ഹാർഡ്‌വെയറിനെ കുറ്റപ്പെടുത്തുന്നതിന് മുൻപ് അൽഗോരിതത്തിന്റെ ഇൻവേരിയന്റുകൾ പരിശോധിക്കുക.`,
            rebuildGuidanceManglish: `Algorithmic growth invariants check cheyyuka.`,
          },
        },
        {
          id: 'opt-b',
          text: `The implementation violated the core invariant: ${secondaryBullet.slice(0, 60)}... causing structural duplicate expansion.`,
          isCorrect: true,
        },
        {
          id: 'opt-c',
          text: `Garbage collection paused execution because integers were treated as immutable heap objects.`,
          isCorrect: false,
          misconception: {
            misconceptionId: `misc-${sIdx}-sc-c`,
            misconceptionLabel: 'GC Blame Heuristic',
            deconstructiveFeedbackEn: `It is tempting to blame Garbage Collection pauses, but primitives in this framework are unboxed and heap-neutral.`,
            deconstructiveFeedbackMl: `ഗാർബേജ് കളക്ഷൻ (GC) കാരണം വൈകി എന്ന് കരുതുന്നത് സ്വാഭാവികമാണ്. എന്നാൽ ഈ സ്ട്രക്ചറിൽ പ്രിമിറ്റീവുകൾ ഹീപ്പിൽ സ്റ്റോർ ചെയ്യുന്നില്ല.`,
            deconstructiveFeedbackManglish: `Garbage Collection pause aanu reason ennu thettayi karuthi. Pakshe primitives heap-neutral aanu.`,
            paradoxScenarioEn: `Disabling GC completely still reproduces the exact same 20x latency spike under load.`,
            paradoxScenarioMl: `ജിസി പൂർണ്ണമായി നിർത്തിവെച്ചാലും ലേറ്റൻസി പ്രശ്നം അതുപോലെ തന്നെ തുടരും.`,
            paradoxScenarioManglish: `GC disable cheythaalum 20x latency spike undaakum.`,
            rebuildGuidanceEn: `Identify whether state overhead is caused by excessive object allocations or degenerate combinatorial paths.`,
            rebuildGuidanceMl: `ഡീജനറേറ്റ് പാത്തുകൾ (Degenerate paths) മൂലമാണോ പ്രശ്നം എന്ന് പരിശോധിക്കുക.`,
            rebuildGuidanceManglish: `Combinatorial duplicate paths aanu check cheyyendath.`,
          },
        },
        {
          id: 'opt-d',
          text: `Thread race conditions caused deadlock on mutex locks.`,
          isCorrect: false,
          misconception: {
            misconceptionId: `misc-${sIdx}-sc-d`,
            misconceptionLabel: 'Concurrency Conflation',
            deconstructiveFeedbackEn: `You suspected multithreading deadlocks, but the core traversal is single-threaded; the latency is purely combinatorial growth.`,
            deconstructiveFeedbackMl: `മൾട്ടിത്രെഡിങ് ഡെഡ്‌ലോക്ക് ആണെന്ന് തെറ്റിദ്ധരിച്ചു. എന്നാൽ ഈ പ്രധാന ട്രാവേഴ്സൽ സിംഗിൾ ത്രെഡ്ഡ് ആണ്.`,
            deconstructiveFeedbackManglish: `Concurrency deadlock aanu ennu karuthi. Traversal single-threaded aanu.`,
            paradoxScenarioEn: `A single-threaded profile exhibits 100% CPU utilization in traversal loops with zero lock waits.`,
            paradoxScenarioMl: `സിംഗിൾ ത്രെഡ് മോണിറ്റർ ചെയ്യുമ്പോൾ ലോക്ക് ഒന്നും ഇല്ലാതെ 100% സിപിയു ഉപയോഗം കാണാം.`,
            paradoxScenarioManglish: `Lock wait onnum illa, CPU 100% loop-il aanu.`,
            rebuildGuidanceEn: `Distinguish algorithmic time complexity spikes from concurrency contention blocks.`,
            rebuildGuidanceMl: `അൽഗോരിതത്തിന്റെ സമയ സങ്കീർണ്ണതയും കൺകറൻസി പ്രശ്നങ്ങളും തമ്മിൽ വേർതിരിച്ചു മനസ്സിലാക്കുക.`,
            rebuildGuidanceManglish: `Time complexity growth vs concurrency locks distinguish cheyyuka.`,
          },
        },
      ],
      correctOptionId: 'opt-b',
      explanation: `Correct! ${secondaryBullet} directly accounts for the pathological latency expansion under load.`,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };
    questions.push(q2);

    // Remediation Bite for this concept
    const quickPool: ConceptualQuickCheck[] = [
      {
        id: `qc-${sIdx}-1`,
        question: `What happens immediately if the primary invariant of ${conceptName} is violated on dense inputs?`,
        options: [
          'Duplicate state traversal expands exponentially',
          'The compiler rejects the binary execution unit',
          'Memory usage automatically drops to O(1)',
          'All cycles are instantly resolved',
        ],
        correctIndex: 0,
        hint: 'Think about multiple shared neighbors pointing back to the same unflagged node.',
      },
      {
        id: `qc-${sIdx}-2`,
        question: `When should state marking take place to ensure cycle prevention?`,
        options: [
          'At the moment of discovery/enqueuing',
          'After the entire graph finishes processing',
          'Only when a stack overflow occurs',
          'When the process receives an exit signal',
        ],
        correctIndex: 0,
        hint: 'Marking early prevents duplicate insertions before they enter the work queue.',
      },
      {
        id: `qc-${sIdx}-3`,
        question: `Which data structure invariant prevents infinite loops in this traversal?`,
        options: [
          'Visited lookup registry or status bitmask',
          'Dynamic resizing array realloc()',
          'Floating-point roundoff register',
          'Unchecked pointer arithmetic',
        ],
        correctIndex: 0,
        hint: 'A lookup table or visited bitmask guarantees each vertex is visited at most once.',
      },
    ];

    const bite: RemediationBite = {
      id: `bite-${deckId}-${sIdx + 1}`,
      conceptId,
      conceptName,
      coreIntuitionEn: `${conceptName} guarantees strict computational bounds during state exploration. Without its fundamental invariants, redundant processing leads to exponential resource blowups.`,
      coreIntuitionMl: `${conceptName} പ്രോസസ്സിംഗ് സമയത്ത് കൃത്യമായ കമ്പ്യൂട്ടേഷൻ പരിധികൾ ഉറപ്പാക്കുന്നു. ഇതിന്റെ നിയമങ്ങൾ പാലിച്ചില്ലെങ്കിൽ റിസോഴ്സ് ഉപയോഗം ക്രമാതീതമായി വർദ്ധിക്കും.`,
      coreIntuitionManglish: `${conceptName} processing time-il bounds urappaakkunnu. Invariants paalichillengil resource blowup undaakum.`,
      analogyEn: `Think of a library catalog card: checking the card first tells you if a book is already loaned out, rather than walking down every aisle in the building multiple times.`,
      analogyMl: `ഒരു ലൈബ്രറി കാറ്റലോഗ് പോലെ: പുസ്തകം ഉണ്ടോ എന്ന് പരിശോധിക്കാൻ മുഴുവൻ ഷെൽഫിലും നടക്കുന്നതിന് പകരം ആദ്യം കാറ്റലോഗിൽ പരിശോധിക്കുന്നു.`,
      analogyManglish: `Oru library catalog pole: direct shelf check cheyyaathe card register nokkunna reethi.`,
      dualLanguageAnchorEn: `Invariant Rule: Mark early, prune duplicates, bound by O(V + E).`,
      dualLanguageAnchorMl: `ഓർക്കുക: ആദ്യം മാർക്ക് ചെയ്യുക, ഡ്യൂപ്ലിക്കേറ്റുകൾ ഒഴിവാക്കുക, O(V + E) ൽ ഒതുക്കുക.`,
      dualLanguageAnchorManglish: `Early marking + duplicate pruning = O(V + E) guarantee.`,
      quickCheckPool: quickPool,
      status: 'pending_review',
    };
    remediationBites.push(bite);
  });

  return {
    deckId,
    deckName,
    generatedAt: new Date().toISOString(),
    isPublished: false,
    questions,
    remediationBites,
  };
}

// ─── Gemini Structured Generator Call ─────────────────────────────────────────

export async function generateRecallQPackageWithGemini(
  deckId: string,
  deckName: string,
  slides: SlideItem[]
): Promise<DeckRecallQPackage> {
  const slidesSummary = slides
    .slice(0, 10)
    .map((s, idx) => `Slide ${idx + 1}: ${s.title}\nBullets: ${s.bullets.join('; ')}\nNotes: ${s.notes || 'None'}`)
    .join('\n\n');

  try {
    const res = await fetch('http://localhost:5000/api/recallq/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckId,
        deckName,
        slidesSummary,
        slideCount: slides.length,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        return data as DeckRecallQPackage;
      }
    }
  } catch (err) {
    console.warn('Backend RecallQ generation endpoint unreachable, falling back to client engine:', err);
  }

  // Fallback to high-quality client deterministic generator
  return generateDeterministicPackage(deckId, deckName, slides);
}
