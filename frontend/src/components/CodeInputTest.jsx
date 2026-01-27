import { useState } from "react";

// Test component to verify code input functionality
const CodeInputTest = () => {
  const [code, setCode] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 6 characters
    const digitsOnly = value.replace(/\D/g, '');
    setCode(digitsOnly.slice(0, 6));
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Code Input Test</h3>
      <input
        type="text"
        placeholder="Enter 6-digit code"
        className="input input-bordered w-full text-center text-lg font-mono"
        value={code}
        onChange={handleChange}
        maxLength={6}
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <p className="text-sm mt-2">
        Current value: "{code}" (Length: {code.length}/6)
      </p>
      <p className="text-xs opacity-70">
        Try typing: letters, numbers, special characters - only numbers should remain
      </p>
    </div>
  );
};

export default CodeInputTest;
