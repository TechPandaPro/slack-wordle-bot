import "dotenv/config";
import { App } from "@slack/bolt";
import WordleGame from "./WordleGame";

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.command("/wordle", async (event) => {
  const wordleWord = "earth";

  const game = new WordleGame(wordleWord);

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
    filename: "wordle.jpg",
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
    // await app.client.chat.postEphemeral({
    await app.client.chat.postMessage({
      // user: event.command.user_id,
      channel: event.command.channel_id,
      text: `<@${event.command.user_id}> Wordle`,
      // text: `<@${event.command.user_id}> wants to play Wordle!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            // @ts-ignore
            text: `<@${event.command.user_id}> wants to play Wordle!`,
            // emoji: true,
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "This is a plain text section block.",
            // emoji: true,
          },
        },
        {
          // type: "file",
          // external_id: fileId,
          // source: "remote",
          type: "image",
          // slack_file: { url: fileUrl },
          slack_file: { id: fileId },
          alt_text: "Wordle game",
        },
        // {
        //   type: "image",
        //   // image_url:
        //   // "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/960px-Cat_November_2010-1a.jpg",
        //   // image_url: game.createImage(),
        //   image_url: fileUrl,
        //   alt_text: "Wordle game",
        // },
      ],
      // response_type: "in_channel",
    });

    // await event.respond({
    //   // text: `<@${event.command.user_id}> wants to play Wordle!`,
    //   blocks: [
    //     {
    //       type: "section",
    //       text: {
    //         type: "mrkdwn",
    //         // @ts-ignore
    //         text: `<@${event.command.user_id}> wants to play Wordle! ${fileUrl}`,
    //         // emoji: true,
    //       },
    //     },
    //     {
    //       type: "divider",
    //     },
    //     {
    //       type: "section",
    //       text: {
    //         type: "mrkdwn",
    //         text: "This is a plain text section block.",
    //         // emoji: true,
    //       },
    //     },
    //     {
    //       // type: "file",
    //       // external_id: fileId,
    //       // source: "remote",
    //       type: "image",
    //       // slack_file: { url: fileUrl },
    //       slack_file: { id: fileId },
    //       alt_text: "Wordle game",
    //     },
    //     // {
    //     //   type: "image",
    //     //   // image_url:
    //     //   // "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/960px-Cat_November_2010-1a.jpg",
    //     //   // image_url: game.createImage(),
    //     //   image_url: fileUrl,
    //     //   alt_text: "Wordle game",
    //     // },
    //   ],
    //   response_type: "in_channel",
    // });
  }, 5000);
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
