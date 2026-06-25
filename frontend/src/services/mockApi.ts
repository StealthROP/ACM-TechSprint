export interface SummaryPoint {
  full_sentence: string;
  syllabified_words: string[][]; // Array of words, where each word is an array of syllables
}

export interface LessonMaterial {
  document_title: string;
  summary_points: SummaryPoint[];
}

/**
 * Defensive parser for incoming lesson payloads.
 * Ensures the app handles malformed API data gracefully without crashing.
 */
export function parseLessonPayload(rawPayload: any): LessonMaterial {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return getFallbackLessonMaterial("Invalid data payload received.");
  }

  const document_title = typeof rawPayload.document_title === 'string' 
    ? rawPayload.document_title 
    : 'Untitled Document';

  const rawSummaryPoints = Array.isArray(rawPayload.summary_points) 
    ? rawPayload.summary_points 
    : [];

  const summary_points: SummaryPoint[] = rawSummaryPoints.map((point: any, index: number) => {
    // 1. Validate full_sentence
    const full_sentence = typeof point?.full_sentence === 'string'
      ? point.full_sentence
      : `Summary point ${index + 1}`;

    // 2. Validate and fall back for syllabified_words
    let syllabified_words: string[][] = [];
    
    if (Array.isArray(point?.syllabified_words)) {
      // Clean and validate nested array structure
      syllabified_words = point.syllabified_words.map((wordArr: any) => {
        if (Array.isArray(wordArr)) {
          const cleanWord = wordArr
            .map((syl: any) => (typeof syl === 'string' ? syl : ''))
            .filter((syl: string) => syl.length > 0);
          return cleanWord.length > 0 ? cleanWord : [' '];
        }
        return typeof wordArr === 'string' ? [wordArr] : [' '];
      });
    }

    // Defensive fallback: If syllabified_words is empty, generate from full_sentence
    if (syllabified_words.length === 0) {
      const words = full_sentence.split(/\s+/);
      syllabified_words = words.map((word: string) => {
        // Very basic client-side syllable estimation for emergency fallback
        return estimateSyllables(word);
      });
    }

    return {
      full_sentence,
      syllabified_words,
    };
  });

  return {
    document_title,
    summary_points: summary_points.length > 0 ? summary_points : getFallbackLessonMaterial("").summary_points,
  };
}

/**
 * Simple English syllable estimator fallback for client-side resiliency.
 */
function estimateSyllables(word: string): string[] {
  const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  if (!cleanWord) return [word];
  
  // Basic regex splitting approximation for vowels
  const parts = cleanWord.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
  if (!parts || parts.length === 0) {
    return [word];
  }
  
  // Re-attach punctuation if any
  const syllables = [...parts];
  const lastIndex = syllables.length - 1;
  const originalEnd = word.substring(cleanWord.length);
  if (originalEnd) {
    syllables[lastIndex] = syllables[lastIndex] + originalEnd;
  }
  return syllables;
}

function getFallbackLessonMaterial(errorContext: string): LessonMaterial {
  return {
    document_title: "Connection Alert",
    summary_points: [
      {
        full_sentence: `Notice: System load issue or data error occurred. ${errorContext}`,
        syllabified_words: [
          ["No", "tice", ":"],
          ["Sys", "tem"],
          ["load"],
          ["is", "sue"],
          ["or"],
          ["da", "ta"],
          ["er", "ror"],
          ["oc", "curred", "."]
        ]
      }
    ]
  };
}

/**
 * High-quality mock data matching the exact payload schema for testing A11y UI rendering.
 */
