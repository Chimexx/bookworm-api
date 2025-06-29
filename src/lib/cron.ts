import cron from "cron";
import https from "https";

const apiUrl = process.env.API_URL as string;

export const job = new cron.CronJob("*/14 * * * *", () => {
  https
    .get(apiUrl, (res) => {
      if (res.statusCode === 200) {
        console.log("GET Request sent successfully");
      } else {
        console.log("GET Request failed:", res.statusCode);
      }
    })
    .on("error", (e) => {
      console.error("Error while sending message", e.message);
    });
})