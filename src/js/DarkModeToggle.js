import React, { useEffect } from "react";
import Toggle from "react-toggle";
import "react-toggle/style.css"; // Import default styling for react-toggle

export const DarkModeToggle = ({ isDarkMode, setIsDarkMode }) => {

  useEffect(() => {
    console.log("Toggle CSS styling darkmode =", isDarkMode);
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Toggle
      checked={isDarkMode}
      onChange={({ target }) => setIsDarkMode(target.checked)}
      icons={{ checked: "🌙", unchecked: "🔆" }}
      aria-label="Dark mode toggle"
    />
  );
};
