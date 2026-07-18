/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Trigram {
  id: string;
  name: string;
  chinese: string;
  vietnamese: string;
  nature: string;
  element: "Metal" | "Wood" | "Water" | "Fire" | "Earth";
  binary: [number, number, number]; // [bottom, middle, top] (1 = Yang, 0 = Yin)
  symbol: string;
  direction: string;
  attribute: string;
  description: string;
  themeColor: string; // Tailwind color class or hex
  glowColor: string;
}

export interface Hexagram {
  number: number;
  chinese: string;
  pinyin: string;
  english: string;
  vietnamese: string;
  binary: number[]; // 6 elements from bottom to top (index 0 is line 1, index 5 is line 6)
  upperTrigram: string; // ID of upper trigram
  lowerTrigram: string; // ID of lower trigram
  judgment: string;
  imagesText: string;
  meaning: string;
}

export interface DivinationSession {
  id: string;
  timestamp: string;
  question: string;
  method: "coins" | "yarrow" | "numerology";
  tosses: number[][]; // 6 tosses, each is an array of 3 coin states (e.g., [2, 3, 2] where 2=Yin/Heads, 3=Yang/Tails)
  primaryHexagram: number; // 1-64
  changingLines: number[]; // 1-indexed lines that are changing (e.g. [2, 5])
  transformedHexagram: number | null; // 1-64 or null if no changing lines
  aiInterpretation?: AIInterpretation;
  notes?: string;
}

export interface AIInterpretation {
  overview: string;
  primaryMeaning: string;
  changingLinesAnalysis: string;
  transformedMeaning: string;
  guidance: string;
  warnings: string;
  opportunities: string;
  reflectionQuestions: string[];
}

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  hexagramContext?: {
    number: number;
    name: string;
  };
}
