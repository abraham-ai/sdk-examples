import {EdenClient} from "eden-sdk";
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import {exec} from 'child_process';


const characters = {
  'Czar': {
    description: 'a healer who is interested in water, botany, and ecological restoration.',
    voiceID: 'VR6AewLTigWG4xSOukaG'
  },
  'Delic': {
    description: 'a carpenter who rides an electric unicycle and practices AI prompt engineering.',
    voiceID: 'ErXwobaYiN019PkySvjV'
  },
  'Marzipan': {
    description: 'a microbiologist who is interested in creating wetware to support the Bombay Beach simulation.',
    voiceID: 'TxGEqnHWrfWFTfGW9XjX'
  },
  'Jmill': {
    description: 'a hacker who is raising chatbots to be his children.',
    voiceID: 'VR6AewLTigWG4xSOukaG'
  },
  'Vanessa': {
    description: 'an artist who is building a simulation linking the minds of people in Bombay Beach.',
    voiceID: '21m00Tcm4TlvDq8ikWAM'
  },
  'Chatsubo': {
    description: 'a mystic and yogi advocating for young people to move to the desert and take up vanlife.',
    voiceID: 'pNInz6obpgDQGcFmaJgB'
  },
  'Gene': {
    description: 'a computer engineer and inventor who is building a simulation engine for the collective imagination.',
    voiceID: 'yoZ06aMxZJJ28mfd3POQ'
  },
  'Xander': {
    description: 'a rock climber turned AI researcher and biotech engineer.',
    voiceID: 'pNInz6obpgDQGcFmaJgB'
  },
  'Vincent': {
    description: 'a media artist and detective investigating an alleged plot to tamper with the intelligence simulator.',
    voiceID: 'VR6AewLTigWG4xSOukaG'
  },
  'Nico': {
    description: 'a musician and composer who is interested in regenerative finance and high-tech ecovillages.',
    voiceID: 'AZnzlk1XvdvUeBnXmlld'
  },
}

const topics = [
  "how cool Bombay Beach is",
  "off-grid solarpunk communities in the desert",
  "artificial intelligence and the ultimate nature of reality",
  "consciousness and and the simulation",
  "DAOs, blockchains, and crypto-art",
  "the future of the internet",
  "how to make a living as an artist",
  "the beauty of mathematics and physics",
  "Keynesian and Austrian economics",
  "the differences among the various flavors of Buddhism",
]

const elevenLabsAPI = 'https://api.elevenlabs.io/v1';

const eden = new EdenClient();

function downloadFile(response, filename) {
  return new Promise((resolve, reject) => {
    response.data.pipe(fs.createWriteStream(filename))
      .on('finish', () => {
        console.log('Downloaded successfully.');
        resolve(filename);
      })
      .on('error', (error) => {
        console.error('Error downloading file:', error);
        reject(error);
      });
  });
}

async function downloadFileFromUrl(url, filename) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  });
  const downloadedFile = await downloadFile(response, filename);
  return downloadedFile;
}