export const MOCK_LESSON_DATA: LessonMaterial = {
  document_title: "Understanding Neurodiversity & Reading Modes",
  summary_points: [
    {
      full_sentence: "Neurodiversity describes the natural variations in human brain function and cognitive styles.",
      syllabified_words: [
        ["Neu", "ro", "di", "ver", "si", "ty"],
        ["de", "scribes"],
        ["the"],
        ["na", "tu", "ral"],
        ["va", "ri", "a", "tions"],
        ["in"],
        ["hu", "man"],
        ["brain"],
        ["func", "tion"],
        ["and"],
        ["cog", "ni", "tive"],
        ["styles", "."]
      ]
    },
    {
      full_sentence: "Dyslexic readers often decode words more efficiently when text colors alternate between syllables.",
      syllabified_words: [
        ["Dys", "lex", "ic"],
        ["rea", "ders"],
        ["of", "ten"],
        ["de", "code"],
        ["words"],
        ["more"],
        ["ef", "fi", "cient", "ly"],
        ["when"],
        ["text"],
        ["co", "lors"],
        ["al", "ter", "nate"],
        ["be", "tween"],
        ["syl", "la", "bles", "."]
      ]
    }
  ]
};

export const MOCK_LESSONS_BY_ID: Record<string, LessonMaterial> = {
  photo: {
    document_title: "Module 1 - Ch. 4: Photosynthesis & Energy",
    summary_points: [
      {
        full_sentence: "Topic 1: Overview. Chloroplasts are specialized cell organelles that capture sunlight to produce glucose.",
        syllabified_words: [
          ["To", "pic"], ["1", ":"], ["O", "ver", "view", "."],
          ["Chlo", "ro", "plasts"], ["are"], ["spe", "cia", "lized"], ["cell"],
          ["or", "ga", "nelles"], ["that"], ["cap", "ture"], ["sun", "light"],
          ["to"], ["pro", "duce"], ["glu", "cose", "."]
        ]
      },
      {
        full_sentence: "Topic 2: Light Actions. Light-dependent reactions split water molecules to charge up ATP energy carriers.",
        syllabified_words: [
          ["To", "pic"], ["2", ":"], ["Light"], ["Ac", "tions", "."],
          ["Light-", "de", "pen", "dent"], ["re", "ac", "tions"], ["split"],
          ["wa", "ter"], ["mo", "le", "cules"], ["to"], ["charge"], ["up"],
          ["A", "T", "P"], ["e", "ner", "gy"], ["car", "riers", "."]
        ]
      },
      {
        full_sentence: "Topic 3: Carbon Cycle. The Calvin cycle uses ATP to combine carbon dioxide into stable organic sugars.",
        syllabified_words: [
          ["To", "pic"], ["3", ":"], ["Car", "bon"], ["Cy", "cle", "."],
          ["The"], ["Cal", "vin"], ["cy", "cle"], ["u", "ses"], ["A", "T", "P"],
          ["to"], ["com", "bine"], ["car", "bon"], ["di", "ox", "ide"], ["in", "to"],
          ["sta", "ble"], ["or", "ga", "nic"], ["su", "gars", "."]
        ]
      }
    ]
  },
  neuro: {
    document_title: "Extracted Notes - Neurodiversity & Learning",
    summary_points: [
      {
        full_sentence: "• Natural variations in brain functions describe human neurodivergence.",
        syllabified_words: [
          ["•"], ["Na", "tu", "ral"], ["va", "ri", "a", "tions"], ["in"],
          ["brain"], ["func", "tions"], ["de", "scribe"], ["hu", "man"],
          ["neu", "ro", "di", "ver", "gence", "."]
        ]
      },
      {
        full_sentence: "• Dyslexic readers read faster when text colors alternate between syllables.",
        syllabified_words: [
          ["•"], ["Dys", "lex", "ic"], ["rea", "ders"], ["read"], ["fas", "ter"],
          ["when"], ["text"], ["co", "lors"], ["al", "ter", "nate"], ["be", "tween"],
          ["syl", "la", "bles", "."]
        ]
      },
      {
        full_sentence: "• ADHD immersive focus modes dim surrounding lines of text to prevent distractions.",
        syllabified_words: [
          ["•"], ["A", "D", "H", "D"], ["im", "mer", "sive"], ["fo", "cus"],
          ["modes"], ["dim"], ["sur", "round", "ing"], ["lines"], ["of"],
          ["text"], ["to"], ["pre", "vent"], ["dis", "trac", "tions", "."]
        ]
      },
      {
        full_sentence: "• Custom font letter spacing reduces visual crowding and stress.",
        syllabified_words: [
          ["•"], ["Cus", "tom"], ["font"], ["let", "ter"], ["spa", "cing"],
          ["re", "duces"], ["vi", "su", "al"], ["crowd", "ing"], ["and"], ["stress", "."]
        ]
      }
    ]
  },
  mitosis: {
    document_title: "Flashcards - Ch. 5: Mitosis & Cell Cycles",
    summary_points: [
      {
        full_sentence: "• Term: Mitosis. Definition: Nuclear cell division producing two identical daughter nuclei.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["Mi", "to", "sis", "."], ["De", "fi", "ni", "tion", ":"],
          ["Nu", "clear"], ["cell"], ["di", "vi", "sion"], ["pro", "du", "cing"],
          ["two"], ["i", "den", "ti", "cal"], ["daugh", "ter"], ["nu", "clei", "."]
        ]
      },
      {
        full_sentence: "• Term: Prophase. Definition: Stage where chromosomes condense and the nuclear envelope disappears.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["Pro", "phase", "."], ["De", "fi", "ni", "tion", ":"],
          ["Stage"], ["where"], ["chro", "mo", "somes"], ["con", "dense"], ["and"],
          ["the"], ["nu", "clear"], ["en", "ve", "lope"], ["dis", "ap", "pears", "."]
        ]
      },
      {
        full_sentence: "• Term: Metaphase. Definition: Stage where chromatids align along the central equatorial plane.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["Me", "ta", "phase", "."], ["De", "fi", "ni", "tion", ":"],
          ["Stage"], ["where"], ["chro", "ma", "tids"], ["a", "lign"], ["a", "long"],
          ["the"], ["cen", "tral"], ["e", "qua", "to", "rial"], ["plane", "."]
        ]
      },
      {
        full_sentence: "• Term: Anaphase. Definition: Stage where spindle fibers separate sister chromatids to opposite poles.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["A", "na", "phase", "."], ["De", "fi", "ni", "tion", ":"],
          ["Stage"], ["where"], ["spin", "dle"], ["fi", "bers"], ["se", "pa", "rate"],
          ["sis", "ter"], ["chro", "ma", "tids"], ["to"], ["op", "po", "site"], ["poles", "."]
        ]
      },
      {
        full_sentence: "• Term: Telophase. Definition: Final stage where new nuclear envelopes assemble around chromosomes.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["Te", "lo", "phase", "."], ["De", "fi", "ni", "tion", ":"],
          ["Fi", "nal"], ["stage"], ["where"], ["new"], ["nu", "clear"], ["en", "ve", "lopes"],
          ["as", "sem", "ble"], ["a", "round"], ["chro", "mo", "somes", "."]
        ]
      }
    ]
  },
  respiration: {
    document_title: "Flashcards - Ch. 6: Cellular Respiration Quiz",
    summary_points: [
      {
        full_sentence: "• Term: Glycolysis. Definition: Anaerobic cytoplasm pathway breaking glucose down into pyruvate molecules.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["Gly", "co", "ly", "sis", "."], ["De", "fi", "ni", "tion", ":"],
          ["A", "naer", "o", "bic"], ["cy", "to", "plasm"], ["path", "way"],
          ["break", "ing"], ["glu", "cose"], ["down"], ["in", "to"], ["py", "ru", "vate"],
          ["mo", "le", "cules", "."]
        ]
      },
      {
        full_sentence: "• Term: Krebs Cycle. Definition: Aerobic mitochondrial matrix pathway generating NADH and FADH2 energy carriers.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["Krebs"], ["Cy", "cle", "."], ["De", "fi", "ni", "tion", ":"],
          ["Aer", "o", "bic"], ["mi", "to", "chon", "drial"], ["ma", "trix"],
          ["path", "way"], ["ge", "ne", "ra", "ting"], ["N", "A", "D", "H"], ["and"],
          ["F", "A", "D", "H", "2"], ["e", "ner", "gy"], ["car", "riers", "."]
        ]
      },
      {
        full_sentence: "• Term: ATP Synthase. Definition: Membrane enzyme channels using proton gradients to generate ATP chemical energy.",
        syllabified_words: [
          ["•"], ["Term", ":"], ["A", "T", "P"], ["Syn", "thase", "."], ["De", "fi", "ni", "tion", ":"],
          ["Mem", "brane"], ["en", "zyme"], ["chan", "nels"], ["u", "sing"],
          ["pro", "ton"], ["gra", "di", "ents"], ["to"], ["ge", "ne", "rate"], ["A", "T", "P"],
          ["che", "mi", "cal"], ["e", "ner", "gy", "."]
        ]
      }
    ]
  },
  plant_anatomy: {
    document_title: "Extracted Notes - PDF Upload: Plant Anatomy",
    summary_points: [
      {
        full_sentence: "• Xylem structures transport soil water and inorganic nutrients upward from roots.",
        syllabified_words: [
          ["•"], ["Xy", "lem"], ["struc", "tures"], ["trans", "port"], ["soil"],
          ["wa", "ter"], ["and"], ["in", "or", "ga", "nic"], ["nu", "tri", "ents"],
          ["up", "ward"], ["from"], ["roots", "."]
        ]
      },
      {
        full_sentence: "• Phloem tubes transport soluble organic compounds synthesized during photosynthesis downward.",
        syllabified_words: [
          ["•"], ["Phlo", "em"], ["tubes"], ["trans", "port"], ["so", "lu", "ble"],
          ["or", "ga", "nic"], ["com", "pounds"], ["syn", "the", "sized"], ["du", "ring"],
          ["pho", "to", "syn", "the", "sis"], ["down", "ward", "."]
        ]
      },
      {
        full_sentence: "• Vascular bundles form structural networks providing mechanical support to leaves.",
        syllabified_words: [
          ["•"], ["Vas", "cu", "lar"], ["bun", "dles"], ["form"], ["struc", "tu", "ral"],
          ["net", "works"], ["pro", "vi", "ding"], ["me", "cha", "ni", "cal"],
          ["sup", "port"], ["to"], ["leaves", "."]
        ]
      }
    ]
  },
  syllables_fil: {
    document_title: "Module 2 - Filipino Phonetics & Reading",
    summary_points: [
      {
        full_sentence: "Paksa 1: Mga Patinig. Ang mga patinig sa alpabetong Filipino ay a, e, i, o, at u.",
        syllabified_words: [
          ["Pak", "sa"], ["1", ":"], ["Mga"], ["Pa", "ti", "nig", "."],
          ["Ang"], ["mga"], ["pa", "ti", "nig"], ["sa"], ["al", "pa", "be", "tong"],
          ["Fi", "li", "pi", "no"], ["ay"], ["a", ","], ["e", ","], ["i", ","],
          ["o", ","], ["at"], ["u", "."]
        ]
      },
      {
        full_sentence: "Paksa 2: Pantig. Ang bawat pantig ay binubuo ng pagsasama ng katinig at patinig.",
        syllabified_words: [
          ["Pak", "sa"], ["2", ":"], ["Pan", "tig", "."],
          ["Ang"], ["ba", "wat"], ["pan", "tig"], ["ay"], ["bi", "nu", "buo"], ["ng"],
          ["pag", "sa", "sa", "ma"], ["ng"], ["ka", "ti", "nig"], ["at"], ["pa", "ti", "nig", "."]
        ]
      },
      {
        full_sentence: "Paksa 3: Diin. Mahalaga ang wastong diin sa pagbasa upang malaman ang tamang kahulugan.",
        syllabified_words: [
          ["Pak", "sa"], ["3", ":"], ["Di", "in", "."],
          ["Ma", "ha", "la", "ga"], ["ang"], ["was", "tong"], ["di", "in"], ["sa"],
          ["pag", "ba", "sa"], ["u", "pang"], ["ma", "la", "man"], ["ang"], ["ta", "mang"],
          ["ka", "hu", "lu", "gan", "."]
        ]
      }
    ]
  }
};
