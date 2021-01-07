const puppeteer = require("puppeteer");

var browser;
var page;

beforeAll(async () => {
    browser = await puppeteer.launch();
});
afterAll(async () => {
    await browser.close();
});
beforeEach(async () => {
    page = await browser.newPage();
    await page.goto("https://elastic-mestorf-b1c185.netlify.app");
});
afterEach(async () => {
    await page.close();
});

describe("Page elements load", () => {
    test("Login dialog loads", async () => {
        expect(await page.$("#login-modal")).toBeDefined();
    });
    test("Notifications dialog loads", async () => {
        expect(await page.$("#notifications-dialog")).toBeDefined();
    });
    test("Events dialog loads", async () => {
        expect(await page.$("#events-dialog")).toBeDefined();
    });
    test("Calendar loads", async () => {
        expect(await page.$("#calendar")).toBeDefined();
    });
});

describe("Login dialog", () => {
    describe("Validation", () => {
        test("Display email empty error", async () => {
            await page.waitForSelector(".submit-login")
            await page.click(".submit-login");
            await page.waitForSelector("label[for=login-email] span")
            const textContent = await page.$eval("label[for=login-email] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure you have entered a valid email.");
        });
        test("Display password empty error", async () => {
            await page.waitForSelector(".submit-login")
            await page.click(".submit-login");
            await page.waitForSelector("label[for=login-password] span")
            const textContent = await page.$eval("label[for=login-password] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure you have entered your password.");
        });
        test("Display email not valid", async () => {
            await page.waitForSelector("#login-email");
            await page.type("#login-email", "This is not a valid email");
            await page.waitForSelector(".submit-login")
            await page.click(".submit-login");
            await page.waitForSelector("label[for=login-email] span")
            const textContent = await page.$eval("label[for=login-email] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure you have entered a valid email.");
        });
    });
    test("Remember me not checked", async () => {
        let checkbox = await page.$("#login-remember-me");
        await page.waitForSelector("#login-remember-me");
        await checkbox.getProperty('checked')
        expect(await (await checkbox.getProperty('checked')).jsonValue()).toBeFalsy();
    });
    test("Remember me checked", async () => {
        let checkbox = await page.$("#login-remember-me");
        await page.waitForSelector("#login-remember-me");
        await page.click("#login-remember-me");
        await checkbox.getProperty('checked')
        expect(await (await checkbox.getProperty('checked')).jsonValue()).toBeTruthy();
    });
});

describe("Signup dialog", () => {
    beforeEach(async () => {
        await page.waitForSelector("#login-modal");
        await page.click("#login-modal a:not(.active)");
    });
    describe("Signup validation", () => {
        test("Display email empty error", async () => {
            await page.waitForSelector(".submit-signup")
            await page.click(".submit-signup");
            await page.waitForSelector("label[for=signup-email] span")
            const textContent = await page.$eval("label[for=signup-email] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure you have entered a valid email.");
        });
        test("Display email not valid", async () => {
            await page.waitForSelector("#signup-email");
            await page.type("#signup-email", "This is not a valid email");
            await page.waitForSelector(".submit-signup")
            await page.click(".submit-signup");
            await page.waitForSelector("label[for=signup-email] span")
            const textContent = await page.$eval("label[for=signup-email] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure you have entered a valid email.");
        });
        test("Password without number", async () => {
            await page.waitForSelector("#signup-password");
            await page.type("#signup-password", "Password");
            await page.waitForSelector(".submit-signup")
            await page.click(".submit-signup");
            await page.waitForSelector("label[for=signup-password] span")
            const textContent = await page.$eval("label[for=signup-password] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.");
        });
        test("Password without uppercase", async () => {
            await page.waitForSelector("#signup-password");
            await page.type("#signup-password", "password1");
            await page.waitForSelector(".submit-signup")
            await page.click(".submit-signup");
            await page.waitForSelector("label[for=signup-password] span")
            const textContent = await page.$eval("label[for=signup-password] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.");
        });
        test("Password without lowercase", async () => {
            await page.waitForSelector("#signup-password");
            await page.type("#signup-password", "PASSWORD1");
            await page.waitForSelector(".submit-signup")
            await page.click(".submit-signup");
            await page.waitForSelector("label[for=signup-password] span")
            const textContent = await page.$eval("label[for=signup-password] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.");
        });
        test("Password confirm different", async () => {
            await page.waitForSelector("#signup-password");
            await page.type("#signup-password", "Password1");
            await page.waitForSelector("#signup-password-confirm");
            await page.type("#signup-password-confirm", "Not the same");
            await page.waitForSelector(".submit-signup")
            await page.click(".submit-signup");
            await page.waitForSelector("label[for=signup-password-confirm] span")
            const textContent = await page.$eval("label[for=signup-password-confirm] span", el => el.textContent)
            expect(textContent).toEqual(" Ensure that passwords match.");
        });
    });
    test("Create new team not checked", async () => {
        let checkbox = await page.$("#signup-team-check");
        await page.waitForSelector("#signup-team-check");
        await checkbox.getProperty('checked')
        expect(await (await checkbox.getProperty('checked')).jsonValue()).toBeFalsy();
    });
    test("Create new team checked", async () => {
        let checkbox = await page.$("#signup-team-check");
        await page.waitForSelector("#signup-team-check");
        await page.click("#signup-team-check");
        await checkbox.getProperty('checked')
        expect(await (await checkbox.getProperty('checked')).jsonValue()).toBeTruthy();
    });
});

describe("Tasks", () => {
    beforeEach(async () => {
        await page.waitForSelector("#login-modal");
        await page.waitForSelector("#login-email");
        await page.type("#login-email", "test@test.com");
        await page.waitForSelector("#login-password");
        await page.type("#login-password", "Password1");
        await page.waitForSelector(".submit-login");
        await page.click(".submit-login");
    });
    describe("Adding new task", () => {
        afterEach(async () => {
            await page.waitForSelector(".list-item");
            await page.click(".list-item");
        });

        test("Add new task", async () => {
            await page.waitForSelector("#new-task");
            await page.type("#new-task", "This is a new task", { delay: 50 });
            await page.keyboard.press(String.fromCharCode(13));
            await page.waitForSelector(".list-item");
            const textContent = await page.$eval(".list-item", el => el.textContent)
            expect(textContent).toEqual("This is a new task");
        });
    });
    describe("Remove task", () => {
        beforeEach(async () => {
            await page.waitForSelector("#new-task");
            await page.type("#new-task", "This is a new task", { delay: 50 });
            await page.keyboard.press(String.fromCharCode(13));
        });
        test("Remove task", async () => {
            
            await page.waitForSelector(".list-item");
            await page.click(".list-item", {delay: 50});

            let item = await page.$(".list-item .checked");
            expect(item).toBeDefined();
        });
    });
});