function concatenateVideosFromFile(textFile, outputFile) {
  const cmd = `ffmpeg -f concat -safe 0 -i ${textFile} -c copy ${outputFile}.mp4`;
  console.log("RUN", cmd)
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

function concatenateVideos(localFiles, outputFile) {
  const textFile = 'files.txt';
  fs.writeFileSync(textFile, localFiles.map(f => `file '${f}'`).join('\n'));
  concatenateVideosFromFile(textFile, outputFile);
}

function getAllFiles(directoryPath, filetype) {
  const files = fs.readdirSync(directoryPath).filter(file => file.endsWith(filetype));
  return files.map(file => path.join(directoryPath, file));
}

function getRandomSample(array, n) {
  let result = [];
  while (result.length < n) {
    const index = Math.floor(Math.random() * array.length);
    if (!result.includes(array[index])) {
      result.push(array[index]);
    }
  }
  return result;
}

function parseChat(chatText) {
  const messages = [];
  const lines = chatText.split("\n");
  for (let line of lines) {
    line = line.trim();
    if (line.includes(":")) {
      const [speaker, message] = line.split(":", 2).map((s) => s.trim());
      messages.push({ speaker, message });
    }
  }
  return messages;
}

function parseLines(text) {
  const textLines = text.trim().split("\n");
  let lines = [];
  for (let line of textLines) {
    line = line.trim();
    line = line.replace(/^\d+\.\s*/, '');
    if (line.length > 0) {
      lines.push(line);
    }
  }
  return lines;
}

async function tts(text, voiceID) {
  const voiceURL = `${elevenLabsAPI}/text-to-speech/${voiceID}`;

  const response = await axios({
    method: 'POST',
    url: voiceURL,
    data: {
      text: text,
      voice_settings: {
        stability: 0,
        similarity_boost: 0
      },
      model_id: undefined
    },
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    responseType: 'stream'
  });

  const randomId = Math.floor(Math.random() * 1000000);
  const filename = `audio-${randomId}.mp3`;

  const audioFilename = await downloadFile(response, filename);
  return audioFilename;
}

async function generateMonologue() {
  try {
    const prompt = "What is the meaning of life? I think it can be seen as a"
    const init_image = 'https://minio.aws.abraham.fun/creations-stg/35e22f295753e2a3ab14b7096851d8500d05751244096d12dc005f136b794b09.jpg';
    const character_description = 'A portrait of a Samurai from the year 1875, headshot, portrait, body, facing forward';
    const gfpgan = false;

    //////////////////////////////////////////////////////
    // 1a) generate the text with a GPT-3 completion
    
    let result1 = await eden.create("complete", {
      prompt: prompt
    });
    const completion = result1.task.output.result.trim();
    
    //////////////////////////////////////////////////////
    // 1b) generate profile image

    const face_config = {
      text_input: character_description,
      init_image_data: init_image,
      init_image_strength: 0.2,
      width: 576,
      height: 832
    }
    const face_result = await eden.create("create", face_config);
    const faceFile = face_result.uri;
    
    //////////////////////////////////////////////////////
    // 2) generate tts
    const voiceID = 'VR6AewLTigWG4xSOukaG';
    const audioFileLocal = await tts(completion, voiceID);
    const audioFile = await eden.uploadFile(audioFileLocal);
    
    //////////////////////////////////////////////////////
    // 3) generate a lip-synced video from the speech and face
    const result = await eden.create("wav2lip", {
      speech_url: audioFile.url,
      face_url: faceFile,
      gfpgan: gfpgan,
      gfpgan_upscale: 2.0
    });

    // final result here
    console.log(result);
    console.log('File saved successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}



async function generateConversation() {
  const nCharacters = 3;
  const init_image = 'https://minio.aws.abraham.fun/creations-stg/35e22f295753e2a3ab14b7096851d8500d05751244096d12dc005f136b794b09.jpg';
  const gfpgan = false;

  const allCharacters = Object.keys(characters);
  const selectedCharacters = getRandomSample(allCharacters, nCharacters);
  const selectedTopic = getRandomSample(topics, 1)[0];

  //////////////////////////////////////////////////////
  // 1a) generate and parse conversation
    
  let characterIntro = "";
  for (const c of selectedCharacters) {
    const character = characters[c];
    characterIntro += `${c}, ${character.description}\n`;
  }

  const prompt = `I would like you to create a chat conversation between the following ${nCharacters} characters.

${characterIntro}
The topic of the conversation is ${selectedTopic}.

Write a conversation between these ${nCharacters} characters that is at least 500 words long. It should be formatted as a chat, one line for each message. No one should speak except these ${nCharacters} characters.`;

  const result = await eden.create("complete", {
    prompt: prompt
  });
  const completion = result.task.output.result.trim();
  console.log(completion);

  const messages = parseChat(completion);

  console.log(messages);

  //////////////////////////////////////////////////////
  // 1b) generate each face image

  for (const c of selectedCharacters) {
    const character = characters[c];
    console.log("get character face", c)
    const face_config = {
      text_input: character.description,
      init_image_data: init_image,
      init_image_strength: 0.22,
      width: 576,
      height: 832
    }
    const face_result = await eden.create("create", face_config);
    character.faceImage = face_result.uri;
  }

  //////////////////////////////////////////////////////
  // 2) generate tts and video
  console.log("TTS")
  const final_videos = [];

  for (let message of messages) {
    const character = characters[message.speaker];
    const voiceID = character.voiceID;
    const faceFile = character.faceImage;

    console.log("-> " + message.message, voiceID, faceFile)

    const audioFileLocal = await tts(message.message, voiceID);
    const audioFile = await eden.uploadFile(audioFileLocal);
    fs.unlinkSync(audioFileLocal);

    const result = await eden.create("wav2lip", {
      speech_url: audioFile.url,
      face_url: faceFile,
      gfpgan: gfpgan,
      gfpgan_upscale: 2.0
    });

    const randomId = Math.floor(Math.random() * 1000000);
    const filename = `audio-${randomId}.mp4`;
    const video = await downloadFileFromUrl(result.uri, filename);
    final_videos.push(video);

    // final result here
    console.log(result);
  }
  console.log(final_videos);
  await concatenateVideos(final_videos, "myOutput3.mp4");
}


// time this
let start = new Date();
generateConversation();
let end = new Date();
console.log("Time elapsed: " + (end - start) + "ms");
// concatenateVideosFromFile('files.txt', 'final')