import "dotenv/config";
import { App, subtype } from "@slack/bolt";
import WordleGameManager from "./WordleGameManager";
import WordleGame from "./WordleGame";
import { fetchWordle } from "./wordleApi";

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// app.message("test", async (event) => {
//   console.log(event.message);
// });

const wordleGames = new WordleGameManager("sqlite.db");
wordleGames.init();

app.message("", async (event) => {
  // event.body.event.subtype
  if (event.message.subtype) return;

  const ts = event.message.ts;
  const threadTs = event.message.thread_ts;
  if (!threadTs || ts === threadTs) return;

  const channelId = event.message.channel;

  // console.log("in thread.");

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
      // reply_broadcast: true,
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
      // reply_broadcast: true,
    });
  }

  // const messageContent = event.message

  // console.log(event.event.type);
  // console.log(event.event.subtype);
  // console.log(event.message.subtype);

  // console.log(event.event.ts);
  // console.log(event.event.event_ts);

  // console.log(event.event.subtype);

  // // @ts-ignore
  // console.log(event.event.thread_ts);

  // // @ts-ignore
  // console.log(event.message.thread_ts);

  // if (event.message.subtype === "message_replied")
  //   console.log(event.message.message);
  // else console.log(event.message.subtype);
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

  // const game = new WordleGame(wordleWord);

  const wordleGame = wordleGames.create(
    wordleMessage.ts,
    wordleMessage.channel,
    event.command.user_id,
    todayWordle.solution,
    todayWordle.printDate
  );

  // wordleGame.guesses.push("hello");

  // wordleGames.save(wordleGame);

  updateImage(wordleGame);

  await app.client.chat.postMessage({
    channel: wordleGame.channelId,
    thread_ts: wordleGame.ts,
    // reply_broadcast: true,
    text: "Post your guesses in this thread! (Everyone can participate!)",
  });
});

async function updateImage(wordleGame: WordleGame) {
  const upload = await app.client.filesUploadV2({
    file: wordleGame.createImage(),
    filename: "wordle.png",
    alt_text: "Wordle game",
  });
  // console.log(upload.files[0].files);
  const files = upload.files[0]?.files ?? [];
  let fileUrl: string;
  let fileId: string;
  if (files) {
    const file = files[0];
    // console.log(file.filetype);
    // console.log(file.permalink);
    // console.log(file);
    fileUrl = file?.permalink ?? "";
    fileId = file?.id ?? "";
  } else {
    fileUrl = "";
    fileId = "";
  }

  // console.log(upload.files[0]);

  // console.log(fileId);

  // const file = await app.client.files.info({ file: fileId });
  // console.log(file);

  // TODO: retry if file hasn't finished uploading yet

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

  // setTimeout(async () => {
  //   try {
  //     await updateMessage();
  //   } catch {
  //     console.log("error");
  //   }
  // }, 500);

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

// app.event("connecting", () => console.log("Connecting to Slack..."));

// app.event("connected", () => console.log("Connected to Slack"));

(async () => {
  await app.start();
})();
