import { createCanvas } from "canvas";

/**
 * Represents a Wordle game.
 *
 * @param word - The word to guess.
 */
class WordleGame {
  ts: string;
  canvasSize: number;
  gridSize: number;
  rectStrokeWidth: number;
  gridGap: number;
  word: string;
  guesses: string[];

  constructor(
    ts: string,
    canvasSize: number,
    gridSize: number,
    gridGap: number,
    rectStrokeWidth: number,
    word: string,
    guesses: string[]
  ) {
    this.ts = ts;
    this.canvasSize = canvasSize;
    this.gridSize = gridSize;
    this.gridGap = gridGap;
    this.rectStrokeWidth = rectStrokeWidth;

    if (word.length !== this.gridSize)
      throw new Error(`Word must be ${this.gridSize} letters long`);

    this.word = word.toLowerCase();
    this.guesses = guesses;
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

  createImage() {
    const canvas = createCanvas(this.canvasSize, this.canvasSize);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const letterSize =
      (canvas.width - this.gridGap * (this.gridSize + 1)) / this.gridSize;

    for (let i = 0; i < this.gridSize; i++) {
      const guessedWord = this.guesses[i];
      const x = (letterSize + this.gridGap) * i + this.gridGap;

      for (let j = 0; j < this.gridSize; j++) {
        const y = (letterSize + this.gridGap) * j + this.gridGap;

        // ctx.fillStyle = "#3A3A3B";
        // ctx.fillRect(x, y, letterSize, letterSize);
        if (guessedWord) {
          rectFill("#3A3A3B", x, y, letterSize, letterSize);
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

    // ctx.font = "30px Impact";
    // ctx.rotate(0.1);
    // ctx.fillText(this.word, 50, 100);

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
