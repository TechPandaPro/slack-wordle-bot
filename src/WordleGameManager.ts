import Database from "better-sqlite3";
import WordleGame from "./WordleGame";

interface RawWordleGame {
  ts: string;
  canvasSize: number;
  gridSize: number;
  gridGap: number;
  rectStrokeWidth: number;
  word: string;
  guesses: string; // a stringified JSON array of strings
}

/**
 * Represents a group of Wordle games.
 *
 * @param dbFilename - The filename for the games database.
 */
class WordleGameManager {
  defaultCanvasSize: number;
  defaultGridSize: number;
  defaultGridGap: number;
  defaultRectStrokeWidth: number;

  cachedGames: WordleGame[];
  initialized: boolean;
  dbFilename: string;
  db: Database.Database;

  constructor(dbFilename: string) {
    this.defaultCanvasSize = 350;
    this.defaultGridSize = 5;
    this.defaultGridGap = 5;
    this.defaultRectStrokeWidth = 2;

    this.cachedGames = [];
    this.initialized = false;
    this.dbFilename = dbFilename;
    this.db = new Database(dbFilename);
  }

  /**
   * Initialize the manager. The manager must be initialized before other methods can be called.
   */
  init() {
    this.db.pragma("journal_mode = WAL");
    this.db
      .prepare(
        `
          CREATE TABLE IF NOT EXISTS games (
            ts TEXT PRIMARY KEY,
            canvas_size INTEGER,
            grid_size INTEGER,
            grid_gap INTEGER,
            rect_stroke_width INTEGER,
            word TEXT,
            guesses TEXT -- a stringified JSON array of strings
          )
        `
      )
      .run();
    this.initialized = true;
  }

  /**
   * Get a particular game.
   *
   * @param ts - The timestamp of the game's Slack parent message.
   * @returns The retrieved WordleGame.
   */
  get(ts: string) {
    if (!this.initialized)
      throw new Error(
        "WordleGameManager must be initialized before performing operations"
      );

    const cachedGame = this.cachedGames.find((game) => game.ts === ts);
    if (cachedGame) return cachedGame;

    // console.log(JSON.stringify(ts));
    // console.log(typeof ts);

    const row = this.db
      .prepare(
        // SELECT (ts, canvas_size, grid_size, grid_gap, rect_stroke_width, word, guesses)
        `
          SELECT ts, canvas_size as canvasSize, grid_size as gridSize, grid_gap as gridGap, rect_stroke_width as rectStrokeWidth, word, guesses
          FROM games
          WHERE ts = ?
        `
      )
      .get(ts) as RawWordleGame | undefined;

    if (!row) return;

    // console.log(row);

    const wordleGame = new WordleGame(
      row.ts,
      row.canvasSize,
      row.gridGap,
      row.gridGap,
      row.rectStrokeWidth,
      row.word,
      JSON.parse(row.guesses)
    );

    return wordleGame;
  }

  /**
   * Create a new game.
   *
   * @param ts - The timestamp of the game's Slack parent message.
   * @param word - The correct word for this game.
   * @returns The new WordleGame.
   */
  create(ts: string, word: string) {
    if (!this.initialized)
      throw new Error(
        "WordleGameManager must be initialized before performing operations"
      );

    const wordleGame = new WordleGame(
      ts,
      this.defaultCanvasSize,
      this.defaultGridSize,
      this.defaultGridGap,
      this.defaultRectStrokeWidth,
      word,
      []
    );

    const params: RawWordleGame = {
      ts: wordleGame.ts,
      canvasSize: wordleGame.canvasSize,
      gridSize: wordleGame.gridSize,
      gridGap: wordleGame.gridGap,
      rectStrokeWidth: wordleGame.rectStrokeWidth,
      word: wordleGame.word,
      guesses: JSON.stringify(wordleGame.guesses),
    };

    this.db
      .prepare(
        `
          INSERT INTO games
          (ts, canvas_size, grid_size, grid_gap, rect_stroke_width, word, guesses)
          VALUES (@ts, @canvasSize, @gridSize, @gridGap, @rectStrokeWidth, @word, @guesses)
        `
      )
      .run(params);

    return wordleGame;
  }

  /**
   * Saves a particular game.
   *
   * @param wordleGame - The WordleGame to save.
   * @returns The saved WordleGame.
   */
  save(wordleGame: WordleGame) {
    if (!this.initialized)
      throw new Error(
        "WordleGameManager must be initialized before performing operations"
      );

    const params: RawWordleGame = {
      ts: wordleGame.ts,
      canvasSize: wordleGame.canvasSize,
      gridSize: wordleGame.gridSize,
      gridGap: wordleGame.gridGap,
      rectStrokeWidth: wordleGame.rectStrokeWidth,
      word: wordleGame.word,
      guesses: JSON.stringify(wordleGame.guesses),
    };

    this.db
      .prepare(
        `
          UPDATE games
          SET
            ts = @ts,
            canvas_size = @canvasSize,
            grid_size = @gridSize,
            grid_gap = @gridGap,
            rect_stroke_width = @rectStrokeWidth,
            word = @word,
            guesses = @guesses
          WHERE ts = @ts
        `
      )
      .run(params);

    return wordleGame;
  }
}

export default WordleGameManager;
