import React, { useState, useEffect, useRef } from 'react';
import './Input.css';

import { isLoggedIn, getSiteSecret } from '../../crypto/account';
import { generateSecret, constructPassword } from '../../crypto/algs';

const hostname = window.location.hostname;

const Input = ({ onChange, onToggleVis }) => {
  const [open, setOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState({});
  const pepperInput = useRef();

  const close = () => {
    setOpen(false);
    setAccountInfo(() => ({}));
    onChange('');
    onToggleVis('password');
  };

  useEffect(() => {
    const userInput = document.querySelector('input[data-pepperpass-username]');
    const changeListener = async (e) => {
      if (!(await isLoggedIn())) {
        close();
        return;
      }
      const siteUser = e.target.value;
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
        close();
      }
    };
    const blurListener = (e) => {
      pepperInput.current?.focus();
    };
    userInput.addEventListener('input', changeListener);
    userInput.addEventListener('blur', blurListener);
    return () => {
      userInput.removeEventListener('input', changeListener);
      userInput.removeEventListener('blur', blurListener);
    };
  }, []);

  useEffect(() => {
    const parentForm = document
      .querySelector('input[data-pepperpass-password]')
      .closest('form');
    const submitListener = (e) => {
      setAccountInfo((info) => {
        // If no pepper is provided, user is bypassing PepperPass so don't save anything
        if (info.pepper) {
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
        }
        return info;
      });
    };
    parentForm.addEventListener('submit', submitListener);
    return () => {
      parentForm.removeEventListener('submit', submitListener);
    };
  }, []);

  useEffect(() => {
    const handlePassword = async () => {
      if (!(await isLoggedIn())) {
        close();
        return;
      }
      const { secret, pepper } = accountInfo;
      if (secret) {
        if (pepper) {
          const password = await constructPassword(accountInfo.secret, pepper, 20);
          console.log({
            secret,
            pepper,
            password,
          });
          onChange(password);
        } else {
          onChange('');
        }
      }
    };
    handlePassword();
  }, [accountInfo.user, accountInfo.pepper]);

  if (!open) return null;
  const { user, isNew, pepper } = accountInfo;
  return (
    <div className="App">
      <h6 className="App-header">PepperPass</h6>
      <label className="pepper-label" htmlFor="pepper">
        {isNew
          ? `Enter your pepper:\nNew account for ${user}`
          : `Enter your pepper:\nExisting account for ${user}`}
      </label>
      <input
        className="pepper-input"
        id="pepper"
        type="password"
        ref={pepperInput}
        value={pepper || ''}
        onChange={(e) =>
          setAccountInfo((prev) => ({ ...prev, pepper: e.target.value }))
        }
      />
      <div className="checkbox">
        <input type="checkbox" id="togglevis" onChange={() => onToggleVis()} />
        <label htmlFor="togglevis">Show password</label>
      </div>
    </div>
  );
};

export default Input;
