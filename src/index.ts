import "dotenv/config";
import { App } from "@slack/bolt";
import WordleGameManager from "./WordleGameManager";
import WordleGame from "./WordleGame";
import { fetchWordle } from "./wordleApi";

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const wordleGames = new WordleGameManager("sqlite.db");
wordleGames.init();

app.message("", async (event) => {
  if (event.message.subtype) return;

  const ts = event.message.ts;
  const threadTs = event.message.thread_ts;
  if (!threadTs || ts === threadTs) return;

  const channelId = event.message.channel;

  const wordleGame = wordleGames.get(threadTs, channelId);
  if (!wordleGame || !wordleGame.isActive()) return;

  const wordToGuess = event.message.text;
  if (!wordToGuess || wordToGuess.length !== wordleGame.gridSize) return;

  const isCorrect = wordleGame.guessWord(wordToGuess);
  wordleGames.save(wordleGame);

  await updateImage(wordleGame);

  if (isCorrect) {
    await app.client.chat.postMessage({
      channel: wordleGame.channelId,
      thread_ts: wordleGame.ts,
      text: `Correct! Today's word is ${wordleGame.word.toUpperCase()}. Awesome job!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Correct! Today's word is *${wordleGame.word.toUpperCase()}*. Awesome job!`,
          },
        },
      ],
    });
  } else if (!wordleGame.isActive()) {
    await app.client.chat.postMessage({
      channel: wordleGame.channelId,
      thread_ts: wordleGame.ts,
      text: `Good attempt! Today's word is ${wordleGame.word.toUpperCase()}.`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Good attempt! Today's word is *${wordleGame.word.toUpperCase()}*.`,
          },
        },
      ],
    });
  }
});

app.command("/wordle", async (event) => {
  await event.ack({ text: "Wordle incoming!" });

  const wordleMessage = await app.client.chat.postMessage({
    channel: event.command.channel_id,
    text: `<@${event.command.user_id}> Wordle`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<@${event.command.user_id}> wants to play Wordle!`,
        },
      },
    ],
  });

  if (!wordleMessage.ts) throw new Error("No ts found on Wordle reply");
  if (!wordleMessage.channel)
    throw new Error("No channel found on Wordle reply");

  const todayWordle = await fetchWordle();
  if (!todayWordle) throw new Error("Could not fetch today's Wordle solution");

  const wordleGame = wordleGames.create(
    wordleMessage.ts,
    wordleMessage.channel,
    event.command.user_id,
    todayWordle.solution,
    todayWordle.printDate
  );

  updateImage(wordleGame);

  await app.client.chat.postMessage({
    channel: wordleGame.channelId,
    thread_ts: wordleGame.ts,
    text: "Post your guesses in this thread! (Everyone can participate!)",
  });
});

async function updateImage(wordleGame: WordleGame) {
  const upload = await app.client.filesUploadV2({
    file: wordleGame.createImage(),
    filename: "wordle.png",
    alt_text: "Wordle game",
  });

  const files = upload.files[0]?.files ?? [];
  let fileId: string;
  if (files) fileId = files[0]?.id ?? "";
  else fileId = "";

  for (let i = 0; i < 10; i++) {
    let success = false;

    try {
      await updateMessage();
      success = true;
    } catch {
      success = false;
      await wait(600);
    }

    if (success) {
      break;
    }
  }

  function wait(ms: number) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
  }

  async function updateMessage() {
    const wordleMessageOptions: Parameters<typeof app.client.chat.update>[0] = {
      ts: wordleGame.ts,
      channel: wordleGame.channelId,
      text: `<@${wordleGame.userId}> wants to play Wordle! (${wordleGame.printDate})`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${wordleGame.userId}> wants to play Wordle! (${wordleGame.printDate})`,
          },
        },
        {
          type: "image",
          slack_file: { id: fileId },
          alt_text: "Wordle game",
        },
      ],
    };

    await app.client.chat.update(wordleMessageOptions);
  }
}

(async () => {
  await app.start();
  console.log("Started Slack app");
})();
