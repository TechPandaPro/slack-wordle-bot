import "dotenv/config";
import { App, subtype } from "@slack/bolt";
import WordleGame from "./WordleGame";
import WordleGameManager from "./WordleGameManager";

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

  const ts: string = event.message.ts;

  // @ts-ignore - for some reason, @slack/bolt doesn't have this parameter in the typings
  const threadTs: string | undefined = event.message.thread_ts;

  if (!threadTs || ts === threadTs) return;

  console.log("in thread.");

  // console.log(wordleGames.get(threadTs));
  // console.log(wordleGames.get("1"));

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
  const wordleWord = "earth";

  // const game = new WordleGame(wordleWord);

  const game = wordleGames.create(String(Date.now()), wordleWord);

  game.guesses.push("hello");

  wordleGames.save(game);

  const upload = await app.client.filesUploadV2({
    // channel_id: "C095LGQCJKE",
    // content: game.createImage(),
    file: game.createImage(),
    // title: "example text file",
    // file: Buffer.from(
    //   await (
    //     await fetch(
    //       "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/960px-Cat_November_2010-1a.jpg"
    //     )
    //   ).arrayBuffer()
    // ),
    filename: "wordle.png",
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
  // return;

  console.log(fileId);

  // console.log(event);
  // console.log("hey");
  await event.ack({ text: "Wordle incoming!" });
  setTimeout(async () => {
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

    // const wordleMessageOptions: Parameters<typeof app.client.chat.update>[0] = {
    const wordleMessageOptions: Parameters<typeof app.client.chat.update>[0] = {
      ts: wordleMessage.ts,
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
        {
          type: "image",
          slack_file: { id: fileId },
          alt_text: "Wordle game",
        },
      ],
    };

    // if (!wordleMessage.ts || !wordleMessage.channel)
    //   throw new Error("No ts found on Wordle reply");

    await app.client.chat.update(wordleMessageOptions);

    await app.client.chat.postMessage({
      channel: wordleMessage.channel ?? "",
      thread_ts: wordleMessage.ts ?? "",
      // reply_broadcast: true,
      text: "Post your guesses in this thread! (Everyone can participate!)",
    });
  }, 1000);
  // await event.
  // await event.say("hey");
  // await event.
});

// app.event("connecting", () => console.log("Connecting to Slack..."));

// app.event("connected", () => console.log("Connected to Slack"));

// slackClient.on("slash_commands", async ({ body, ack }) => {
//   console.log("received!");
//   if (body.command === "/wordle") {
//     // await ack({ text: "yay wordle!" });
//     await ack({});
//     // await
//   }
// });
// slackClient.on("slash_commands", async ({ body, ack }) => {
//   console.log("received!");
//   if (body.command === "/wordle") {
//     // await ack({ text: "yay wordle!" });
//     await ack({});
//     // await
//   }
// });

(async () => {
  await app.start();
})();
