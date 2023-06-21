import {EdenClient} from "eden-sdk";
import fs from 'fs';
import axios from 'axios';
import characters from './characters.js';
import {
  downloadFile,
  downloadFileFromUrl,
  concatenateVideos,
  getRandomSample,
  parseChat,
} from './utils.js';

const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1';

const eden = new EdenClient();

async function tts(text, voiceID) {
  const voiceURL = `${ELEVENLABS_URL}/text-to-speech/${voiceID}`;
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
    console.log('File saved successfully.');
    console.log(result);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function generateConversation() {
  const nCharacters = 3;
  const init_image = 'https://minio.aws.abraham.fun/creations-stg/35e22f295753e2a3ab14b7096851d8500d05751244096d12dc005f136b794b09.jpg';
  const gfpgan = false;
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
  const messages = parseChat(completion);

  //////////////////////////////////////////////////////
  // 1b) generate each face image

  for (const c of selectedCharacters) {
    const character = characters[c];
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

  const final_videos = [];

  for (let message of messages) {
    const character = characters[message.speaker];
    const voiceID = character.voiceID;
    const faceFile = character.faceImage;

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
  }

  console.log(final_videos);
  await concatenateVideos(final_videos, "output");
}


generateConversation();
