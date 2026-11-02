/**
 * MusicBlocks v3.6.2
 *
 * @author eyeaadil
 *
 * @copyright 2026 eyeaadil
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

global.clampNumber = require("../utils-logic").clampNumber;

// Load the file which attaches MBDialog to window
require("../mb-dialog");

describe("MBDialog", () => {
    beforeEach(() => {
        // Clear DOM and classes before each test
        document.body.innerHTML = "";
        document.body.className = "";

        // Reset translation mock
        delete window._;

        // Mock matchMedia
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            }))
        });

        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

        // Mock requestAnimationFrame and cancelAnimationFrame asynchronously to match browser behavior
        window.requestAnimationFrame = jest.fn().mockImplementation(cb => {
            return setTimeout(cb, 0);
        });
        window.cancelAnimationFrame = jest.fn().mockImplementation(id => {
            clearTimeout(id);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Remove left-over dialogs if any
        document.querySelectorAll(".mb-system-dialog").forEach(el => el.remove());
    });

    describe("MBDialog.alert()", () => {
        test("creates an alert dialog with message and default title", () => {
            window.MBDialog.alert("Test Alert Message");

            const overlay = document.querySelector(".mb-dialog-overlay");
            const frame = document.querySelector(".windowFrame");
            const title = document.querySelector(".wftTitle");
            const message = document.querySelector(".wfbWidget > div");
            const okButton = document.querySelector(".confirm-button");

            expect(overlay).toBeTruthy();
            expect(frame).toBeTruthy();
            expect(title.textContent).toBe("Music Blocks"); // Default title
            expect(message.textContent).toBe("Test Alert Message");
            expect(okButton).toBeTruthy();
            expect(okButton.textContent).toBe("OK");
        });

        test("creates an alert dialog with custom title and OK text", () => {
            window.MBDialog.alert("Hello", "Custom Title", { okText: "Got it" });

            expect(document.querySelector(".wftTitle").textContent).toBe("Custom Title");
            expect(document.querySelector(".confirm-button").textContent).toBe("Got it");
        });

        test("closes the dialog when OK is clicked", () => {
            const onCloseMock = jest.fn();
            window.MBDialog.alert("Message", "Title", { onClose: onCloseMock });

            expect(document.querySelector(".windowFrame")).toBeTruthy();

            const okButton = document.querySelector(".confirm-button");
            okButton.click();

            expect(document.querySelector(".windowFrame")).toBeNull();
            expect(onCloseMock).toHaveBeenCalledTimes(1);
        });

        test("closes the dialog when top-bar close button is clicked", () => {
            window.MBDialog.alert("Message");
            const closeBtn = document.querySelector(".wftButton.close");
            closeBtn.click();
            expect(document.querySelector(".windowFrame")).toBeNull();
        });

        test("closes the dialog when Escape key is pressed", () => {
            window.MBDialog.alert("Message");
            expect(document.querySelector(".windowFrame")).toBeTruthy();

            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);

            expect(document.querySelector(".windowFrame")).toBeNull();
        });

        test("ignores other key presses", () => {
            window.MBDialog.alert("Message");

            const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
            document.dispatchEvent(enterEvent);

            expect(document.querySelector(".windowFrame")).toBeTruthy(); // Should still be open
        });
    });

    describe("MBDialog.prompt()", () => {
        test("creates a prompt dialog with an input field", () => {
            window.MBDialog.prompt({
                title: "Prompt Title",
                message: "Enter name",
                defaultValue: "Default Name",
                okText: "Submit",
                cancelText: "Abort"
            });

            const input = document.querySelector("input[type='text']");
            const confirmBtn = document.querySelector(".confirm-button");
            const cancelBtn = document.querySelector(".cancel-button");

            expect(input).toBeTruthy();
            expect(input.value).toBe("Default Name");
            expect(document.querySelector(".wftTitle").textContent).toBe("Prompt Title");
            expect(confirmBtn.textContent).toBe("Submit");
            expect(cancelBtn.textContent).toBe("Abort");
        });

        test("resolves the promise with input value when OK is clicked", async () => {
            const promptPromise = window.MBDialog.prompt({ defaultValue: "My Input" });

            const confirmBtn = document.querySelector(".confirm-button");
            confirmBtn.click();

            const result = await promptPromise;
            expect(result).toBe("My Input");
            expect(document.querySelector(".windowFrame")).toBeNull(); // ensures closed
        });

        test("resolves the promise with input value when Enter key is pressed in input field", async () => {
            const promptPromise = window.MBDialog.prompt({ defaultValue: "Typing..." });

            const input = document.querySelector("input[type='text']");
            const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            input.dispatchEvent(enterEvent);

            const result = await promptPromise;
            expect(result).toBe("Typing...");
            expect(document.querySelector(".windowFrame")).toBeNull();
        });

        test("stops propagation of keyup and keypress events on prompt input", () => {
            const originalPrompt = window.MBDialog.prompt;

            // Use prompt() with empty options and test keyup/keypress stopping propagation
            const promptPromise = originalPrompt();
            const input = document.querySelector("input[type='text']");

            const keyupSpy = jest.fn();
            const keypressSpy = jest.fn();
            document.addEventListener("keyup", keyupSpy);
            document.addEventListener("keypress", keypressSpy);

            input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent("keypress", { bubbles: true }));

            expect(keyupSpy).not.toHaveBeenCalled();
            expect(keypressSpy).not.toHaveBeenCalled();

            document.removeEventListener("keyup", keyupSpy);
            document.removeEventListener("keypress", keypressSpy);

            // Clean up opened prompt
            const cancelBtn = document.querySelector(".cancel-button");
            if (cancelBtn) cancelBtn.click();
            return promptPromise;
        });

        test("resolves with null when Cancel button is clicked", async () => {
            const promptPromise = window.MBDialog.prompt({});

            const cancelBtn = document.querySelector(".cancel-button");
            cancelBtn.click();

            const result = await promptPromise;
            expect(result).toBeNull();
        });

        test("resolves with null when Escape key is pressed", async () => {
            const promptPromise = window.MBDialog.prompt({});

            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);

            const result = await promptPromise;
            expect(result).toBeNull();
        });

        test("resolves with null when top-bar close button is clicked", async () => {
            const promptPromise = window.MBDialog.prompt({});

            const closeBtn = document.querySelector(".wftButton.close");
            closeBtn.click();

            const result = await promptPromise;
            expect(result).toBeNull();
        });
    });

    describe("Theme Management", () => {
        test("uses localStorage theme preference if available", () => {
            window.localStorage.getItem.mockReturnValue("dark");
            window.MBDialog.alert("Dark Mode Test");
            expect(document.body.classList.contains("dark")).toBe(true);
        });

        test("falls back to matchMedia preferred-color-scheme if no localStorage", () => {
            window.matchMedia.mockImplementation(query => ({
                matches: query === "(prefers-color-scheme: dark)", // true for dark mode
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));

            window.MBDialog.alert("Media Query Dark Mode Test");
            expect(document.body.classList.contains("dark")).toBe(true);
        });

        test("defaults to light theme if no preferences found", () => {
            window.MBDialog.alert("Light Mode Test");
            expect(document.body.classList.contains("light")).toBe(true);
        });

        test("does not override existing theme on body", () => {
            document.body.classList.add("dark");
            window.localStorage.getItem.mockReturnValue("light"); // Should ignore this

            window.MBDialog.alert("Keep Existing Theme Test");
            expect(document.body.classList.contains("dark")).toBe(true);
            expect(document.body.classList.contains("light")).toBe(false);
        });

        test("handles localStorage.getItem throwing an exception gracefully", () => {
            window.localStorage.getItem.mockImplementation(() => {
                throw new Error("QuotaExceeded or SecurityError");
            });
            window.MBDialog.alert("Storage error test");
            expect(document.body.classList.contains("light")).toBe(true);
        });
    });

    describe("Dialog lifecycle constraints & DOM containers", () => {
        test("creating a new dialog removes active ones", () => {
            window.MBDialog.alert("First Alert");
            expect(document.querySelectorAll(".windowFrame").length).toBe(1);

            window.MBDialog.alert("Second Alert");
            expect(document.querySelectorAll(".windowFrame").length).toBe(1);
            expect(document.querySelector(".wfbWidget > div").textContent).toBe("Second Alert");
        });

        test("attaches dialog to #floatingWindows if present", () => {
            const fw = document.createElement("div");
            fw.id = "floatingWindows";
            document.body.appendChild(fw);

            window.MBDialog.alert("Floating container test");
            expect(fw.querySelector(".windowFrame")).toBeTruthy();
            expect(fw.querySelector(".mb-dialog-overlay")).toBeTruthy();
        });

        test("prevents default on wheel events over the overlay", () => {
            window.MBDialog.alert("Overlay wheel test");
            const overlay = document.querySelector(".mb-dialog-overlay");
            const wheelEvent = new MouseEvent("wheel", { cancelable: true });
            const defaultPrevented = !overlay.dispatchEvent(wheelEvent);
            expect(defaultPrevented).toBe(true);
        });

        test("recenters dialog on window resize", () => {
            window.MBDialog.alert("Resize test");
            const frame = document.querySelector(".windowFrame");
            frame.getBoundingClientRect = jest.fn(() => ({
                top: 0,
                left: 0,
                width: 200,
                height: 100
            }));
            window.innerWidth = 800;
            window.innerHeight = 600;

            window.dispatchEvent(new Event("resize"));
            expect(frame.style.left).toBe("300px"); // (800 - 200) / 2
            expect(frame.style.top).toBe("250px"); // (600 - 100) / 2
        });
    });

    describe("Internationalization (i18n)", () => {
        test("translates default texts when window._ is available", () => {
            window._ = jest.fn(key => {
                if (key === "OK") return "D'accord";
                if (key === "Cancel") return "Annuler";
                if (key === "Close") return "Fermer";
                return key;
            });

            window.MBDialog.prompt({});

            const okBtn = document.querySelector(".confirm-button");
            const cancelBtn = document.querySelector(".cancel-button");
            const closeBtn = document.querySelector(".wftButton.close");

            expect(okBtn.textContent).toBe("D'accord");
            expect(cancelBtn.textContent).toBe("Annuler");
            expect(closeBtn.title).toBe("Fermer");
            expect(closeBtn.getAttribute("aria-label")).toBe("Fermer");
        });
    });

    describe("Dragging functionality", () => {
        test("allows dragging the dialog via the title bar", done => {
            window.MBDialog.alert("Draggable Alert");
            const frame = document.querySelector(".windowFrame");
            const topBar = document.querySelector(".wfTopBar");

            // Mock getBoundingClientRect
            frame.getBoundingClientRect = jest.fn(() => ({
                top: 100,
                left: 100,
                width: 300,
                height: 200
            }));

            // Mouse down on top bar
            topBar.dispatchEvent(
                new MouseEvent("mousedown", { clientX: 150, clientY: 110, bubbles: true })
            );

            // Mouse move on document
            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 150 }));

            setTimeout(() => {
                // Dialog should have moved
                expect(frame.style.left).toBe("150px"); // 100 + (200 - 150)
                expect(frame.style.top).toBe("140px"); // 100 + (150 - 110)

                // Mouse up stops dragging
                document.dispatchEvent(new MouseEvent("mouseup"));

                // Subsequent moves shouldn't affect position
                document.dispatchEvent(new MouseEvent("mousemove", { clientX: 500, clientY: 500 }));

                setTimeout(() => {
                    expect(frame.style.left).toBe("150px");
                    done();
                }, 10);
            }, 10);
        });

        test("does not initiate drag if mousedown targets a button inside topBar", done => {
            window.MBDialog.alert("Button click in topBar");
            const frame = document.querySelector(".windowFrame");
            const closeBtn = document.querySelector(".wftButton.close");

            frame.getBoundingClientRect = jest.fn(() => ({
                top: 100,
                left: 100,
                width: 300,
                height: 200
            }));

            closeBtn.dispatchEvent(
                new MouseEvent("mousedown", { clientX: 100, clientY: 100, bubbles: true })
            );

            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 200 }));

            setTimeout(() => {
                // Position should not change from default
                expect(frame.style.left).not.toBe("200px");
                done();
            }, 10);
        });

        test("cancels active animation frame if dragging ends while animation frame is pending", () => {
            let rafCb = null;
            window.requestAnimationFrame = jest.fn(cb => {
                rafCb = cb;
                return 42;
            });

            window.MBDialog.alert("Cancel RAF test");
            const frame = document.querySelector(".windowFrame");
            const topBar = document.querySelector(".wfTopBar");

            frame.getBoundingClientRect = jest.fn(() => ({
                top: 50,
                left: 50,
                width: 200,
                height: 100
            }));

            topBar.dispatchEvent(
                new MouseEvent("mousedown", { clientX: 60, clientY: 60, bubbles: true })
            );
            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 70, clientY: 70 }));

            // Mouseup while RAF is pending
            document.dispatchEvent(new MouseEvent("mouseup"));
            expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);

            // If the pending callback runs after dragging was set to false
            if (rafCb) rafCb();
            // Should not crash and position should remain clamped/unchanged
        });

        test("ignores mousemove if dragging is false", () => {
            window.MBDialog.alert("Not dragging test");
            const frame = document.querySelector(".windowFrame");
            const initialLeft = frame.style.left;

            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 300, clientY: 300 }));
            expect(frame.style.left).toBe(initialLeft);
        });

        test("clamps dragging position within window bounds", done => {
            window.innerWidth = 500;
            window.innerHeight = 400;

            window.MBDialog.alert("Clamp test");
            const frame = document.querySelector(".windowFrame");
            const topBar = document.querySelector(".wfTopBar");

            Object.defineProperty(frame, "offsetWidth", { value: 200, configurable: true });
            Object.defineProperty(frame, "offsetHeight", { value: 100, configurable: true });

            frame.getBoundingClientRect = jest.fn(() => ({
                top: 100,
                left: 100,
                width: 200,
                height: 100
            }));

            topBar.dispatchEvent(
                new MouseEvent("mousedown", { clientX: 100, clientY: 100, bubbles: true })
            );

            // Drag far into negative space
            document.dispatchEvent(new MouseEvent("mousemove", { clientX: -100, clientY: -100 }));

            setTimeout(() => {
                expect(frame.style.left).toBe("8px"); // clamp min 8
                expect(frame.style.top).toBe("64px"); // clamp min 64

                // Drag far beyond window bounds
                document.dispatchEvent(
                    new MouseEvent("mousemove", { clientX: 1000, clientY: 1000 })
                );

                setTimeout(() => {
                    // maxLeft = 500 - 200 = 300
                    // maxTop = 400 - 100 = 300
                    expect(frame.style.left).toBe("300px");
                    expect(frame.style.top).toBe("300px");
                    done();
                }, 10);
            }, 10);
        });
    });
});
