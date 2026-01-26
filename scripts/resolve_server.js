const fs = require('fs');
const path = require('path');

const serverPath = path.join(process.cwd(), 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Fix fetchAthleteActivitiesByEvent conflicts
// Remove the first small conflict (break vs log+break) - keep HEAD (clean break)
content = content.replace(/<<<<<<< HEAD\s+if \(response\.data\.length === 0\) break;\s+=======\s+\/\/console\.log.*?\s+if \(response\.data\.length === 0\) break;\s+>>>>>>> [a-f0-9]+/s, 'if (response.data.length === 0) break;');

// Fix the second large conflict (map body vs push logic)
// We want to keep HEAD's map body and append Remote's push logic
const mapBodyRegex = /<<<<<<< HEAD\s+(return \{[\s\S]+?category: athlete\.category \|\| "100"\s+\})\s+=======\s+([\s\S]+?)\s+>>>>>>> [a-f0-9]+/s;
content = content.replace(mapBodyRegex, (match, headBody, remoteBody) => {
    return `${headBody}
        })); // Close map

        ${remoteBody}`;
});

// 2. Fix syncEventActivitiesRange and syncEventActivities conflicts
// This is tricky because it spans multiple blocks.
// We will try to replace the whole section from the start of the conflict to the end.
// The conflict starts at `app.post('/syncEventActivitiesRange', ...`
// HEAD has one version, Remote has another.
// We want Remote's version.

const syncConflictRegex = /<<<<<<< HEAD\s+try \{\s+const \{[\s\S]+?\}\s+=======\s+(try \{\s+const \{[\s\S]+?\}\s+>>>>>>> [a-f0-9]+)/s;
// This only matches the first block.
// The file has nested/multiple conflicts in this area.
// Let's try to just read the file line by line and reconstruct it.

const lines = content.split('\n');
const newLines = [];
let inConflict = false;
let conflictBlock = [];

// Helper to process a conflict block
function processConflict(block) {
    const sepIndex = block.indexOf('=======');
    const head = block.slice(0, sepIndex);
    const remote = block.slice(sepIndex + 1);

    // Check content to decide
    const headStr = head.join('\n');
    const remoteStr = remote.join('\n');

    if (headStr.includes('return {') && headStr.includes('category: athlete.category')) {
        // This is the map body conflict. Keep HEAD + close map + Remote push
        return [
            ...head,
            '        }));',
            ...remote
        ];
    }

    if (headStr.includes('if (response.data.length === 0) break;')) {
        // Keep HEAD
        return head;
    }

    if (headStr.includes('const {') && headStr.includes('eventId,')) {
        // syncEventActivitiesRange start. Use Remote.
        return remote;
    }

    if (headStr.includes('// Mark EMPTY')) {
        // syncEventActivitiesRange end / syncEventActivities start. Use Remote.
        return remote;
    }

    if (headStr.includes('existingDocs = await EventActivity.find')) {
        // syncEventActivities conflict. Use Remote.
        return remote;
    }

    // Default to Remote for other logic updates
    return remote;
}

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('<<<<<<< HEAD')) {
        inConflict = true;
        conflictBlock = [];
    } else if (line.startsWith('>>>>>>>')) {
        inConflict = false;
        const resolved = processConflict(conflictBlock);
        newLines.push(...resolved);
    } else if (inConflict) {
        conflictBlock.push(line);
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync(serverPath, newLines.join('\n'));
console.log('Resolved server.js');
