import 'bootstrap-icons/font/bootstrap-icons.css';
import '../style/navbar.css'
import { Navbar, Container, Nav, Form, FormControl, Button, Row, Col} from 'react-bootstrap';
import logo from '../media/logo.webp'



function MainNavBar(props) {
    let user;
    if(props.user)
        user=props.user;
    else 
        user={name:"anon"};

    return (
        <Navbar className="navbar-main"  >
            <Container fluid className="d-flex align-items-center" >
            <Nav className="me-auto">
                <Navbar.Brand href="/" className="navbar-button">Home</Navbar.Brand>
            </Nav>
            <Nav className="ml-auto" style={{ maxHeight: '100px' }} navbarScroll >
                    {
                        props.logged ?
                            <>
                                {props.user && <Navbar.Brand><p className="link-light fs-6 pt-2 m-0">Hey {props.user.name}! ID: {props.user.id}</p></Navbar.Brand>}
                                <Navbar.Brand href="/">
                                    <Button variant="link" className="link-light p-0 m-0 text-decoration-none" onClick={(ev)=>props.logoutHandler(ev)}>
                                        &nbsp; Logout
                                    </Button>
                                </Navbar.Brand>
                            </>
                            : <Navbar.Brand href="/login">
                                <Button variant="link" className="link-light p-0 m-0 text-decoration-none" >
                                    &nbsp; Login
                                </Button>
                            </Navbar.Brand>
                    }
                </Nav>
            </Container>
        </Navbar>
    );
}

function LogoNavBar(props){
    return (<div>
            <Navbar className="navbar-logo" style={{height: "10vh"}}>
                <Container fluid className="d-flex align-items-center" >
                <Navbar.Brand href="#home">
                    <img
                    alt=""
                    src={logo}
                    height="80"
                    className="d-inline-block p-0 m-0" 
                    />{' '}
                </Navbar.Brand>
                
                <p className="fw-lighter fst-italic"> Are you sure?...</p>

                </Container>
            </Navbar>
      </div>
      )
}

export {LogoNavBar, MainNavBar}