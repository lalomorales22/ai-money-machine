import { Signal, NewsItem } from '../types';

/**
 * Simulates a SQLite database connection using LocalStorage.
 * In a real backend environment, this would connect to a .sqlite file.
 */

const DB_KEYS = {
  SIGNALS: 'aimm_signals_table',
  NEWS: 'aimm_news_table',
  SETTINGS: 'aimm_settings_table'
};

export const dbService = {
  init: () => {
    if (!localStorage.getItem(DB_KEYS.SIGNALS)) {
      localStorage.setItem(DB_KEYS.SIGNALS, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.NEWS)) {
      localStorage.setItem(DB_KEYS.NEWS, JSON.stringify([]));
    }
    console.log("Database initialized.");
  },

  insertSignal: (signal: Signal) => {
    const data = JSON.parse(localStorage.getItem(DB_KEYS.SIGNALS) || '[]');
    data.unshift(signal);
    // Keep max 50 records to prevent quota limits
    if (data.length > 50) data.pop();
    localStorage.setItem(DB_KEYS.SIGNALS, JSON.stringify(data));
  },

  insertNews: (news: NewsItem) => {
    const data = JSON.parse(localStorage.getItem(DB_KEYS.NEWS) || '[]');
    data.unshift(news);
    if (data.length > 50) data.pop();
    localStorage.setItem(DB_KEYS.NEWS, JSON.stringify(data));
  },

  getSignals: (): Signal[] => {
    return JSON.parse(localStorage.getItem(DB_KEYS.SIGNALS) || '[]');
  },

  getNews: (): NewsItem[] => {
    return JSON.parse(localStorage.getItem(DB_KEYS.NEWS) || '[]');
  },

  clearDb: () => {
    localStorage.removeItem(DB_KEYS.SIGNALS);
    localStorage.removeItem(DB_KEYS.NEWS);
    console.log("Database cleared.");
  }
};
