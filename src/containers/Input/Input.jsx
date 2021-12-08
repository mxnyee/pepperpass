import React, { useState, useEffect } from 'react';
import './Input.css';

import { isLoggedIn, getSiteSecret } from '../../crypto/account';
import { generateSecret, constructPassword } from '../../crypto/algs';

const hostname = window.location.hostname;

const Input = ({ onChange, onToggleVis }) => {
  const [open, setOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState({});

  useEffect(() => {
    const userInput = document.querySelector('input[data-pepperpass-username]');
    const changeListener = (e) => {
      const value = e.target.value;
      if (!value) {
        setOpen(false);
      }
    };
    const blurListener = async (e) => {
      const siteUser = e.target.value;
      if (!(await isLoggedIn())) {
        setOpen(false);
        setAccountInfo(() => ({}));
        return;
      }
      if (siteUser) {
        setAccountInfo((prev) => ({ ...prev, user: siteUser }));
        const siteSecret = await getSiteSecret(hostname, siteUser);
        if (siteSecret) {
          setAccountInfo((prev) => ({
            ...prev,
            secret: siteSecret,
            isNew: false,
          }));
        } else {
          setAccountInfo((prev) => ({
            ...prev,
            secret: generateSecret(),
            isNew: true,
          }));
        }
        console.log({ hostname, siteSecret });
        setOpen(true);
      } else {
        setAccountInfo(() => ({}));
      }
    };
    userInput.addEventListener('change', changeListener);
    userInput.addEventListener('blur', blurListener);
    return () => {
      userInput.removeEventListener('change', changeListener);
      userInput.removeEventListener('blur', blurListener);
    };
  }, []);

  useEffect(() => {
    const parentForm = document
      .querySelector('input[data-pepperpass-password]')
      .closest('form');
    const submitListener = (e) => {
      setAccountInfo((info) => {
        console.log('sending message:', hostname, info);
        chrome.runtime.sendMessage(
          {
            from: 'input',
            action: 'addAccount',
            payload: {
              hostname,
              ...info,
              event: e,
            },
          },
          (ack) => {
            console.log('received ack:', ack);
          }
        );
        return info;
      });
    };
    parentForm.addEventListener('submit', submitListener);
    return () => {
      parentForm.removeEventListener('submit', submitListener);
    };
  }, []);

  const handleChange = async (e) => {
    const pepper = e.target.value;
    if (!(await isLoggedIn())) {
      setOpen(false);
      setAccountInfo(() => ({}));
      return;
    }
    if (accountInfo.secret) {
      if (pepper) {
        const password = await constructPassword(accountInfo.secret, pepper);
        console.log({ secret: accountInfo.secret, pepper, password });
        onChange(password);
      } else {
        onChange('');
      }
    }
  };

  if (!open) return null;
  return (
    <div className="App">
      <h6 className="App-header">PepperPass</h6>
      <label className="pepper-label" htmlFor="pepper">
        {accountInfo.isNew
          ? `Enter your pepper:\nNew account for ${accountInfo.user}`
          : `Enter your pepper:\nExisting account for ${accountInfo.user}`}
      </label>
      <input
        autoFocus
        className="pepper-input"
        id="pepper"
        type="password"
        onChange={handleChange}
      />
      <div className="checkbox">
        <input type="checkbox" id="togglevis" onChange={onToggleVis} />
        <label htmlFor="togglevis">Show password</label>
      </div>
    </div>
  );
};

export default Input;
