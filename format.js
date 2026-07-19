const { readFileSync, writeFileSync } = require('fs');
let code = readFileSync('js/piemenus.js', 'utf8');
code = code.replace(
  `                        that._intervalWheel.navItems[l * 8 + j].navItem.show();
                        if (!activeTabs.includes(j + 1)) {
                            that._intervalWheel.navItems[l * 8 + j].enabled = false;
                        } else {
                            that._intervalWheel.navItems[l * 8 + j].enabled = true;
                        }`,
  `                        that._intervalWheel.navItems[l * 8 + j].navItem.show();
                        that._intervalWheel.navItems[l * 8 + j].enabled = activeTabs.includes(
                            j + 1
                        );`
);
writeFileSync('js/piemenus.js', code);
