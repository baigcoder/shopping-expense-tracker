import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsView, type SettingsPrefs } from './SettingsView';

const prefs: SettingsPrefs = {
    currency: 'PKR', theme: 'light', soundEnabled: true, reducedMotion: false, emailNotifications: true,
    aiLiveEnabled: true, aiMemoryEnabled: true, aiIncludePendingCandidates: true,
};
const noop = async () => undefined;

describe('SettingsView currency', () => {
    it('asks before switching, because amounts are not converted', () => {
        const onPref = vi.fn();
        render(<SettingsView name="Sana" email="s@cashly.app" prefs={prefs} currencies={[{ code: 'PKR', name: 'Rupee' }, { code: 'USD', name: 'Dollar' }]}
            onSaveName={noop} onPref={onPref} onAI={vi.fn()} onClearChat={noop} onPasswordReset={vi.fn()} onSignOut={vi.fn()}
            onRequestCode={async () => true} onConfirmDelete={async () => true} />);
        fireEvent.change(screen.getByRole('combobox', { name: /Currency/ }), { target: { value: 'USD' } });
        expect(onPref).not.toHaveBeenCalled();
        expect(screen.getByText(/50,000 PKR would show as 50,000 USD/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Switch to USD' }));
        expect(onPref).toHaveBeenCalledWith({ currency: 'USD' });
    });
});
