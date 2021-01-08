describe("Check that the timer functionality works", () => {
    before(() => {
        cy.visit("/");
    });
    afterEach(() => {
        cy.reload();
    })
    it("On click play button expect play to hide", () => {
        cy.get("#play").click({force: true}).wait(100).should("not.be.visible");
    });
    it("On click play button expect pause to be visible", () => {
        cy.get("#play").click({force: true});
        cy.wait(100);
        cy.get("#pause").should("be.visible");
    });
    it("On click play button expect stop to be visible", () => {
        cy.get("#play").click({force: true});
        cy.wait(100);
        cy.get("#stop").should("be.visible");
    });
    it("On click pause button expect pause to hide", () => {
        cy.get("#play").click({force: true});
        cy.wait(100);
        cy.get("#pause").click({force: true}).wait(100).should("not.be.visible");
    });
    it("On click pause button expect play to be visible", () => {
        cy.get("#play").click({force: true});
        cy.wait(100);
        cy.get("#pause").click({force: true});
        cy.wait(100);
        cy.get("#play").should("be.visible");
    });
    it("On click pause button expect stop to be visible", () => {
        cy.get("#play").click({force: true});
        cy.wait(100);
        cy.get("#pause").click({force: true});
        cy.wait(100);
        cy.get("#stop").should("be.visible");
    }); 
    it("On click stop button with no task entered expect toast", () => {
        cy.get("#play").click({force: true});
        cy.wait(100);
        cy.get("#stop").click({force: true});
        cy.wait(100);
        cy.contains("Please enter a time tracking task name.").should("exist");
    });
});