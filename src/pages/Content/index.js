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

  // Show/hide on pw field
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'togglevis';
  checkbox.onchange = () => {
    const password = document.querySelector('input[data-pepperpass-password]');
    if (password.type === 'password') password.type = 'text';
    else password.type = 'password';
  };
  const checkboxLabel = document.createElement('label');
  checkboxLabel.innerHTML = 'Show password';
  checkboxLabel.htmlFor = 'togglevis';
  const div = document.createElement('div');
  // div.style.display = 'flex';
  // div.style.alignItems = 'center';
  // div.style.justifyContent = 'center';
  div.appendChild(checkbox);
  div.appendChild(checkboxLabel);
  targetInput.parentNode.appendChild(div);

  // Pepper input element
  const root = document.createElement('div');
  root.id = 'root';
  targetInput.parentNode.appendChild(root);

  const onChange = (pepper) => {
    targetInput.value = pepper;
  };

  render(<Input onChange={onChange} />, root);
} else {
  console.log('No password input detected.');
}
