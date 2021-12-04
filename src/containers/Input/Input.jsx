import React, { useState } from 'react';
import './Input.css';

const Input = ({ onChange }) => {
  const [vis, setVis] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    onChange(value);
  };

  return (
    <div className="App">
      <h6 className="App-header">PepperPass</h6>
      <label className="pepper-label" htmlFor="pepper">
        Enter your pepper
      </label>
      <input
        className="pepper-input"
        id="pepper"
        type={!vis ? 'password' : 'text'}
        onChange={handleChange}
      />
      {/* <div className="pepper-checkbox">
        <input
          type="checkbox"
          id="toggle-pepper-vis"
          onChange={() => setVis((prev) => !prev)}
        />
        <label htmlFor="toggle-pepper-vis">Show pepper</label>
      </div> */}
    </div>
  );
};

export default Input;
