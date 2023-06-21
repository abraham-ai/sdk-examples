import fs from 'fs';
import path from 'path';
import axios from 'axios';
import {exec} from 'child_process';

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

function concatenateVideos(localFiles, outputFile) {
  const textFile = 'files.txt';
  fs.writeFileSync(textFile, localFiles.map(f => `file '${f}'`).join('\n'));
  concatenateVideosFromFile(textFile, outputFile);
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

function formatString(template, values) {
  return template.replace(/\${(\w+)}/g, (match, key) => values[key]);
}

export {
  downloadFile,
  downloadFileFromUrl,
  concatenateVideos,
  concatenateVideosFromFile,
  getAllFiles,
  getRandomSample,
  parseChat,
  parseLines,
  formatString
};