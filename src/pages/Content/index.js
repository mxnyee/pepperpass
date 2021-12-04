import { printLine } from './modules/print';
import { render } from 'react-dom';
import React from 'react';
import Input from '../../containers/Input/Input';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

const targetInput = document.querySelector('input[type="password"]');

if (targetInput) {
  targetInput.setAttribute('data-pepperpass-target', '');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'togglevis';
  checkbox.onchange = () => {
    const password = document.querySelector('input[data-pepperpass-target]');
    if (password.type === 'password') password.type = 'text';
    else password.type = 'password';
  };
  const checkboxLabel = document.createElement('label');
  checkboxLabel.innerHTML = 'Show password';
  checkboxLabel.htmlFor = 'togglevis';
  targetInput.parentNode.appendChild(checkbox);
  targetInput.parentNode.appendChild(checkboxLabel);

  const root = document.createElement('div');
  root.id = 'root';
  targetInput.parentNode.appendChild(root);
  //   targetInput.value = '';

  const onChange = (pepper) => {
    console.log('received value:', pepper);
    // targetInput.setAttribute('value', pepper);
    targetInput.value = pepper;
  };

  render(<Input onChange={onChange} />, root);
} else {
  console.log('No password input detected.');
}
