export interface HangmanGame {
  word: string;
  guessedLetters: Set<string>;
  mistakes: number;
  maxMistakes: number;
  lastMessageId?: string;
  timeout?: NodeJS.Timeout;
}

export interface TicTacToeGame {
  board: string[];
  turn: string;
  winner?: string | null;
  ended?: boolean;
}

export interface TriviaGame {
  question: string;
  answer: string;
  options?: string[];
  reward?: number;
  timeout?: NodeJS.Timeout;
}

declare global {
  type HangmanGameGlobal = HangmanGame;
}
