import {
  BusinessSettings,
  Investor,
  Subscriber,
  ExpenseTransaction,
  CapexItem,
  MonthlyClosing,
} from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_INVESTORS,
  DEFAULT_SUBSCRIBERS,
  DEFAULT_EXPENSES,
  DEFAULT_CAPEX,
  DEFAULT_CLOSINGS,
} from './dataStore';

interface GlobalState {
  settings: BusinessSettings;
  investors: Investor[];
  subscribers: Subscriber[];
  expenses: ExpenseTransaction[];
  capex: CapexItem[];
  closings: MonthlyClosing[];
  last_synced_at: string;
}

// Global server memory cache (persists across warm serverless lambdas)
declare global {
  var __SMW_SERVER_STATE: GlobalState | undefined;
}

export function getServerState(): GlobalState {
  if (!global.__SMW_SERVER_STATE) {
    global.__SMW_SERVER_STATE = {
      settings: DEFAULT_SETTINGS,
      investors: DEFAULT_INVESTORS,
      subscribers: DEFAULT_SUBSCRIBERS,
      expenses: DEFAULT_EXPENSES,
      capex: DEFAULT_CAPEX,
      closings: DEFAULT_CLOSINGS,
      last_synced_at: new Date().toISOString(),
    };
  }
  return global.__SMW_SERVER_STATE;
}

export function updateServerState(partial: Partial<GlobalState>): GlobalState {
  const current = getServerState();
  global.__SMW_SERVER_STATE = {
    ...current,
    ...partial,
    last_synced_at: new Date().toISOString(),
  };
  return global.__SMW_SERVER_STATE;
}
