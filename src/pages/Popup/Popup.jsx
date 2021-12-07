import React, { useState, useEffect } from 'react';
import './Popup.css';

import { accountLogin, accountLogout } from '../../crypto/login';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

const Account = ({ account: { email }, onLogout }) => {
  return (
    <div>
      <p>{`Hello ${email}`}</p>
      <button onClick={onLogout}>Log out</button>
    </div>
  );
};

const Popup = () => {
  const [loggedIn, setLoggedIn] = useState(null);

  const getUserInfo = async () => {
    const storage = await chrome.storage.local.get('sessionStore');
    const session = storage.sessionStore
      ? JSON.parse(storage.sessionStore)
      : null;
    console.log('session storage:', session);
    if (session?.email) {
      setLoggedIn({ email: session.email });
    }
  };
  useEffect(() => {
    getUserInfo();
  }, []);
  return (
    <div className="App">
      <h6 className="App-header">PepperPass</h6>
      {!!loggedIn ? (
        <Account
          account={loggedIn}
          onLogout={async () => {
            await accountLogout();
            setLoggedIn(null);
            const storage = await chrome.storage.local.get('sessionStore');
            console.log('session storage after logout:', storage);
          }}
        />
      ) : (
        <Login
          onLogin={() => {
            getUserInfo();
          }}
        />
      )}
    </div>
  );
};

export default Popup;
