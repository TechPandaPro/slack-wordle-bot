import "dotenv/config";
import { SocketModeClient } from "@slack/socket-mode";

// const appToken = process.env.SLACK_APP_TOKEN

// SocketModeClient;

const slackClient = new SocketModeClient({
  appToken: process.env.SLACK_APP_TOKEN ?? "",
});

slackClient.on("connecting", () => console.log("Connecting to Slack..."));

slackClient.on("connected", () => console.log("Connected to Slack"));

slackClient.on("slash_commands", async ({ body, ack }) => {
  console.log("received!");
  if (body.command === "/wordle") {
    await ack({ text: "yay wordle!" });
  }
});

(async () => {
  await slackClient.start();
})();
