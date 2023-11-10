const rawDataService = require("./rawDataService");
const prisma = require("./prisma/prisma.js");

async function populateRawData() {
  try {
    const rauId = 5; // Replace with the desired RAU ID
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const oneHourLater = new Date();
    oneHourLater.setTime(oneHourLater.getTime() + 60 * 60 * 1000); // Add one hour

    const currentTime = new Date(tenMinutesAgo);
    const randomMax = 20;

    while (currentTime <= oneHourLater) {
      const randomValues = {
        rau_id: rauId,
        timestamp: currentTime,
        serial_number: `SerialNumber_${Math.floor(Math.random() * randomMax)}`,
        status: "Status",
        est_freq: Math.random() * randomMax,
        est_p: Math.random() * randomMax,
        est_q: Math.random() * randomMax,
        est_s: Math.random() * randomMax,
        est_fi: Math.random() * randomMax,
        est_fi_deg: Math.random() * randomMax,
        est_pset: Math.random() * randomMax,
        channel_raw: `Channel_${Math.floor(Math.random() * randomMax)}`,
      };

      await prisma.tbl_RawData.create({
        data: randomValues,
      });

      currentTime.setSeconds(currentTime.getSeconds() + 1);
    }

    console.log("RawData populated successfully");
  } catch (error) {
    console.error("Error populating RawData:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Call the function to populate the rawData
populateRawData();
