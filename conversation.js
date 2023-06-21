import {EdenClient} from "eden-sdk";
import fs from 'fs';
import characters from './characters.js';
import tts from './tts.js';
import {
  downloadFileFromUrl,
  concatenateVideos,
  parseChat,
  formatString,
} from './utils.js';


const promptTemplate = `I would like you to create a chat conversation between the following \${nCharacters} characters.

\${characterIntro}
The topic of the conversation is \${selectedTopic}.

Write a conversation between these \${nCharacters} characters that is at least 500 words long. It should be formatted as a chat, one line for each message. No one should speak except these \${nCharacters} characters.`;

export async function conversation(
  selectedCharacters, 
  selectedTopic, 
  init_image, 
  gfpgan
) {
  const eden = new EdenClient();

  //////////////////////////////////////////////////////
  // 1a) generate and parse conversation
    
  const nCharacters = selectedCharacters.length;
  const characterIntro = selectedCharacters.map(c => `${c}, ${characters[c].description}`).join('\n');  
  const prompt = formatString(promptTemplate, {
    nCharacters,
    characterIntro,
    selectedTopic
  });

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

  //////////////////////////////////////////////////////
  // 3) concatenate videos into one

  console.log(final_videos);
  await concatenateVideos(final_videos, "output");
  
}
