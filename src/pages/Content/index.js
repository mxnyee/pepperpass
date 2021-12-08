import { printLine } from './modules/print';
import { render } from 'react-dom';
import React from 'react';
import Input from '../../containers/Input/Input';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

const targetInput = document.querySelector('input[type="password"]');

if (targetInput) {
  // Assuming that the login form contains username + password input only
  targetInput.setAttribute('data-pepperpass-password', '');
  targetInput
    .closest('form')
    .querySelector('input[type="text"]')
    .setAttribute('data-pepperpass-username', '');

  // Pepper input element
  const root = document.createElement('div');
  root.id = 'root';
  targetInput.parentNode.appendChild(root);

  const onChange = (pepper) => {
    targetInput.value = pepper;
  };

  const onToggleVis = (value) => {
    if (value) targetInput.type = value;
    else if (targetInput.type === 'password') targetInput.type = 'text';
    else targetInput.type = 'password';
  };

  render(<Input onChange={onChange} onToggleVis={onToggleVis} />, root);
} else {
  console.log('No password input detected.');
}
