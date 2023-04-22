import * as fs from 'fs';
import * as csv from 'neat-csv';

const parseCsv = (filename: string): Promise<csv.Row[]> => {
    return new Promise<csv.Row[]>((resolve, reject) => {
        fs.readFile(filename, {}, async (e, data) => {
            if (e) {
                console.error('could not read file', e);
                reject(e);
                return;
            }
            const results = await csv(data);
            resolve(results);
        });
    });
};

export { parseCsv };
