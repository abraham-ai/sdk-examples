import {EdenClient} from "eden-sdk";
import tts from './tts.js';


export async function monologue(
  character_description,
  init_image,
  prompt,
  voiceID,
  gfpgan,
) {
  const eden = new EdenClient();

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
}
