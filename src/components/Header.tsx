import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React from 'react';

type HeaderProps = {
  state?: string;
};

const Header: React.FC<HeaderProps> = ({ state }) => {
  const isIndex = state !== undefined;

  if (isIndex) {
    return (
      <Navbar expand="lg" >
        <Container className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <header className="mb-auto">
            <div>
              <h3 className="float-md-start mb-0">Kizzy Sinar</h3>
              <nav className="nav nav-masthead justify-content-center float-md-end">
              </nav>
            </div>
          </header>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto text-light">
              <Nav.Link className='text-light' href="/">Home</Nav.Link>
              <Nav.Link className='text-light' href="about">About</Nav.Link>
              <Nav.Link className='text-light' href="projects">Projects</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar expand="lg" >
      <Container className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto text-light">
            <Nav.Link className='text-light' href="/">Kizzy's Website</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
