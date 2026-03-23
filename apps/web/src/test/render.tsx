import type { ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider, createStore } from 'jotai';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: ReturnType<typeof createStore>;
}

export function renderWithProviders(ui: ReactNode, { store = createStore(), ...options }: CustomRenderOptions = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    store,
  };
}
