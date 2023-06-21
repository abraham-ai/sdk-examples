import axios from 'axios';
import {downloadFile} from './utils.js';

const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1';

export default async function tts(text, voiceID) {
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