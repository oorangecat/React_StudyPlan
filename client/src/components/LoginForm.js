import { useState } from 'react';
import {Form, Button, Row, Col, Container} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {pswCharsCount} from '../config'

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(undefined);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
      event.preventDefault();
      let pswRegex="^[a-zA-Z0-9]{"+pswCharsCount.min+","+pswCharsCount.max+"}$";
      pswRegex=new RegExp(pswRegex);
      if(username.match(pswRegex))            //regex for username validation
      {
          const credentials = { username: username, password: password };
          const logged = await props.login(credentials);
          if(!logged)
          {
            setError('Wrong email and/or password');
          }
          else 
          {
              setError(undefined);
              navigate('/');
          };
      }
      else
      {
        setError('Wrong username format. No special characters allowed')
      }
  };

  return (
    <Container className='App'>
        <Row>
          <Col>
            <h1 className='p-3'> Login </h1>
          </Col>
        </Row>
        <Row>
          <Col>
          <div className="shadow rounded-3 mb-5 ms-4 me-4"> 
            <Form onSubmit={handleLogin}>
              <Row className="p-2 justify-content-center">
              <Form.Group as={Col} className="col-5" controlId='username'>
                  <Form.Label>Username</Form.Label>
                  <Form.Control type='text' value={username} onChange={ev => setUsername(ev.target.value)} required={true} />
              </Form.Group>
              </Row>
              <Row className="p-2 justify-content-center">
              <Form.Group as={Col} className="col-5" controlId='password'>
                  <Form.Label>Password</Form.Label>
                  <Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} required={true} minLength={4}/>
              </Form.Group>
              </Row>
              <Row className="p-3 justify-content-center">
              <Button type="submit" className="col-2 mb-3">Login</Button>
              {
                error ? <p style={{color: 'red'}}>{error}</p> : undefined
              }
              </Row>
          </Form>
          </div>
          </Col>
        </Row>
    </Container>
  ) 
}

export {LoginForm}