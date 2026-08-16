export interface Transition {
  from: string;
  symbol: string;
  to: string;
}

export interface AutomatonData {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string | null;
  acceptStates: string[];
  stateMappings?: Record<string, string>;
}

export interface ConversionStep {
  stepIndex: number;
  title: string;
  description: string;
  explanation: string;
  activeStates: string[];
  activeTransitions: Transition[];
  currentSubsetTable?: { stateName: string; originalSet: string[]; transitions: Record<string, string> }[];
  currentPartitions?: string[][];
  intermediateAutomaton: AutomatonData;
}

export interface TheoreticalBreakdown {
  formalDefinition: {
    Q: string[];
    Sigma: string[];
    delta: Record<string, Record<string, string[]>>;
    q0: string;
    F: string[];
  };
  epsilonClosures?: Record<string, string[]>;
  subsetTable?: {
    dfaState: string;
    nfaSubset: string[];
    isStart: boolean;
    isAccept: boolean;
    moves: Record<string, string>;
  }[];
  minimizationSteps?: {
    iteration: number;
    description: string;
    partitions: string[][];
    splitReason?: string;
  }[];
  theoremNotes: string[];
}

export interface TestCase {
  input: string;
  expected: boolean;
  explanation: string;
}

export interface PracticeChallenge {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  description: string;
  alphabet: string[];
  hints: string[];
  sampleRegex?: string;
  optimalStateCount: number;
  testCases: TestCase[];
}

export interface LessonModule {
  id: string;
  title: string;
  category: string;
  readTime: string;
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
  summary: string;
  content: {
    heading: string;
    body: string;
    mathFormula?: string;
    codeExample?: string;
    keyTakeaway: string;
  }[];
  interactiveTips: string[];
  commonMistakes: string[];
  practiceChallengeId?: string;
}
