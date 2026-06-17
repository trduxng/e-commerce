import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingApi } from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        storeName: 'BaseShop',
        logoUrl: '',
        contactEmail: 'info@baseshop.com',
        contactPhone: '+012 345 6789',
        address: '123 Street, City, Country',
        facebookLink: '#',
        twitterLink: '#',
        instagramLink: '#'
    });

    const loadSettings = async () => {
        try {
            const response = await settingApi.get();
            if (response.data) {
                setSettings(response.data);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, reloadSettings: loadSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
