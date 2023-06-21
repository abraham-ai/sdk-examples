import characters from './characters.js';
import {conversation} from './conversation.js';
import {monologue} from './monologue.js';
import {getRandomSample} from './utils.js';


async function generateMonologue() {
  const prompt = "What is the meaning of life? I think it can be seen as a"
  const init_image = 'https://minio.aws.abraham.fun/creations-stg/35e22f295753e2a3ab14b7096851d8500d05751244096d12dc005f136b794b09.jpg';
  const character_description = 'A portrait of a Samurai from the year 1875, headshot, portrait, body, facing forward';
  const gfpgan = false;
  const voiceID = 'VR6AewLTigWG4xSOukaG';
  await monologue(character_description, init_image, prompt, voiceID, gfpgan);
}

async function generateConversation() {
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
  ];
  const init_image = 'https://minio.aws.abraham.fun/creations-stg/35e22f295753e2a3ab14b7096851d8500d05751244096d12dc005f136b794b09.jpg';
  const gfpgan = false;
  const nCharacters = 3;
  // select nCharacters random characters and a random topic
  const allCharacters = Object.keys(characters);
  const selectedCharacters = getRandomSample(allCharacters, nCharacters);
  const selectedTopic = getRandomSample(topics, 1)[0];
  await conversation(selectedCharacters, selectedTopic, init_image, gfpgan);
}


generateConversation();
// generateMonologue();