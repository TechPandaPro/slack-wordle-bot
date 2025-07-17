import { createCanvas } from "canvas";

/**
 * Represents a Wordle game.
 *
 * @param word - The word to guess.
 */
class WordleGame {
  ts: string;
  channelId: string;
  userId: string;
  canvasSize: number;
  gridSize: number;
  rectStrokeWidth: number;
  gridGap: number;
  word: string;
  printDate: string;
  guesses: string[];

  constructor(
    ts: string,
    channelId: string,
    userId: string,
    canvasSize: number,
    gridSize: number,
    gridGap: number,
    rectStrokeWidth: number,
    word: string,
    printDate: string,
    guesses: string[]
  ) {
    this.ts = ts;
    this.channelId = channelId;
    this.userId = userId;
    this.canvasSize = canvasSize;
    this.gridSize = gridSize;
    this.gridGap = gridGap;
    this.rectStrokeWidth = rectStrokeWidth;

    if (word.length !== this.gridSize)
      throw new Error(`Word must be ${this.gridSize} letters long`);

    this.word = word.toLowerCase();
    this.printDate = printDate;
    this.guesses = guesses;
  }

  /**
   * Guess a word.
   *
   * @param word - The word to guess.
   * @returns Whether or not the guess was correct.
   */
  guessWord(word: string): boolean {
    if (!this.isActive())
      throw new Error("Cannot guess while game is not active");

    const guessedWord = word.toLowerCase();

    this.guesses.push(guessedWord);

    return guessedWord === this.word;
  }

  /**
   * Check whether or not the game has been won.
   *
   * @returns Whether or not the game has been won.
   */
  isWon(): boolean {
    // note that there may not be any guesses yet, but that is okay for this check
    return this.guesses[this.guesses.length - 1] === this.word;
  }

  /**
   * Check whether or not the game is still "active" (i.e. has not ended).
   *
   * @returns Whether or not the game is still active.
   */
  isActive(): boolean {
    return !this.isWon() && this.guesses.length < 5;
  }

  /**
   * Generate an image representing the current game.
   *
   * @returns The buffer for the generated image.
   */
  createImage() {
    const canvas = createCanvas(this.canvasSize, this.canvasSize);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const letterSize =
      (canvas.width - this.gridGap * (this.gridSize + 1)) / this.gridSize;

    for (let i = 0; i < this.gridSize; i++) {
      const guessedWord = this.guesses[i];
      const y = (letterSize + this.gridGap) * i + this.gridGap;

      for (let j = 0; j < this.gridSize; j++) {
        const x = (letterSize + this.gridGap) * j + this.gridGap;

        if (guessedWord) {
          const guessedLetter = guessedWord[j] ?? "";

          let fillColor = "#3A3A3B";

          if (guessedLetter === this.word[j]) fillColor = "#538D4E";
          else if (
            guessedWord
              .slice(0, j + 1)
              .split("")
              .filter((letter) => guessedLetter === letter).length <=
            this.word.split("").filter((letter) => guessedLetter === letter)
              .length
          )
            fillColor = "#B59F3A";

          rectFill(fillColor, x, y, letterSize, letterSize);

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "bold 40px Arial";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(
            guessedLetter.toUpperCase(),
            x + letterSize / 2,
            y + letterSize / 2
          );
        } else {
          rectStroke(
            "#3A3A3B",
            this.rectStrokeWidth,
            x,
            y,
            letterSize,
            letterSize
          );
        }
      }
    }

    return canvas.toBuffer();

    function rectFill(
      fillColor: string,
      x: number,
      y: number,
      width: number,
      height: number
    ) {
      ctx.save();

      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);

      ctx.restore();
    }

    function rectStroke(
      strokeColor: string,
      strokeWidth: number,
      x: number,
      y: number,
      width: number,
      height: number
    ) {
      ctx.save();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeRect(
        x + strokeWidth / 2,
        y + strokeWidth / 2,
        width - strokeWidth,
        height - strokeWidth
      );

      ctx.restore();
    }
  }
}

export default WordleGame;
