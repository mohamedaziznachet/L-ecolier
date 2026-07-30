const fs = require('fs');
const css = fs.readFileSync('src/index.css', 'utf8');
let inString = false, stringChar = '', inComment = false;
let currentOpen = 0;
let lineNum = 1;
for(let i=0; i<css.length; i++) {
  let c = css[i], next = css[i+1];
  if(c === '\n') lineNum++;
  if(inComment) {
    if(c === '*' && next === '/') { inComment = false; i++; }
    continue;
  }
  if(inString) {
    if(c === '\\') { i++; continue; }
    if(c === stringChar) { inString = false; }
    continue;
  }
  if(c === '/' && next === '*') { inComment = true; i++; continue; }
  if(c === '"' || c === "'") { inString = true; stringChar = c; continue; }
  if(c === '{') {
    currentOpen++;
  }
  if(c === '}') {
    currentOpen--;
    if(currentOpen < 0) {
      console.log('Negative nesting at line ' + lineNum);
      currentOpen = 0;
    }
  }
}
console.log('Final nesting:', currentOpen);
