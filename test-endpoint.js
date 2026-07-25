const fs = require('fs');

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a", lang: "ewe" })
    });
    
    if (!res.ok) {
      console.error("Failed:", res.status, res.statusText);
      return;
    }
    
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync("test_endpoint.wav", buffer);
    console.log("Saved test_endpoint.wav. Size:", buffer.length);
    
    // Check WAV header
    const header = buffer.toString('ascii', 0, 4);
    if (header === 'RIFF') {
      console.log("Valid RIFF header found.");
    } else {
      console.error("Invalid WAV header:", header);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
