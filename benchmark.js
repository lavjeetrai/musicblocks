const { JSDOM } = require("jsdom");

const dom = new JSDOM(`
  <html>
    <body>
      <div id="floatingWindows">
        ${Array(100).fill(`
          <div class="windowFrame" style="width: 100px; height: 100px;">
            <div class="wfWinBody"></div>
            <div class="wfbWidget"></div>
          </div>
        `).join('')}
      </div>
    </body>
  </html>
`);

const document = dom.window.document;

function benchmarkQuerySelector() {
    const floatingWindowsDiv = document.getElementById("floatingWindows");
    const windowFrameElements = floatingWindowsDiv.querySelectorAll(".windowFrame");

    const start = process.hrtime.bigint();
    for (let j = 0; j < 1000; j++) {
        for (let i = 0; i < windowFrameElements.length; i++) {
            const windowFrame = windowFrameElements[i];
            const wfWinBody = windowFrame.querySelector(".wfWinBody");
            const wfbWidget = windowFrame.querySelector(".wfbWidget");
        }
    }
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000;
}

function benchmarkGetElementsByClassName() {
    const floatingWindowsDiv = document.getElementById("floatingWindows");
    const windowFrameElements = floatingWindowsDiv.getElementsByClassName("windowFrame");

    const start = process.hrtime.bigint();
    for (let j = 0; j < 1000; j++) {
        for (let i = 0; i < windowFrameElements.length; i++) {
            const windowFrame = windowFrameElements[i];
            const wfWinBody = windowFrame.getElementsByClassName("wfWinBody")[0];
            const wfbWidget = windowFrame.getElementsByClassName("wfbWidget")[0];
        }
    }
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000;
}

const qsTime = benchmarkQuerySelector();
const gebcTime = benchmarkGetElementsByClassName();

console.log(`querySelector: ${qsTime} ms`);
console.log(`getElementsByClassName: ${gebcTime} ms`);
console.log(`Improvement: ${((qsTime - gebcTime) / qsTime * 100).toFixed(2)}%`);
