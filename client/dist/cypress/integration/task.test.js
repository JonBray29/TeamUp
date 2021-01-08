describe("Checks that adding and removing tasks works", () => {
    before(() => {
        cy.visit("/");
        cy.wait(1000);
        cy.get("#login-email").type("test@test.com");
        cy.get("#login-password").type("Password1");
        cy.get(".submit-login").click().wait(100);
    });
    it("On enter when new task input should add task to list", () => {
        cy.get("#new-task").type("This is a new task {enter}");
        cy.get("#todo-list").children().should("have.length", 2);
    });
    it("Clicking on task in list should remove it from the list", () => {
        cy.get(".list-item").click();
        cy.wait(5000);
        cy.get("#todo-list").children().should("have.length", 1);
    })
    it("Clicking on task in list should add a strike through to the list item", () => {
        cy.get("#new-task").type("Strike through me {enter}");
        cy.get(".list-item").click().should("have.css", "text-decoration", "line-through solid rgb(255, 255, 255)");
    });
});