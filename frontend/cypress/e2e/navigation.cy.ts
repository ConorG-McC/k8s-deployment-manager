describe('Navigation', () => {
  it('handles unknown routes by falling back to HomePage', () => {
    cy.visit('http://localhost:3000/unknown');
    cy.contains('Kubernetes Deployment Tracker').should('be.visible');
  });

  it('navigates using Back button', () => {
    cy.visit('http://localhost:3000/');
    cy.contains(/Start Deployment/i).click();

    cy.get('button').contains(/Back/i).click();
    cy.url().should('eq', 'http://localhost:3000/');
  });
});
