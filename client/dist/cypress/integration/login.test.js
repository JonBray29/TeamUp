describe("Tests that the login and signup dialog functions properly", () => {
    before(() => {
        cy.visit("/");
    });
    describe("Check login validation", () => {
        before(() => {
            cy.get(".submit-login").click();
        })
        it("Email validation should be shown when no email is input", () => {
            cy.contains("Ensure you have entered a valid email.").should("exist");
        });
        it("Email validation should be shown when invalid email is input", () => {
            cy.get("#login-email").type("This is not a valid email");
            cy.get(".submit-login").click();
            cy.contains("Ensure you have entered a valid email.").should("exist");
        });
        it("Password validation should be shown when no password is input", () => {
            cy.get(".submit-login").click();
            cy.contains("Ensure you have entered your password.").should("exist");
        });
    });
    describe("Check clicks on login page works", () => {
        it("Check click on signup button", () => {
            cy.contains("Sign Up").click();
            cy.get("#login-modal section").last().should("be.visible");
        })
        it("Check remember me checkbox is checked on click", () => {
            cy.get("#login-remember-me").click({force: true}).should("be.checked");
        })
    })
    describe("Check signup validation", () => {
        before(() => {
            cy.wait(100);
            cy.contains("Sign Up").click();
            cy.get(".submit-signup").click();
        });
        it("Email validation should be shown when no email is input", () => {
            cy.contains("Ensure you have entered a valid email.").should("exist");
        });
        it("Email validation should be shown when invalid email is input", () => {
            cy.get("#signup-email").type("This is not a valid email");
            cy.get(".submit-signup").click();
            cy.contains("Ensure you have entered a valid email.").should("exist");
        });
        it("Team name validation should be shown when no name is input", () => {
            cy.get(".submit-signup").click();
            cy.contains("Ensure that you have entered a team name.").should("exist");
        });
        it("Password validation should be shown when no password is input", () => {
            cy.get(".submit-signup").click();
            cy.contains("Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.").should("exist");
        });
        it("Password validation should be shown when no number in password", () => {
            cy.get("#signup-password").type("Password");
            cy.get(".submit-signup").click();
            cy.contains("Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.").should("exist");
        });
        it("Password validation should be shown when no uppercase letter in password", () => {
            cy.get("#signup-password").clear().type("password1");
            cy.get(".submit-signup").click();
            cy.contains("Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.").should("exist");
        });
        it("Password validation should be shown when no lowercase letter in password", () => {
            cy.get("#signup-password").clear().type("PASSWORD1");
            cy.get(".submit-signup").click();
            cy.contains("Ensure your password is at least 8 characters in length, contains 1 upper and 1 lowercase letter, and 1 Number.").should("exist");
        });
        it("Confirm password validation should be shown when passwords don't match", () => {
            cy.get("#signup-password").type("Password1");
            cy.get("#signup-password-confirm").type("Not the same password");
            cy.get(".submit-signup").click();
            cy.contains("Ensure that passwords match.").should("exist");
        })
    });
    describe("Check signup clicks work", () => {
        it("Check click on sign in button", () => {
            cy.contains("Sign Up").click();
            cy.contains("Sign In").click();
            cy.get("#login-modal section").first().should("be.visible");
        })
        it("Check create new team checkbox is checked on click", () => {
            cy.contains("Sign Up").click();
            cy.get("#signup-team-check").click().should("be.checked");
        })
    });
});