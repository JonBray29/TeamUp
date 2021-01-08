describe("Test that the event dialog validation works", () => {
    beforeEach(() => {
        cy.visit("/").wait(100);
        cy.get("#save-event").click({force: true});

    });
    it("Event title validation should be shown when no event title is added", () => {
        cy.contains("Ensure you have entered an event name.").should("exist");
    });
    it("Event start date validation should be shown when there is no start date selected", () => {
        cy.contains("Ensure you have selected a start date.").should("exist");
    });
    it("Event end date validation should be shown when there is no end date selected", () => {
        cy.contains("Ensure you have selected an end date.").should("exist");
    });
});