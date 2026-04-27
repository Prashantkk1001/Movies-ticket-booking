import { inngest } from "./inngest/index.js";

async function test() {
  try {
    await inngest.send({
      name: "app/show.added",
      data: { movieTitle: "Test Movie" },
    });
    console.log("Sent successfully");
  } catch (error) {
    console.error("Caught error:", error);
  }
}

test();
