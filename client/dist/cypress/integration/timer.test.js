before(() => {
    cy.visit("/");
});
beforeEach(() => {
    cy.wait(500);
    cy.get("#login-email").type("test@test.com");
    cy.get("#login-password").type("Password1");
    cy.get(".submit-login").click();
    cy.wait(100);
})
afterEach(() => {
    cy.reload();
})
it("On click play button expect play to hide", () => {
    cy.get("#play").click().wait(100).should("not.be.visible");
});
it("On click play button expect pause to be visible", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#pause").should("be.visible");
});
it("On click play button expect stop to be visible", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#stop").should("be.visible");
});
it("On click pause button expect pause to hide", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#pause").click().wait(100).should("not.be.visible");
});
it("On click pause button expect play to be visible", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#pause").click();
    cy.wait(100);
    cy.get("#play").should("be.visible");
});
it("On click pause button expect stop to be visible", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#pause").click();
    cy.wait(100);
    cy.get("#stop").should("be.visible");
}); 
it("On click stop button with no task entered expect toast", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#stop").click();
    cy.wait(100);
    cy.contains("Please enter a time tracking task name.").should("exist");
});
it("On click stop button with task entered expect stop to hide", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#time-task").type("This is a test task");
    cy.wait(100)
    cy.get("#stop").click().wait(100).should("not.be.visible");
});
it("On click stop button with task entered expect play to be visible", () => {
    cy.get("#play").click();
    cy.wait(100);
    cy.get("#time-task").type("This is a test task");
    cy.wait(100);
    cy.get("#stop").click();
    cy.wait(100);
    cy.get("#play").should("be.visible");
});
