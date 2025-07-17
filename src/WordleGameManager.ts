import Database from "better-sqlite3";
import WordleGame from "./WordleGame";

interface RawWordleGame {
  ts: string;
  channelId: string;
  userId: string;
  canvasSize: number;
  gridSize: number;
  gridGap: number;
  rectStrokeWidth: number;
  word: string;
  printDate: string;
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
      // ts TEXT PRIMARY KEY,
      .prepare(
        `
          CREATE TABLE IF NOT EXISTS games (
            ts TEXT,
            channel_id TEXT,
            user_id TEXT,
            canvas_size INTEGER,
            grid_size INTEGER,
            grid_gap INTEGER,
            rect_stroke_width INTEGER,
            word TEXT,
            print_date TEXT,
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
  get(ts: string, channelId: string) {
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
          SELECT ts, channel_id as channelId, user_id as userId, canvas_size as canvasSize, grid_size as gridSize, grid_gap as gridGap, rect_stroke_width as rectStrokeWidth, word, print_date as printDate, guesses
          FROM games
          WHERE ts = @ts AND channel_id = @channelId
        `
      )
      .get({
        ts,
        channelId,
      }) as RawWordleGame | undefined;

    if (!row) return;

    // console.log(row);

    const wordleGame = new WordleGame(
      row.ts,
      row.channelId,
      row.userId,
      row.canvasSize,
      row.gridGap,
      row.gridGap,
      row.rectStrokeWidth,
      row.word,
      row.printDate,
      JSON.parse(row.guesses)
    );

    this.cachedGames.push(wordleGame);

    return wordleGame;
  }

  /**
   * Create a new game.
   *
   * @param ts - The timestamp of the game's Slack parent message.
   * @param word - The correct word for this game.
   * @returns The new WordleGame.
   */
  create(
    ts: string,
    channelId: string,
    userId: string,
    word: string,
    printDate: string
  ) {
    if (!this.initialized)
      throw new Error(
        "WordleGameManager must be initialized before performing operations"
      );

    const wordleGame = new WordleGame(
      ts,
      channelId,
      userId,
      this.defaultCanvasSize,
      this.defaultGridSize,
      this.defaultGridGap,
      this.defaultRectStrokeWidth,
      word,
      printDate,
      []
    );

    const params: RawWordleGame = {
      ts: wordleGame.ts,
      channelId: wordleGame.channelId,
      userId: wordleGame.userId,
      canvasSize: wordleGame.canvasSize,
      gridSize: wordleGame.gridSize,
      gridGap: wordleGame.gridGap,
      rectStrokeWidth: wordleGame.rectStrokeWidth,
      word: wordleGame.word,
      printDate: wordleGame.printDate,
      guesses: JSON.stringify(wordleGame.guesses),
    };

    this.db
      .prepare(
        `
          INSERT INTO games
          (ts, channel_id, user_id, canvas_size, grid_size, grid_gap, rect_stroke_width, word, print_date, guesses)
          VALUES (@ts, @channelId, @userId, @canvasSize, @gridSize, @gridGap, @rectStrokeWidth, @word, @printDate, @guesses)
        `
      )
      .run(params);

    this.cachedGames.push(wordleGame);

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
      channelId: wordleGame.channelId,
      userId: wordleGame.userId,
      canvasSize: wordleGame.canvasSize,
      gridSize: wordleGame.gridSize,
      gridGap: wordleGame.gridGap,
      rectStrokeWidth: wordleGame.rectStrokeWidth,
      word: wordleGame.word,
      printDate: wordleGame.printDate,
      guesses: JSON.stringify(wordleGame.guesses),
    };

    this.db
      .prepare(
        `
          UPDATE games
          SET
            ts = @ts,
            channel_id = @channelId,
            user_id = @userId,
            canvas_size = @canvasSize,
            grid_size = @gridSize,
            grid_gap = @gridGap,
            rect_stroke_width = @rectStrokeWidth,
            word = @word,
            print_date = @printDate,
            guesses = @guesses
          WHERE ts = @ts AND channel_id = @channelId
        `
      )
      .run(params);

    return wordleGame;
  }
}

export default WordleGameManager;
