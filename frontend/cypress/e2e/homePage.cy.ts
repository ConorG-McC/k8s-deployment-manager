describe('HomePage', () => {
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it('loads the homepage and displays main elements', () => {
    cy.contains('Kubernetes Deployment Tracker').should('be.visible');
    cy.contains('DEMO').should('be.visible');

    cy.get('.navbar').should('be.visible');
  });

  it('responds correctly on different screen sizes', () => {
    cy.viewport(1280, 720);
    cy.contains('Kubernetes Deployment Tracker').should('be.visible');

    cy.viewport(360, 200);
    cy.contains('Kubernetes Deployment Tracker').should('be.visible');
  });

  it('navigates to the deployment form when the corresponding link or button is clicked', () => {
    cy.contains(/Start Deployment/i).click();
    cy.url().should('include', '/deploy');
    cy.contains('Deployment Form').should('be.visible');
  });

  it('displays correct content for fallback routes', () => {
    cy.visit(`${baseUrl}/unknown-route`);
    cy.contains('Kubernetes Deployment Tracker').should('be.visible');
    cy.contains('DEMO').should('be.visible');
  });
});
