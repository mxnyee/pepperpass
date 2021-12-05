import React, { useState } from 'react';
import './Popup.css';

import { accountLogin } from '../../crypto/login';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [text, setText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await accountLogin(email, password);
    if (success) {
      onLogin();
    } else {
      setText('Invalid login credentials.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <br />
      <input
        id="email"
        name="email"
        type="text"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setText('');
        }}
      />
      <br />
      <br />
      <label htmlFor="masterpass">Master Password</label>
      <br />
      <input
        id="masterpass"
        name="password"
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setText('');
        }}
      />
      <br />
      <button>Log in</button>
      <br />
      <span>{text}</span>
    </form>
  );
};

const Account = ({ onLogout }) => {
  return <button onClick={onLogout}>Log out</button>;
};

const Popup = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  return (
    <div className="App">
      <h6 className="App-header">PepperPass</h6>
      {loggedIn ? (
        <Account onLogout={() => setLoggedIn(false)} />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  );
};

export default Popup;
