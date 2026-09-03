import fs from 'node:fs';
import path from 'node:path';

const INPUT_DIR =
  'data/gtfs/rapid-bus-kl';

const OUTPUT_DIR =
  'src/shared/data/bus';

function parseCsvLine(line) {
  const values = [];

  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      char === ',' &&
      !quoted
    ) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);

  return values;
}

function readTable(filename) {
  const fullPath =
    path.join(
      INPUT_DIR,
      filename,
    );

  const text =
    fs.readFileSync(
      fullPath,
      'utf8',
    );

  const lines =
    text
      .replace(/\r/g, '')
      .trim()
      .split('\n');

  const headers =
    parseCsvLine(lines[0]);

  return lines
    .slice(1)
    .map(line => {
      const values =
        parseCsvLine(line);

      return Object.fromEntries(
        headers.map(
          (header, index) => [
            header,
            values[index] ?? '',
          ],
        ),
      );
    });
}

const stops =
  readTable('stops.txt');

const output =
  stops
    .map(stop => ({
      stopId:
        stop.stop_id,

      name:
        stop.stop_name,

      lat:
        Number(stop.stop_lat),

      lon:
        Number(stop.stop_lon),
    }))
    .filter(
      stop =>
        Number.isFinite(stop.lat) &&
        Number.isFinite(stop.lon),
    );

fs.mkdirSync(
  OUTPUT_DIR,
  {
    recursive: true,
  },
);

fs.writeFileSync(
  path.join(
    OUTPUT_DIR,
    'stops.json',
  ),
  JSON.stringify(
    output,
    null,
    2,
  ),
);

console.log(
  `Bus stops emitted: ${output.length}`,
);