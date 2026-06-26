export interface Flashcard {
  term: string;
  definition: string;
}

export interface SummaryPoint {
  full_sentence: string;
  syllabified_words: string[][]; // Array of words, where each word is an array of syllables
}

export interface LessonMaterial {
  document_title: string;
  raw_text: string;
  raw_text_fil: string;
  review_points: SummaryPoint[];
  review_points_fil: SummaryPoint[];
  flashcards: Flashcard[];
  flashcards_fil: Flashcard[];
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
    
  const raw_text = typeof rawPayload.raw_text === 'string' ? rawPayload.raw_text : "No raw text available.";
  const raw_text_fil = typeof rawPayload.raw_text_fil === 'string' ? rawPayload.raw_text_fil : "Walang magagamit na teksto.";

  const parseSummaryList = (rawList: any): SummaryPoint[] => {
    const arr = Array.isArray(rawList) ? rawList : [];
    return arr.map((point: any, index: number) => {
      const full_sentence = typeof point?.full_sentence === 'string' ? point.full_sentence : `Point ${index + 1}`;
      let syllabified_words: string[][] = [];
      if (Array.isArray(point?.syllabified_words)) {
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
      if (syllabified_words.length === 0) {
        const words = full_sentence.split(/\s+/);
        syllabified_words = words.map((word: string) => estimateSyllables(word));
      }
      return { full_sentence, syllabified_words };
    });
  };

  const parseFlashcardList = (rawList: any): Flashcard[] => {
    const arr = Array.isArray(rawList) ? rawList : [];
    return arr.map((card: any) => ({
      term: typeof card?.term === 'string' ? card.term : 'Unknown',
      definition: typeof card?.definition === 'string' ? card.definition : 'No definition provided.'
    }));
  };

  return {
    document_title,
    raw_text,
    raw_text_fil,
    review_points: parseSummaryList(rawPayload.review_points),
    review_points_fil: parseSummaryList(rawPayload.review_points_fil),
    flashcards: parseFlashcardList(rawPayload.flashcards),
    flashcards_fil: parseFlashcardList(rawPayload.flashcards_fil),
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
    raw_text: `Notice: System load issue or data error occurred. ${errorContext}`,
    raw_text_fil: `Babala: May problema sa koneksyon. ${errorContext}`,
    review_points: [
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
    ],
    review_points_fil: [],
    flashcards: [],
    flashcards_fil: []
  };
}

/**
 * High-quality mock data matching the exact payload schema for testing A11y UI rendering.
 */
export const MOCK_LESSON_DATA: LessonMaterial = {
  document_title: "Understanding Neurodiversity & Reading Modes",
  raw_text: "Neurodiversity describes the natural variations in human brain function and cognitive styles. Dyslexic readers often decode words more efficiently when text colors alternate between syllables.",
  raw_text_fil: "Inilalarawan ng neurodiversity ang mga natural na pagkakaiba sa function ng utak ng tao. Mas mabilis makapagbasa ang mga may dyslexia kapag nag-iiba ang kulay ng bawat pantig.",
  review_points: [
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
  ],
  review_points_fil: [],
  flashcards: [
    {
      term: "Neurodiversity",
      definition: "Natural variations in human brain function and cognitive styles."
    }
  ],
  flashcards_fil: []
};

export const MOCK_LESSONS_BY_ID: Record<string, LessonMaterial> = {
  photo: {
    document_title: "Module 1 - Ch. 4: Photosynthesis & Energy",
    raw_text: "Chloroplasts capture sunlight to produce glucose. Light-dependent reactions split water to charge ATP. The Calvin cycle uses ATP to synthesize sugars.",
    raw_text_fil: "Kinukuha ng mga chloroplast ang liwanag ng araw para gumawa ng glucose. Hinihiwalay ng light-dependent reactions ang tubig para kargahan ang ATP. Ginagamit ng Calvin cycle ang ATP para gumawa ng asukal.",
    review_points: [
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
    ],
    review_points_fil: [
      {
        full_sentence: "Paksa 1: Pangkalahatan. Ang mga chloroplast ay mga organelle ng selula na kumukuha ng liwanag ng araw upang gumawa ng glucose.",
        syllabified_words: [
          ["Pak", "sa"], ["1", ":"], ["Pang", "ka", "la", "ha", "tan", "."],
          ["Ang"], ["mga"], ["chlo", "ro", "plasts"], ["ay"], ["mga"], ["or", "ga", "nelle"],
          ["ng"], ["se", "lu", "la"], ["na"], ["ku", "mu", "ku", "ha"], ["ng"], ["li", "wa", "nag"],
          ["ng"], ["a", "raw"], ["u", "pang"], ["gu", "ma", "wa"], ["ng"], ["glu", "cose", "."]
        ]
      },
      {
        full_sentence: "Paksa 2: Reaksyon sa Liwanag. Hinihiwalay ng light-dependent reactions ang molekula ng tubig upang kargahan ang ATP.",
        syllabified_words: [
          ["Pak", "sa"], ["2", ":"], ["Re", "ak", "syon"], ["sa"], ["Li", "wa", "nag", "."],
          ["Hi", "ni", "hi", "wa", "lay"], ["ng"], ["light-", "de", "pen", "dent"], ["re", "ac", "tions"],
          ["ang"], ["mo", "le", "ku", "la"], ["ng"], ["tu", "big"], ["u", "pang"], ["kar", "ga", "han"],
          ["ang"], ["A", "T", "P", "."]
        ]
      },
      {
        full_sentence: "Paksa 3: Siklo ng Carbon. Ginagamit ng Calvin cycle ang ATP upang pagsamahin ang carbon dioxide para maging asukal.",
        syllabified_words: [
          ["Pak", "sa"], ["3", ":"], ["Sik", "lo"], ["ng"], ["Car", "bon", "."],
          ["Gi", "na", "ga", "mit"], ["ng"], ["Cal", "vin"], ["cy", "cle"], ["ang"], ["A", "T", "P"],
          ["u", "pang"], ["pag", "sa", "ma", "hin"], ["ang"], ["car", "bon"], ["di", "ox", "ide"],
          ["pa", "ra"], ["ma", "ging"], ["a", "su", "kal", "."]
        ]
      }
    ],
    flashcards: [
      {
        term: "Chloroplast",
        definition: "Organelle where photosynthesis takes place."
      },
      {
        term: "ATP",
        definition: "Energy carrier molecule used by cells."
      },
      {
        term: "Calvin Cycle",
        definition: "Process that makes sugar from carbon dioxide."
      }
    ],
    flashcards_fil: [
      {
        term: "Chloroplast",
        definition: "Bahagi ng selula kung saan nagaganap ang photosynthesis."
      },
      {
        term: "ATP",
        definition: "Molekula na nagdadala ng enerhiya sa mga selula."
      },
      {
        term: "Calvin Cycle",
        definition: "Proseso na gumagawa ng asukal mula sa carbon dioxide."
      }
    ]
  },
  neuro: {
    document_title: "Extracted Notes - Neurodiversity & Learning",
    raw_text: "Neurodiversity describes natural variations in brain functions. Dyslexic readers read faster with alternating syllable colors. ADHD focus modes dim surrounding lines.",
    raw_text_fil: "Ang neurodiversity ay mga pagkakaiba sa utak. Mas mabilis magbasa ang may dyslexia kapag iba-iba ang kulay ng pantig. Ang focus mode ay nagpapadilim sa paligid para sa ADHD.",
    review_points: [
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
    ],
    review_points_fil: [
      {
        full_sentence: "• Ang mga natural na pagkakaiba sa utak ay naglalarawan ng neurodivergence.",
        syllabified_words: [
          ["•"], ["Ang"], ["mga"], ["na", "tu", "ral"], ["na"], ["pag", "ka", "ka", "i", "ba"],
          ["sa"], ["u", "tak"], ["ay"], ["nag", "la", "la", "ra", "wan"], ["ng"],
          ["neu", "ro", "di", "ver", "gence", "."]
        ]
      },
      {
        full_sentence: "• Mas mabilis magbasa ang mga dyslexic kapag nag-iiba ang kulay ng bawat pantig.",
        syllabified_words: [
          ["•"], ["Mas"], ["ma", "bi", "lis"], ["mag", "ba", "sa"], ["ang"], ["mga"],
          ["dys", "lex", "ic"], ["ka", "pag"], ["nag-", "i", "i", "ba"], ["ang"],
          ["ku", "lay"], ["ng"], ["ba", "wat"], ["pan", "tig", "."]
        ]
      },
      {
        full_sentence: "• Ang immersive focus mode ng ADHD ay nagpapadilim sa paligid upang maiwasan ang distraction.",
        syllabified_words: [
          ["•"], ["Ang"], ["im", "mer", "sive"], ["fo", "cus"], ["mode"], ["ng"],
          ["A", "D", "H", "D"], ["ay"], ["nag", "pa", "pa", "di", "lim"], ["sa"],
          ["pa", "li", "gid"], ["u", "pang"], ["mai", "wa", "san"], ["ang"],
          ["dis", "trac", "tion", "."]
        ]
      }
    ],
    flashcards: [
      {
        term: "Neurodiversity",
        definition: "The concept that neurological differences are natural variations."
      },
      {
        term: "Syllabification",
        definition: "Dividing words into syllables to help dyslexic readers."
      },
      {
        term: "Focus Mode",
        definition: "A tool that dims non-focused text to help ADHD readers."
      }
    ],
    flashcards_fil: [
      {
        term: "Neurodiversity",
        definition: "Ang konsepto na ang mga pagkakaiba sa utak ay natural na variation lamang."
      },
      {
        term: "Syllabification",
        definition: "Paghahati ng mga salita sa pantig upang matulungan ang mga dyslexic."
      },
      {
        term: "Focus Mode",
        definition: "Isang tool na nagpapadilim sa ibang teksto para sa may ADHD."
      }
    ]
  },
  mitosis: {
    document_title: "Flashcards - Ch. 5: Mitosis & Cell Cycles",
    raw_text: "Mitosis is nuclear cell division that produces identical nuclei. Prophase condenses chromosomes. Metaphase aligns chromatids. Anaphase separates chromatids.",
    raw_text_fil: "Ang mitosis ay paghahati ng selula. Sa prophase, namumuo ang mga chromosome. Sa metaphase, pumipila ang mga ito sa gitna. Sa anaphase naman, naghihiwalay ang mga ito.",
    review_points: [
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
    ],
    review_points_fil: [
      {
        full_sentence: "• Mitosis: Paghahati ng nucleus na gumagawa ng dalawang parehong nucleus.",
        syllabified_words: [
          ["•"], ["Mi", "to", "sis", ":"], ["Pag", "ha", "ha", "ti"], ["ng"], ["nu", "cleus"],
          ["na"], ["gu", "ma", "ga", "wa"], ["ng"], ["da", "la", "wang"], ["pa", "re", "hong"],
          ["nu", "cleus", "."]
        ]
      },
      {
        full_sentence: "• Prophase: Unang yugto kung saan namumuo ang mga chromosome.",
        syllabified_words: [
          ["•"], ["Pro", "phase", ":"], ["U", "nang"], ["yug", "to"], ["kung"], ["sa", "an"],
          ["na", "mu", "muo"], ["ang"], ["mga"], ["chro", "mo", "some", "."]
        ]
      },
      {
        full_sentence: "• Metaphase: Yugto kung saan pumipila ang mga chromosome sa gitna.",
        syllabified_words: [
          ["•"], ["Me", "ta", "phase", ":"], ["Yug", "to"], ["kung"], ["sa", "an"],
          ["pu", "mi", "pi", "la"], ["ang"], ["mga"], ["chro", "mo", "some"], ["sa"],
          ["git", "na", "."]
        ]
      }
    ],
    flashcards: [
      {
        term: "Mitosis",
        definition: "Cell division that results in two identical cells."
      },
      {
        term: "Prophase",
        definition: "First stage of mitosis where chromosomes condense."
      },
      {
        term: "Metaphase",
        definition: "Stage of mitosis where chromosomes align in the center."
      },
      {
        term: "Anaphase",
        definition: "Stage of mitosis where chromatids are pulled apart."
      },
      {
        term: "Telophase",
        definition: "Final stage where two new nuclear membranes form."
      }
    ],
    flashcards_fil: [
      {
        term: "Mitosis",
        definition: "Paghahati ng selula na nagbubunga ng dalawang magkatulad na selula."
      },
      {
        term: "Prophase",
        definition: "Unang yugto ng mitosis kung saan namumuo ang mga chromosome."
      },
      {
        term: "Metaphase",
        definition: "Yugto kung saan pumipila ang mga chromosome sa gitna."
      },
      {
        term: "Anaphase",
        definition: "Yugto kung saan pinaghihiwalay ang mga chromosome."
      },
      {
        term: "Telophase",
        definition: "Huling yugto kung saan nabubuo ang dalawang bagong membrane."
      }
    ]
  },
  respiration: {
    document_title: "Flashcards - Ch. 6: Cellular Respiration Quiz",
    raw_text: "Glycolysis breaks glucose into pyruvate. The Krebs Cycle generates NADH and FADH2 in mitochondria. ATP Synthase creates chemical ATP energy.",
    raw_text_fil: "Ang glycolysis ay naghahati ng glucose sa cytoplasm. Ang Krebs Cycle ay gumagawa ng NADH at FADH2. Ang ATP Synthase naman ay gumagawa ng mismong ATP.",
    review_points: [
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
    ],
    review_points_fil: [
      {
        full_sentence: "• Glycolysis: Paghahati ng glucose sa cytoplasm nang walang oxygen.",
        syllabified_words: [
          ["•"], ["Gly", "co", "ly", "sis", ":"], ["Pag", "ha", "ha", "ti"], ["ng"], ["glu", "cose"],
          ["sa"], ["cy", "to", "plasm"], ["nang"], ["wa", "lang"], ["o", "xy", "gen", "."]
        ]
      },
      {
        full_sentence: "• Krebs Cycle: Proseso sa mitochondria na gumagawa ng mga electron carrier.",
        syllabified_words: [
          ["•"], ["Krebs"], ["Cy", "cle", ":"], ["Pro", "se", "so"], ["sa"], ["mi", "to", "chon", "dria"],
          ["na"], ["gu", "ma", "ga", "wa"], ["ng"], ["mga"], ["e", "lec", "tron"], ["car", "rier", "."]
        ]
      },
      {
        full_sentence: "• ATP Synthase: Enzyme na gumagamit ng proton gradient para gumawa ng ATP.",
        syllabified_words: [
          ["•"], ["A", "T", "P"], ["Syn", "thase", ":"], ["En", "zyme"], ["na"], ["gu", "ma", "ga", "mit"],
          ["ng"], ["pro", "ton"], ["gra", "di", "ent"], ["pa", "ra"], ["gu", "ma", "wa"],
          ["ng"], ["A", "T", "P", "."]
        ]
      }
    ],
    flashcards: [
      {
        term: "Glycolysis",
        definition: "The breakdown of glucose by enzymes, releasing energy."
      },
      {
        term: "Krebs Cycle",
        definition: "A cycle of reactions in the mitochondria to produce energy carriers."
      },
      {
        term: "ATP Synthase",
        definition: "An enzyme that creates the energy storage molecule ATP."
      }
    ],
    flashcards_fil: [
      {
        term: "Glycolysis",
        definition: "Ang pagkasira ng glucose gamit ang enzymes upang maglabas ng enerhiya."
      },
      {
        term: "Krebs Cycle",
        definition: "Siklo ng mga reaksyon sa mitochondria upang gumawa ng energy carriers."
      },
      {
        term: "ATP Synthase",
        definition: "Isang enzyme na gumagawa ng ATP, ang imbakan ng enerhiya."
      }
    ]
  },
  plant_anatomy: {
    document_title: "Extracted Notes - PDF Upload: Plant Anatomy",
    raw_text: "Xylem transports water and minerals upward from plant roots. Phloem transports soluble organic compounds synthesized downwards.",
    raw_text_fil: "Ang xylem ay nagdadala ng tubig at mineral pataas mula sa ugat. Ang phloem naman ay nagdadala ng mga sustansya pababa.",
    review_points: [
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
    ],
    review_points_fil: [
      {
        full_sentence: "• Ang xylem ay nagdadala ng tubig at mineral pataas mula sa mga ugat.",
        syllabified_words: [
          ["•"], ["Ang"], ["xy", "lem"], ["ay"], ["nag", "da", "da", "la"], ["ng"],
          ["tu", "big"], ["at"], ["mi", "ne", "ral"], ["pa", "ta", "as"], ["mu", "la"],
          ["sa"], ["mga"], ["u", "gat", "."]
        ]
      },
      {
        full_sentence: "• Ang phloem naman ay nagdadala ng pagkain mula sa dahon pababa.",
        syllabified_words: [
          ["•"], ["Ang"], ["phlo", "em"], ["na", "man"], ["ay"], ["nag", "da", "da", "la"],
          ["ng"], ["pag", "ka", "in"], ["mu", "la"], ["sa"], ["da", "hon"],
          ["pa", "ba", "ba", "."]
        ]
      }
    ],
    flashcards: [
      {
        term: "Xylem",
        definition: "Plant tissue that carries water upward from roots."
      },
      {
        term: "Phloem",
        definition: "Plant tissue that carries organic nutrients downward."
      },
      {
        term: "Vascular Bundle",
        definition: "A strand of conducting vessels in the stem and leaves."
      }
    ],
    flashcards_fil: [
      {
        term: "Xylem",
        definition: "Tisyu ng halaman na nagdadala ng tubig pataas mula sa mga ugat."
      },
      {
        term: "Phloem",
        definition: "Tisyu ng halaman na nagdadala ng pagkain pababa sa ibang bahagi."
      },
      {
        term: "Vascular Bundle",
        definition: "Grupo ng mga ugat-daluyan sa tangkay at dahon ng halaman."
      }
    ]
  },
  syllables_fil: {
    document_title: "Module 2 - Filipino Phonetics & Reading",
    raw_text: "Ang mga patinig ay a, e, i, o, u. Ang bawat pantig ay may katinig at patinig. Mahalaga ang wastong diin sa pagbasa upang malaman ang tamang kahulugan.",
    raw_text_fil: "Ang mga patinig ay a, e, i, o, u. Ang bawat pantig ay may katinig at patinig. Mahalaga ang wastong diin sa pagbasa upang malaman ang tamang kahulugan.",
    review_points: [
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
    ],
    review_points_fil: [
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
    ],
    flashcards: [
      {
        term: "Vowels",
        definition: "The letters A, E, I, O, U in the Filipino alphabet."
      },
      {
        term: "Syllable",
        definition: "A unit of pronunciation having one vowel sound."
      },
      {
        term: "Stress (Diin)",
        definition: "The emphasis placed on a syllable in speaking."
      }
    ],
    flashcards_fil: [
      {
        term: "Patinig",
        definition: "Ang mga titik na A, E, I, O, U sa alpabetong Filipino."
      },
      {
        term: "Pantig",
        definition: "Yunit ng pagbigkas na may isang tunog ng patinig."
      },
      {
        term: "Diin",
        definition: "Ang lakas o bigat na ibinibigay sa pagbigkas ng pantig."
      }
    ]
  }
};

