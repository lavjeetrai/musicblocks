const { execSync } = require('child_process');

try {
  execSync('npx commitlint --verbose', {
    input: `refactor: add all tabs to each interval\n\nRemoves the TODO in js/piemenus.js by refactoring the __setupAction logic to always render all tabs for the active interval type but sets them to disabled when not present in the interval's activeTabs mapping, ensuring all interval tabs are visible for consistency while correctly maintaining their usability.`,
    stdio: 'pipe'
  });
  console.log("Passed!");
} catch (e) {
  console.log("Failed:", e.output.toString());
}
