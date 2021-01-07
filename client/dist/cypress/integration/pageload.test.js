const moment = require('moment');

//Tests that the page elements and attributes load properly.
beforeEach(() => {
    cy.visit("/");
});
describe("Page elements load properly", () => {
    it("Login dialog loads", () => {
        cy.get("#login-modal").should("exist");
    });
    it("Notification dialog loads", () => {
        cy.get("#notifications-dialog").should("exist");
    });
    it("Event dialog loads", () => {
        cy.get("#events-dialog").should("exist");
    });
    it("Calendar loads", () => {
        cy.get("#calendar").should("exist");
    });
});
describe("Page attributes and labels are set properly", () => {
    it("Title is set properly", () => {
        cy.title().should('eq', "Team Up");
    });
    it("Date is set properly", () => {
        cy.get("#date").contains(moment().format("dddd Do MMMM YYYY"));
    });
    it("Title is set properly", () => {
        cy.get("#time").contains(moment().format("HH:mm:ss"));
    });
});