import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeView } from './HomeView';
import { buildHomeModel } from './homeModel';

const now = new Date(2026, 10, 15, 12);
const renderHome = (model: ReturnType<typeof buildHomeModel>) => render(
    <MemoryRouter><HomeView model={model} firstName="Sana" money={(n) => `Rs ${n}`} onApprove={() => {}} onDismiss={() => {}} onAdd={() => {}} /></MemoryRouter>,
);

describe('HomeView', () => {
    it('shows setup instead of a Rs 0 safe-to-spend for a new user, ticking off budgets already set', () => {
        renderHome(buildHomeModel({ now, transactions: [], budgets: [{ category: 'Food', amount: 1000 }], commitments: [], goals: [], pending: [] }));
        expect(screen.getByRole('heading', { name: 'Set up Cashly' })).toBeTruthy();
        expect(screen.queryByText('Safe to spend')).toBeNull();
        expect(screen.getByRole('link', { name: /Set a monthly budget/ }).querySelector('[aria-label="Done"]')).toBeTruthy();
    });

    it('explains safe to spend once there is money recorded', () => {
        renderHome(buildHomeModel({ now, transactions: [], budgets: [], commitments: [], goals: [], pending: [], accountsBalance: 5000 }));
        expect(screen.getByText('Safe to spend')).toBeTruthy();
        expect(screen.getByText(/Rs 5000 in your accounts/)).toBeTruthy();
    });
});
