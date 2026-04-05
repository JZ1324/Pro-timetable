import React, { useState, useEffect } from 'react';
import '../styles/components/ThemeSwitcher.css';
import { setAccentHue, getAccentHue, applyCustomTheme, setTheme } from '../services/themeService';

const ThemeSwitcher = ({ onThemeChange, currentTheme }) => {
    const [accentHue, setHue] = useState(getAccentHue());
    const [contrastBoost, setContrastBoost] = useState(0);
    const accentHueInputId = 'theme-accent-hue';
    const contrastBoostInputId = 'theme-contrast-boost';

    useEffect(() => {
        setAccentHue(accentHue);
    }, [accentHue]);

    const handleClick = (event, theme) => {
        // Prevent default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();
        
        console.log("Theme button clicked:", theme);
        
        // Only trigger if actually changing to a different theme
        if (theme !== currentTheme) {
            onThemeChange(theme);
        }
    };


const themes = [
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'colorful', name: 'Colorful' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'pastel', name: 'Pastel' },
    { id: 'cosmos', name: 'Cosmos' },
    { id: 'custom', name: 'Custom' }
];

    const applyCustom = () => {
        applyCustomTheme({ hue: accentHue, contrastBoost, id: 'custom' });
        setTheme('custom');
        onThemeChange('custom');
    };

    return (
        <div className="theme-switcher-container">
            <h2 className="theme-switcher-title">Select a Theme</h2>
            <div className="theme-buttons">
                {themes.map(theme => (
                    <button 
                        key={theme.id}
                        type="button"
                        className={`theme-button ${theme.id} ${currentTheme === theme.id ? 'active' : ''}`}
                        onClick={(e) => handleClick(e, theme.id)}
                        aria-label={`${theme.name} theme`}
                        title={`Switch to ${theme.name} theme`}
                    >
                        <div className="theme-button-preview"></div>
                        <span>{theme.name}</span>
                    </button>
                ))}
            </div>
            <div className="current-theme-label">
                Current theme: <span>{currentTheme ? currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1) : 'Light'}</span>
            </div>
            <div className="accent-controls">
                <label htmlFor={accentHueInputId}>Accent Hue: <strong>{accentHue}</strong></label>
                <input
                    id={accentHueInputId}
                    type="range"
                    min="0"
                    max="359"
                    value={accentHue}
                    onChange={(e)=> setHue(Number(e.target.value))}
                />
                <label htmlFor={contrastBoostInputId}>Contrast Boost: <strong>{contrastBoost.toFixed(2)}</strong></label>
                <input
                    id={contrastBoostInputId}
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={contrastBoost}
                    onChange={(e)=> setContrastBoost(Number(e.target.value))}
                />
                <button type="button" className="apply-custom-button" onClick={applyCustom}>Apply Custom Theme</button>
            </div>
        </div>
    );
};

export default ThemeSwitcher;
