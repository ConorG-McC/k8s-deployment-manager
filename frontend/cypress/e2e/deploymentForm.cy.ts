describe('Deployment Form', () => {
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    cy.visit(`${baseUrl}/deploy`);
  });

  it('renders the deployment form with all input fields and buttons', () => {
    cy.contains('Deployment Form').should('be.visible');
    cy.get('input[aria-label="Image Name"]').should('be.visible');
    cy.get('input[aria-label="Service Name"]').should('be.visible');
    cy.get('input[aria-label="Namespace"]').should('be.visible');
    cy.get('input[aria-label="Port"]').should('be.visible');
    cy.get('input[aria-label="Replicas"]').should('be.visible');
    cy.get('button')
      .contains(/Deploy/i)
      .should('be.visible');
    cy.get('button').contains(/Back/i).should('be.visible');
  });

  it('updates input fields correctly', () => {
    cy.get('input[aria-label="Image Name"]')
      .type('my-image')
      .should('have.value', 'my-image');
    cy.get('input[aria-label="Service Name"]')
      .type('my-service')
      .should('have.value', 'my-service');
    cy.get('input[aria-label="Namespace"]')
      .type('my-namespace')
      .should('have.value', 'my-namespace');
    cy.get('input[aria-label="Port"]')
      .clear()
      .type('808')
      .should('have.value', 8080);
    cy.get('input[aria-label="Replicas"]')
      .clear()
      .type('1')
      .should('have.value', 10);
  });

  it('displays a loading state during form submission', () => {
    cy.intercept('POST', `${baseUrl.replace('3000', '3001')}/deploy`, (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: { deploymentId: 'test-deployment-id' },
      });
    }).as('createDeployment');

    cy.get('input[aria-label="Image Name"]').type('my-image');
    cy.get('input[aria-label="Service Name"]').type('my-service');
    cy.get('input[aria-label="Namespace"]').type('my-namespace');
    cy.get('input[aria-label="Port"]').clear().type('808');
    cy.get('input[aria-label="Replicas"]').clear().type('3');

    cy.get('button')
      .contains(/deploy/i)
      .click();
    cy.get('button')
      .contains(/Validating.../)
      .should('be.disabled');

    cy.wait('@createDeployment');
  });

  it('navigates to progress page on successful submission', () => {
    cy.intercept('POST', `${baseUrl.replace('3000', '3001')}/deploy`, {
      statusCode: 200,
      body: { deploymentId: 'test-deployment-id' },
    }).as('createDeployment');

    cy.get('input[aria-label="Image Name"]').type('my-image');
    cy.get('input[aria-label="Service Name"]').type('my-service');
    cy.get('input[aria-label="Namespace"]').type('my-namespace');
    cy.get('input[aria-label="Port"]').clear().type('808');
    cy.get('input[aria-label="Replicas"]').clear().type('3');

    cy.get('button')
      .contains(/deploy/i)
      .click();
    cy.wait('@createDeployment');

    cy.url().should('include', '/progress/test-deployment-id');
  });

  it('displays error message if createDeployment fails', () => {
    cy.intercept('POST', `${baseUrl.replace('3000', '3001')}/deploy`, {
      statusCode: 500,
      body: {},
    }).as('createDeployment');

    cy.get('input[aria-label="Image Name"]').type('my-image');
    cy.get('input[aria-label="Service Name"]').type('my-service');
    cy.get('input[aria-label="Namespace"]').type('my-namespace');
    cy.get('input[aria-label="Port"]').clear().type('808');
    cy.get('input[aria-label="Replicas"]').clear().type('3');

    cy.get('button')
      .contains(/deploy/i)
      .click();

    cy.contains('Failed to create deployment').should('be.visible');
  });

  it('navigates back to homepage when Back button is clicked', () => {
    cy.get('button').contains(/back/i).click();
    cy.url().should('eq', `${baseUrl}/`);
    cy.contains('Kubernetes Deployment Tracker').should('be.visible');
  });
});
