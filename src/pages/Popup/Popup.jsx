import React, { useState, useEffect } from 'react';
import './Popup.css';

import {
  accountLogin,
  accountLogout,
  getUserInfo,
  isLoggedIn,
} from '../../crypto/account';

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
  const [userInfo, setUserInfo] = useState(null);

  const checkUser = async () => {
    if (await isLoggedIn()) {
      setUserInfo(await getUserInfo());
    }
  };
  useEffect(() => {
    checkUser();
  }, []);

  return (
    <div className="App">
      <h6 className="App-header">PepperPass</h6>
      {!!userInfo ? (
        <Account
          account={userInfo}
          onLogout={async () => {
            await accountLogout();
            setUserInfo(null);
          }}
        />
      ) : (
        <Login
          onLogin={() => {
            checkUser();
          }}
        />
      )}
    </div>
  );
};

export default Popup;
